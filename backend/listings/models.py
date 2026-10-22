from django.db import models
from common.enums import ProductCondition, FulfillmentChannel, ListingStatus, CommerceChannel
from common.utils import generate_id

class Listing(models.Model):
    """
    The Seller Offer / Merchant SKU. Multiple merchants list offers against the SAME Product ASIN.
    Buy Box competition takes place here.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    seller = models.ForeignKey('sellers.Seller', on_delete=models.CASCADE, related_name='listings')
    product = models.ForeignKey('catalog.Product', on_delete=models.RESTRICT, related_name='listings')
    seller_sku = models.CharField(max_length=100)
    condition = models.CharField(max_length=50, choices=ProductCondition.choices, default=ProductCondition.NEW)
    condition_note = models.TextField(null=True, blank=True)
    fulfillment_channel = models.CharField(max_length=30, choices=FulfillmentChannel.choices, default=FulfillmentChannel.MAKAANO_FULFILLED)
    commerce_channel = models.CharField(
        max_length=20,
        choices=CommerceChannel.choices,
        default=CommerceChannel.BAZAAR,
        help_text="BAZAAR for Pan-India, QUICK_COMMERCE for 8-10 km hyperlocal, BOTH for hybrid."
    )
    status = models.CharField(max_length=30, choices=ListingStatus.choices, default=ListingStatus.ACTIVE)

    # Pricing & Currency
    standard_price = models.DecimalField(max_digits=12, decimal_places=2)
    sale_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    sale_starts_at = models.DateTimeField(null=True, blank=True)
    sale_ends_at = models.DateTimeField(null=True, blank=True)
    minimum_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    maximum_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    # Fulfillment SLA & Inventory Limits
    handling_time_days = models.IntegerField(default=1)
    max_order_quantity = models.IntegerField(null=True, blank=True)
    restock_date = models.DateTimeField(null=True, blank=True)

    # Algorithmic Buy Box Status
    is_buy_box_winner = models.BooleanField(default=False)
    buy_box_won_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'listings'
        unique_together = [
            ('seller', 'seller_sku'),
            ('seller', 'product', 'condition', 'fulfillment_channel'),
        ]
        indexes = [
            models.Index(fields=['product', 'status', 'standard_price']),
            models.Index(fields=['is_buy_box_winner']),
        ]

    def __str__(self):
        return f"{self.seller.display_name} - {self.seller_sku} (${self.standard_price})"

class ListingTierPrice(models.Model):
    """
    B2B Quantity Tier Discounts for enterprise buyers.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='b2b_tier_prices')
    min_quantity = models.IntegerField()
    discounted_price = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'listing_tier_prices'
        unique_together = ('listing', 'min_quantity')

    def __str__(self):
        return f"Qty {self.min_quantity}+ @ ${self.discounted_price} for {self.listing.seller_sku}"
