from django.contrib.auth.backends import ModelBackend
from django.db.models import Q
from .models import User

class PhoneOrEmailBackend(ModelBackend):
    """
    Custom authentication backend that seamlessly handles:
    - 10-digit phone number (e.g., 9999999999)
    - Phone number with country code (e.g., +919999999999)
    - Email address
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get('phone') or kwargs.get('email')

        if not username or not password:
            return None

        identifier = str(username).strip()
        digits_only = ''.join(filter(str.isdigit, identifier))

        phone_queries = Q(phone=identifier)
        if digits_only:
            phone_queries |= Q(phone=digits_only)
            if len(digits_only) == 10:
                phone_queries |= Q(phone=f"+91{digits_only}")
            elif len(digits_only) == 12 and digits_only.startswith("91"):
                phone_queries |= Q(phone=digits_only[2:])
                phone_queries |= Q(phone=f"+{digits_only}")

        user = User.objects.filter(
            phone_queries | Q(email__iexact=identifier) | Q(username__iexact=identifier)
        ).first()

        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
