from django.db import models
from django.conf import settings
from common.utils import generate_id

class Cart(models.Model):
    """
    Customer active shopping cart.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'carts'

    def __str__(self):
        return f"Cart of {self.user.email}"

class CartItem(models.Model):
    """
    Cart line item with Save for Later feature toggle.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    listing = models.ForeignKey('listings.Listing', on_delete=models.CASCADE, related_name='cart_items')
    quantity = models.IntegerField(default=1)
    is_saved_for_later = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'cart_items'
        unique_together = ('cart', 'listing')
        indexes = [
            models.Index(fields=['cart']),
        ]

    def __str__(self):
        return f"{self.listing.seller_sku} x {self.quantity}"

class Wishlist(models.Model):
    """
    Customer registry, gift list, or product wishlist.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlists')
    name = models.CharField(max_length=255, default="Shopping List")
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'wishlists'
        indexes = [
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.name} ({self.user.email})"

class WishlistItem(models.Model):
    """
    Item tracked inside a customer wishlist.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    wishlist = models.ForeignKey(Wishlist, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('catalog.Product', on_delete=models.CASCADE, related_name='wishlist_items')
    added_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    priority = models.IntegerField(default=1) # 1=Low, 2=Medium, 3=High
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'wishlist_items'
        unique_together = ('wishlist', 'product')

    def __str__(self):
        return f"{self.product.asin} in {self.wishlist.name}"
