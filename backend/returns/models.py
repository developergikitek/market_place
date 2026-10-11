from django.db import models
from django.conf import settings
from common.enums import ReturnReason, ReturnStatus, AtoZClaimStatus
from common.utils import generate_id

class ReturnRequest(models.Model):
    """
    Customer merchandise return request and RMA processing.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    rma_number = models.CharField(max_length=100, unique=True)
    order_item = models.ForeignKey('orders.OrderItem', on_delete=models.RESTRICT, related_name='return_requests')
    seller = models.ForeignKey('sellers.Seller', on_delete=models.RESTRICT, related_name='return_requests')
    reason = models.CharField(max_length=50, choices=ReturnReason.choices)
    customer_comment = models.TextField(null=True, blank=True)
    evidence_images = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=30, choices=ReturnStatus.choices, default=ReturnStatus.REQUESTED)

    return_carrier = models.CharField(max_length=100, null=True, blank=True)
    return_tracking_number = models.CharField(max_length=100, null=True, blank=True)
    return_label_url = models.CharField(max_length=500, null=True, blank=True)

    restocking_fee_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2)
    refunded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'return_requests'
        indexes = [
            models.Index(fields=['order_item']),
            models.Index(fields=['seller']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.rma_number} ({self.status}) - ${self.refund_amount}"

class AtoZClaim(models.Model):
    """
    A-to-z Guarantee Buyer Protection Claim dispute resolution.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    claim_number = models.CharField(max_length=100, unique=True)
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='claims')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.RESTRICT, related_name='claims_filed')
    seller = models.ForeignKey('sellers.Seller', on_delete=models.RESTRICT, related_name='claims_against_seller')
    claim_reason = models.CharField(max_length=255)
    buyer_explanation = models.TextField()
    seller_response_text = models.TextField(null=True, blank=True)
    seller_responded_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=50, choices=AtoZClaimStatus.choices, default=AtoZClaimStatus.FILED)
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    arbitration_notes = models.TextField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'atoz_claims'
        indexes = [
            models.Index(fields=['order']),
            models.Index(fields=['seller']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.claim_number} ({self.status}) on Order {self.order.order_number}"
