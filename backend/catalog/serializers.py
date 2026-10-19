from rest_framework import serializers
from decimal import Decimal
from django.db import transaction
from django.db.models import Avg, Sum
from common.enums import VariationTheme, CommerceChannel
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
        fields = ['id', 'parent_id', 'name', 'slug', 'level', 'is_leaf', 'browse_node_id']


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
    commerce_channel_display = serializers.CharField(source='get_commerce_channel_display', read_only=True)
    effective_price = serializers.SerializerMethodField()
    b2b_tier_prices = ListingTierPriceSerializer(many=True, read_only=True)
    in_stock = serializers.SerializerMethodField()
    available_stock = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            'id', 'seller_sku', 'seller', 'condition', 'condition_note',
            'fulfillment_channel', 'fulfillment_channel_display',
            'commerce_channel', 'commerce_channel_display',
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
            'model_number', 'part_number', 'status', 'is_parent', 'variation_theme',
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
            'commerce_channel': listing.commerce_channel,
            'commerce_channel_display': listing.get_commerce_channel_display(),
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
            'hsn_code', 'gst_rate_percent', 'country_of_origin', 'manufacturer_details',
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


class ProductVariationInputSerializer(serializers.Serializer):
    """
    One child variation (e.g. 50 kg bag, Red / 4 ft) with its own offer.
    """
    attributes = ProductAttributeInputSerializer(many=True)
    seller_sku = serializers.CharField(required=False, allow_blank=True)
    standard_price = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))
    sale_price = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    initial_stock = serializers.IntegerField(required=False, min_value=0, default=0)
    images = ProductImageInputSerializer(many=True, required=False)

    def validate(self, attrs):
        if not attrs['attributes']:
            raise serializers.ValidationError({"attributes": "A variation needs at least one variation attribute value."})
        sale_price = attrs.get('sale_price')
        if sale_price is not None and sale_price > attrs['standard_price']:
            raise serializers.ValidationError({"sale_price": "Selling price cannot be higher than MRP."})
        return attrs


GST_RATE_CHOICES = {Decimal(r) for r in ['0', '0.25', '3', '5', '12', '18', '28', '40']}


def derive_variation_theme(attribute_codes):
    codes = set(attribute_codes)
    has_colour = any('colo' in c for c in codes)
    if has_colour and len(codes) > 1:
        return VariationTheme.SIZE_COLOR
    if has_colour:
        return VariationTheme.COLOR
    if any(c.startswith('capacity') for c in codes):
        return VariationTheme.CAPACITY
    if codes == {'finish'}:
        return VariationTheme.STYLE
    return VariationTheme.SIZE


