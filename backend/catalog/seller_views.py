from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
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
    permission_classes = [permissions.IsAuthenticated, IsSellerUser]

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
        detail_serializer = ProductDetailSerializer(product)
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)
