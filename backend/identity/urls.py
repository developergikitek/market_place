from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    CurrentUserView,
    ChangePasswordView,
    SendOTPView,
    VerifyOTPView,
    LogoutView,
    UserSessionsView,
    RevokeSessionView,
    CustomTokenRefreshView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', LoginView.as_view(), name='auth_login'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('send-otp/', SendOTPView.as_view(), name='auth_send_otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='auth_verify_otp'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('me/', CurrentUserView.as_view(), name='auth_me'),
    path('change-password/', ChangePasswordView.as_view(), name='auth_change_password'),
    path('sessions/', UserSessionsView.as_view(), name='auth_sessions'),
    path('sessions/<str:session_id>/', RevokeSessionView.as_view(), name='auth_revoke_session'),
]

