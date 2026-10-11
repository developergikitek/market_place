from django.contrib import admin
from .models import Warehouse, InventoryItem, InventoryMovement, InboundShipment, InboundShipmentItem

admin.site.register(Warehouse)
admin.site.register(InventoryItem)
admin.site.register(InventoryMovement)
admin.site.register(InboundShipment)
admin.site.register(InboundShipmentItem)
