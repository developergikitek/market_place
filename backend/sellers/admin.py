from django.contrib import admin
from .models import Seller, SellerKycDocument, SellerBankAccount, SellerPerformanceMetrics

admin.site.register(Seller)
admin.site.register(SellerKycDocument)
admin.site.register(SellerBankAccount)
admin.site.register(SellerPerformanceMetrics)
