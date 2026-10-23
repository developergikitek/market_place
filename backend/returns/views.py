import secrets
from datetime import timedelta
from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.db.models import Case, Count, F, IntegerField, Q, Sum, Value, When
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from common.enums import (
    AtoZClaimStatus, FulfillmentChannel, InventoryMovementReason, OrderItemStatus, OrderStatus,
    PaymentStatus, ReturnReason, ReturnStatus, SettlementStatus, TransactionType,
)
from common.pagination import StandardResultsSetPagination
from orders.models import OrderItem
from returns.models import AtoZClaim, ReturnRequest
from returns.serializers import AtoZClaimSerializer, ReturnCreateSerializer, ReturnRequestSerializer
from returns.workflow import (
    BUYER_REMORSE_REASONS, MAX_DAMAGED_FEE_RATE, MAX_RESTOCKING_FEE_RATE, STATUS_GROUPS, TRANSITIONS,
)
from sellers.utils import resolve_request_seller
from sellers.permissions import IsSellerUser

OPEN_STATUSES = STATUS_GROUPS['action_required'] + STATUS_GROUPS['in_progress']


def _new_number(prefix, model, field):
    while True:
        number = f"{prefix}-{secrets.randbelow(900000) + 100000}"
        if not model.objects.filter(**{field: number}).exists():
            return number


def _money(value):
    return str(Decimal(str(value or 0)).quantize(Decimal('0.01')))


def _rate(value, maximum):
    try:
        rate = Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        raise ValidationError({'restocking_fee_rate': 'Enter a number.'})
    if not rate.is_finite() or rate < 0 or rate > maximum:
        raise ValidationError({'restocking_fee_rate': f'Restocking fee must be between 0 and {maximum}%.'})
    return rate


class ReturnRequestViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin,
                           viewsets.GenericViewSet):
    """
    Returns (RMA) management.
    Sellers list their returns and move them through the lifecycle with the action endpoints;
    buyers open a return on a delivered order line (POST) and may cancel it before it ships.
    """
    serializer_class = ReturnRequestSerializer
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        # Opening / cancelling a return is the buyer's (customer); all other actions are for the seller
        if self.action in ('create', 'cancel'):
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsSellerUser()]

    def get_queryset(self):
        qs = ReturnRequest.objects.select_related(
            'order_item__order__shipping_address', 'order_item__order__customer',
            'order_item__listing__product__brand',
        ).prefetch_related('order_item__listing__product__images')

        if self.action == 'cancel':
            return qs.filter(order_item__order__customer=self.request.user)
        seller = resolve_request_seller(self.request)
        qs = qs.filter(seller=seller) if seller else qs.none()
        if self.action != 'list':
            return qs

        params = self.request.query_params
        group = params.get('group')
        if group in STATUS_GROUPS:
            qs = qs.filter(status__in=STATUS_GROUPS[group])
        statuses = [s.strip().upper() for s in (params.get('status') or '').split(',') if s.strip()]
        if statuses:
            qs = qs.filter(status__in=statuses)
        if params.get('reason'):
            qs = qs.filter(reason=params['reason'].upper())
        if params.get('fulfillment'):
            qs = qs.filter(order_item__listing__fulfillment_channel=params['fulfillment'].upper())

        search = (params.get('search') or params.get('q') or '').strip()
        if search:
            qs = qs.filter(
                Q(rma_number__icontains=search) |
                Q(order_item__order__order_number__icontains=search) |
                Q(order_item__listing__product__title__icontains=search) |
                Q(order_item__listing__product__asin__iexact=search) |
                Q(order_item__listing__seller_sku__icontains=search) |
                Q(return_tracking_number__icontains=search) |
                Q(order_item__order__shipping_address__full_name__icontains=search)
            )

        date_from, date_to = parse_date(params.get('date_from') or ''), parse_date(params.get('date_to') or '')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        ordering = {
            'oldest': 'created_at', 'refund_desc': '-refund_amount', 'refund_asc': 'refund_amount',
        }.get(params.get('ordering'), '-created_at')
        return qs.order_by(ordering)

    # ---------- buyer: open / cancel ----------

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = ReturnCreateSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        item = OrderItem.objects.select_for_update().select_related('order', 'listing').filter(
            id=data.validated_data['order_item_id'], order__customer=request.user
        ).first()
        if not item:
            raise ValidationError({'order_item_id': 'Order item not found on your orders.'})
        if item.status != OrderItemStatus.DELIVERED:
            raise ValidationError({'order_item_id': 'Only delivered items can be returned.'})
        if item.return_requests.filter(status__in=OPEN_STATUSES + [ReturnStatus.REFUND_ISSUED]).exists():
            raise ValidationError({'order_item_id': 'A return is already open for this item.'})

        # Makaano-fulfilled (MF) returns are authorised automatically; seller-fulfilled (SF) wait for the seller.
        start = ReturnStatus.AUTO_AUTHORIZED if item.listing.fulfillment_channel in (FulfillmentChannel.MF, FulfillmentChannel.MAKAANO_FULFILLED) \
            else ReturnStatus.REQUESTED
        rr = ReturnRequest.objects.create(
            rma_number=_new_number('RMA', ReturnRequest, 'rma_number'),
            order_item=item,
            seller=item.seller,
            reason=data.validated_data['reason'],
            customer_comment=data.validated_data.get('customer_comment') or None,
            evidence_images=data.validated_data.get('evidence_images', []),
            status=start,
            restocking_fee_rate=Decimal('0'),
            refund_amount=item.total_price,
        )
        item.status = OrderItemStatus.RETURN_REQUESTED
        item.save(update_fields=['status'])
        return Response(ReturnRequestSerializer(rr).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        return self._transition('cancel', lambda rr, data: self._restore_item(rr))

    # ---------- seller lifecycle ----------

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Authorise the return. Optional `restocking_fee_rate` (buyer-remorse reasons only, max 20%)."""
        def apply(rr, data):
            if 'restocking_fee_rate' in data:
                if rr.reason not in BUYER_REMORSE_REASONS and Decimal(str(data['restocking_fee_rate'] or 0)) > 0:
                    raise ValidationError({'restocking_fee_rate': 'A restocking fee only applies when the buyer changed their mind.'})
                rr.restocking_fee_rate = _rate(data['restocking_fee_rate'], MAX_RESTOCKING_FEE_RATE)
        return self._transition('approve', apply)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        return self._transition('reject', lambda rr, data: self._restore_item(rr))

    @action(detail=True, methods=['post'])
    def generate_label(self, request, pk=None):
        """Attach the return shipment: `carrier` and `tracking_number` required, `label_url` optional."""
        def apply(rr, data):
            carrier, tracking = str(data.get('carrier') or '').strip(), str(data.get('tracking_number') or '').strip()
            errors = {}
            if not carrier:
                errors['carrier'] = 'Enter the courier name.'
            if not tracking:
                errors['tracking_number'] = 'Enter the tracking number.'
            if errors:
                raise ValidationError(errors)
            rr.return_carrier, rr.return_tracking_number = carrier, tracking
            rr.return_label_url = str(data.get('label_url') or '').strip() or None
        return self._transition('generate_label', apply)

    @action(detail=True, methods=['post'])
    def mark_in_transit(self, request, pk=None):
        return self._transition('mark_in_transit')

    @action(detail=True, methods=['post'])
    def mark_received(self, request, pk=None):
        def apply(rr, data):
            rr.order_item.status = OrderItemStatus.RETURNED
            rr.order_item.save(update_fields=['status'])
        return self._transition('mark_received', apply)

    @action(detail=True, methods=['post'])
    def inspect(self, request, pk=None):
        """
        Record the inspection: `condition` = SELLABLE (stock goes back to inventory) or DAMAGED
        (optional `restocking_fee_rate` up to 50% to cover the loss).
        """
        def apply(rr, data):
            condition = str(data.get('condition') or '').upper()
            if condition == 'SELLABLE':
                rr.status = ReturnStatus.INSPECTED_SELLABLE
                self._restock(rr)
            elif condition == 'DAMAGED':
                rr.status = ReturnStatus.INSPECTED_DAMAGED
                if 'restocking_fee_rate' in data:
                    rr.restocking_fee_rate = _rate(data['restocking_fee_rate'], MAX_DAMAGED_FEE_RATE)
            else:
                raise ValidationError({'condition': 'Choose SELLABLE or DAMAGED.'})
        return self._transition('inspect', apply)

    @action(detail=True, methods=['post'])
    def issue_refund(self, request, pk=None):
        """Refund the buyer (item total minus restocking fee) and book it against the seller's open settlement."""
        def apply(rr, data):
            item = rr.order_item
            fee = (item.total_price * rr.restocking_fee_rate / Decimal('100')).quantize(Decimal('0.01'))
            rr.refund_amount = item.total_price - fee
            rr.refunded_at = timezone.now()
            item.status = OrderItemStatus.REFUND_PROCESSED
            item.save(update_fields=['status'])
            self._book_refund(rr)
        return self._transition('issue_refund', apply)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Counts per tab and status, refund totals, top reasons and the 30-day return rate."""
        seller = resolve_request_seller(request)
        qs = ReturnRequest.objects.filter(seller=seller) if seller else ReturnRequest.objects.none()
        by_status = dict(qs.values_list('status').annotate(n=Count('id')).order_by())
        since = timezone.now() - timedelta(days=30)
        sold = OrderItem.objects.filter(seller=seller, order__placed_at__gte=since).count() if seller else 0
        returned = qs.filter(created_at__gte=since).count()
        reasons = qs.values('reason').annotate(n=Count('id')).order_by('-n')[:5]
        reason_labels = dict(ReturnReason.choices)
        return Response({
            'total': qs.count(),
            'groups': {g: sum(by_status.get(s, 0) for s in statuses) for g, statuses in STATUS_GROUPS.items()},
            'by_status': {s: by_status.get(s, 0) for s in ReturnStatus.values},
            'refunded_total': _money(qs.filter(status=ReturnStatus.REFUND_ISSUED).aggregate(t=Sum('refund_amount'))['t']),
            'pending_refund_total': _money(qs.filter(status__in=OPEN_STATUSES).aggregate(t=Sum('refund_amount'))['t']),
            'return_rate_30d': round(returned * 100 / sold, 1) if sold else 0,
            'top_reasons': [{'reason': r['reason'], 'label': reason_labels.get(r['reason'], r['reason']), 'count': r['n']} for r in reasons],
        })

    # ---------- helpers ----------

    def _transition(self, name, apply=None):
        sources, target = TRANSITIONS[name]
        with transaction.atomic():
            rr = self.get_queryset().select_for_update(of=('self',)).get(pk=self.get_object().pk)
            if rr.status not in sources:
                return Response(
                    {'error': f"Can't {name.replace('_', ' ')} a return that is {rr.get_status_display().lower()}."},
                    status=status.HTTP_409_CONFLICT,
                )
            if target:
                rr.status = target
            if apply:
                apply(rr, self.request.data)
            rr.save()
        return Response(ReturnRequestSerializer(self.get_queryset().get(pk=rr.pk)).data)

    @staticmethod
    def _restore_item(rr):
        rr.order_item.status = OrderItemStatus.DELIVERED
        rr.order_item.save(update_fields=['status'])

    @staticmethod
    def _restock(rr):
        from warehouses.models import InventoryItem, InventoryMovement, Warehouse

        listing = rr.order_item.listing
        inv = listing.inventory_items.select_for_update().first()
        if not inv:
            warehouse = Warehouse.objects.first()
            if not warehouse:
                return
            inv = InventoryItem.objects.create(listing=listing, seller=listing.seller, warehouse=warehouse, available_stock=0)
        inv.available_stock += rr.order_item.quantity
        inv.save(update_fields=['available_stock'])
        InventoryMovement.objects.create(
            inventory_item=inv,
            quantity_change=rr.order_item.quantity,
            balance_after=inv.available_stock,
            reason=InventoryMovementReason.CUSTOMER_RETURN_RESTOCKED,
            reference_note=f"Return {rr.rma_number}",
        )

    @staticmethod
    def _book_refund(rr):
        from payments.models import SellerSettlement, SellerTransaction

        order = rr.order_item.order
        now = timezone.now()
        settlement = SellerSettlement.objects.select_for_update().filter(seller=rr.seller, status=SettlementStatus.OPEN) \
            .order_by('-period_start').first()
        if not settlement:
            settlement = SellerSettlement.objects.create(
                settlement_number=_new_number('STL', SellerSettlement, 'settlement_number'),
                seller=rr.seller, period_start=now, period_end=now + timedelta(days=14),
            )
        SellerTransaction.objects.create(
            settlement=settlement,
            order_item=rr.order_item,
            transaction_type=TransactionType.REFUND_DEDUCTION,
            amount=-rr.refund_amount,
            currency=order.currency,
            description=f"Refund for return {rr.rma_number} (order {order.order_number})",
        )
        SellerSettlement.objects.filter(pk=settlement.pk).update(
            refund_deductions_total=F('refund_deductions_total') + rr.refund_amount,
            net_disbursement_amount=F('net_disbursement_amount') - rr.refund_amount,
        )

        fully_refunded = not order.items.exclude(status__in=[OrderItemStatus.REFUND_PROCESSED, OrderItemStatus.CANCELLED]).exists()
        order.payments.filter(status__in=[PaymentStatus.CAPTURED, PaymentStatus.PARTIALLY_REFUNDED]).update(
            status=PaymentStatus.REFUNDED if fully_refunded else PaymentStatus.PARTIALLY_REFUNDED
        )
        if fully_refunded:
            order.status = OrderStatus.REFUNDED
            order.save(update_fields=['status'])


class AtoZClaimViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    A-to-z Guarantee claims filed against the seller. The seller can only respond;
    the marketplace investigates and resolves.
    """
    serializer_class = AtoZClaimSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [permissions.IsAuthenticated, IsSellerUser]

    def get_queryset(self):
        seller = resolve_request_seller(self.request)
        qs = AtoZClaim.objects.select_related('order__shipping_address', 'customer')
        qs = qs.filter(seller=seller) if seller else qs.none()
        params = self.request.query_params
        if params.get('status'):
            qs = qs.filter(status__in=[s.strip().upper() for s in params['status'].split(',')])
        search = (params.get('search') or '').strip()
        if search:
            qs = qs.filter(Q(claim_number__icontains=search) | Q(order__order_number__icontains=search) |
                           Q(claim_reason__icontains=search))
        # Claims still waiting on the seller come first.
        awaiting = Case(
            When(status__in=[AtoZClaimStatus.FILED, AtoZClaimStatus.WAITING_FOR_SELLER_RESPONSE], then=Value(0)),
            default=Value(1), output_field=IntegerField(),
        )
        return qs.order_by(awaiting, '-created_at')

    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        """Seller's side of the story (`response`, at least 20 characters); the claim moves to investigation."""
        text = str(request.data.get('response') or '').strip()
        if len(text) < 20:
            return Response({'response': 'Explain what happened in at least 20 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            claim = self.get_queryset().select_for_update(of=('self',)).get(pk=self.get_object().pk)
            if claim.status not in (AtoZClaimStatus.FILED, AtoZClaimStatus.WAITING_FOR_SELLER_RESPONSE):
                return Response({'error': 'This claim is no longer waiting for your response.'}, status=status.HTTP_409_CONFLICT)
            claim.seller_response_text = text
            claim.seller_responded_at = timezone.now()
            claim.status = AtoZClaimStatus.UNDER_INVESTIGATION
            claim.save()
        return Response(AtoZClaimSerializer(claim).data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        qs = self.get_queryset()
        by_status = dict(qs.values_list('status').annotate(n=Count('id')).order_by())
        return Response({
            'total': qs.count(),
            'awaiting_response': by_status.get(AtoZClaimStatus.FILED, 0) + by_status.get(AtoZClaimStatus.WAITING_FOR_SELLER_RESPONSE, 0),
            'by_status': {s: by_status.get(s, 0) for s in AtoZClaimStatus.values},
        })
