from django.db import models
from django.utils import timezone
from django.conf import settings
from common.enums import OrderStatus, OrderItemStatus, ShippingSpeed, ShipmentStatus
from common.utils import generate_id

class Order(models.Model):
    """
    Master composite customer purchase order.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    order_number = models.CharField(max_length=100, unique=True)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.RESTRICT, related_name='orders')
    status = models.CharField(max_length=30, choices=OrderStatus.choices, default=OrderStatus.PENDING_PAYMENT)
    
    currency = models.CharField(max_length=10, default="USD")
    items_subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    shipping_total = models.DecimalField(max_digits=10, decimal_places=2)
    tax_total = models.DecimalField(max_digits=10, decimal_places=2)
    promotion_discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2)

    promotion = models.ForeignKey('promotions.Promotion', null=True, blank=True, on_delete=models.SET_NULL, related_name='orders_used')
    shipping_address = models.ForeignKey('identity.Address', on_delete=models.RESTRICT, related_name='shipping_orders')
    billing_address = models.ForeignKey('identity.Address', on_delete=models.RESTRICT, related_name='billing_orders')

    shipping_speed = models.CharField(max_length=30, choices=ShippingSpeed.choices, default=ShippingSpeed.STANDARD)
    is_gift = models.BooleanField(default=False)
    gift_message = models.TextField(null=True, blank=True)

    placed_at = models.DateTimeField(default=timezone.now)
    paid_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'orders'
        indexes = [
            models.Index(fields=['order_number']),
            models.Index(fields=['customer']),
            models.Index(fields=['status']),
            models.Index(fields=['placed_at']),
        ]

    def __str__(self):
        return f"Order {self.order_number} ({self.status}) - ${self.grand_total}"

class Shipment(models.Model):
    """
    Physical parcel shipment dispatched from an FC or merchant warehouse.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    shipment_number = models.CharField(max_length=100, unique=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='shipments')
    seller = models.ForeignKey('sellers.Seller', null=True, blank=True, on_delete=models.SET_NULL, related_name='shipments_fulfilled')
    warehouse = models.ForeignKey('warehouses.Warehouse', null=True, blank=True, on_delete=models.SET_NULL, related_name='outbound_packages')
    status = models.CharField(max_length=30, choices=ShipmentStatus.choices, default=ShipmentStatus.LABEL_CREATED)

    carrier_name = models.CharField(max_length=100)
    tracking_number = models.CharField(max_length=100, null=True, blank=True)
    tracking_url = models.CharField(max_length=500, null=True, blank=True)
    shipping_label_url = models.CharField(max_length=500, null=True, blank=True)
    package_weight_pounds = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)

    estimated_delivery_at = models.DateTimeField(null=True, blank=True)
    dispatched_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shipments'
        indexes = [
            models.Index(fields=['order']),
            models.Index(fields=['tracking_number']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.shipment_number} ({self.carrier_name}) - {self.status}"

class OrderItem(models.Model):
    """
    Line item in an order belonging to a specific seller's listing offer.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    listing = models.ForeignKey('listings.Listing', on_delete=models.RESTRICT, related_name='order_items')
    seller = models.ForeignKey('sellers.Seller', on_delete=models.RESTRICT, related_name='order_items_fulfilled')
    shipment = models.ForeignKey(Shipment, null=True, blank=True, on_delete=models.SET_NULL, related_name='order_items')
    status = models.CharField(max_length=30, choices=OrderItemStatus.choices, default=OrderItemStatus.PENDING)

    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)

    item_tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    item_shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    item_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)

    referral_fee_charged = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    closing_fee_charged = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    mf_fulfillment_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)

    gift_wrap_requested = models.BooleanField(default=False)
    gift_wrap_fee = models.DecimalField(max_digits=6, decimal_places=2, default=0.0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'order_items'
        indexes = [
            models.Index(fields=['order']),
            models.Index(fields=['seller']),
            models.Index(fields=['listing']),
        ]

    def __str__(self):
        return f"{self.order.order_number}: {self.listing.seller_sku} x {self.quantity}"

class ShipmentCheckpoint(models.Model):
    """
    Real-time geolocation and transit milestones reported by shipping carriers.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name='tracking_events')
    event_time = models.DateTimeField()
    location = models.CharField(max_length=255)
    status_text = models.CharField(max_length=255)
    carrier_code = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'shipment_checkpoints'
        indexes = [
            models.Index(fields=['shipment', 'event_time']),
        ]

    def __str__(self):
        return f"{self.shipment.shipment_number} - {self.status_text} @ {self.location}"
