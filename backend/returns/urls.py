from django.urls import path, include
from rest_framework.routers import DefaultRouter
from returns.views import ReturnRequestViewSet, AtoZClaimViewSet

router = DefaultRouter()
# Registered before the root route so /claims/ isn't captured as a return id.
router.register(r'claims', AtoZClaimViewSet, basename='atoz-claim')
router.register(r'', ReturnRequestViewSet, basename='return')

urlpatterns = [
    path('', include(router.urls)),
]
