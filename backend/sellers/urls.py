from django.urls import path, include
from rest_framework.routers import DefaultRouter
from sellers.views import (
    SellerProfileViewSet,
    SellerListingViewSet,
    SellerProductViewSet,
    ProductImageUploadView,
    SellerReturnRequestViewSet,
    SellerAtoZClaimViewSet,
    SellerDashboardView,
)
from catalog.seller_views import SellerCatalogViewSet

router = DefaultRouter()
router.register(r'profile', SellerProfileViewSet, basename='portal-profile')
router.register(r'listings', SellerListingViewSet, basename='portal-listing')
router.register(r'inventory', SellerListingViewSet, basename='portal-inventory')
router.register(r'products', SellerProductViewSet, basename='portal-product')
router.register(r'catalog', SellerCatalogViewSet, basename='portal-catalog')
router.register(r'returns/claims', SellerAtoZClaimViewSet, basename='portal-claim')
router.register(r'returns', SellerReturnRequestViewSet, basename='portal-return')

urlpatterns = [
    path('dashboard/', SellerDashboardView.as_view(), name='portal-dashboard'),
    path('uploads/product-images/', ProductImageUploadView.as_view(), name='portal-product-image-upload'),
    path('', include(router.urls)),
]
