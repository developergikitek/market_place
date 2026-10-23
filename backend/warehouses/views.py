from django.db import transaction
from django.db.models import F, Prefetch, Q, Sum
from django.db.models.functions import Coalesce
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from common.enums import InventoryMovementReason, ListingStatus
from common.pagination import StandardResultsSetPagination
from listings.models import Listing
from sellers.utils import resolve_request_seller
from warehouses.models import InventoryItem, InventoryMovement, Warehouse

# Reasons a seller may pick by hand, per adjustment mode. Order reservations/dispatches and
# return restocks are written by the order and returns flows, never typed in here.
MANUAL_REASONS = {
    'add': [InventoryMovementReason.FBA_INBOUND_RECEIVED, InventoryMovementReason.CYCLE_COUNT_ADJUSTMENT],
    'remove': [
        InventoryMovementReason.DAMAGED_IN_WAREHOUSE, InventoryMovementReason.DISPOSED,
        InventoryMovementReason.SELLER_REMOVAL_ORDER, InventoryMovementReason.CYCLE_COUNT_ADJUSTMENT,
    ],
    'set': [InventoryMovementReason.CYCLE_COUNT_ADJUSTMENT],
}


def _stock_status(available, safety):
    if available <= 0:
        return 'OUT_OF_STOCK'
    if available <= safety:
        return 'LOW_STOCK'
    return 'IN_STOCK'


class WarehouseSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = Warehouse
        fields = ['id', 'code', 'name', 'type', 'type_display', 'city', 'state_or_province']


class InventoryItemSerializer(serializers.ModelSerializer):
    warehouse = WarehouseSerializer(read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = InventoryItem
        fields = [
            'id', 'warehouse', 'available_stock', 'reserved_stock', 'inbound_stock', 'damaged_stock',
            'safety_stock', 'status', 'updated_at',
        ]

    def get_status(self, obj):
        return _stock_status(obj.available_stock, obj.safety_stock)


class InventoryListingSerializer(serializers.ModelSerializer):
    """One row per listing: stock summed across warehouses, with the per-warehouse items."""
    product = serializers.SerializerMethodField()
    items = InventoryItemSerializer(source='inventory_items', many=True, read_only=True)
    available = serializers.IntegerField(read_only=True)
    reserved = serializers.IntegerField(read_only=True)
    inbound = serializers.IntegerField(read_only=True)
    damaged = serializers.IntegerField(read_only=True)
    safety = serializers.IntegerField(read_only=True)
    stock_status = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            'id', 'seller_sku', 'status', 'fulfillment_channel', 'product', 'items',
            'available', 'reserved', 'inbound', 'damaged', 'safety', 'stock_status', 'updated_at',
        ]

    def get_product(self, obj):
        p = obj.product
        images = sorted(p.images.all(), key=lambda i: i.sort_order)
        return {
            'asin': p.asin,
            'title': p.title,
            'brand': p.brand.name if p.brand else None,
            'image': images[0].image_url if images else None,
        }

    def get_stock_status(self, obj):
        return _stock_status(obj.available, obj.safety)


class MovementSerializer(serializers.ModelSerializer):
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)
    warehouse = serializers.CharField(source='inventory_item.warehouse.name', read_only=True)

    class Meta:
        model = InventoryMovement
        fields = ['id', 'quantity_change', 'balance_after', 'reason', 'reason_display', 'reference_note', 'warehouse', 'created_at']


