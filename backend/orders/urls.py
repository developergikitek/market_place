from django.urls import path, include
from rest_framework.routers import DefaultRouter
from orders.views import SellerOrderViewSet

router = DefaultRouter()
router.register(r'', SellerOrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
]
