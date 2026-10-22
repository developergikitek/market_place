import os
import uuid
from django.conf import settings
from django.core.files.storage import default_storage
from django.db.models import BooleanField, Count, Exists, OuterRef, Q, Value
from rest_framework import mixins, viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from common.pagination import StandardResultsSetPagination
from catalog.models import Category, Product
from catalog.serializers import (
    ProductListSerializer, ProductDetailSerializer, SellerProductCreateSerializer,
    CatalogProductSerializer, CatalogProductDetailSerializer, CatalogProductUpdateSerializer,
)
from catalog.views import category_subtree_ids, resolve_category
from common.enums import CatalogStatus
from listings.models import Listing
from sellers.utils import resolve_request_seller
from sellers.permissions import IsSellerUser


class SellerProductViewSet(viewsets.ModelViewSet):
    """
    Seller Catalog Master Product Creation & Management API.
    Enables authorized merchants to create brand new products in the master catalog.
    """
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        # Create stays open (like listing create) until the seller frontend sends JWTs.
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsSellerUser()]

    def get_queryset(self):
        user = self.request.user
        seller = getattr(user, 'seller_account', None)
        if user.role == 'ADMIN' and not seller:
            return Product.objects.all().order_by('-created_at')
        return Product.objects.filter(listings__seller=seller).distinct().order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return SellerProductCreateSerializer
        elif self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        data = ProductDetailSerializer(product).data
        data['variations'] = [
            {'asin': child.asin, 'title': child.title}
            for child in product.child_variations.order_by('created_at')
        ]
        return Response(data, status=status.HTTP_201_CREATED)


class ProductImageUploadView(APIView):
    """
    Upload a product photo (multipart field `file`) and get back its public URL.
    """
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser]

    ALLOWED_TYPES = {'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp'}
    MAX_BYTES = 5 * 1024 * 1024

    def post(self, request):
        upload = request.FILES.get('file')
        if not upload:
            return Response({'error': "Attach an image in the 'file' field."}, status=status.HTTP_400_BAD_REQUEST)
        ext = self.ALLOWED_TYPES.get(upload.content_type)
        if not ext:
            return Response({'error': 'Only JPG, PNG or WEBP images are allowed.'}, status=status.HTTP_400_BAD_REQUEST)
        if upload.size > self.MAX_BYTES:
            return Response({'error': 'Image must be 5 MB or smaller.'}, status=status.HTTP_400_BAD_REQUEST)

        path = default_storage.save(os.path.join('product-images', f"{uuid.uuid4().hex}{ext}"), upload)
        url = request.build_absolute_uri(settings.MEDIA_URL + path)
        return Response({'image_url': url}, status=status.HTTP_201_CREATED)


class SellerCatalogViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin,
                           viewsets.GenericViewSet):
    """
    Seller Central catalog: master-catalog products only (photos, attributes, brand, category, variants).
    Price, stock, SKU and buy box live on listings (/api/listings/) and inventory, not here.

    Filters: scope=all|listed|my_brands, search, category (includes sub-categories), brand,
    status, images=missing, ordering=newest|title|updated. Variant children are shown inside their parent.
    """
    pagination_class = StandardResultsSetPagination
    permission_classes = [permissions.AllowAny]
    lookup_field = 'asin'
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CatalogProductDetailSerializer
        if self.action in ('update', 'partial_update'):
            return CatalogProductUpdateSerializer
        return CatalogProductSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['category_map'] = {c['id']: (c['name'], c['parent_id']) for c in Category.objects.values('id', 'name', 'parent_id')}
        return ctx

    def _seller(self):
        return resolve_request_seller(self.request)

    def get_queryset(self):
        seller = self._seller()
        qs = Product.objects.select_related('brand', 'category', 'parent_asin').prefetch_related('images').annotate(
            variants_count=Count('child_variations', distinct=True),
            image_count=Count('images', distinct=True),
            attribute_count=Count('attribute_values', distinct=True),
            listed_by_me=Exists(Listing.objects.filter(product=OuterRef('pk'), seller=seller)) if seller else Value(False, output_field=BooleanField()),
        )
        if self.action != 'list':
            return qs

        params = self.request.query_params
        scope = params.get('scope', 'all')
        if scope == 'listed':
            qs = qs.filter(Q(listed_by_me=True) | Q(child_variations__listings__seller=seller)).distinct()
        elif scope == 'my_brands':
            qs = qs.filter(brand__owner_seller=seller) if seller else qs.none()

        search = (params.get('search') or '').strip()
        if search:
            qs = qs.filter(
                Q(title__icontains=search) | Q(asin__iexact=search) | Q(model_number__icontains=search) |
                Q(brand__name__icontains=search)
            )
        else:
            qs = qs.filter(parent_asin__isnull=True)

        if params.get('category'):
            root = resolve_category(params['category'])
            qs = qs.filter(category_id__in=category_subtree_ids(root)) if root else qs.none()
        if params.get('brand'):
            qs = qs.filter(brand_id=params['brand'])
        if params.get('status'):
            qs = qs.filter(status=params['status'].upper())
        if params.get('images') == 'missing':
            qs = qs.filter(image_count=0)

        ordering = {'title': 'title', 'updated': '-updated_at'}.get(params.get('ordering'), '-created_at')
        return qs.order_by(ordering)

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        super().update(request, *args, **kwargs)
        product = self.get_queryset().get(pk=self.get_object().pk)
        return Response(CatalogProductDetailSerializer(product, context=self.get_serializer_context()).data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        seller = self._seller()
        top = Product.objects.filter(parent_asin__isnull=True)
        by_status = dict(top.values_list('status').annotate(n=Count('id')).order_by())
        return Response({
            'total': top.count(),
            'by_status': {s: by_status.get(s, 0) for s in CatalogStatus.values},
            'variation_families': top.filter(is_parent=True).count(),
            'missing_images': top.filter(images__isnull=True).count(),
            'listed_by_me': top.filter(
                Q(listings__seller=seller) | Q(child_variations__listings__seller=seller)
            ).distinct().count() if seller else 0,
            'my_brands': top.filter(brand__owner_seller=seller).count() if seller else 0,
        })
