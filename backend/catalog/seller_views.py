import os
import uuid
from django.conf import settings
from django.core.files.storage import default_storage
from rest_framework import viewsets, permissions, status
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from common.pagination import StandardResultsSetPagination
from catalog.models import Product
from catalog.serializers import (
    ProductListSerializer, ProductDetailSerializer, SellerProductCreateSerializer
)
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