class SellerProductCreateSerializer(serializers.ModelSerializer):
    """
    Creates a master catalog product with its first offer.
    With `variations`, creates a parent ASIN plus one child ASIN (and offer) per variation.
    """
    brand_id = serializers.CharField(required=False, allow_blank=True)
    brand_name = serializers.CharField(required=False, allow_blank=True)
    category_id = serializers.CharField(required=True)
    images = ProductImageInputSerializer(many=True, required=False)
    attributes = ProductAttributeInputSerializer(many=True, required=False)
    initial_listing = serializers.DictField(required=False, allow_null=True)
    variations = ProductVariationInputSerializer(many=True, required=False)

    class Meta:
        model = Product
        fields = [
            'id', 'asin', 'title', 'brand_id', 'brand_name', 'category_id',
            'description', 'bullet_points', 'search_keywords',
            'model_number', 'part_number', 'upc', 'ean', 'gtin',
            'package_length_inches', 'package_width_inches', 'package_height_inches', 'package_weight_pounds',
            'is_hazmat', 'hazmat_details',
            'hsn_code', 'gst_rate_percent', 'country_of_origin', 'manufacturer_details',
            'images', 'attributes', 'initial_listing', 'variations'
        ]
        read_only_fields = ['id', 'asin']

    def validate_hsn_code(self, value):
        if value and (not value.isdigit() or len(value) not in (4, 6, 8)):
            raise serializers.ValidationError("HSN code must be 4, 6 or 8 digits.")
        return value

    def validate_gst_rate_percent(self, value):
        if value is not None and value not in GST_RATE_CHOICES:
            raise serializers.ValidationError("Unsupported GST rate.")
        return value

    def validate(self, attrs):
        category = Category.objects.filter(id=attrs['category_id']).first()
        if not category:
            raise serializers.ValidationError({"category_id": "Category does not exist."})
        if not category.is_leaf:
            raise serializers.ValidationError({"category_id": "Select the last-level category for this product."})
        attrs['resolved_category'] = category

        if not attrs.get('variations') and not attrs.get('initial_listing'):
            raise serializers.ValidationError({"initial_listing": "Price and stock are required."})
        return attrs

    def _resolve_brand(self, seller, brand_id, brand_name):
        """
        Brand is optional. New catalog products only carry the seller's own brand: one registered to them
        (brand_id), or a new brand name that gets registered to them. Global brands are sold via existing ASINs.
        """
        from django.utils.text import slugify

        def owned(brand):
            return seller is not None and brand.owner_seller_id == seller.id

        if brand_id and brand_id != 'others':
            brand = Brand.objects.filter(id=brand_id).first()
            if not brand:
                raise serializers.ValidationError({"brand_id": "Brand does not exist."})
            if not owned(brand):
                raise serializers.ValidationError({"brand_id": "You can only add new products under your own brand."})
            return brand

        brand_name = (brand_name or '').strip()
        if not brand_name:
            return None

        brand = Brand.objects.filter(name__iexact=brand_name).first()
        if brand:
            if owned(brand):
                return brand
            raise serializers.ValidationError({
                "brand_name": f"'{brand.name}' is already a brand on Makaano. Use a name for your own brand, "
                              "or leave the brand empty."
            })
        base_slug = slugify(brand_name) or 'brand'
        slug, n = base_slug, 1
        while Brand.objects.filter(slug=slug).exists():
            n += 1
            slug = f"{base_slug}-{n}"
        return Brand.objects.create(name=brand_name, slug=slug, owner_seller=seller)

    def _create_product(self, fields, **extra):
        from common.utils import generate_asin

        asin = generate_asin()
        while Product.objects.filter(asin=asin).exists():
            asin = generate_asin()
        return Product.objects.create(asin=asin, **fields, **extra)

    def _add_images(self, product, images_data):
        for i, img_item in enumerate(images_data):
            ProductImage.objects.create(
                product=product,
                image_url=img_item.get('image_url'),
                zoom_image_url=img_item.get('zoom_image_url'),
                thumbnail_url=img_item.get('thumbnail_url'),
                variant_tag=img_item.get('variant_tag', 'MAIN' if i == 0 else f'PT{i:02d}'),
                sort_order=img_item.get('sort_order', i)
            )

    def _add_attributes(self, product, attributes_data):
        cat_attrs = CategoryAttribute.objects.in_bulk([a['attribute_id'] for a in attributes_data])
        for attr_item in attributes_data:
            cat_attr = cat_attrs.get(attr_item['attribute_id'])
            if cat_attr and cat_attr.category_id == product.category_id:
                ProductAttributeValue.objects.update_or_create(
                    product=product,
                    attribute=cat_attr,
                    defaults={
                        'value': attr_item['value'],
                        'unit_of_measure': attr_item.get('unit_of_measure'),
                    }
                )

    def _create_listing(self, seller, product, listing_data):
        from listings.models import Listing, ListingTierPrice
        from warehouses.models import Warehouse, InventoryItem

        sku = listing_data.get('seller_sku') or f"{seller.store_slug[:6].upper()}-{product.asin}"
        if Listing.objects.filter(seller=seller, seller_sku=sku).exists():
            raise serializers.ValidationError({"seller_sku": f"You already have a listing with SKU '{sku}'."})

        commerce = str(listing_data.get('commerce_channel') or '').upper()
        if not commerce:
            raise serializers.ValidationError({"commerce_channel": "Choose a selling channel."})
        if commerce not in CommerceChannel.values:
            raise serializers.ValidationError({"commerce_channel": "Choose BAZAAR, QUICK_COMMERCE or BOTH."})

        std_price = Decimal(str(listing_data.get('standard_price') or '0'))
        if std_price <= 0:
            raise serializers.ValidationError({"standard_price": "MRP must be greater than zero."})
        sale_price = listing_data.get('sale_price')
        sale_price = Decimal(str(sale_price)) if sale_price not in (None, '') else None
        if sale_price is not None and sale_price > std_price:
            raise serializers.ValidationError({"sale_price": "Selling price cannot be higher than MRP."})
        if sale_price == std_price:
            sale_price = None

        listing = Listing.objects.create(
            seller=seller,
            product=product,
            seller_sku=sku,
            condition=listing_data.get('condition', 'NEW'),
            standard_price=std_price,
            sale_price=sale_price,
            fulfillment_channel=listing_data.get('fulfillment_channel', 'FBM'),
            commerce_channel=commerce,
            handling_time_days=int(listing_data.get('handling_time_days') or 1),
            max_order_quantity=listing_data.get('max_order_quantity') or None,
            is_buy_box_winner=True
        )

        for tp in listing_data.get('b2b_tier_prices', []):
            ListingTierPrice.objects.create(
                listing=listing,
                min_quantity=tp['min_quantity'],
                discounted_price=Decimal(str(tp['discounted_price']))
            )

        stock = int(listing_data.get('initial_stock') or 0)
        if stock > 0:
            wh = Warehouse.objects.first()
            if wh:
                InventoryItem.objects.create(listing=listing, seller=seller, warehouse=wh, available_stock=stock)
        return listing

    @transaction.atomic
    def create(self, validated_data):
        from sellers.utils import resolve_request_seller

        validated_data.pop('category_id')
        category = validated_data.pop('resolved_category')
        seller = resolve_request_seller(self.context.get('request'))
        brand = self._resolve_brand(seller, validated_data.pop('brand_id', None), validated_data.pop('brand_name', ''))
        images_data = validated_data.pop('images', [])
        attributes_data = validated_data.pop('attributes', [])
        listing_data = validated_data.pop('initial_listing', None) or {}
        variations_data = validated_data.pop('variations', [])

        if not variations_data:
            product = self._create_product(validated_data, brand=brand, category=category)
            self._add_images(product, images_data)
            self._add_attributes(product, attributes_data)
            if seller:
                self._create_listing(seller, product, listing_data)
            return product

        variation_attr_ids = {a['attribute_id'] for v in variations_data for a in v['attributes']}
        variation_attrs = CategoryAttribute.objects.in_bulk(list(variation_attr_ids))
        theme = derive_variation_theme(a.code for a in variation_attrs.values())

        # Barcodes identify a single sellable unit, so they never go on the parent.
        shared_fields = {k: v for k, v in validated_data.items() if k not in ('upc', 'ean', 'gtin')}
        parent = self._create_product(
            shared_fields, brand=brand, category=category, is_parent=True, variation_theme=theme
        )
        self._add_images(parent, images_data)
        self._add_attributes(parent, attributes_data)

        seen_skus = set()
        for variation in variations_data:
            label = ' / '.join(
                f"{a['value']} {a.get('unit_of_measure') or ''}".strip() for a in variation['attributes']
            )
            child = self._create_product(
                {**shared_fields, 'title': f"{shared_fields['title']} - {label}"[:500]},
                brand=brand, category=category, parent_asin=parent, variation_theme=theme
            )
            self._add_images(child, variation.get('images') or images_data)
            self._add_attributes(child, attributes_data + variation['attributes'])

            sku = variation.get('seller_sku')
            if sku and sku in seen_skus:
                raise serializers.ValidationError({"variations": f"SKU '{sku}' is used by more than one variation."})
            seen_skus.add(sku)
            if seller:
                self._create_listing(seller, child, {
                    **listing_data,
                    'seller_sku': sku,
                    'standard_price': variation['standard_price'],
                    'sale_price': variation.get('sale_price'),
                    'initial_stock': variation.get('initial_stock', 0),
                })

        return parent
