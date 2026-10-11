from rest_framework import serializers
from sellers.models import Seller, SellerKycDocument, SellerBankAccount, SellerPerformanceMetrics


class SellerPerformanceMetricsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerPerformanceMetrics
        fields = [
            'order_defect_rate', 'cancellation_rate', 'late_shipment_rate',
            'valid_tracking_rate', 'on_time_delivery_rate', 'policy_compliance_score',
            'positive_feedback_percent', 'average_feedback_score', 'lifetime_review_count'
        ]


class SellerProfileSerializer(serializers.ModelSerializer):
    metrics = SellerPerformanceMetricsSerializer(read_only=True)
    user_phone = serializers.CharField(source='user.phone', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Seller
        fields = [
            'id', 'user_phone', 'user_email', 'legal_business_name', 'display_name',
            'store_slug', 'tier', 'account_status', 'verification_status',
            'logo_url', 'banner_url', 'store_description',
            'support_email', 'support_phone', 'tax_identification_num',
            'default_fulfillment', 'holiday_mode_enabled', 'metrics',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'legal_business_name', 'store_slug', 'tier',
            'account_status', 'verification_status', 'created_at', 'updated_at'
        ]


class SellerKycDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerKycDocument
        fields = [
            'id', 'document_type', 'document_number', 'file_url',
            'status', 'verified_at', 'rejection_reason', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'verified_at', 'rejection_reason', 'created_at']


class SellerBankAccountSerializer(serializers.ModelSerializer):
    # Mask account number in reads for security (e.g. ******1234)
    masked_account_number = serializers.SerializerMethodField()

    class Meta:
        model = SellerBankAccount
        fields = [
            'id', 'bank_name', 'account_holder', 'account_number', 'masked_account_number',
            'routing_number', 'swift_bic', 'currency', 'country_code',
            'is_primary', 'status', 'created_at'
        ]
        extra_kwargs = {
            'account_number': {'write_only': True}
        }
        read_only_fields = ['id', 'status', 'created_at']

    def get_masked_account_number(self, obj):
        if obj.account_number and len(obj.account_number) > 4:
            return f"******{obj.account_number[-4:]}"
        return "******"
