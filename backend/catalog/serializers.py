from rest_framework import serializers
from decimal import Decimal
from django.db import transaction
from django.db.models import Avg, Sum
from catalog.models import (
    Product, Brand, Category, CategoryAttribute,
    ProductImage, ProductAttributeValue
)
from listings.models import Listing, ListingTierPrice
from warehouses.models import InventoryItem


class BrandSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug', 'logo_url', 'is_gated']


class CategorySimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'level', 'is_leaf', 'browse_node_id']


class CategoryAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryAttribute
        fields = [
            'id', 'code', 'label', 'data_type', 'is_required',
            'is_variation_attribute', 'is_filterable',
            'allowed_options_json', 'unit_of_measure_options'
        ]


class CategoryDetailSerializer(serializers.ModelSerializer):
    attributes = CategoryAttributeSerializer(many=True, read_only=True)
    children_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id', 'parent_id', 'name', 'slug', 'browse_node_id',
            'level', 'is_leaf', 'is_gated', 'banner_url',
            'children_count', 'attributes'
        ]

    def get_children_count(self, obj):
        return obj.children.count()


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = [
            'id', 'image_url', 'zoom_image_url', 'thumbnail_url',
            'variant_tag', 'sort_order'
        ]


class ProductAttributeValueSerializer(serializers.ModelSerializer):
    attribute_id = serializers.CharField(source='attribute.id', read_only=True)
    attribute_code = serializers.CharField(source='attribute.code', read_only=True)
    attribute_label = serializers.CharField(source='attribute.label', read_only=True)

    class Meta:
        model = ProductAttributeValue
        fields = [
            'id', 'attribute_id', 'attribute_code', 'attribute_label',
            'value', 'unit_of_measure'
        ]


class ListingTierPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingTierPrice
        fields = ['id', 'min_quantity', 'discounted_price']


class SellerSummarySerializer(serializers.Serializer):
    id = serializers.CharField()
    display_name = serializers.CharField()
    store_slug = serializers.CharField()
    logo_url = serializers.CharField(allow_null=True)
    tier = serializers.CharField()
    is_official_buildmart = serializers.SerializerMethodField()

    def get_is_official_buildmart(self, obj):
        return obj.store_slug == 'gikitek'


class ListingOfferSerializer(serializers.ModelSerializer):
    seller = serializers.SerializerMethodField()
    fulfillment_channel_display = serializers.CharField(source='get_fulfillment_channel_display', read_only=True)
    effective_price = serializers.SerializerMethodField()
    b2b_tier_prices = ListingTierPriceSerializer(many=True, read_only=True)
    in_stock = serializers.SerializerMethodField()
    available_stock = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            'id', 'seller_sku', 'seller', 'condition', 'condition_note',
            'fulfillment_channel', 'fulfillment_channel_display',
            'standard_price', 'sale_price', 'effective_price',
            'is_buy_box_winner', 'handling_time_days',
            'in_stock', 'available_stock', 'b2b_tier_prices'
        ]

    def get_seller(self, obj):
        return {
            'id': obj.seller.id,
            'display_name': obj.seller.display_name,
            'store_slug': obj.seller.store_slug,
            'logo_url': obj.seller.logo_url,
            'tier': obj.seller.tier,
            'is_official_buildmart': obj.seller.store_slug == 'gikitek'
        }

    def get_effective_price(self, obj):
        return obj.sale_price if obj.sale_price is not None else obj.standard_price

    def get_available_stock(self, obj):
        total = obj.inventory_items.aggregate(total=Sum('available_stock'))['total']
        return total if total is not None else 0

    def get_in_stock(self, obj):
        return self.get_available_stock(obj) > 0


