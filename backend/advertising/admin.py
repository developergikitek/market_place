from django.contrib import admin
from .models import AdCampaign, AdGroup, AdKeyword, SponsoredProductAd

admin.site.register(AdCampaign)
admin.site.register(AdGroup)
admin.site.register(AdKeyword)
admin.site.register(SponsoredProductAd)
