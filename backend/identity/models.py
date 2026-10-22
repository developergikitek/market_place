import uuid
import hashlib
from django.conf import settings
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser, BaseUserManager
from common.enums import UserRole
from common.utils import generate_id

class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, phone, password=None, email=None, **extra_fields):
        if not phone:
            raise ValueError('The Mobile Number (phone) is mandatory.')

        phone = str(phone).strip()
        extra_fields.setdefault('username', phone)

        if email:
            email = self.normalize_email(email)
            extra_fields['email'] = email
        else:
            extra_fields['email'] = None

        user = self.model(phone=phone, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, email=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', UserRole.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(phone, password=password, email=email, **extra_fields)

class User(AbstractUser):
    """
    Core platform account with mandatory Mobile Number (phone) as USERNAME_FIELD
    and optional email.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    phone = models.CharField(max_length=30, unique=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    role = models.CharField(max_length=30, choices=UserRole.choices, default=UserRole.CUSTOMER)
    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=255, null=True, blank=True)
    failed_login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    last_login_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['phone']),
            models.Index(fields=['email']),
            models.Index(fields=['role']),
        ]

    def __str__(self):
        name = self.get_full_name() or self.phone
        return f"{name} [{self.phone}] ({self.role})"

    @property
    def password_hash(self):
        return self.password

class CustomerProfile(models.Model):
    """
    Consumer profile containing shopping preferences, Prime subscription, and loyalty status.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    is_prime_member = models.BooleanField(default=False)
    prime_started_at = models.DateTimeField(null=True, blank=True)
    prime_expires_at = models.DateTimeField(null=True, blank=True)
    prime_auto_renew = models.BooleanField(default=True)
    preferred_currency = models.CharField(max_length=10, default="USD")
    preferred_language = models.CharField(max_length=10, default="en-US")
    is_tax_exempt = models.BooleanField(default=False)
    tax_exemption_number = models.CharField(max_length=100, null=True, blank=True)
    avatar_url = models.CharField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customer_profiles'
        indexes = [
            models.Index(fields=['is_prime_member']),
        ]

    def __str__(self):
        return f"Profile of {self.user.phone}"

class Address(models.Model):
    """
    Customer physical address book for deliveries, tax jurisdiction, and billing.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=30)
    street_line1 = models.CharField(max_length=255)
    street_line2 = models.CharField(max_length=255, null=True, blank=True)
    company_name = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=100)
    state_or_province = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=30)
    country_code = models.CharField(max_length=10, default="US")
    is_default_shipping = models.BooleanField(default=False)
    is_default_billing = models.BooleanField(default=False)
    is_commercial = models.BooleanField(default=False)
    delivery_instructions = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'addresses'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['postal_code', 'country_code']),
        ]

    def __str__(self):
        return f"{self.full_name} - {self.city}, {self.postal_code}"


class OTPPurpose(models.TextChoices):
    SELLER_LOGIN = "SELLER_LOGIN", "Seller Login"
    SELLER_SIGNUP = "SELLER_SIGNUP", "Seller Registration"
    CUSTOMER_LOGIN = "CUSTOMER_LOGIN", "Customer Login"
    PASSWORD_RESET = "PASSWORD_RESET", "Password Reset"
    BANK_UPDATE = "BANK_UPDATE", "Bank Account Update"
    ORDER_DELIVERY = "ORDER_DELIVERY", "Order Delivery Confirmation"


class OTPChannel(models.TextChoices):
    SMS = "SMS", "SMS"
    WHATSAPP = "WHATSAPP", "WhatsApp"
    EMAIL = "EMAIL", "Email"


class OTPRequest(models.Model):
    """
    Enterprise-grade OTP tracking model supporting multi-channel delivery,
    rate-limiting, attempt-capping, and cryptographic verification.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    session_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    phone = models.CharField(max_length=30, db_index=True)
    purpose = models.CharField(
        max_length=30,
        choices=OTPPurpose.choices,
        default=OTPPurpose.SELLER_LOGIN,
        db_index=True,
    )
    otp_hash = models.CharField(max_length=128)
    channel = models.CharField(max_length=15, choices=OTPChannel.choices, default=OTPChannel.SMS)
    provider = models.CharField(max_length=30, default="MOCK")
    provider_msg_id = models.CharField(max_length=100, blank=True, null=True)

    attempts = models.PositiveSmallIntegerField(default=0)
    max_attempts = models.PositiveSmallIntegerField(default=3)
    expires_at = models.DateTimeField()
    resend_available_at = models.DateTimeField()

    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(blank=True, null=True)

    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "auth_otp_requests"
        verbose_name = "OTP Request"
        verbose_name_plural = "OTP Requests"
        indexes = [
            models.Index(fields=["phone", "purpose", "is_verified", "expires_at"]),
            models.Index(fields=["session_id"]),
        ]

    def __str__(self):
        return f"OTP for {self.phone} [{self.purpose}] ({'Verified' if self.is_verified else 'Pending'})"

    @classmethod
    def hash_otp(cls, raw_otp: str) -> str:
        salt = getattr(settings, "OTP_SECRET_SALT", None) or getattr(settings, "SECRET_KEY", None)
        if not salt:
            raise ValueError("No OTP salt or SECRET_KEY configured in environment (.env).")
        return hashlib.sha256(f"{raw_otp}:{salt}".encode()).hexdigest()


    def set_otp(self, raw_otp: str):
        self.otp_hash = self.hash_otp(raw_otp)

    def check_otp(self, raw_otp: str) -> bool:
        return self.otp_hash == self.hash_otp(raw_otp)

    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at

    def can_attempt(self) -> bool:
        return not self.is_verified and not self.is_expired() and self.attempts < self.max_attempts

