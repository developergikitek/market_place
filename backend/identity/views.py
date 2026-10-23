import random
from datetime import timedelta
from django.conf import settings
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.utils import timezone

from .models import (
    User,
    OTPRequest,
    OTPPurpose,
    OTPChannel,
    UserDevice,
    UserSession,
    RefreshTokenRecord,
    SessionStatus,
    AuthEventType,
)
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    ChangePasswordSerializer,
    SendOTPSerializer,
    VerifyOTPSerializer,
    UserDeviceSerializer,
    UserSessionSerializer,
)
from .services import (
    create_user_session_and_tokens,
    extract_device_info,
    revoke_session,
    revoke_all_user_sessions,
    record_audit_log,
)


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class RegisterView(APIView):
    """
    Public registration endpoint. Mobile number (phone) is mandatory.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            device_info = extract_device_info(request, serializer.validated_data)
            auth_data = create_user_session_and_tokens(user, request, device_info=device_info)
            return Response(
                {
                    "message": "User registered successfully.",
                    "user": UserSerializer(user).data,
                    "tokens": auth_data['tokens'],
                    "session_id": auth_data['session_id'],
                    "device_id": auth_data['device_id'],
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    """
    Login endpoint using mobile number (phone) and password.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            user.last_login_at = timezone.now()
            user.failed_login_attempts = 0
            user.save(update_fields=['last_login_at', 'failed_login_attempts'])

            device_info = extract_device_info(request, serializer.validated_data)
            auth_data = create_user_session_and_tokens(user, request, device_info=device_info)
            return Response(
                {
                    "message": "Login successful.",
                    "user": UserSerializer(user).data,
                    "tokens": auth_data['tokens'],
                    "session_id": auth_data['session_id'],
                    "device_id": auth_data['device_id'],
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CurrentUserView(APIView):
    """
    Get or update authenticated user profile.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Profile updated successfully.",
                    "user": serializer.data,
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    """
    Change password for authenticated user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            new_password = serializer.validated_data['new_password']
            request.user.set_password(new_password)
            request.user.save()
            return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SendOTPView(APIView):
    """
    Generate and dispatch an OTP to the given mobile number with 60s cooldown,
    attempt-capping, and multi-purpose validation.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        phone = serializer.validated_data['phone']
        purpose = serializer.validated_data.get('purpose', OTPPurpose.SELLER_LOGIN)
        channel = serializer.validated_data.get('channel', OTPChannel.SMS)

        # For login flows, verify an account exists
        if purpose in [OTPPurpose.SELLER_LOGIN, OTPPurpose.CUSTOMER_LOGIN]:
            user = User.objects.filter(phone=phone).first()
            if not user:
                return Response(
                    {"error": "No registered account found with this mobile number. Please register first."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        # Check Resend Cooldown (60 seconds)
        now = timezone.now()
        recent_otp = (
            OTPRequest.objects.filter(phone=phone, purpose=purpose)
            .order_by('-created_at')
            .first()
        )
        if recent_otp and recent_otp.resend_available_at > now:
            remaining_seconds = max(1, int((recent_otp.resend_available_at - now).total_seconds()))
            return Response(
                {
                    "error": f"Please wait {remaining_seconds} seconds before requesting a new OTP.",
                    "resend_cooldown_seconds": remaining_seconds,
                    "session_id": str(recent_otp.session_id),
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # Invalidate any prior pending OTPs for this phone + purpose
        OTPRequest.objects.filter(phone=phone, purpose=purpose, is_verified=False).update(
            expires_at=now
        )

        # Generate 6-digit OTP
        raw_otp = f"{random.randint(100000, 999999)}"

        expires_at = now + timedelta(minutes=5)
        resend_available_at = now + timedelta(seconds=60)

        # Extract client IP and user agent
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        ip = x_forwarded_for.split(',')[0].strip() if x_forwarded_for else request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        otp_request = OTPRequest(
            phone=phone,
            purpose=purpose,
            channel=channel,
            provider="MOCK",
            expires_at=expires_at,
            resend_available_at=resend_available_at,
            ip_address=ip,
            user_agent=user_agent[:500] if user_agent else None,
        )
        otp_request.set_otp(raw_otp)
        otp_request.save()

        # Development Console Log
        print(f"\n========================================================")
        print(f"🔐 [OTP DISPATCH] Phone: +91-{phone} | Purpose: {purpose}")
        print(f"🔑 OTP CODE: {raw_otp}")
        print(f"🆔 Session ID: {otp_request.session_id}")
        print(f"========================================================\n")

        response_data = {
            "message": "OTP sent successfully.",
            "session_id": str(otp_request.session_id),
            "phone": phone,
            "resend_cooldown_seconds": 60,
            "expires_in_seconds": 300,
        }

        # Include debug_otp in dev environment for easy testing
        if getattr(settings, 'DEBUG', True):
            response_data["debug_otp"] = raw_otp

        return Response(response_data, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    """
    Verify OTP with session tracking, max attempts (3),
    and issue JWT tokens upon successful seller login.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        session_id = serializer.validated_data.get('session_id')
        phone = serializer.validated_data.get('phone')
        otp = serializer.validated_data['otp']
        purpose = serializer.validated_data.get('purpose', OTPPurpose.SELLER_LOGIN)

        otp_request = None
        if session_id:
            otp_request = OTPRequest.objects.filter(session_id=session_id).first()
        elif phone:
            otp_request = (
                OTPRequest.objects.filter(phone=phone, purpose=purpose)
                .order_by('-created_at')
                .first()
            )

        if not otp_request:
            return Response(
                {"error": "No OTP session found. Please request a new OTP."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if otp_request.is_verified:
            return Response(
                {"error": "This OTP has already been used. Please request a new OTP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp_request.is_expired():
            return Response(
                {"error": "This OTP has expired. Please request a new OTP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp_request.attempts >= otp_request.max_attempts:
            return Response(
                {"error": "Maximum verification attempts exceeded. Please request a new OTP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check OTP
        otp_request.attempts += 1
        if not otp_request.check_otp(otp):
            otp_request.save(update_fields=['attempts'])
            remaining = otp_request.max_attempts - otp_request.attempts
            if remaining > 0:
                return Response(
                    {"error": f"Invalid OTP. {remaining} attempt(s) remaining.", "remaining_attempts": remaining},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            else:
                return Response(
                    {"error": "Invalid OTP. Maximum attempts exceeded. Please request a new OTP.", "remaining_attempts": 0},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Success - Mark as verified
        now = timezone.now()
        otp_request.is_verified = True
        otp_request.verified_at = now
        otp_request.save(update_fields=['is_verified', 'verified_at', 'attempts'])

        # Find associated user
        user = User.objects.filter(phone=otp_request.phone).first()

        if user:
            user.is_phone_verified = True
            user.last_login_at = now
            user.failed_login_attempts = 0
            user.save(update_fields=['is_phone_verified', 'last_login_at', 'failed_login_attempts'])

            device_info = extract_device_info(request, serializer.validated_data)
            auth_data = create_user_session_and_tokens(user, request, device_info=device_info)
            return Response(
                {
                    "message": "OTP verified successfully. Login successful.",
                    "user": UserSerializer(user).data,
                    "tokens": auth_data['tokens'],
                    "session_id": auth_data['session_id'],
                    "device_id": auth_data['device_id'],
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "message": "Mobile number verified successfully.",
                "phone": otp_request.phone,
                "is_registered": False,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """
    Logout endpoint: Revokes active session and invalidates tokens.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        session_id = None
        if hasattr(request, 'user_session') and request.user_session:
            session_id = request.user_session.id
        elif hasattr(request, 'auth') and hasattr(request.auth, 'get'):
            session_id = request.auth.get('session_id')

        if not session_id:
            session_id = request.data.get('session_id') or request.headers.get('X-Session-Id')

        if session_id:
            revoke_session(session_id, request.user, reason="USER_LOGOUT")
        else:
            # Fallback: Revoke most recent active session for this user
            latest_session = UserSession.objects.filter(
                user=request.user,
                status=SessionStatus.ACTIVE
            ).order_by('-created_at').first()
            if latest_session:
                latest_session.revoke(reason="USER_LOGOUT")
                session_id = latest_session.id

        record_audit_log(
            event=AuthEventType.LOGOUT,
            user=request.user,
            request=request,
            metadata={'session_id': session_id}
        )
        return Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)


class UserSessionsView(APIView):
    """
    List all active sessions for authenticated user ("Active Devices / Logged-in Sessions").
    DELETE: Revoke all other sessions ("Log out from all other devices").
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sessions = UserSession.objects.filter(
            user=request.user,
            status=SessionStatus.ACTIVE,
            expires_at__gt=timezone.now(),
        ).select_related('device').order_by('-last_activity_at')
        return Response(UserSessionSerializer(sessions, many=True).data, status=status.HTTP_200_OK)

    def delete(self, request):
        current_session_id = request.data.get('current_session_id') or request.headers.get('X-Session-Id')
        revoked_count = revoke_all_user_sessions(
            request.user,
            except_session_id=current_session_id,
            reason="USER_REVOKED_OTHER_SESSIONS",
        )
        record_audit_log(
            event=AuthEventType.SESSION_REVOKED,
            user=request.user,
            request=request,
            metadata={'action': 'revoke_all_other_sessions', 'revoked_count': revoked_count}
        )
        return Response(
            {"message": f"Successfully revoked {revoked_count} other active session(s)."},
            status=status.HTTP_200_OK,
        )


class RevokeSessionView(APIView):
    """
    Revoke a specific session by ID ("Remove Device").
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, session_id):
        revoked = revoke_session(session_id, request.user, reason="USER_MANUAL_REVOCATION")
        if revoked:
            record_audit_log(
                event=AuthEventType.SESSION_REVOKED,
                user=request.user,
                request=request,
                metadata={'revoked_session_id': session_id}
            )
            return Response({"message": "Session revoked successfully."}, status=status.HTTP_200_OK)
        return Response({"error": "Session not found or already inactive."}, status=status.HTTP_404_NOT_FOUND)


class CustomTokenRefreshView(TokenRefreshView):
    """
    Enterprise OAuth 2.0 / JWT Token Refresh View with Session Binding & Family Rotation:
    1. Replay Attack Detection: If an already-revoked refresh token is re-submitted,
       revoke ALL tokens in that family and terminate the entire UserSession immediately.
    2. Token Rotation: If refresh succeeds, rotate the token record and update
       UserSession.last_activity_at.
    3. Session Expiration: If refresh fails due to token expiration (401),
       mark UserSession status = 'EXPIRED' and record revocation in the DB.
    """
    def post(self, request, *args, **kwargs):
        raw_refresh = request.data.get('refresh')
        token_hash = RefreshTokenRecord.hash_token(raw_refresh) if raw_refresh else None
        record = None

        if token_hash:
            record = RefreshTokenRecord.objects.filter(token_hash=token_hash).select_related('session', 'session__user').first()

            # Fallback: If valid token has session_id claim but wasn't tracked, track it now
            if not record and raw_refresh:
                try:
                    from rest_framework_simplejwt.tokens import RefreshToken as JWTRefreshToken
                    token_payload = JWTRefreshToken(raw_refresh)
                    sess_id = token_payload.get('session_id')
                    if sess_id:
                        session = UserSession.objects.filter(id=sess_id).first()
                        if session and session.status == SessionStatus.ACTIVE:
                            record = RefreshTokenRecord.objects.create(
                                session=session,
                                token_hash=token_hash,
                                family_id=str(uuid.uuid4()),
                                expires_at=timezone.now() + timedelta(days=30),
                            )
                except Exception:
                    pass

            # Security Defense: Replay attack detection (token was already used/revoked)
            if record and record.is_revoked:
                session = record.session
                now = timezone.now()

                # Leeway Window (30 seconds): Modern browsers fire parallel requests on reload
                # If this token was rotated within the last 30 seconds, treat it as a concurrent request race condition,
                # NOT a malicious replay attack!
                latest_token = (
                    RefreshTokenRecord.objects.filter(family_id=record.family_id, is_revoked=False)
                    .order_by('-created_at')
                    .first()
                )

                if latest_token and session and session.status == SessionStatus.ACTIVE:
                    time_diff = (now - latest_token.created_at).total_seconds()
                    if time_diff <= 30:
                        # Legitimate concurrent request: Issue new access & refresh token with session_id without killing session
                        from rest_framework_simplejwt.tokens import RefreshToken as JWTRefreshToken
                        jwt_obj = JWTRefreshToken.for_user(session.user)
                        jwt_obj['session_id'] = str(session.id)
                        if session.device:
                            jwt_obj['device_id'] = str(session.device.device_id)
                            jwt_obj['platform'] = str(session.device.platform)

                        new_refresh_str = str(jwt_obj)
                        RefreshTokenRecord.objects.create(
                            session=session,
                            token_hash=RefreshTokenRecord.hash_token(new_refresh_str),
                            family_id=record.family_id,
                            expires_at=now + timedelta(days=30),
                        )

                        return Response(
                            {
                                "access": str(jwt_obj.access_token),
                                "refresh": new_refresh_str,
                            },
                            status=status.HTTP_200_OK,
                        )

                # Outside leeway window (>30s) -> Genuine replay attack from an attacker!
                if session and session.status == SessionStatus.ACTIVE:
                    session.revoke(reason="TOKEN_REPLAY_ATTACK_DETECTED")
                    RefreshTokenRecord.objects.filter(family_id=record.family_id).update(is_revoked=True)
                    record_audit_log(
                        event=AuthEventType.SESSION_REVOKED,
                        user=session.user,
                        request=request,
                        metadata={
                            'reason': 'REPLAY_ATTACK_DETECTED',
                            'family_id': record.family_id,
                            'session_id': session.id,
                        }
                    )
                return Response(
                    {"detail": "Security violation: This token was already used or revoked. Please log in again.", "code": "token_replayed"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

        try:
            response = super().post(request, *args, **kwargs)

            # Success (200 OK)
            if response.status_code == status.HTTP_200_OK and record:
                session = record.session
                now = timezone.now()

                # Update session activity
                session.last_activity_at = now
                session.save(update_fields=['last_activity_at'])

                # If new refresh token was returned (ROTATE_REFRESH_TOKENS=True)
                new_refresh = response.data.get('refresh')
                if new_refresh:
                    # Invalidate old token
                    record.is_revoked = True
                    record.save(update_fields=['is_revoked'])

                    # Create new token record in same family
                    new_token_hash = RefreshTokenRecord.hash_token(new_refresh)
                    RefreshTokenRecord.objects.create(
                        session=session,
                        token_hash=new_token_hash,
                        family_id=record.family_id,
                        expires_at=now + timedelta(days=30),
                    )

                record_audit_log(
                    event=AuthEventType.TOKEN_REFRESH,
                    user=session.user,
                    request=request,
                    metadata={'session_id': session.id}
                )

            return response

        except (InvalidToken, TokenError) as exc:
            # Token Expired or Invalid -> Mark UserSession as EXPIRED in DB
            if record and record.session:
                session = record.session
                if session.status == SessionStatus.ACTIVE:
                    session.status = SessionStatus.EXPIRED
                    session.revoked_at = timezone.now()
                    session.revocation_reason = "REFRESH_TOKEN_EXPIRED"
                    session.save(update_fields=['status', 'revoked_at', 'revocation_reason'])

                    record.is_revoked = True
                    record.save(update_fields=['is_revoked'])

                    record_audit_log(
                        event=AuthEventType.SESSION_REVOKED,
                        user=session.user,
                        request=request,
                        metadata={
                            'reason': 'REFRESH_TOKEN_EXPIRED',
                            'session_id': session.id,
                        }
                    )
            raise exc