class InventoryViewSet(viewsets.GenericViewSet):
    """
    Seller inventory, from InventoryItem (stock per listing per warehouse) and InventoryMovement (audit log).

    GET  /api/inventory/                     listings with summed stock; filters: search, warehouse,
                                             stock_status=IN_STOCK|LOW_STOCK|OUT_OF_STOCK, ordering
    GET  /api/inventory/summary/             totals for the KPI cards
    GET  /api/inventory/warehouses/          active warehouses
    GET  /api/inventory/reasons/             reasons a seller may pick, per mode
    POST /api/inventory/adjust/              add / remove / set stock with a reason (writes a movement)
    PATCH /api/inventory/items/<id>/         change an item's safety stock
    GET  /api/inventory/<listing_id>/movements/  stock history of a listing
    """
    serializer_class = InventoryListingSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [permissions.IsAuthenticated]

    def _seller(self):
        return resolve_request_seller(self.request)

    def _listings(self):
        seller = self._seller()
        items = InventoryItem.objects.select_related('warehouse').order_by('warehouse__name')
        warehouse = self.request.query_params.get('warehouse')
        if warehouse:
            items = items.filter(warehouse_id=warehouse)
        totals = {
            name: Coalesce(Sum(f'inventory_items__{field}', filter=Q(inventory_items__warehouse_id=warehouse) if warehouse else None), 0)
            for name, field in [('available', 'available_stock'), ('reserved', 'reserved_stock'),
                                ('inbound', 'inbound_stock'), ('damaged', 'damaged_stock'), ('safety', 'safety_stock')]
        }
        qs = Listing.objects.filter(seller=seller) if seller else Listing.objects.none()
        return qs.exclude(status=ListingStatus.ARCHIVED).select_related('product__brand').prefetch_related(
            'product__images', Prefetch('inventory_items', queryset=items)
        ).annotate(**totals)

    def list(self, request):
        qs = self._listings()
        params = request.query_params
        search = (params.get('search') or '').strip()
        if search:
            qs = qs.filter(Q(seller_sku__icontains=search) | Q(product__title__icontains=search) | Q(product__asin__iexact=search))
        if params.get('warehouse'):
            qs = qs.filter(inventory_items__warehouse_id=params['warehouse']).distinct()
        stock_status = (params.get('stock_status') or '').upper()
        if stock_status == 'OUT_OF_STOCK':
            qs = qs.filter(available__lte=0)
        elif stock_status == 'LOW_STOCK':
            qs = qs.filter(available__gt=0, available__lte=F('safety'))
        elif stock_status == 'IN_STOCK':
            qs = qs.filter(available__gt=F('safety'))
        ordering = {
            'stock_asc': 'available', 'stock_desc': '-available', 'sku': 'seller_sku', 'updated': '-updated_at',
        }.get(params.get('ordering'), 'available')
        page = self.paginate_queryset(qs.order_by(ordering, 'seller_sku'))
        return self.get_paginated_response(self.get_serializer(page, many=True).data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        rows = list(self._listings().values('available', 'reserved', 'inbound', 'damaged', 'safety'))
        return Response({
            'total_skus': len(rows),
            'available_units': sum(r['available'] for r in rows),
            'reserved_units': sum(r['reserved'] for r in rows),
            'inbound_units': sum(r['inbound'] for r in rows),
            'damaged_units': sum(r['damaged'] for r in rows),
            'in_stock': sum(1 for r in rows if _stock_status(r['available'], r['safety']) == 'IN_STOCK'),
            'low_stock': sum(1 for r in rows if _stock_status(r['available'], r['safety']) == 'LOW_STOCK'),
            'out_of_stock': sum(1 for r in rows if r['available'] <= 0),
        })

    @action(detail=False, methods=['get'])
    def warehouses(self, request):
        return Response(WarehouseSerializer(Warehouse.objects.filter(is_active=True).order_by('name'), many=True).data)

    @action(detail=False, methods=['get'])
    def reasons(self, request):
        labels = dict(InventoryMovementReason.choices)
        return Response({mode: [{'value': r, 'label': labels[r]} for r in reasons] for mode, reasons in MANUAL_REASONS.items()})

    @action(detail=False, methods=['post'])
    def adjust(self, request):
        """
        {listing_id, warehouse_id, mode: add|remove|set, quantity, reason, note?}
        Stock never goes below zero. "Damaged in warehouse" moves units from available to damaged.
        """
        data = request.data
        errors = {}
        mode = str(data.get('mode') or '').lower()
        if mode not in MANUAL_REASONS:
            errors['mode'] = "Choose add, remove or set."
        try:
            quantity = int(data.get('quantity'))
            if quantity < 0 or (mode in ('add', 'remove') and quantity == 0):
                raise ValueError
        except (TypeError, ValueError):
            errors['quantity'] = "Enter a whole number of units" + (" above zero." if mode != 'set' else ".")
            quantity = None
        reason = str(data.get('reason') or '').upper()
        if mode in MANUAL_REASONS and reason not in MANUAL_REASONS[mode]:
            errors['reason'] = "Pick a reason for this adjustment."
        listing = self._listings().filter(id=data.get('listing_id')).first()
        if not listing:
            errors['listing_id'] = "Choose one of your listings."
        warehouse = Warehouse.objects.filter(id=data.get('warehouse_id'), is_active=True).first()
        if not warehouse:
            errors['warehouse_id'] = "Choose a warehouse."
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        note = str(data.get('note') or '').strip()[:255] or None
        with transaction.atomic():
            item, _ = InventoryItem.objects.select_for_update().get_or_create(
                listing=listing, warehouse=warehouse, defaults={'seller': listing.seller}
            )
            before = item.available_stock
            after = {'add': before + quantity, 'remove': before - quantity, 'set': quantity}[mode]
            if after < 0:
                return Response({'quantity': f"Only {before} units are available in {warehouse.name}."},
                                status=status.HTTP_400_BAD_REQUEST)
            if after == before:
                return Response({'quantity': "That doesn't change the stock."}, status=status.HTTP_400_BAD_REQUEST)
            item.available_stock = after
            if reason == InventoryMovementReason.DAMAGED_IN_WAREHOUSE:
                item.damaged_stock += before - after
            item.save(update_fields=['available_stock', 'damaged_stock', 'updated_at'])
            InventoryMovement.objects.create(
                inventory_item=item, quantity_change=after - before, balance_after=after,
                reason=reason, reference_note=note,
            )
            # Selling out pauses buyers' view of the offer; restocking brings it back.
            if after == 0 and listing.status == ListingStatus.ACTIVE and not listing.inventory_items.filter(available_stock__gt=0).exists():
                Listing.objects.filter(pk=listing.pk).update(status=ListingStatus.OUT_OF_STOCK)
            elif after > 0 and listing.status == ListingStatus.OUT_OF_STOCK:
                Listing.objects.filter(pk=listing.pk).update(status=ListingStatus.ACTIVE)

        return Response(self.get_serializer(self._listings().get(pk=listing.pk)).data)

    @action(detail=False, methods=['patch'], url_path=r'items/(?P<item_id>[^/.]+)')
    def update_item(self, request, item_id=None):
        """Change the safety stock (low-stock threshold) of one warehouse item."""
        seller = self._seller()
        item = InventoryItem.objects.filter(id=item_id, listing__seller=seller).first() if seller else None
        if not item:
            return Response({'error': "Inventory item not found."}, status=status.HTTP_404_NOT_FOUND)
        try:
            safety = int(request.data.get('safety_stock'))
            if safety < 0:
                raise ValueError
        except (TypeError, ValueError):
            raise ValidationError({'safety_stock': "Safety stock must be a whole number of 0 or more."})
        item.safety_stock = safety
        item.save(update_fields=['safety_stock', 'updated_at'])
        return Response(InventoryItemSerializer(item).data)

    @action(detail=True, methods=['get'])
    def movements(self, request, pk=None):
        listing = self._listings().filter(pk=pk).first()
        if not listing:
            return Response({'error': "Listing not found."}, status=status.HTTP_404_NOT_FOUND)
        qs = InventoryMovement.objects.filter(inventory_item__listing=listing).select_related('inventory_item__warehouse')
        page = self.paginate_queryset(qs.order_by('-created_at'))
        return self.get_paginated_response(MovementSerializer(page, many=True).data)
