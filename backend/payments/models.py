from django.db import models
from django.utils import timezone
from common.enums import PaymentMethodType, PaymentStatus, SettlementStatus, TransactionType
from common.utils import generate_id

class Payment(models.Model):
    """
    Gateway payment transaction authorized and captured for an order.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='payments')
    payment_method = models.CharField(max_length=50, choices=PaymentMethodType.choices)
    gateway_provider = models.CharField(max_length=100) # STRIPE, ADYEN, RAZORPAY, etc.
    gateway_transaction_id = models.CharField(max_length=255, unique=True)
    gateway_payload_json = models.JSONField(null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default="USD")
    status = models.CharField(max_length=30, choices=PaymentStatus.choices, default=PaymentStatus.INITIATED)
    authorized_at = models.DateTimeField(null=True, blank=True)
    captured_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments'
        indexes = [
            models.Index(fields=['order']),
            models.Index(fields=['gateway_transaction_id']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.gateway_provider} {self.gateway_transaction_id} (${self.amount})"

class SellerSettlement(models.Model):
    """
    Bi-weekly financial settlement account statement for third-party sellers.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    settlement_number = models.CharField(max_length=100, unique=True)
    seller = models.ForeignKey('sellers.Seller', on_delete=models.CASCADE, related_name='settlements')
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    status = models.CharField(max_length=30, choices=SettlementStatus.choices, default=SettlementStatus.OPEN)

    gross_sales_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    referral_fees_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    closing_fees_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    mf_fulfillment_fees = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    mf_storage_fees = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    refund_deductions_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    advertising_spend_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    other_adjustments_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    net_disbursement_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)

    bank_account = models.ForeignKey('sellers.SellerBankAccount', null=True, blank=True, on_delete=models.SET_NULL, related_name='settlements')
    disbursed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'seller_settlements'
        indexes = [
            models.Index(fields=['seller', 'status']),
        ]

    def __str__(self):
        return f"{self.settlement_number} - {self.seller.display_name} (${self.net_disbursement_amount})"

class SellerTransaction(models.Model):
    """
    Atomic line item entry on a seller's financial ledger statement.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    settlement = models.ForeignKey(SellerSettlement, on_delete=models.CASCADE, related_name='transactions')
    order_item = models.ForeignKey('orders.OrderItem', null=True, blank=True, on_delete=models.SET_NULL, related_name='settlement_entries')
    transaction_type = models.CharField(max_length=50, choices=TransactionType.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2) # Positive for credits, Negative for fees/refunds
    currency = models.CharField(max_length=10, default="USD")
    description = models.TextField()
    posted_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'seller_transactions'
        indexes = [
            models.Index(fields=['settlement']),
            models.Index(fields=['order_item']),
        ]

    def __str__(self):
        return f"{self.transaction_type}: {self.amount} ({self.settlement.settlement_number})"
