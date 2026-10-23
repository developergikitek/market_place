import uuid
import secrets
from datetime import timedelta
from django.utils import timezone
from .models import (
    User,
    UserDevice,
    UserSession,
    RefreshTokenRecord,
    AuthAuditLog,
    DevicePlatform,
    SessionStatus,
    AuthEventType,
)


def get_client_ip(request) -> str:
    """Extract client IP address handling proxies/load balancers."""
    if not request or not hasattr(request, 'META'):
        return '127.0.0.1'
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '127.0.0.1')


def get_client_user_agent(request) -> str:
    """Extract User-Agent string from request."""
    if not request or not hasattr(request, 'META'):
        return ''
    return request.META.get('HTTP_USER_AGENT', '')


def extract_device_info(request, data=None):
    """
    Extract device info from request headers or body payload.
    Supports both Mobile App headers (X-Device-Id, X-Platform) and body payload.
    """
    data = data or {}
    device_id = (
        request.headers.get('X-Device-Id')
        or data.get('device_id')
        or request.COOKIES.get('makaano_device_id')
    )

    platform_str = (
        request.headers.get('X-Platform')
        or data.get('platform')
        or 'WEB'
    ).upper()

    platform = DevicePlatform.WEB
    if platform_str in DevicePlatform.values:
        platform = platform_str

    device_model = request.headers.get('X-Device-Model') or data.get('device_model')
    os_version = request.headers.get('X-OS-Version') or data.get('os_version')
    app_version = request.headers.get('X-App-Version') or data.get('app_version')
    push_token = request.headers.get('X-Push-Token') or data.get('push_token')

    return {
        'device_id': device_id,
        'platform': platform,
        'device_model': device_model,
        'os_version': os_version,
        'app_version': app_version,
        'push_token': push_token,
    }


def register_or_update_device(user: User, device_info: dict) -> UserDevice:
    """
    Register a new device or update existing device footprint for the user.
    """
    device_id = device_info.get('device_id')
    if not device_id:
        # If no client device ID provided (e.g. desktop web browser without cookie),
        # generate a unique UUID fallback
        device_id = f"web_{uuid.uuid4().hex[:16]}"

    device, created = UserDevice.objects.get_or_create(
        user=user,
        device_id=device_id,
        defaults={
            'platform': device_info.get('platform', DevicePlatform.WEB),
            'device_model': device_info.get('device_model'),
            'os_version': device_info.get('os_version'),
            'app_version': device_info.get('app_version'),
            'push_token': device_info.get('push_token'),
            'push_token_updated_at': timezone.now() if device_info.get('push_token') else None,
        }
    )

    if not created:
        # Update existing device info
        update_fields = ['last_seen_at']
        device.last_seen_at = timezone.now()

        if device_info.get('device_model') and device.device_model != device_info['device_model']:
            device.device_model = device_info['device_model']
            update_fields.append('device_model')

        if device_info.get('os_version') and device.os_version != device_info['os_version']:
            device.os_version = device_info['os_version']
            update_fields.append('os_version')

        if device_info.get('app_version') and device.app_version != device_info['app_version']:
            device.app_version = device_info['app_version']
            update_fields.append('app_version')

        if device_info.get('push_token') and device.push_token != device_info['push_token']:
            device.push_token = device_info['push_token']
            device.push_token_updated_at = timezone.now()
            update_fields.extend(['push_token', 'push_token_updated_at'])

        device.save(update_fields=update_fields)

    return device


def create_user_session_and_tokens(
    user: User,
    request,
    device_info: dict = None,
    expiry_days: int = 30,
    idle_minutes: int = 60,
) -> dict:
    """
    Enterprise login flow:
    1. Bind UserDevice
    2. Generate cryptographically secure Session Token & hash
    3. Create UserSession record
    4. Bind RefreshToken record (with family ID for rotation)
    5. Log AuthAuditLog
    """
    now = timezone.now()
    ip = get_client_ip(request)
    ua = get_client_user_agent(request)

    # 1. Device binding
    device = None
    if device_info:
        device = register_or_update_device(user, device_info)

    # 2. Cryptographic session token
    raw_session_token = secrets.token_urlsafe(48)
    token_hash = UserSession.hash_token(raw_session_token)

    # 3. Create UserSession
    session = UserSession.objects.create(
        user=user,
        device=device,
        session_token_hash=token_hash,
        status=SessionStatus.ACTIVE,
        expires_at=now + timedelta(days=expiry_days),
        idle_expires_at=None,
        ip_address=ip,
        user_agent=ua,
    )

    # 4. Generate SimpleJWT tokens with embedded session_id & device claims
    from rest_framework_simplejwt.tokens import RefreshToken as JWTRefreshToken
    jwt_refresh = JWTRefreshToken.for_user(user)
    jwt_refresh['session_id'] = str(session.id)
    if device:
        jwt_refresh['device_id'] = str(device.device_id)
        jwt_refresh['platform'] = str(device.platform)
    jwt_access = str(jwt_refresh.access_token)
    jwt_refresh_str = str(jwt_refresh)

    # Bind RefreshToken record to session with family ID
    family_id = str(uuid.uuid4())
    RefreshTokenRecord.objects.create(
        session=session,
        token_hash=RefreshTokenRecord.hash_token(jwt_refresh_str),
        family_id=family_id,
        expires_at=now + timedelta(days=expiry_days),
    )

    # 5. Record Audit Log
    record_audit_log(
        event=AuthEventType.LOGIN_SUCCESS,
        user=user,
        request=request,
        device_id=device.device_id if device else None,
        metadata={
            'session_id': session.id,
            'platform': device.platform if device else 'UNKNOWN',
        }
    )

    return {
        'session_id': session.id,
        'session_token': raw_session_token,
        'device_id': device.device_id if device else None,
        'tokens': {
            'access': jwt_access,
            'refresh': jwt_refresh_str,
        },
        'expires_at': session.expires_at.isoformat(),
    }


def record_audit_log(
    event: str,
    user: User = None,
    request = None,
    device_id: str = None,
    metadata: dict = None,
):
    """Record an immutable security audit event."""
    ip = get_client_ip(request) if request else None
    ua = get_client_user_agent(request) if request else None

    AuthAuditLog.objects.create(
        user=user,
        event=event,
        ip_address=ip,
        user_agent=ua,
        device_id=device_id,
        metadata=metadata or {},
    )


def revoke_session(session_id: str, user: User, reason: str = "USER_LOGOUT") -> bool:
    """Revoke a specific session."""
    session = UserSession.objects.filter(id=session_id, user=user, status=SessionStatus.ACTIVE).first()
    if session:
        session.revoke(reason=reason)
        # Mark all associated refresh tokens as revoked
        session.refresh_tokens.update(is_revoked=True)
        return True
    return False


def revoke_all_user_sessions(user: User, except_session_id: str = None, reason: str = "LOGOUT_ALL_DEVICES") -> int:
    """Revoke all sessions for a user (e.g. password reset or remote logout)."""
    qs = UserSession.objects.filter(user=user, status=SessionStatus.ACTIVE)
    if except_session_id:
        qs = qs.exclude(id=except_session_id)

    session_ids = list(qs.values_list('id', flat=True))
    count = qs.update(
        status=SessionStatus.REVOKED,
        revoked_at=timezone.now(),
        revocation_reason=reason,
    )
    RefreshTokenRecord.objects.filter(session_id__in=session_ids).update(is_revoked=True)
    return count
