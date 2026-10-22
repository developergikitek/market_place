import csv
import secrets
from datetime import datetime, timedelta
from decimal import Decimal

from django.db import transaction
from django.db.models import Count, Prefetch, Q, Sum
from django.http import HttpResponse
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.enums import (
    FulfillmentChannel, InventoryMovementReason, OrderItemStatus, OrderStatus, PaymentMethodType, PaymentStatus,
    ShipmentStatus,
)
from common.pagination import StandardResultsSetPagination
from orders.models import Order, OrderItem, Shipment, ShipmentCheckpoint
from payments.models import Payment
from orders.workflow import (
    TABS, UNSHIPPED_ITEM, allowed_actions, capture_cod_if_delivered, cod_payment, recompute_order_status,
    settle_payment_for_cancelled,
)
from sellers.utils import resolve_request_seller
from warehouses.models import InventoryItem, InventoryMovement


def _money(value):
    return str(Decimal(str(value or 0)).quantize(Decimal('0.01')))


def _ship_by(order, items):
    """Dispatch deadline: payment time plus the longest handling time among the seller's lines."""
    start = order.paid_at or order.placed_at
    days = max((i.listing.handling_time_days for i in items), default=1)
    return start + timedelta(days=days)


class OrderItemSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    seller_sku = serializers.CharField(source='listing.seller_sku', read_only=True)
    fulfillment_channel = serializers.CharField(source='listing.fulfillment_channel', read_only=True)
    product = serializers.SerializerMethodField()
    fees_total = serializers.SerializerMethodField()
    net_earning = serializers.SerializerMethodField()
    shipment_number = serializers.CharField(source='shipment.shipment_number', read_only=True, default=None)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'status', 'status_display', 'seller_sku', 'fulfillment_channel', 'product', 'quantity',
            'unit_price', 'total_price', 'item_tax_amount', 'item_shipping_fee', 'item_discount_amount',
            'referral_fee_charged', 'closing_fee_charged', 'fba_fulfillment_fee', 'gift_wrap_requested',
            'fees_total', 'net_earning', 'shipment_number',
        ]

    def get_product(self, obj):
        p = obj.listing.product
        images = sorted(p.images.all(), key=lambda i: i.sort_order)
        return {'asin': p.asin, 'title': p.title, 'image': images[0].image_url if images else None}

    def get_fees_total(self, obj):
        return _money(obj.referral_fee_charged + obj.closing_fee_charged + obj.fba_fulfillment_fee)

    def get_net_earning(self, obj):
        fees = obj.referral_fee_charged + obj.closing_fee_charged + obj.fba_fulfillment_fee
        return _money(obj.total_price + obj.item_shipping_fee - obj.item_discount_amount - fees)


def _payment_info(p):
    """Method and status of a payment; for COD also how much the courier still has to collect."""
    is_cod = p.payment_method == PaymentMethodType.CASH_ON_DELIVERY
    return {
        'method': p.get_payment_method_display(), 'status': p.status, 'status_display': p.get_status_display(),
        'is_cod': is_cod,
        'cod_to_collect': _money(p.amount) if is_cod and p.status == PaymentStatus.INITIATED else None,
    }


def _seller_items(order):
    return getattr(order, 'seller_items', None) or list(order.items.all())


class OrderListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    customer = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()
    seller_total = serializers.SerializerMethodField()
    payment = serializers.SerializerMethodField()
    ship_by = serializers.SerializerMethodField()
    is_late = serializers.SerializerMethodField()
    allowed_actions = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'status_display', 'placed_at', 'paid_at', 'currency',
            'grand_total', 'seller_total', 'shipping_speed', 'is_gift', 'customer', 'items', 'payment',
            'ship_by', 'is_late', 'allowed_actions',
        ]

    def get_customer(self, obj):
        a = obj.shipping_address
        return {'name': a.full_name, 'phone': a.phone_number, 'city': a.city, 'state': a.state_or_province}

    def get_items(self, obj):
        return OrderItemSerializer(_seller_items(obj), many=True).data

    def get_seller_total(self, obj):
        return _money(sum((i.total_price for i in _seller_items(obj)), Decimal('0')))

    def get_payment(self, obj):
        p = cod_payment(obj) or next(iter(obj.payments.all()), None)
        return _payment_info(p) if p else None

    def get_ship_by(self, obj):
        return _ship_by(obj, _seller_items(obj))

    def get_is_late(self, obj):
        items = _seller_items(obj)
        return any(i.status in UNSHIPPED_ITEM for i in items) and obj.status not in (
            OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED) and timezone.now() > _ship_by(obj, items)

    def get_allowed_actions(self, obj):
        return allowed_actions(obj, _seller_items(obj))


class CheckpointSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShipmentCheckpoint
        fields = ['id', 'event_time', 'location', 'status_text', 'carrier_code']


class ShipmentSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    events = CheckpointSerializer(source='tracking_events', many=True, read_only=True)
    warehouse = serializers.CharField(source='warehouse.name', read_only=True, default=None)

    class Meta:
        model = Shipment
        fields = [
            'id', 'shipment_number', 'status', 'status_display', 'carrier_name', 'tracking_number',
            'tracking_url', 'warehouse', 'estimated_delivery_at', 'dispatched_at', 'delivered_at', 'events',
        ]


class OrderDetailSerializer(OrderListSerializer):
    shipping_address = serializers.SerializerMethodField()
    billing_address = serializers.SerializerMethodField()
    payments = serializers.SerializerMethodField()
    shipments = serializers.SerializerMethodField()
    other_sellers_items = serializers.SerializerMethodField()

    class Meta(OrderListSerializer.Meta):
        fields = OrderListSerializer.Meta.fields + [
            'items_subtotal', 'shipping_total', 'tax_total', 'promotion_discount', 'gift_message',
            'shipping_address', 'billing_address', 'payments', 'shipments', 'other_sellers_items', 'updated_at',
        ]

    @staticmethod
    def _address(a):
        return {
            'full_name': a.full_name, 'phone': a.phone_number, 'company': a.company_name,
            'lines': [l for l in (a.street_line1, a.street_line2) if l],
            'city': a.city, 'state': a.state_or_province, 'postal_code': a.postal_code,
            'instructions': a.delivery_instructions,
        }

    def get_shipping_address(self, obj):
        return self._address(obj.shipping_address)

    def get_billing_address(self, obj):
        return self._address(obj.billing_address)

    def get_payments(self, obj):
        return [{
            **_payment_info(p), 'provider': p.gateway_provider, 'reference': p.gateway_transaction_id,
            'amount': _money(p.amount), 'captured_at': p.captured_at,
        } for p in obj.payments.all()]

    def get_shipments(self, obj):
        ids = {i.shipment_id for i in _seller_items(obj) if i.shipment_id}
        shipments = [s for s in obj.shipments.all() if s.id in ids]
        return ShipmentSerializer(sorted(shipments, key=lambda s: s.created_at), many=True).data

    def get_other_sellers_items(self, obj):
        return len(obj.items.all()) - len(_seller_items(obj))


