from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Sum
from common.pagination import StandardResultsSetPagination
from common.enums import ListingStatus
from listings.models import Listing
from listings.serializers import SellerListingSerializer
from sellers.permissions import IsSellerUser


class SellerListingViewSet(viewsets.ModelViewSet):
    """
    Merchant Listing & Offer Management API.
    Provides complete CRUD operations for sellers to list products,
    update selling prices, manage bulk tier pricing, and stock.
    """
    serializer_class = SellerListingSerializer
    permission_classes = [permissions.IsAuthenticated, IsSellerUser]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        # Admin can view all or filter by seller, regular seller only sees their own
        user = self.request.user
        seller = getattr(user, 'seller_account', None)
        
        if user.role == 'ADMIN' and not seller:
            qs = Listing.objects.all()
        else:
            qs = Listing.objects.filter(seller=seller)

        qs = qs.select_related(
            'seller', 'product', 'product__brand', 'product__category'
        ).prefetch_related(
            'b2b_tier_prices',
            'inventory_items',
            'product__images'
        )

        params = self.request.query_params

        # Filter by status (ACTIVE, INACTIVE, ARCHIVED, etc.)
        listing_status = params.get('status')
        if listing_status:
            qs = qs.filter(status=listing_status.upper())
        else:
            # By default exclude ARCHIVED listings
            qs = qs.exclude(status=ListingStatus.ARCHIVED)

        # Search query (SKU, Product Title, ASIN)
        search = params.get('search') or params.get('q')
        if search:
            search = search.strip()
            qs = qs.filter(
                Q(seller_sku__icontains=search) |
                Q(product__title__icontains=search) |
                Q(product__asin__iexact=search)
            )

        # Filter by fulfillment channel
        fulfillment = params.get('fulfillment')
        if fulfillment:
            qs = qs.filter(fulfillment_channel=fulfillment.upper())

        return qs.order_by('-updated_at')

    def perform_destroy(self, instance):
        """
        Soft delete by default to protect historical order data integrity.
        """
        # If listing has no order items, can hard delete, otherwise archive
        if hasattr(instance, 'order_items') and instance.order_items.exists():
            instance.status = ListingStatus.ARCHIVED
            instance.save()
        else:
            instance.delete()

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """
        Quickly toggle between ACTIVE and INACTIVE states (pause/resume listing).
        """
        listing = self.get_object()
        if listing.status == ListingStatus.ACTIVE:
            listing.status = ListingStatus.INACTIVE
        else:
            listing.status = ListingStatus.ACTIVE
        listing.save()
        return Response({
            'id': listing.id,
            'seller_sku': listing.seller_sku,
            'status': listing.status,
            'message': f"Listing is now {listing.status}."
        })

    @action(detail=True, methods=['post'])
    def update_stock(self, request, pk=None):
        """
        Quick endpoint to adjust stock quantity.
        Payload: {"quantity": 100} or {"available_stock": 100}
        """
        listing = self.get_object()
        qty = request.data.get('available_stock')
        if qty is None:
            qty = request.data.get('quantity')
            
        if qty is None:
            return Response({"error": "'available_stock' or 'quantity' is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            qty = int(qty)
            if qty < 0:
                raise ValueError()
        except ValueError:
            return Response({"error": "Quantity must be a non-negative integer."}, status=status.HTTP_400_BAD_REQUEST)

        inv_item = listing.inventory_items.first()
        if inv_item:
            inv_item.available_stock = qty
            inv_item.save()
        else:
            from warehouses.models import Warehouse, InventoryItem
            wh = Warehouse.objects.first()
            if wh:
                inv_item = InventoryItem.objects.create(
                    listing=listing,
                    seller=listing.seller,
                    warehouse=wh,
                    available_stock=qty
                )

        return Response({
            'listing_id': listing.id,
            'seller_sku': listing.seller_sku,
            'available_stock': qty,
            'message': "Stock updated successfully."
        })

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Dashboard overview numbers for the merchant.
        """
        qs = self.get_queryset()
        total_listings = qs.count()
        active_listings = qs.filter(status=ListingStatus.ACTIVE).count()
        buy_box_winners = qs.filter(is_buy_box_winner=True).count()
        
        # Calculate total available stock across all listings
        total_stock = qs.aggregate(total=Sum('inventory_items__available_stock'))['total'] or 0
        
        # Out of stock listings
        out_of_stock = qs.filter(Q(inventory_items__available_stock__lte=0) | Q(inventory_items__isnull=True)).distinct().count()

        return Response({
            'total_listings': total_listings,
            'active_listings': active_listings,
            'out_of_stock_listings': out_of_stock,
            'buy_box_winners': buy_box_winners,
            'total_stock_units': total_stock
        })
