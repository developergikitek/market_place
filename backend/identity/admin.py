from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, CustomerProfile, Address, OTPRequest

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

admin.site.register(CustomerProfile)
admin.site.register(Address)