class SellerOrderViewSet(viewsets.GenericViewSet):
    """
    Seller Central orders: orders that contain the seller's lines, with only those lines shown.

    GET  /api/orders/              tab=pending_payment|unshipped|shipped|delivered|cancelled|refunded,
                                   search, date_from, date_to, fulfillment=FBA|FBM, payment=COD|PREPAID,
                                   late=true, ordering
    GET  /api/orders/summary/      tab counts, 30-day sales and late shipments
    GET  /api/orders/export/       same filters, as CSV
    GET  /api/orders/<order_number>/
    POST /api/orders/<n>/confirm|pack|ship|mark_delivered|mark_rto|add_tracking|cancel/
    """
    pagination_class = StandardResultsSetPagination
    permission_classes = [permissions.AllowAny]  # open like the other seller APIs until JWT login lands
    lookup_field = 'order_number'

    def _seller(self):
        return resolve_request_seller(self.request)

    def get_queryset(self):
        seller = self._seller()
        if not seller:
            return Order.objects.none()
        item_qs = OrderItem.objects.select_related('listing__product', 'shipment').prefetch_related('listing__product__images')
        return Order.objects.filter(items__seller=seller).distinct().select_related(
            'shipping_address', 'billing_address'
        ).prefetch_related(
            Prefetch('items', queryset=item_qs.filter(seller=seller), to_attr='seller_items'),
            'items', 'payments', 'shipments__tracking_events', 'shipments__warehouse',
        )

    def _filtered(self):
        qs = self.get_queryset()
        p = self.request.query_params
        if p.get('tab') in TABS:
            qs = qs.filter(status__in=TABS[p['tab']])
        search = (p.get('search') or '').strip()
        if search:
            qs = qs.filter(
                Q(order_number__icontains=search) | Q(shipping_address__full_name__icontains=search) |
                Q(shipping_address__phone_number__icontains=search) | Q(items__listing__seller_sku__icontains=search) |
                Q(items__listing__product__asin__iexact=search) | Q(items__listing__product__title__icontains=search) |
                Q(shipments__tracking_number__icontains=search)
            ).distinct()
        if parse_date(p.get('date_from') or ''):
            qs = qs.filter(placed_at__date__gte=parse_date(p['date_from']))
        if parse_date(p.get('date_to') or ''):
            qs = qs.filter(placed_at__date__lte=parse_date(p['date_to']))
        channel = {'FBA': FulfillmentChannel.MAKAANO_FULFILLED, 'FBM': FulfillmentChannel.SELLER_FULFILLED}.get(p.get('fulfillment'))
        if channel:
            qs = qs.filter(items__seller=self._seller(), items__listing__fulfillment_channel=channel).distinct()
        if p.get('payment') == 'COD':
            qs = qs.filter(payments__payment_method=PaymentMethodType.CASH_ON_DELIVERY).distinct()
        elif p.get('payment') == 'PREPAID':
            qs = qs.exclude(payments__payment_method=PaymentMethodType.CASH_ON_DELIVERY)
        ordering = {'oldest': 'placed_at', 'total_desc': '-grand_total', 'total_asc': 'grand_total'}.get(p.get('ordering'), '-placed_at')
        qs = qs.order_by(ordering)
        if p.get('late') in ('true', '1'):
            qs = [o for o in qs if OrderListSerializer().get_is_late(o)]
        return qs

    def list(self, request):
        page = self.paginate_queryset(self._filtered())
        return self.get_paginated_response(OrderListSerializer(page, many=True).data)

    def retrieve(self, request, order_number=None):
        return Response(OrderDetailSerializer(self._get(order_number)).data)

    def _get(self, order_number):
        order = self.get_queryset().filter(order_number=order_number).first()
        if not order:
            from django.http import Http404
            raise Http404("Order not found.")
        return order

    @action(detail=False, methods=['get'])
    def summary(self, request):
        seller = self._seller()
        qs = self.get_queryset()
        by_status = dict(Order.objects.filter(id__in=qs.values('id')).values_list('status').annotate(n=Count('id')).order_by())
        since = timezone.now() - timedelta(days=30)
        recent = OrderItem.objects.filter(seller=seller, order__placed_at__gte=since).exclude(
            status=OrderItemStatus.CANCELLED).exclude(order__status=OrderStatus.PENDING_PAYMENT) if seller else OrderItem.objects.none()
        agg = recent.aggregate(sales=Sum('total_price'), orders=Count('order', distinct=True), units=Sum('quantity'))
        # Orders that still have lines to dispatch, including partly shipped ones.
        open_orders = [o for o in qs.filter(status__in=TABS['unshipped'] + [OrderStatus.PARTIALLY_SHIPPED])]
        # Cash the couriers still have to collect on open COD orders.
        cod_open = Payment.objects.filter(
            order__in=qs.values('id'), payment_method=PaymentMethodType.CASH_ON_DELIVERY, status=PaymentStatus.INITIATED,
        ).aggregate(n=Count('id'), amount=Sum('amount'))
        return Response({
            'tabs': {tab: sum(by_status.get(s, 0) for s in statuses) for tab, statuses in TABS.items()},
            'total': sum(by_status.values()),
            'sales_30d': _money(agg['sales']),
            'orders_30d': agg['orders'] or 0,
            'units_30d': agg['units'] or 0,
            'avg_order_value_30d': _money((agg['sales'] or 0) / agg['orders']) if agg['orders'] else '0.00',
            'late_shipments': sum(1 for o in open_orders if OrderListSerializer().get_is_late(o)),
            'cod_open_orders': cod_open['n'],
            'cod_to_collect': _money(cod_open['amount']),
        })

    @action(detail=False, methods=['get'])
    def export(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="orders-{timezone.localdate()}.csv"'
        w = csv.writer(response)
        w.writerow(['Order', 'Placed', 'Status', 'Customer', 'City', 'SKU', 'ASIN', 'Product', 'Qty', 'Unit price',
                    'Line total', 'Tax', 'Fees', 'Item status', 'Payment', 'Tracking'])
        for o in self._filtered():
            pay = next(iter(o.payments.all()), None)
            for i in _seller_items(o):
                w.writerow([
                    o.order_number, timezone.localtime(o.placed_at).strftime('%Y-%m-%d %H:%M'), o.get_status_display(),
                    o.shipping_address.full_name, o.shipping_address.city, i.listing.seller_sku, i.listing.product.asin,
                    i.listing.product.title, i.quantity, i.unit_price, i.total_price, i.item_tax_amount,
                    _money(i.referral_fee_charged + i.closing_fee_charged + i.fba_fulfillment_fee), i.get_status_display(),
                    pay.get_payment_method_display() if pay else '', i.shipment.tracking_number if i.shipment else '',
                ])
        return response

    # ---------- lifecycle actions ----------

    def _act(self, order_number, name, apply):
        with transaction.atomic():
            order = Order.objects.select_for_update().get(pk=self._get(order_number).pk)
            order = self.get_queryset().get(pk=order.pk)
            items = _seller_items(order)
            if name not in allowed_actions(order, items):
                return Response({'error': f"Can't {name.replace('_', ' ')} this order right now ({order.get_status_display().lower()})."},
                                status=status.HTTP_409_CONFLICT)
            error = apply(order, items, self.request.data)
            if error:
                transaction.set_rollback(True)
                return Response(error, status=status.HTTP_400_BAD_REQUEST)
            order.status = recompute_order_status(order)
            order.save(update_fields=['status', 'updated_at'])
        return Response(OrderDetailSerializer(self._get(order_number)).data)

    @staticmethod
    def _stock_item(line):
        return InventoryItem.objects.select_for_update().filter(listing=line.listing).order_by('-available_stock').first()

    @action(detail=True, methods=['post'])
    def confirm(self, request, order_number=None):
        """Accept the order: reserve stock for each pending line."""
        def apply(order, items, data):
            for line in items:
                if line.status != OrderItemStatus.PENDING:
                    continue
                inv = self._stock_item(line)
                free = (inv.available_stock - inv.reserved_stock) if inv else 0
                if free < line.quantity:
                    return {'error': f"Not enough stock for {line.listing.seller_sku}: {max(free, 0)} free, {line.quantity} needed. Add stock in Inventory first."}
                inv.reserved_stock += line.quantity
                inv.save(update_fields=['reserved_stock', 'updated_at'])
                line.status = OrderItemStatus.ALLOCATED
                line.save(update_fields=['status', 'updated_at'])
        return self._act(order_number, 'confirm', apply)

    @action(detail=True, methods=['post'])
    def pack(self, request, order_number=None):
        def apply(order, items, data):
            for line in items:
                if line.status == OrderItemStatus.ALLOCATED:
                    line.status = OrderItemStatus.PACKED
                    line.save(update_fields=['status', 'updated_at'])
        return self._act(order_number, 'pack', apply)

    @action(detail=True, methods=['post'])
    def ship(self, request, order_number=None):
        """
        Dispatch confirmed lines: {carrier, tracking_number, estimated_delivery_at?, item_ids?}.
        Stock leaves the warehouse (CUSTOMER_ORDER_DISPATCHED movement) and a shipment is created.
        """
        def apply(order, items, data):
            carrier, tracking = str(data.get('carrier') or '').strip(), str(data.get('tracking_number') or '').strip()
            if not carrier or not tracking:
                return {'carrier': 'Enter the courier.', 'tracking_number': 'Enter the tracking number.'} if not carrier and not tracking \
                    else ({'carrier': 'Enter the courier.'} if not carrier else {'tracking_number': 'Enter the tracking number.'})
            wanted = set(data.get('item_ids') or [])
            lines = [l for l in items if l.status in (OrderItemStatus.ALLOCATED, OrderItemStatus.PACKED) and (not wanted or l.id in wanted)]
            if not lines:
                return {'item_ids': 'Choose at least one confirmed line to ship.'}
            eta = data.get('estimated_delivery_at')
            eta = (parse_datetime(eta) or (timezone.make_aware(datetime.combine(parse_date(eta), datetime.min.time()))
                   if parse_date(eta or '') else None)) if eta else None
            now = timezone.now()
            first_inv = self._stock_item(lines[0])
            shipment = Shipment.objects.create(
                shipment_number=f"PKG-{secrets.randbelow(9000000) + 1000000}", order=order, seller=lines[0].seller,
                warehouse=first_inv.warehouse if first_inv else None, status=ShipmentStatus.PICKED_UP,
                carrier_name=carrier, tracking_number=tracking, estimated_delivery_at=eta or now + timedelta(days=4),
                dispatched_at=now,
            )
            ShipmentCheckpoint.objects.create(
                shipment=shipment, event_time=now, status_text="Picked up by courier",
                location=first_inv.warehouse.city if first_inv and first_inv.warehouse else order.shipping_address.city,
            )
            for line in lines:
                inv = self._stock_item(line)
                if not inv or inv.available_stock < line.quantity:
                    return {'error': f"Only {inv.available_stock if inv else 0} units of {line.listing.seller_sku} in stock."}
                inv.available_stock -= line.quantity
                inv.reserved_stock = max(0, inv.reserved_stock - line.quantity)
                inv.save(update_fields=['available_stock', 'reserved_stock', 'updated_at'])
                InventoryMovement.objects.create(
                    inventory_item=inv, quantity_change=-line.quantity, balance_after=inv.available_stock,
                    reason=InventoryMovementReason.CUSTOMER_ORDER_DISPATCHED, reference_note=f"Order {order.order_number}",
                )
                line.status, line.shipment = OrderItemStatus.SHIPPED, shipment
                line.save(update_fields=['status', 'shipment', 'updated_at'])
        return self._act(order_number, 'ship', apply)

    @action(detail=True, methods=['post'])
    def add_tracking(self, request, order_number=None):
        """Add a tracking event: {shipment_id, status_text, location, status?} (status from ShipmentStatus)."""
        def apply(order, items, data):
            shipment = Shipment.objects.filter(id=data.get('shipment_id'), order_items__in=items).distinct().first()
            text, location = str(data.get('status_text') or '').strip(), str(data.get('location') or '').strip()
            if not shipment:
                return {'shipment_id': 'Choose one of your shipments.'}
            if not text or not location:
                return {'status_text': 'Describe the update and where it happened.'}
            new_status = str(data.get('status') or '').upper()
            if new_status and new_status not in (ShipmentStatus.IN_TRANSIT, ShipmentStatus.OUT_FOR_DELIVERY, ShipmentStatus.DELIVERY_ATTEMPTED):
                return {'status': 'Use IN_TRANSIT, OUT_FOR_DELIVERY or DELIVERY_ATTEMPTED.'}
            ShipmentCheckpoint.objects.create(shipment=shipment, event_time=timezone.now(), status_text=text[:255], location=location[:255])
            if new_status:
                shipment.status = new_status
                shipment.save(update_fields=['status', 'updated_at'])
        return self._act(order_number, 'add_tracking', apply)

    @action(detail=True, methods=['post'])
    def mark_delivered(self, request, order_number=None):
        """Confirm delivery of a shipment ({shipment_id}; defaults to every shipped line)."""
        def apply(order, items, data):
            lines = [l for l in items if l.status == OrderItemStatus.SHIPPED and (not data.get('shipment_id') or l.shipment_id == data.get('shipment_id'))]
            if not lines:
                return {'shipment_id': 'Nothing in that shipment is waiting for delivery.'}
            now = timezone.now()
            for shipment in {l.shipment for l in lines if l.shipment}:
                shipment.status, shipment.delivered_at = ShipmentStatus.DELIVERED, now
                shipment.save(update_fields=['status', 'delivered_at', 'updated_at'])
                ShipmentCheckpoint.objects.create(shipment=shipment, event_time=now, status_text="Delivered", location=order.shipping_address.city)
            for line in lines:
                line.status = OrderItemStatus.DELIVERED
                line.save(update_fields=['status', 'updated_at'])
            capture_cod_if_delivered(order)
        return self._act(order_number, 'mark_delivered', apply)

    @action(detail=True, methods=['post'])
    def mark_rto(self, request, order_number=None):
        """
        Return to origin ({shipment_id, reason?}; defaults to every shipped line): the buyer refused the
        parcel or couldn't be reached. Units go back on the shelf, the lines are cancelled and the payment
        is voided (COD) or refunded (prepaid).
        """
        def apply(order, items, data):
            lines = [l for l in items if l.status == OrderItemStatus.SHIPPED and (not data.get('shipment_id') or l.shipment_id == data.get('shipment_id'))]
            if not lines:
                return {'shipment_id': 'Nothing in that shipment is out with the courier.'}
            reason = str(data.get('reason') or '').strip()[:200] or "Buyer refused / not reachable"
            now = timezone.now()
            for shipment in {l.shipment for l in lines if l.shipment}:
                shipment.status = ShipmentStatus.EXCEPTION_RETURNED
                shipment.save(update_fields=['status', 'updated_at'])
                ShipmentCheckpoint.objects.create(
                    shipment=shipment, event_time=now, status_text=f"Returned to seller (RTO): {reason}"[:255],
                    location=shipment.warehouse.city if shipment.warehouse else order.shipping_address.city,
                )
            for line in lines:
                inv = self._stock_item(line)
                if inv:
                    inv.available_stock += line.quantity
                    inv.save(update_fields=['available_stock', 'updated_at'])
                    InventoryMovement.objects.create(
                        inventory_item=inv, quantity_change=line.quantity, balance_after=inv.available_stock,
                        reason=InventoryMovementReason.CUSTOMER_RETURN_RESTOCKED, reference_note=f"RTO · order {order.order_number}",
                    )
                line.status = OrderItemStatus.CANCELLED
                line.save(update_fields=['status', 'updated_at'])
            settle_payment_for_cancelled(order, lines)
            capture_cod_if_delivered(order)
        return self._act(order_number, 'mark_rto', apply)

    @action(detail=True, methods=['post'])
    def cancel(self, request, order_number=None):
        """Cancel the seller's unshipped lines; reserved stock is released and the payment voided or refunded."""
        def apply(order, items, data):
            for line in items:
                if line.status == OrderItemStatus.ALLOCATED or line.status == OrderItemStatus.PACKED:
                    inv = self._stock_item(line)
                    if inv:
                        inv.reserved_stock = max(0, inv.reserved_stock - line.quantity)
                        inv.save(update_fields=['reserved_stock', 'updated_at'])
                line.status = OrderItemStatus.CANCELLED
                line.save(update_fields=['status', 'updated_at'])
            settle_payment_for_cancelled(order, items)
        return self._act(order_number, 'cancel', apply)
