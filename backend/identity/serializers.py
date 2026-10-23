from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, CustomerProfile, Address
from common.enums import UserRole

class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = [
            'id', 'is_prime_member', 'prime_started_at', 'prime_expires_at',
            'prime_auto_renew', 'preferred_currency', 'preferred_language',
            'is_tax_exempt', 'tax_exemption_number', 'avatar_url', 'created_at', 'updated_at'
        ]

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            'id', 'full_name', 'phone_number', 'street_line1', 'street_line2',
            'company_name', 'city', 'state_or_province', 'postal_code',
            'country_code', 'is_default_shipping', 'is_default_billing',
            'is_commercial', 'delivery_instructions', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class UserSerializer(serializers.ModelSerializer):
    customer_profile = CustomerProfileSerializer(read_only=True)
    seller_info = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'phone', 'email', 'first_name', 'last_name', 'role',
            'is_phone_verified', 'is_email_verified', 'two_factor_enabled',
            'last_login_at', 'created_at', 'updated_at', 'customer_profile', 'seller_info'
        ]
        read_only_fields = ['id', 'role', 'is_phone_verified', 'is_email_verified', 'created_at', 'updated_at']

    def get_seller_info(self, obj):
        seller = getattr(obj, 'seller_account', None)
        if not seller:
            return None
        return {
            'id': seller.id,
            'display_name': seller.display_name,
            'legal_business_name': seller.legal_business_name,
            'store_slug': seller.store_slug,
            'tier': seller.tier,
            'account_status': seller.account_status,
        }

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6, style={'input_type': 'password'})
    role = serializers.ChoiceField(choices=UserRole.choices, default=UserRole.CUSTOMER, required=False)

    class Meta:
        model = User
        fields = ['phone', 'password', 'first_name', 'last_name', 'email', 'role']

    def validate_phone(self, value):
        cleaned = value.strip()
        if User.objects.filter(phone=cleaned).exists():
            raise serializers.ValidationError("An account with this mobile number already exists.")
        return cleaned

    def validate_email(self, value):
        if value:
            cleaned = value.strip().lower()
            if User.objects.filter(email=cleaned).exists():
                raise serializers.ValidationError("An account with this email already exists.")
            return cleaned
        return None

    def create(self, validated_data):
        password = validated_data.pop('password')
        role = validated_data.get('role', UserRole.CUSTOMER)
        
        user = User.objects.create_user(
            phone=validated_data['phone'],
            password=password,
            email=validated_data.get('email'),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=role,
        )

        # Automatically initialize customer profile
        CustomerProfile.objects.create(user=user)

        return user

class LoginSerializer(serializers.Serializer):
    phone = serializers.CharField(required=False, allow_blank=True)
    email = serializers.CharField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)
    identifier = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'})

    def validate(self, attrs):
        # Resolve identifier from any provided field (phone, email, username, or generic identifier)
        raw_identifier = (
            attrs.get('phone') or
            attrs.get('email') or
            attrs.get('username') or
            attrs.get('identifier') or
            ''
        ).strip()
        password = attrs.get('password')

        if not raw_identifier:
            raise serializers.ValidationError("Please provide your phone, email, or username.")

        # Allow login by matching against actual database columns: phone, email, or username
        user = (
            User.objects.filter(phone=raw_identifier).first() or
            User.objects.filter(email__iexact=raw_identifier).first() or
            User.objects.filter(username__iexact=raw_identifier).first()
        )

        if not user or not user.check_password(password):
            raise serializers.ValidationError("Invalid credentials. Please check your phone/email/username and password.")

        if not user.is_active:
            raise serializers.ValidationError("User account is inactive or disabled.")

        attrs['user'] = user
        return attrs

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, min_length=6, write_only=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value


class SendOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(required=True)
    purpose = serializers.ChoiceField(
        choices=[
            ("SELLER_LOGIN", "Seller Login"),
            ("SELLER_SIGNUP", "Seller Registration"),
            ("CUSTOMER_LOGIN", "Customer Login"),
            ("PASSWORD_RESET", "Password Reset"),
            ("BANK_UPDATE", "Bank Account Update"),
            ("ORDER_DELIVERY", "Order Delivery Confirmation"),
        ],
        default="SELLER_LOGIN",
    )
    channel = serializers.ChoiceField(
        choices=[("SMS", "SMS"), ("WHATSAPP", "WhatsApp"), ("EMAIL", "Email")],
        default="SMS",
    )

    def validate_phone(self, value):
        cleaned = value.strip().replace(" ", "").replace("-", "")
        # Remove +91 or 91 if present for 10-digit standard Indian phone numbers
        if cleaned.startswith("+91"):
            cleaned = cleaned[3:]
        elif cleaned.startswith("91") and len(cleaned) == 12:
            cleaned = cleaned[2:]

        if not cleaned.isdigit() or len(cleaned) < 10:
            raise serializers.ValidationError("Please provide a valid 10-digit mobile number.")
        return cleaned


class VerifyOTPSerializer(serializers.Serializer):
    session_id = serializers.UUIDField(required=False)
    phone = serializers.CharField(required=False)
    otp = serializers.CharField(required=True, min_length=4, max_length=8)
    purpose = serializers.ChoiceField(
        choices=[
            ("SELLER_LOGIN", "Seller Login"),
            ("SELLER_SIGNUP", "Seller Registration"),
            ("CUSTOMER_LOGIN", "Customer Login"),
            ("PASSWORD_RESET", "Password Reset"),
            ("BANK_UPDATE", "Bank Account Update"),
            ("ORDER_DELIVERY", "Order Delivery Confirmation"),
        ],
        default="SELLER_LOGIN",
        required=False,
    )

    # Optional device binding fields
    device_id = serializers.CharField(required=False, allow_blank=True)
    platform = serializers.CharField(required=False, allow_blank=True)
    device_model = serializers.CharField(required=False, allow_blank=True)
    os_version = serializers.CharField(required=False, allow_blank=True)
    app_version = serializers.CharField(required=False, allow_blank=True)
    push_token = serializers.CharField(required=False, allow_blank=True)

    def validate_otp(self, value):
        cleaned = value.strip()
        if not cleaned.isdigit():
            raise serializers.ValidationError("OTP must be numeric digits only.")
        return cleaned

    def validate(self, attrs):
        if not attrs.get('session_id') and not attrs.get('phone'):
            raise serializers.ValidationError("Either 'session_id' or 'phone' must be provided.")
        if attrs.get('phone'):
            cleaned = attrs['phone'].strip().replace(" ", "").replace("-", "")
            if cleaned.startswith("+91"):
                cleaned = cleaned[3:]
            elif cleaned.startswith("91") and len(cleaned) == 12:
                cleaned = cleaned[2:]
            attrs['phone'] = cleaned
        return attrs


class UserDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import UserDevice
        model = UserDevice
        fields = [
            'id', 'device_id', 'platform', 'device_model', 'os_version',
            'app_version', 'is_trusted', 'is_active', 'first_seen_at', 'last_seen_at'
        ]
        read_only_fields = ['id', 'first_seen_at', 'last_seen_at']


class UserSessionSerializer(serializers.ModelSerializer):
    device = UserDeviceSerializer(read_only=True)

    class Meta:
        from .models import UserSession
        model = UserSession
        fields = [
            'id', 'device', 'status', 'ip_address', 'city', 'country',
            'user_agent', 'last_activity_at', 'expires_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'last_activity_at']

