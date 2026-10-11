from django.urls import path, include
from rest_framework.routers import DefaultRouter
from listings.views import SellerListingViewSet

router = DefaultRouter()
router.register(r'', SellerListingViewSet, basename='listing')

urlpatterns = [
    path('', include(router.urls)),
]
