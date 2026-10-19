from rest_framework import serializers
from decimal import Decimal
from django.db import transaction
from django.db.models import Sum
from listings.models import Listing, ListingTierPrice
from catalog.models import Product
from warehouses.models import Warehouse, InventoryItem
from common.enums import ProductCondition, FulfillmentChannel, ListingStatus
from sellers.utils import resolve_request_seller


class ListingTierPriceInputSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingTierPrice
        fields = ['min_quantity', 'discounted_price']


class ProductMiniSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'asin', 'title', 'brand_name', 'category_name', 'primary_image']

    def get_primary_image(self, obj):
        first_img = obj.images.order_by('sort_order').first()
        return first_img.image_url if first_img else None


class SellerListingSerializer(serializers.ModelSerializer):
    # Read-only enriched fields
    product = ProductMiniSerializer(read_only=True)
    fulfillment_channel_display = serializers.CharField(source='get_fulfillment_channel_display', read_only=True)
    commerce_channel_display = serializers.CharField(source='get_commerce_channel_display', read_only=True)
    effective_price = serializers.SerializerMethodField()
    available_stock = serializers.SerializerMethodField()
    b2b_tier_prices = ListingTierPriceInputSerializer(many=True, required=False)

    # Write-only input fields for creation/update
    product_asin = serializers.CharField(write_only=True, required=False)
    product_id = serializers.CharField(write_only=True, required=False)
    initial_stock = serializers.IntegerField(write_only=True, required=False, min_value=0)
    warehouse_id = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Listing
        fields = [
            'id', 'seller_sku', 'product', 'product_asin', 'product_id',
            'condition', 'condition_note', 'fulfillment_channel', 'fulfillment_channel_display',
            'commerce_channel', 'commerce_channel_display',
            'status', 'standard_price', 'sale_price', 'effective_price',
            'handling_time_days', 'max_order_quantity', 'is_buy_box_winner',
            'available_stock', 'initial_stock', 'warehouse_id',
            'b2b_tier_prices', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_buy_box_winner', 'created_at', 'updated_at']

    def get_effective_price(self, obj):
        return obj.sale_price if obj.sale_price is not None else obj.standard_price

    def get_available_stock(self, obj):
        total = obj.inventory_items.aggregate(total=Sum('available_stock'))['total']
        return total if total is not None else 0

    def validate(self, attrs):
        seller = resolve_request_seller(self.context['request'])
        
        # When creating a new listing
        if not self.instance:
            product_asin = attrs.get('product_asin')
            product_id = attrs.get('product_id')
            if not product_asin and not product_id:
                raise serializers.ValidationError("Either 'product_asin' or 'product_id' is required to create a listing.")

            product = None
            if product_asin:
                product = Product.objects.filter(asin__iexact=product_asin).first()
            elif product_id:
                product = Product.objects.filter(id=product_id).first()

            if not product:
                raise serializers.ValidationError(f"Product not found matching '{product_asin or product_id}'.")

            attrs['resolved_product'] = product

            # Validate seller_sku uniqueness for this seller
            sku = attrs.get('seller_sku')
            if Listing.objects.filter(seller=seller, seller_sku=sku).exists():
                raise serializers.ValidationError(f"You already have an active listing with SKU '{sku}'.")

            if Listing.objects.filter(
                seller=seller,
                product=product,
                condition=attrs.get('condition', ProductCondition.NEW),
                fulfillment_channel=attrs.get('fulfillment_channel', FulfillmentChannel.FBA),
            ).exists():
                raise serializers.ValidationError(
                    "You already sell this product in this condition and fulfilment mode. "
                    "Update that listing from your catalog instead."
                )

        # Standard price vs Sale price validation
        std_price = attrs.get('standard_price', getattr(self.instance, 'standard_price', None))
        sale_price = attrs.get('sale_price', getattr(self.instance, 'sale_price', None))
        if sale_price and std_price and sale_price >= std_price:
            raise serializers.ValidationError({"sale_price": "Sale price must be strictly lower than the standard price."})

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        seller = resolve_request_seller(self.context['request'])
        product = validated_data.pop('resolved_product')
        validated_data.pop('product_asin', None)
        validated_data.pop('product_id', None)
        
        initial_stock = validated_data.pop('initial_stock', None)
        warehouse_id = validated_data.pop('warehouse_id', None)
        tier_prices_data = validated_data.pop('b2b_tier_prices', [])

        # Check if this listing wins the Buy Box (e.g. if it's the first active listing or lowest price)
        existing_active = product.listings.filter(status=ListingStatus.ACTIVE)
        is_first_listing = not existing_active.exists()
        is_buy_box = is_first_listing or validated_data.get('standard_price', Decimal('0')) <= (
            existing_active.order_by('standard_price').first().standard_price if existing_active.exists() else Decimal('0')
        )

        listing = Listing.objects.create(
            seller=seller,
            product=product,
            is_buy_box_winner=is_buy_box,
            **validated_data
        )

        # Create B2B Tier Prices
        for tp in tier_prices_data:
            ListingTierPrice.objects.create(
                listing=listing,
                min_quantity=tp['min_quantity'],
                discounted_price=tp['discounted_price']
            )

        # Create Initial Inventory if provided
        if initial_stock is not None and initial_stock > 0:
            warehouse = None
            if warehouse_id:
                warehouse = Warehouse.objects.filter(id=warehouse_id).first()
            if not warehouse:
                warehouse = Warehouse.objects.first()

            if warehouse:
                InventoryItem.objects.create(
                    listing=listing,
                    seller=seller,
                    warehouse=warehouse,
                    available_stock=initial_stock
                )

        return listing

    @transaction.atomic
    def update(self, instance, validated_data):
        tier_prices_data = validated_data.pop('b2b_tier_prices', None)
        initial_stock = validated_data.pop('initial_stock', None)
        validated_data.pop('warehouse_id', None)
        validated_data.pop('resolved_product', None)
        validated_data.pop('product_asin', None)
        validated_data.pop('product_id', None)

        # Update standard fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update B2B Tier Prices if provided in payload
        if tier_prices_data is not None:
            instance.b2b_tier_prices.all().delete()
            for tp in tier_prices_data:
                ListingTierPrice.objects.create(
                    listing=instance,
                    min_quantity=tp['min_quantity'],
                    discounted_price=tp['discounted_price']
                )

        # Update Stock if provided
        if initial_stock is not None:
            inv_item = instance.inventory_items.first()
            if inv_item:
                inv_item.available_stock = initial_stock
                inv_item.save()
            else:
                warehouse = Warehouse.objects.first()
                if warehouse:
                    InventoryItem.objects.create(
                        listing=instance,
                        seller=instance.seller,
                        warehouse=warehouse,
                        available_stock=initial_stock
                    )

        return instance
