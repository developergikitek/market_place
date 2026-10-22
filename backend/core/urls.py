from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView
)

def health_check(request):
    return JsonResponse({
        "status": "online",
        "service": "Construction Marketplace API",
        "version": "1.0.0",
        "message": "Django backend is up and running!",
        "documentation": "/api/docs/"
    })

urlpatterns = [
    # Administration
    path('admin/', admin.site.urls),
    
    # System Health
    path('', health_check, name='root_health'),
    path('api/health/', health_check, name='health_check'),
    
    # 📚 Interactive Swagger & OpenAPI Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui-alias'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # 🔐 Identity & Authentication APIs
    path('api/auth/', include('identity.urls')),
    
    # 📦 Public Catalog (Products, Categories & Brands)
    path('api/catalog/', include('catalog.urls')),
    
    # 🏪 Seller Portal APIs (Unified under /api/portal/ namespace)
    path('api/portal/', include('sellers.urls')),
    path('api/seller/', include('sellers.urls')),
    path('api/listings/', include('listings.urls')),
    path('api/returns/', include('returns.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
