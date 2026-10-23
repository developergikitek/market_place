from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User,
    CustomerProfile,
    Address,
    OTPRequest,
    UserDevice,
    UserSession,
    RefreshTokenRecord,
    AuthAuditLog,
)

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('phone', 'first_name', 'last_name', 'email', 'role', 'is_phone_verified', 'is_staff')
    list_filter = ('role', 'is_phone_verified', 'is_email_verified', 'is_staff', 'is_superuser')
    search_fields = ('phone', 'email', 'first_name', 'last_name')
    ordering = ('phone',)
    fieldsets = (
        (None, {'fields': ('phone', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'email')}),
        ('Role & Verification', {'fields': ('role', 'is_phone_verified', 'is_email_verified')}),
        ('Security', {'fields': ('two_factor_enabled', 'two_factor_secret', 'failed_login_attempts', 'locked_until', 'last_login_at')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone', 'password', 'first_name', 'last_name', 'role'),
        }),
    )

@admin.register(OTPRequest)
class OTPRequestAdmin(admin.ModelAdmin):
    list_display = ('phone', 'purpose', 'channel', 'provider', 'attempts', 'is_verified', 'expires_at', 'created_at')
    list_filter = ('purpose', 'channel', 'provider', 'is_verified')
    search_fields = ('phone', 'session_id')
    readonly_fields = ('id', 'session_id', 'created_at', 'updated_at', 'verified_at')
    ordering = ('-created_at',)


@admin.register(UserDevice)
class UserDeviceAdmin(admin.ModelAdmin):
    list_display = ('user', 'platform', 'device_model', 'os_version', 'is_trusted', 'is_active', 'last_seen_at')
    list_filter = ('platform', 'is_trusted', 'is_active')
    search_fields = ('user__phone', 'device_id', 'device_model', 'push_token')
    readonly_fields = ('id', 'first_seen_at', 'last_seen_at')
    ordering = ('-last_seen_at',)


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'device', 'status', 'ip_address', 'expires_at', 'last_activity_at')
    list_filter = ('status',)
    search_fields = ('user__phone', 'ip_address', 'session_token_hash')
    readonly_fields = ('id', 'session_token_hash', 'created_at', 'updated_at', 'last_activity_at')
    ordering = ('-created_at',)


@admin.register(RefreshTokenRecord)
class RefreshTokenRecordAdmin(admin.ModelAdmin):
    list_display = ('session', 'family_id', 'is_revoked', 'expires_at', 'created_at')
    list_filter = ('is_revoked',)
    search_fields = ('session__user__phone', 'family_id', 'token_hash')
    readonly_fields = ('id', 'token_hash', 'family_id', 'created_at')
    ordering = ('-created_at',)


@admin.register(AuthAuditLog)
class AuthAuditLogAdmin(admin.ModelAdmin):
    list_display = ('event', 'user', 'ip_address', 'device_id', 'created_at')
    list_filter = ('event',)
    search_fields = ('user__phone', 'ip_address', 'device_id')
    readonly_fields = ('id', 'user', 'event', 'ip_address', 'user_agent', 'device_id', 'metadata', 'created_at')
    ordering = ('-created_at',)


admin.site.register(CustomerProfile)
admin.site.register(Address)

