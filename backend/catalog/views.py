from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Min
from django.http import Http404
from common.pagination import StandardResultsSetPagination
from common.enums import CatalogStatus
from catalog.models import Product, Brand, Category, CategoryAttribute
from catalog.serializers import (
    ProductListSerializer, ProductDetailSerializer,
    CategorySimpleSerializer, CategoryDetailSerializer, CategoryAttributeSerializer,
    BrandSimpleSerializer, ListingOfferSerializer
)


class ProductViewSet(viewsets.ModelViewSet):
    """
    Complete Marketplace Product Catalog API.
    Supports filtering by search query, category, brand, price range, and in-stock status.
    Lookup supports both Product UUID and ASIN (e.g. /products/BM01CEMENT01/).
    Supports POST (Create Product), PUT/PATCH (Update Product and Listing data).
    """
    pagination_class = StandardResultsSetPagination
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Product.objects.all().select_related(
            'brand', 'category'
        ).prefetch_related(
            'images',
            'listings__seller',
            'listings__b2b_tier_prices',
            'listings__inventory_items',
            'attribute_values__attribute',
            'reviews'
        )

        params = self.request.query_params

        # Filter by status if requested (default to all active & inactive for merchant portal)
        status_filter = params.get('status')
        if status_filter and status_filter != 'All Status':
            qs = qs.filter(status=status_filter.upper())

        params = self.request.query_params

        # 1. Search Query (Title, Description, Brand, Model Number, ASIN)
        search = params.get('search') or params.get('q')
        if search:
            search = search.strip()
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(asin__iexact=search) |
                Q(brand__name__icontains=search) |
                Q(model_number__icontains=search)
            )

        # 2. Category Filter (by UUID, browse_node_id, or slug) — includes every sub-category below it
        category_param = params.get('category')
        if category_param:
            root = Category.objects.filter(
                Q(id=category_param) | Q(slug=category_param) | Q(browse_node_id=category_param)
            ).first()
            qs = qs.filter(category_id__in=self._category_subtree_ids(root)) if root else qs.none()

        # 3. Brand Filter (by UUID, slug, or name)
        brand_param = params.get('brand')
        if brand_param:
            qs = qs.filter(
                Q(brand__id=brand_param) |
                Q(brand__slug=brand_param) |
                Q(brand__name__iexact=brand_param)
            )

        # 4. Price Filtering (Standard Price on Active Listings)
        min_price = params.get('min_price')
        if min_price:
            try:
                qs = qs.filter(listings__status='ACTIVE', listings__standard_price__gte=float(min_price))
            except ValueError:
                pass

        max_price = params.get('max_price')
        if max_price:
            try:
                qs = qs.filter(listings__status='ACTIVE', listings__standard_price__lte=float(max_price))
            except ValueError:
                pass

        # 5. In-Stock Filter
        in_stock = params.get('in_stock')
        if in_stock in ['true', '1', 'True']:
            qs = qs.filter(listings__status='ACTIVE', listings__inventory_items__available_stock__gt=0)

        # 6. Fulfillment Filter (FBA = Fulfillment by Buildmart, FBM = Merchant)
        fulfillment = params.get('fulfillment')
        if fulfillment:
            qs = qs.filter(listings__status='ACTIVE', listings__fulfillment_channel__iexact=fulfillment)

        # 7. Ordering
        sort = params.get('sort') or params.get('ordering')
        if sort == 'price_asc':
            qs = qs.annotate(min_price_val=Min('listings__standard_price')).order_by('min_price_val')
        elif sort == 'price_desc':
            qs = qs.annotate(min_price_val=Min('listings__standard_price')).order_by('-min_price_val')
        elif sort == 'title_asc':
            qs = qs.order_by('title')
        elif sort == 'oldest':
            qs = qs.order_by('created_at')
        else:
            qs = qs.order_by('-created_at')

        return qs.distinct()

    @staticmethod
    def _category_subtree_ids(root):
        ids, frontier = [root.id], [root.id]
        while frontier:
            frontier = list(Category.objects.filter(parent_id__in=frontier).values_list('id', flat=True))
            ids.extend(frontier)
        return ids

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductListSerializer

    def get_object(self):
        """
        Support lookup by either ASIN (e.g. BM01CEMENT01) or standard UUID PK.
        """
        lookup = self.kwargs.get('pk')
        qs = self.get_queryset()

        obj = qs.filter(asin__iexact=lookup).first()
        if not obj:
            obj = qs.filter(id=lookup).first()

        if not obj:
            raise Http404(f"Product with ASIN or ID '{lookup}' was not found.")

        self.check_object_permissions(self.request, obj)
        return obj

    def create(self, request, *args, **kwargs):
        from decimal import Decimal
        from django.utils.text import slugify
        from common.utils import generate_asin
        from listings.models import Listing
        from sellers.models import Seller
        from warehouses.models import Warehouse, InventoryItem

        data = request.data
        title = data.get('title')
        if not title:
            return Response({'error': 'Title is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Brand lookup or creation
        brand_val = data.get('brand') or data.get('brand_name') or 'BuildMart Certified'
        if isinstance(brand_val, dict):
            brand_val = brand_val.get('name') or 'BuildMart Certified'
        brand = Brand.objects.filter(Q(id=brand_val) | Q(name__iexact=str(brand_val))).first()
        if not brand:
            slug = slugify(str(brand_val)) or 'brand'
            brand = Brand.objects.create(name=str(brand_val), slug=slug)

        # Category lookup or creation
        cat_val = data.get('category') or data.get('category_name') or 'Building Materials'
        if isinstance(cat_val, dict):
            cat_val = cat_val.get('name') or 'Building Materials'
        category = Category.objects.filter(Q(id=cat_val) | Q(name__iexact=str(cat_val)) | Q(browse_node_id=str(cat_val))).first()
        if not category:
            category = Category.objects.filter(is_leaf=True).first() or Category.objects.first()

        asin = data.get('asin') or generate_asin()
        while Product.objects.filter(asin=asin).exists():
            asin = generate_asin()

        product = Product.objects.create(
            asin=asin,
            title=title,
            brand=brand,
            category=category,
            model_number=data.get('model_number') or data.get('modelNumber') or '',
            status=(data.get('status') or CatalogStatus.ACTIVE).upper(),
            description=data.get('description', '')
        )

        # Default seller
        user = request.user if request.user and request.user.is_authenticated else None
        seller = getattr(user, 'seller_account', None) if user else None
        if not seller:
            seller = Seller.objects.filter(store_slug='gikitek').first() or Seller.objects.first()

        price_val = data.get('price') or data.get('standard_price') or 450
        try:
            price_val = Decimal(str(price_val))
        except Exception:
            price_val = Decimal('450')

        stock_val = data.get('stock') or data.get('available_stock') or 50
        try:
            stock_val = int(stock_val)
        except Exception:
            stock_val = 50

        sku = data.get('sku') or data.get('seller_sku') or f"SKU-{asin}"
        channel = (data.get('fulfillment_channel') or data.get('fulfillmentChannel') or 'FBA').upper()

        if seller:
            listing = Listing.objects.create(
                seller=seller,
                product=product,
                seller_sku=sku,
                standard_price=price_val,
                fulfillment_channel=channel,
                is_buy_box_winner=True,
                status=product.status
            )

            wh = Warehouse.objects.first()
            if wh and stock_val >= 0:
                InventoryItem.objects.create(
                    listing=listing,
                    seller=seller,
                    warehouse=wh,
                    available_stock=stock_val
                )

        serializer = ProductListSerializer(product)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        return self._handle_product_update(request, partial=False)

    def partial_update(self, request, *args, **kwargs):
        return self._handle_product_update(request, partial=True)

    def _handle_product_update(self, request, partial=False):
        from decimal import Decimal
        from django.utils.text import slugify
        from warehouses.models import Warehouse, InventoryItem

        product = self.get_object()
        data = request.data

        if 'title' in data:
            product.title = data['title']
        if 'status' in data:
            status_val = data['status'].upper()
            if status_val in ['ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED']:
                product.status = status_val
        if 'model_number' in data or 'modelNumber' in data:
            product.model_number = data.get('model_number') or data.get('modelNumber')
        if 'description' in data:
            product.description = data['description']

        if 'brand' in data:
            b_val = data['brand']
            brand = Brand.objects.filter(Q(id=b_val) | Q(name__iexact=str(b_val))).first()
            if not brand:
                slug = slugify(str(b_val)) or 'brand'
                brand = Brand.objects.create(name=str(b_val), slug=slug)
            product.brand = brand

        if 'category' in data:
            c_val = data['category']
            cat = Category.objects.filter(Q(id=c_val) | Q(name__iexact=str(c_val))).first()
            if cat:
                product.category = cat

        product.save()

        # Update associated listing if price, stock, sku, or status changed
        listing = product.listings.first()
        if listing:
            if 'price' in data or 'standard_price' in data:
                p_val = data.get('price') or data.get('standard_price')
                try:
                    listing.standard_price = Decimal(str(p_val))
                except Exception:
                    pass
            if 'sku' in data or 'seller_sku' in data:
                listing.seller_sku = data.get('sku') or data.get('seller_sku')
            if 'status' in data:
                listing.status = product.status
            if 'fulfillment_channel' in data or 'fulfillmentChannel' in data:
                listing.fulfillment_channel = (data.get('fulfillment_channel') or data.get('fulfillmentChannel')).upper()
            listing.save()

            if 'stock' in data or 'available_stock' in data:
                s_val = data.get('stock') if 'stock' in data else data.get('available_stock')
                try:
                    s_int = int(s_val)
                    inv = listing.inventory_items.first()
                    if inv:
                        inv.available_stock = s_int
                        inv.save()
                    else:
                        wh = Warehouse.objects.first()
                        if wh:
                            InventoryItem.objects.create(
                                listing=listing,
                                seller=listing.seller,
                                warehouse=wh,
                                available_stock=s_int
                            )
                except Exception:
                    pass

        serializer = ProductListSerializer(product)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def offers(self, request, pk=None):
        """
        Returns all competitive seller offers / merchant listings for this product.
        Amazon 'Other sellers on Buildmart' style.
        """
        product = self.get_object()
        active_listings = product.listings.filter(status='ACTIVE').select_related(
            'seller'
        ).prefetch_related(
            'b2b_tier_prices',
            'inventory_items'
        ).order_by('-is_buy_box_winner', 'standard_price')

        serializer = ListingOfferSerializer(active_listings, many=True)
        return Response({
            'asin': product.asin,
            'title': product.title,
            'total_offers': active_listings.count(),
            'offers': serializer.data
        })

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """
        Returns featured flagship products for marketplace homepage.
        """
        featured_qs = self.get_queryset()[:8]
        serializer = ProductListSerializer(featured_qs, many=True)
        return Response({
            'count': len(serializer.data),
            'results': serializer.data
        })


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Hierarchical Category taxonomy navigation API.
    """
    queryset = Category.objects.all().order_by('level', 'name')
    permission_classes = [permissions.AllowAny]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CategoryDetailSerializer
        return CategorySimpleSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        level = self.request.query_params.get('level')
        if level:
            try:
                qs = qs.filter(level=int(level))
            except ValueError:
                pass

        parent_id = self.request.query_params.get('parent')
        if parent_id:
            qs = qs.filter(parent_id=parent_id)

        root_only = self.request.query_params.get('root_only')
        if root_only in ['true', '1', 'True']:
            qs = qs.filter(parent__isnull=True)

        return qs

    @action(detail=True, methods=['get'])
    def children(self, request, pk=None):
        """
        Fetch immediate subcategories for a given category.
        """
        category = self.get_object()
        children = category.children.all().order_by('name')
        serializer = CategorySimpleSerializer(children, many=True)
        return Response({
            'category_id': category.id,
            'category_name': category.name,
            'subcategories_count': children.count(),
            'children': serializer.data
        })

    @action(detail=True, methods=['get'])
    def attributes(self, request, pk=None):
        """
        Fetch all catalog schema attributes for this category with allowed options.
        """
        category = self.get_object()
        attrs = category.attributes.all().order_by('label')
        serializer = CategoryAttributeSerializer(attrs, many=True)
        return Response({
            'category_id': category.id,
            'category_name': category.name,
            'attributes_count': attrs.count(),
            'attributes': serializer.data
        })


class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Brand Registry API.
    """
    queryset = Brand.objects.all().order_by('name')
    serializer_class = BrandSimpleSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search') or self.request.query_params.get('q')
        if search:
            qs = qs.filter(name__icontains=search.strip())
        return qs

    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        """
        Fetch products under this brand.
        """
        brand = self.get_object()
        products = brand.products.filter(status=CatalogStatus.ACTIVE)
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = ProductListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)
