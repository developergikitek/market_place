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


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Complete Marketplace Product Catalog API.
    Supports filtering by search query, category, brand, price range, and in-stock status.
    Lookup supports both Product UUID and ASIN (e.g. /products/BM01CEMENT01/).
    """
    pagination_class = StandardResultsSetPagination
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Product.objects.filter(status=CatalogStatus.ACTIVE).select_related(
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

        # 2. Category Filter (by UUID, browse_node_id, or slug)
        category_param = params.get('category')
        if category_param:
            qs = qs.filter(
                Q(category__id=category_param) |
                Q(category__slug=category_param) |
                Q(category__browse_node_id=category_param) |
                Q(category__parent__slug=category_param)
            )

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
