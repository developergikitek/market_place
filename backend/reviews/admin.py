from django.contrib import admin
from .models import ProductReview, ReviewVote, SellerFeedback, ProductQuestion, ProductAnswer

admin.site.register(ProductReview)
admin.site.register(ReviewVote)
admin.site.register(SellerFeedback)
admin.site.register(ProductQuestion)
admin.site.register(ProductAnswer)
