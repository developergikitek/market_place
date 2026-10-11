from django.db import models
from django.conf import settings
from common.utils import generate_id

class ProductReview(models.Model):
    """
    Verified customer product review with 1-5 star rating and photo uploads.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    product = models.ForeignKey('catalog.Product', on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    order_item = models.OneToOneField('orders.OrderItem', null=True, blank=True, on_delete=models.SET_NULL, related_name='review')
    rating = models.IntegerField() # 1 to 5 stars
    headline = models.CharField(max_length=255)
    content = models.TextField()
    is_verified_purchase = models.BooleanField(default=False)
    image_urls = models.JSONField(default=list, blank=True)
    helpful_votes_count = models.IntegerField(default=0)
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'product_reviews'
        indexes = [
            models.Index(fields=['product', 'rating']),
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.rating}★ review on {self.product.asin} by {self.user.email}"

class ReviewVote(models.Model):
    """
    Upvotes on product reviews.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    review = models.ForeignKey(ProductReview, on_delete=models.CASCADE, related_name='votes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='review_votes')
    is_helpful = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'review_votes'
        unique_together = ('review', 'user')

    def __str__(self):
        return f"Vote by {self.user.email} on {self.review.id}"

class SellerFeedback(models.Model):
    """
    Feedback on merchant performance (shipping, communication, service).
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    seller = models.ForeignKey('sellers.Seller', on_delete=models.CASCADE, related_name='seller_feedbacks')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='seller_feedback')
    order_item = models.OneToOneField('orders.OrderItem', on_delete=models.CASCADE, related_name='seller_feedback')
    rating = models.IntegerField() # 1 to 5 stars
    feedback_text = models.TextField()
    item_as_described = models.BooleanField(default=True)
    prompt_shipping = models.BooleanField(default=True)
    customer_service = models.BooleanField(default=True)
    seller_response_text = models.TextField(null=True, blank=True)
    seller_responded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'seller_feedback'
        indexes = [
            models.Index(fields=['seller', 'rating']),
        ]

    def __str__(self):
        return f"{self.rating}★ seller feedback for {self.seller.display_name}"

class ProductQuestion(models.Model):
    """
    Community customer questions asked on product detail pages.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    product = models.ForeignKey('catalog.Product', on_delete=models.CASCADE, related_name='questions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='questions_asked')
    question_text = models.TextField()
    upvotes_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'product_questions'
        indexes = [
            models.Index(fields=['product']),
        ]

    def __str__(self):
        return f"Q on {self.product.asin}: {self.question_text[:50]}"

class ProductAnswer(models.Model):
    """
    Answers submitted to product questions by other buyers or the seller.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    question = models.ForeignKey(ProductQuestion, on_delete=models.CASCADE, related_name='answers')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='answers_given')
    answer_text = models.TextField()
    is_seller_answer = models.BooleanField(default=False)
    upvotes_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'product_answers'
        indexes = [
            models.Index(fields=['question']),
        ]

    def __str__(self):
        return f"Answer to {self.question.id} by {self.user.email}"
