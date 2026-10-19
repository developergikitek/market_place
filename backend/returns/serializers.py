from decimal import Decimal
from rest_framework import serializers
from common.enums import ReturnReason, ReturnStatus, AtoZClaimStatus
from returns.models import ReturnRequest, AtoZClaim
from returns.workflow import allowed_actions, BUYER_REMORSE_REASONS


class ReturnRequestSerializer(serializers.ModelSerializer):
    """Seller-facing view of a return: the RMA plus the order line, product and buyer it belongs to."""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)
    order_number = serializers.CharField(source='order_item.order.order_number', read_only=True)
    order_placed_at = serializers.DateTimeField(source='order_item.order.placed_at', read_only=True)
    order_item_id = serializers.CharField(source='order_item.id', read_only=True)
    quantity = serializers.IntegerField(source='order_item.quantity', read_only=True)
    unit_price = serializers.DecimalField(source='order_item.unit_price', max_digits=12, decimal_places=2, read_only=True)
    item_total = serializers.DecimalField(source='order_item.total_price', max_digits=12, decimal_places=2, read_only=True)
    seller_sku = serializers.CharField(source='order_item.listing.seller_sku', read_only=True)
    fulfillment_channel = serializers.CharField(source='order_item.listing.fulfillment_channel', read_only=True)
    product = serializers.SerializerMethodField()
    customer = serializers.SerializerMethodField()
    restocking_fee_amount = serializers.SerializerMethodField()
    restocking_fee_allowed = serializers.SerializerMethodField()
    allowed_actions = serializers.SerializerMethodField()

    class Meta:
        model = ReturnRequest
        fields = [
            'id', 'rma_number', 'status', 'status_display', 'reason', 'reason_display',
            'customer_comment', 'evidence_images',
            'order_number', 'order_placed_at', 'order_item_id', 'quantity', 'unit_price', 'item_total',
            'seller_sku', 'fulfillment_channel', 'product', 'customer',
            'return_carrier', 'return_tracking_number', 'return_label_url',
            'restocking_fee_rate', 'restocking_fee_amount', 'restocking_fee_allowed', 'refund_amount', 'refunded_at',
            'allowed_actions', 'created_at', 'updated_at',
        ]

    def get_product(self, obj):
        product = obj.order_item.listing.product
        image = next(iter(sorted(product.images.all(), key=lambda i: i.sort_order)), None)
        return {
            'asin': product.asin,
            'title': product.title,
            'brand': product.brand.name if product.brand else None,
            'image': image.image_url if image else None,
        }

    def get_customer(self, obj):
        order = obj.order_item.order
        address = order.shipping_address
        return {
            'name': address.full_name if address else order.customer.get_full_name() or order.customer.username,
            'phone': address.phone_number if address else None,
            'city': address.city if address else None,
            'state': address.state_or_province if address else None,
        }

    def get_restocking_fee_amount(self, obj):
        rate = Decimal(str(obj.restocking_fee_rate))
        return str((obj.order_item.total_price * rate / Decimal('100')).quantize(Decimal('0.01')))

    def get_restocking_fee_allowed(self, obj):
        return obj.reason in BUYER_REMORSE_REASONS or obj.status == ReturnStatus.INSPECTED_DAMAGED

    def get_allowed_actions(self, obj):
        return allowed_actions(obj)


class ReturnCreateSerializer(serializers.Serializer):
    """Buyer opens a return against a delivered order line."""
    order_item_id = serializers.CharField()
    reason = serializers.ChoiceField(choices=ReturnReason.choices)
    customer_comment = serializers.CharField(required=False, allow_blank=True)
    evidence_images = serializers.ListField(child=serializers.CharField(max_length=500), required=False)


class AtoZClaimSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    order_total = serializers.DecimalField(source='order.grand_total', max_digits=12, decimal_places=2, read_only=True)
    customer_name = serializers.SerializerMethodField()
    can_respond = serializers.SerializerMethodField()

    class Meta:
        model = AtoZClaim
        fields = [
            'id', 'claim_number', 'status', 'status_display', 'order_number', 'order_total', 'customer_name',
            'claim_reason', 'buyer_explanation', 'seller_response_text', 'seller_responded_at',
            'refund_amount', 'resolved_at', 'can_respond', 'created_at', 'updated_at',
        ]

    def get_customer_name(self, obj):
        address = obj.order.shipping_address
        return address.full_name if address else obj.customer.get_full_name() or obj.customer.username

    def get_can_respond(self, obj):
        return obj.status in (AtoZClaimStatus.FILED, AtoZClaimStatus.WAITING_FOR_SELLER_RESPONSE)
