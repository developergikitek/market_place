from django.contrib import admin
from .models import Listing, ListingTierPrice

admin.site.register(Listing)
admin.site.register(ListingTierPrice)
