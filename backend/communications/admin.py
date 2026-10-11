from django.contrib import admin
from .models import BuyerSellerMessage, AuditLog

admin.site.register(BuyerSellerMessage)
admin.site.register(AuditLog)
