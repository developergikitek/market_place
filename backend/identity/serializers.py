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
    phone = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'})

    def validate(self, attrs):
        phone = attrs.get('phone', '').strip()
        password = attrs.get('password')

        # Allow login by phone, email, or username
        user = User.objects.filter(phone=phone).first()
        if not user and '@' in phone:
            user = User.objects.filter(email=phone.lower()).first()
        if not user:
            user = User.objects.filter(username=phone).first()

        if not user or not user.check_password(password):
            raise serializers.ValidationError("Invalid mobile number, username, or password.")

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
