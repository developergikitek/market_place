from django.db import models
from django.utils import timezone
from django.conf import settings
from common.utils import generate_id

class BuyerSellerMessage(models.Model):
    """
    Secure, policy-compliant Buyer-Seller Messaging relay.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_messages')
    order_number = models.CharField(max_length=100, null=True, blank=True)
    subject = models.CharField(max_length=255)
    body = models.TextField()
    attachment_urls = models.JSONField(default=list, blank=True)
    is_read = models.BooleanField(default=False)
    sent_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'buyer_seller_messages'
        indexes = [
            models.Index(fields=['sender']),
            models.Index(fields=['recipient']),
        ]

    def __str__(self):
        return f"Message from {self.sender.email} to {self.recipient.email}: {self.subject}"

class AuditLog(models.Model):
    """
    Security, financial, and admin action audit logging.
    """
    id = models.CharField(max_length=64, primary_key=True, default=generate_id, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='audit_logs')
    action = models.CharField(max_length=255)
    entity_type = models.CharField(max_length=100)
    entity_id = models.CharField(max_length=100)
    metadata = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        indexes = [
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['user']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"[{self.action}] on {self.entity_type}#{self.entity_id} at {self.created_at}"
