from django.db import models
from common.enums import WarehouseType, InboundShipmentStatus, InventoryMovementReason
from common.utils import generate_id

class Warehouse(models.Model):
    """
    Physical fulfillment center, sorting hub, or merchant warehouse.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=WarehouseType.choices, default=WarehouseType.FBA_FULFILLMENT_CENTER)
    street_address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state_or_province = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=30)
    country_code = models.CharField(max_length=10, default="US")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    seller = models.ForeignKey('sellers.Seller', on_delete=models.CASCADE, null=True, blank=True, related_name='warehouses')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'warehouses'
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['seller']),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"

class InventoryItem(models.Model):
    """
    Multi-location physical stock tracking per listing offer in every warehouse.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    listing = models.ForeignKey('listings.Listing', on_delete=models.CASCADE, related_name='inventory_items')
    seller = models.ForeignKey('sellers.Seller', on_delete=models.CASCADE, related_name='warehouse_inventories')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.RESTRICT, related_name='inventory_items')
    available_stock = models.IntegerField(default=0)
    reserved_stock = models.IntegerField(default=0)
    inbound_stock = models.IntegerField(default=0)
    damaged_stock = models.IntegerField(default=0)
    safety_stock = models.IntegerField(default=5)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inventory_items'
        unique_together = ('listing', 'warehouse')
        indexes = [
            models.Index(fields=['listing']),
            models.Index(fields=['warehouse']),
        ]

    def __str__(self):
        return f"{self.listing.seller_sku} @ {self.warehouse.code} (Available: {self.available_stock})"

class InventoryMovement(models.Model):
    """
    Immutable audit ledger recording all physical stock mutations.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    inventory_item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='stock_logs')
    quantity_change = models.IntegerField()
    balance_after = models.IntegerField()
    reason = models.CharField(max_length=50, choices=InventoryMovementReason.choices)
    reference_note = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'inventory_movements'
        indexes = [
            models.Index(fields=['inventory_item', 'created_at']),
        ]

    def __str__(self):
        return f"Move: {self.quantity_change} ({self.reason}) -> Bal {self.balance_after}"

class InboundShipment(models.Model):
    """
    Inbound replenishment shipment plan created by a seller sending cartons/pallets to FCs.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    shipment_number = models.CharField(max_length=100, unique=True)
    seller = models.ForeignKey('sellers.Seller', on_delete=models.CASCADE, related_name='inbound_shipments')
    destination_fc = models.ForeignKey(Warehouse, on_delete=models.RESTRICT, related_name='inbound_shipments')
    status = models.CharField(max_length=30, choices=InboundShipmentStatus.choices, default=InboundShipmentStatus.WORKING)
    carrier_name = models.CharField(max_length=100, null=True, blank=True)
    tracking_number = models.CharField(max_length=100, null=True, blank=True)
    box_count = models.IntegerField(default=1)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inbound_shipments'
        indexes = [
            models.Index(fields=['seller']),
            models.Index(fields=['destination_fc']),
        ]

    def __str__(self):
        return f"{self.shipment_number} ({self.status}) -> {self.destination_fc.code}"

class InboundShipmentItem(models.Model):
    """
    Line items declared inside an replenishment carton/pallet shipment.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    inbound_shipment = models.ForeignKey(InboundShipment, on_delete=models.CASCADE, related_name='items')
    seller_sku = models.CharField(max_length=100)
    quantity_expected = models.IntegerField()
    quantity_received = models.IntegerField(default=0)
    quantity_damaged = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inbound_shipment_items'
        indexes = [
            models.Index(fields=['inbound_shipment']),
        ]

    def __str__(self):
        return f"{self.seller_sku}: {self.quantity_received}/{self.quantity_expected}"
