from django.contrib import admin
from .models import (
    Brand, Category, CategoryAttribute, SellerBrandAuthorization,
    SellerCategoryAuthorization, GtinExemption, Product, ProductImage, ProductAttributeValue
)

admin.site.register(Brand)
admin.site.register(Category)
admin.site.register(CategoryAttribute)
admin.site.register(SellerBrandAuthorization)
admin.site.register(SellerCategoryAuthorization)
admin.site.register(GtinExemption)
admin.site.register(Product)
admin.site.register(ProductImage)
admin.site.register(ProductAttributeValue)
