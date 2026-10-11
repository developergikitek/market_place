from django.db import models
from common.enums import CampaignStatus, AdKeywordMatchType
from common.utils import generate_id

class AdCampaign(models.Model):
    """
    Sponsored Products PPC campaign.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    seller = models.ForeignKey('sellers.Seller', on_delete=models.CASCADE, related_name='ad_campaigns')
    name = models.CharField(max_length=255)
    daily_budget = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=30, choices=CampaignStatus.choices, default=CampaignStatus.ACTIVE)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ad_campaigns'
        indexes = [
            models.Index(fields=['seller']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.name} (${self.daily_budget}/day)"

class AdGroup(models.Model):
    """
    Ad Group containing targeted listings and associated bidding keywords.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    campaign = models.ForeignKey(AdCampaign, on_delete=models.CASCADE, related_name='ad_groups')
    name = models.CharField(max_length=255)
    default_bid = models.DecimalField(max_digits=6, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ad_groups'
        indexes = [
            models.Index(fields=['campaign']),
        ]

    def __str__(self):
        return f"{self.name} in {self.campaign.name}"

class AdKeyword(models.Model):
    """
    Target keywords and cost-per-click bids for sponsored placement.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    ad_group = models.ForeignKey(AdGroup, on_delete=models.CASCADE, related_name='keywords')
    keyword = models.CharField(max_length=255)
    match_type = models.CharField(max_length=30, choices=AdKeywordMatchType.choices, default=AdKeywordMatchType.BROAD)
    bid_price = models.DecimalField(max_digits=6, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ad_keywords'
        indexes = [
            models.Index(fields=['ad_group', 'keyword']),
        ]

    def __str__(self):
        return f"[{self.match_type}] {self.keyword} (${self.bid_price})"

class SponsoredProductAd(models.Model):
    """
    Sponsored product impression, click, and conversion performance tracker.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    ad_group = models.ForeignKey(AdGroup, on_delete=models.CASCADE, related_name='ads')
    listing = models.ForeignKey('listings.Listing', on_delete=models.CASCADE, related_name='sponsored_ads')
    impressions = models.IntegerField(default=0)
    clicks = models.IntegerField(default=0)
    total_spend = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    attributed_sales = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sponsored_product_ads'
        unique_together = ('ad_group', 'listing')

    def __str__(self):
        return f"Ad for {self.listing.seller_sku} in {self.ad_group.name}"
