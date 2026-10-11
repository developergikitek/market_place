from django.db import models
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
