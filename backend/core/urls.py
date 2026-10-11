from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({
        "status": "online",
        "service": "Construction Marketplace API",
        "version": "1.0.0",
        "message": "Django backend is up and running!"
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', health_check, name='root_health'),
    path('api/health/', health_check, name='health_check'),
    
    # Identity & Authentication APIs
    path('api/auth/', include('identity.urls')),
    
    # Public Catalog (Products, Categories & Brands)
    path('api/catalog/', include('catalog.urls')),
    
    # Seller Portal APIs (Listings, Products, Profile & Stock)
    path('api/seller/', include('sellers.urls')),
    path('api/listings/', include('listings.urls')),
]
