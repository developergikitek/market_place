from django.contrib import admin
from .models import Payment, SellerSettlement, SellerTransaction

admin.site.register(Payment)
admin.site.register(SellerSettlement)
admin.site.register(SellerTransaction)
