from django.db import models
from django.utils import timezone
from django.conf import settings
from common.enums import (
    SellerTier, SellerAccountStatus, VerificationStatus,
    FulfillmentChannel, KycDocumentType
)
from common.utils import generate_id

class Seller(models.Model):
    """
    Merchant account entity operating on the Marketplace.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='seller_account')
    legal_business_name = models.CharField(max_length=255)
    display_name = models.CharField(max_length=255, unique=True)
    store_slug = models.CharField(max_length=255, unique=True)
    tier = models.CharField(max_length=30, choices=SellerTier.choices, default=SellerTier.INDIVIDUAL)
    account_status = models.CharField(max_length=30, choices=SellerAccountStatus.choices, default=SellerAccountStatus.ONBOARDING)
    verification_status = models.CharField(max_length=30, choices=VerificationStatus.choices, default=VerificationStatus.PENDING_REVIEW)
    logo_url = models.CharField(max_length=500, null=True, blank=True)
    banner_url = models.CharField(max_length=500, null=True, blank=True)
    store_description = models.TextField(null=True, blank=True)
    support_email = models.EmailField()
    support_phone = models.CharField(max_length=30)
    tax_identification_num = models.CharField(max_length=100, null=True, blank=True)
    default_fulfillment = models.CharField(max_length=10, choices=FulfillmentChannel.choices, default=FulfillmentChannel.FBA)
    holiday_mode_enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sellers'
        indexes = [
            models.Index(fields=['account_status']),
            models.Index(fields=['verification_status']),
        ]

    def __str__(self):
        return f"{self.display_name} ({self.legal_business_name})"

class SellerKycDocument(models.Model):
    """
    Regulatory Know-Your-Customer (KYC) identity compliance document uploads.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    seller = models.ForeignKey(Seller, on_delete=models.CASCADE, related_name='kyc_documents')
    document_type = models.CharField(max_length=50, choices=KycDocumentType.choices)
    document_number = models.CharField(max_length=100, null=True, blank=True)
    file_url = models.CharField(max_length=500)
    status = models.CharField(max_length=30, choices=VerificationStatus.choices, default=VerificationStatus.PENDING_REVIEW)
    verified_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'seller_kyc_documents'
        indexes = [
            models.Index(fields=['seller']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.document_type} - {self.seller.display_name}"

class SellerBankAccount(models.Model):
    """
    Merchant disbursement bank account for automated ACH/SEPA/Wire settlements.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    seller = models.ForeignKey(Seller, on_delete=models.CASCADE, related_name='bank_accounts')
    bank_name = models.CharField(max_length=255)
    account_holder = models.CharField(max_length=255)
    account_number = models.CharField(max_length=255)
    routing_number = models.CharField(max_length=100, null=True, blank=True)
    swift_bic = models.CharField(max_length=50, null=True, blank=True)
    currency = models.CharField(max_length=10, default="USD")
    country_code = models.CharField(max_length=10, default="US")
    is_primary = models.BooleanField(default=False)
    status = models.CharField(max_length=30, choices=VerificationStatus.choices, default=VerificationStatus.PENDING_REVIEW)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'seller_bank_accounts'
        indexes = [
            models.Index(fields=['seller']),
        ]

    def __str__(self):
        return f"{self.bank_name} ({self.account_holder})"

class SellerPerformanceMetrics(models.Model):
    """
    Live algorithmic health and performance scorecard for maintaining seller privileges.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    seller = models.OneToOneField(Seller, on_delete=models.CASCADE, related_name='metrics')
    order_defect_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    cancellation_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    late_shipment_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    valid_tracking_rate = models.DecimalField(max_digits=5, decimal_places=2, default=100.0)
    on_time_delivery_rate = models.DecimalField(max_digits=5, decimal_places=2, default=100.0)
    policy_compliance_score = models.IntegerField(default=1000)
    lifetime_review_count = models.IntegerField(default=0)
    positive_feedback_percent = models.DecimalField(max_digits=5, decimal_places=2, default=100.0)
    average_feedback_score = models.DecimalField(max_digits=3, decimal_places=2, default=5.0)
    last_calculated_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'seller_performance_metrics'

    def __str__(self):
        return f"Metrics for {self.seller.display_name}"