class ProductListSerializer(serializers.ModelSerializer):
    brand = BrandSimpleSerializer(read_only=True)
    category = CategorySimpleSerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()
    buy_box_listing = serializers.SerializerMethodField()
    rating_summary = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'asin', 'title', 'brand', 'category',
            'model_number', 'part_number', 'status',
            'primary_image', 'buy_box_listing', 'rating_summary',
            'created_at'
        ]

    def get_primary_image(self, obj):
        first_img = obj.images.order_by('sort_order').first()
        return first_img.image_url if first_img else None

    def get_buy_box_listing(self, obj):
        # Find buy box winner or lowest standard price listing
        listing = obj.listings.filter(status='ACTIVE', is_buy_box_winner=True).first()
        if not listing:
            listing = obj.listings.filter(status='ACTIVE').order_by('standard_price').first()
        if not listing:
            return None

        effective_price = listing.sale_price if listing.sale_price else listing.standard_price
        discount_percent = 0
        if listing.sale_price and listing.standard_price > 0:
            discount_percent = round(((listing.standard_price - listing.sale_price) / listing.standard_price) * 100, 1)

        available_stock = listing.inventory_items.aggregate(total=Sum('available_stock'))['total'] or 0

        tier_prices = [
            {
                'min_quantity': tp.min_quantity,
                'discounted_price': str(tp.discounted_price)
            }
            for tp in listing.b2b_tier_prices.all().order_by('min_quantity')
        ]

        return {
            'listing_id': listing.id,
            'seller_sku': listing.seller_sku,
            'seller_id': listing.seller.id,
            'seller_name': listing.seller.display_name,
            'seller_slug': listing.seller.store_slug,
            'is_official_buildmart': listing.seller.store_slug == 'gikitek',
            'fulfillment_channel': listing.fulfillment_channel,
            'fulfillment_channel_display': listing.get_fulfillment_channel_display(),
            'standard_price': str(listing.standard_price),
            'sale_price': str(listing.sale_price) if listing.sale_price else None,
            'effective_price': str(effective_price),
            'discount_percent': discount_percent,
            'in_stock': available_stock > 0,
            'available_stock': available_stock,
            'b2b_tier_prices': tier_prices
        }

    def get_rating_summary(self, obj):
        reviews = obj.reviews.filter(is_approved=True)
        count = reviews.count()
        avg_rating = reviews.aggregate(avg=Avg('rating'))['avg'] or 0.0
        return {
            'average_rating': round(float(avg_rating), 1),
            'total_reviews': count
        }


