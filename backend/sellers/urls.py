from django.urls import path, include
from rest_framework.routers import DefaultRouter
from sellers.views import SellerProfileViewSet
from listings.views import SellerListingViewSet
from catalog.seller_views import SellerProductViewSet, ProductImageUploadView

router = DefaultRouter()
router.register(r'profile', SellerProfileViewSet, basename='seller-profile')
router.register(r'listings', SellerListingViewSet, basename='seller-listing')
router.register(r'products', SellerProductViewSet, basename='seller-product')

urlpatterns = [
    path('uploads/product-images/', ProductImageUploadView.as_view(), name='seller-product-image-upload'),
    path('', include(router.urls)),
]
