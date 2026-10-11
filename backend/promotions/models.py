from django.db import models
from common.utils import generate_id

class Promotion(models.Model):
    """
    Vouchers, promo codes, and discount campaigns sponsored by platform or seller.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    code = models.CharField(max_length=100, unique=True, null=True, blank=True)
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    sponsor_seller = models.ForeignKey('sellers.Seller', null=True, blank=True, on_delete=models.SET_NULL, related_name='promotions_sponsored')
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    minimum_spend = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    maximum_discount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    usage_limit_global = models.IntegerField(null=True, blank=True)
    usage_limit_per_user = models.IntegerField(default=1)
    total_times_used = models.IntegerField(default=0)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'promotions'
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active', 'starts_at', 'ends_at']),
        ]

    def __str__(self):
        return f"{self.name} ({self.code or 'Auto'})"

class Deal(models.Model):
    """
    Lightning Deals and Deal of the Day with limited quantity and countdown timer.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    listing = models.ForeignKey('listings.Listing', on_delete=models.CASCADE, related_name='deals')
    product = models.ForeignKey('catalog.Product', on_delete=models.CASCADE, related_name='deals')
    deal_title = models.CharField(max_length=255)
    deal_price = models.DecimalField(max_digits=12, decimal_places=2)
    max_quantity = models.IntegerField()
    claimed_quantity = models.IntegerField(default=0)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'deals'
        indexes = [
            models.Index(fields=['listing']),
            models.Index(fields=['is_active', 'starts_at', 'ends_at']),
        ]

    def __str__(self):
        return f"{self.deal_title} - ${self.deal_price}"
