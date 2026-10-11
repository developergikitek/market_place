from django.contrib import admin
from .models import Order, OrderItem, Shipment, ShipmentCheckpoint

admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Shipment)
admin.site.register(ShipmentCheckpoint)