class ProductDetailSerializer(ProductListSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    attributes = ProductAttributeValueSerializer(source='attribute_values', many=True, read_only=True)
    breadcrumbs = serializers.SerializerMethodField()
    package_dimensions = serializers.SerializerMethodField()
    all_offers = serializers.SerializerMethodField()
    offers_count = serializers.SerializerMethodField()

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + [
            'description', 'bullet_points', 'search_keywords',
            'a_plus_content_html', 'package_dimensions', 'is_hazmat', 'hazmat_details',
            'breadcrumbs', 'images', 'attributes', 'offers_count', 'all_offers'
        ]

    def get_breadcrumbs(self, obj):
        crumbs = []
        curr = obj.category
        while curr:
            crumbs.insert(0, {
                'id': curr.id,
                'name': curr.name,
                'slug': curr.slug,
                'level': curr.level
            })
            curr = curr.parent
        return crumbs

    def get_package_dimensions(self, obj):
        return {
            'length_inches': str(obj.package_length_inches) if obj.package_length_inches else None,
            'width_inches': str(obj.package_width_inches) if obj.package_width_inches else None,
            'height_inches': str(obj.package_height_inches) if obj.package_height_inches else None,
            'weight_pounds': str(obj.package_weight_pounds) if obj.package_weight_pounds else None,
        }

    def get_all_offers(self, obj):
        active_listings = obj.listings.filter(status='ACTIVE').order_by('-is_buy_box_winner', 'standard_price')
        return ListingOfferSerializer(active_listings, many=True).data

    def get_offers_count(self, obj):
        return obj.listings.filter(status='ACTIVE').count()


class ProductImageInputSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['image_url', 'zoom_image_url', 'thumbnail_url', 'variant_tag', 'sort_order']


class ProductAttributeInputSerializer(serializers.Serializer):
    attribute_id = serializers.CharField(required=True)
    value = serializers.CharField(required=True)
    unit_of_measure = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class SellerProductCreateSerializer(serializers.ModelSerializer):
    brand_id = serializers.CharField(required=True)
    category_id = serializers.CharField(required=True)
    images = ProductImageInputSerializer(many=True, required=False)
    attributes = ProductAttributeInputSerializer(many=True, required=False)
    initial_listing = serializers.DictField(required=False, allow_null=True)

    class Meta:
        model = Product
        fields = [
            'id', 'asin', 'title', 'brand_id', 'category_id',
            'description', 'bullet_points', 'search_keywords',
            'model_number', 'part_number', 'upc', 'ean', 'gtin',
            'package_length_inches', 'package_width_inches', 'package_height_inches', 'package_weight_pounds',
            'is_hazmat', 'hazmat_details',
            'images', 'attributes', 'initial_listing'
        ]
        read_only_fields = ['id', 'asin']

    @transaction.atomic
    def create(self, validated_data):
        from common.utils import generate_asin
        from listings.models import Listing, ListingTierPrice
        from warehouses.models import Warehouse, InventoryItem

        brand_id = validated_data.pop('brand_id')
        category_id = validated_data.pop('category_id')
        images_data = validated_data.pop('images', [])
        attributes_data = validated_data.pop('attributes', [])
        initial_listing_data = validated_data.pop('initial_listing', None)

        brand = Brand.objects.filter(id=brand_id).first()
        if not brand:
            raise serializers.ValidationError({"brand_id": "Brand does not exist."})

        category = Category.objects.filter(id=category_id).first()
        if not category:
            raise serializers.ValidationError({"category_id": "Category does not exist."})

        asin = generate_asin()
        while Product.objects.filter(asin=asin).exists():
            asin = generate_asin()

        product = Product.objects.create(
            asin=asin,
            brand=brand,
            category=category,
            **validated_data
        )

        for i, img_item in enumerate(images_data):
            ProductImage.objects.create(
                product=product,
                image_url=img_item.get('image_url'),
                zoom_image_url=img_item.get('zoom_image_url'),
                thumbnail_url=img_item.get('thumbnail_url'),
                variant_tag=img_item.get('variant_tag', 'MAIN' if i == 0 else 'PT01'),
                sort_order=img_item.get('sort_order', i)
            )

        for attr_item in attributes_data:
            cat_attr = CategoryAttribute.objects.filter(id=attr_item['attribute_id']).first()
            if cat_attr:
                ProductAttributeValue.objects.create(
                    product=product,
                    attribute=cat_attr,
                    value=attr_item['value'],
                    unit_of_measure=attr_item.get('unit_of_measure')
                )

        request = self.context.get('request')
        seller = getattr(request.user, 'seller_account', None) if request else None

        if initial_listing_data and seller:
            sku = initial_listing_data.get('seller_sku') or f"{seller.store_slug[:6].upper()}-{asin}"
            std_price = Decimal(str(initial_listing_data.get('standard_price', '0')))
            sale_price = Decimal(str(initial_listing_data['sale_price'])) if initial_listing_data.get('sale_price') else None
            channel = initial_listing_data.get('fulfillment_channel', 'FBA')
            stock = int(initial_listing_data.get('initial_stock', 0))

            listing = Listing.objects.create(
                seller=seller,
                product=product,
                seller_sku=sku,
                standard_price=std_price,
                sale_price=sale_price,
                fulfillment_channel=channel,
                is_buy_box_winner=True
            )

            for tp in initial_listing_data.get('b2b_tier_prices', []):
                ListingTierPrice.objects.create(
                    listing=listing,
                    min_quantity=tp['min_quantity'],
                    discounted_price=Decimal(str(tp['discounted_price']))
                )

            if stock > 0:
                wh = Warehouse.objects.first()
                if wh:
                    InventoryItem.objects.create(
                        listing=listing,
                        seller=seller,
                        warehouse=wh,
                        available_stock=stock
                    )

        return product
