from django.urls import path, include
from rest_framework.routers import DefaultRouter
from warehouses.views import InventoryViewSet

router = DefaultRouter()
router.register(r'', InventoryViewSet, basename='inventory')

urlpatterns = [
    path('', include(router.urls)),
]
