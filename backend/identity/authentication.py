from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from django.utils import timezone
from .models import UserSession, SessionStatus


class SessionJWTAuthentication(JWTAuthentication):
    """
    Enterprise Real-time Session Validation Authentication Backend.
    In addition to verifying the cryptographic JWT signature & expiration,
    it verifies that the embedded session_id corresponds to an ACTIVE session
    in the database. If the session has been revoked or expired (e.g. user logged out
    or remote wipe), the request is instantly denied with 401 Unauthorized.
    """

    def authenticate(self, request):
        auth_result = super().authenticate(request)
        if auth_result is None:
            return None

        user, validated_token = auth_result
        session_id = validated_token.get('session_id')

        # Strictly mandatory: Reject any legacy token lacking session_id
        if not session_id:
            raise AuthenticationFailed(
                {
                    "detail": "Invalid token: Mandatory session binding missing. Please log in again.",
                    "code": "session_id_required",
                }
            )

        session = UserSession.objects.filter(id=session_id, user=user).select_related('device').first()
        if not session:
            raise AuthenticationFailed(
                {"detail": "Session not found or has been terminated. Please log in again.", "code": "session_not_found"}
            )

        if not session.is_valid():
            raise AuthenticationFailed(
                {
                    "detail": f"Session is {session.status.lower()} ({session.revocation_reason or 'expired'}). Please log in again.",
                    "code": "session_inactive",
                }
            )

        # Attach active session to request
        request.user_session = session

        return (user, validated_token)
