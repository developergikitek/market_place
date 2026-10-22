import random
from datetime import timedelta
from django.conf import settings
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone

from .models import User, OTPRequest, OTPPurpose, OTPChannel
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    ChangePasswordSerializer,
    SendOTPSerializer,
    VerifyOTPSerializer,
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
            tokens = get_tokens_for_user(user)
            return Response(
                {
                    "message": "User registered successfully.",
                    "user": UserSerializer(user).data,
                    "tokens": tokens,
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

            tokens = get_tokens_for_user(user)
            return Response(
                {
                    "message": "Login successful.",
                    "user": UserSerializer(user).data,
                    "tokens": tokens,
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

            tokens = get_tokens_for_user(user)
            return Response(
                {
                    "message": "OTP verified successfully. Login successful.",
                    "user": UserSerializer(user).data,
                    "tokens": tokens,
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

