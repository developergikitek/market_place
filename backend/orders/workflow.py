"""
Seller-side order lifecycle, driven by the seller's order lines (OrderItem):

PENDING ─confirm─▶ ALLOCATED ─pack─▶ PACKED ─ship─▶ SHIPPED ─deliver─▶ DELIVERED
   └──────────── cancel (before shipping) ───────────▶ CANCELLED
                                      SHIPPED ─rto (buyer refused / unreachable)─▶ CANCELLED

Stock: confirming reserves units (InventoryItem.reserved_stock); shipping takes them out of the
warehouse (available and reserved go down, with a CUSTOMER_ORDER_DISPATCHED movement); cancelling
releases the reservation. The order's own status is recomputed from all of its lines.

Cash on delivery (the Amazon / Flipkart model):
  - A COD order skips PENDING_PAYMENT: it is placed straight into PAYMENT_CONFIRMED (the "Unshipped"
    tab) with a Payment of method CASH_ON_DELIVERY in INITIATED, i.e. "to be collected". paid_at stays empty.
  - The courier collects the cash at the door. Marking the order delivered captures the payment
    (CAPTURED, captured_at and Order.paid_at set) once every live line is delivered.
  - Cancelling before dispatch moves no money: the payment is VOIDED, or its amount to collect is
    reduced when only some lines are cancelled.
  - The buyer can refuse the parcel or be unreachable. The seller then marks the shipment RTO
    (return to origin): the shipment becomes EXCEPTION_RETURNED, the units go back on the shelf and the
    lines are cancelled, with the payment settled as for a cancellation. Prepaid orders can be RTO'd
    too; their payment is refunded instead.
"""
from decimal import Decimal

from django.utils import timezone

from common.enums import OrderItemStatus, OrderStatus, PaymentMethodType, PaymentStatus

UNSHIPPED_ITEM = {OrderItemStatus.PENDING, OrderItemStatus.ALLOCATED, OrderItemStatus.PACKED}
AFTER_DELIVERY_ITEM = {OrderItemStatus.RETURN_REQUESTED, OrderItemStatus.RETURNED, OrderItemStatus.REFUND_PROCESSED}

# Seller page tabs -> order statuses.
TABS = {
    'pending_payment': [OrderStatus.PENDING_PAYMENT],
    'unshipped': [OrderStatus.PAYMENT_CONFIRMED, OrderStatus.PROCESSING],
    'shipped': [OrderStatus.PARTIALLY_SHIPPED, OrderStatus.SHIPPED],
    'delivered': [OrderStatus.DELIVERED],
    'cancelled': [OrderStatus.CANCELLED],
    'refunded': [OrderStatus.REFUNDED],
}


# Orders above this can't be paid in cash (Amazon.in and Flipkart cap COD at ₹50,000).
COD_MAX_ORDER_VALUE = Decimal('50000')


def cod_payment(order):
    """The order's cash-on-delivery payment, or None for a prepaid order."""
    return next((p for p in order.payments.all() if p.payment_method == PaymentMethodType.CASH_ON_DELIVERY), None)


def line_amount(line):
    """What the buyer pays for one line: price, tax and shipping, less its discount."""
    return line.total_price + line.item_tax_amount + line.item_shipping_fee - line.item_discount_amount


def settle_payment_for_cancelled(order, lines):
    """
    Adjust the order's payment after `lines` were cancelled or RTO'd. COD: nothing was collected, so
    void it (everything cancelled) or lower the amount the courier collects. Prepaid: refund.
    """
    nothing_left = not order.items.exclude(status=OrderItemStatus.CANCELLED).exists()
    cod = cod_payment(order)
    if cod and cod.status == PaymentStatus.INITIATED:
        if nothing_left:
            cod.status = PaymentStatus.VOIDED
        else:
            cod.amount = max(Decimal('0'), cod.amount - sum((line_amount(l) for l in lines), Decimal('0')))
        cod.save(update_fields=['status', 'amount', 'updated_at'])
        return
    if nothing_left:
        order.payments.filter(status=PaymentStatus.AUTHORIZED).update(status=PaymentStatus.VOIDED)
        order.payments.filter(status=PaymentStatus.CAPTURED).update(status=PaymentStatus.REFUNDED)
    else:
        order.payments.filter(status=PaymentStatus.CAPTURED).update(status=PaymentStatus.PARTIALLY_REFUNDED)


def capture_cod_if_delivered(order):
    """COD: the cash has been collected once every line still live on the order has reached the buyer."""
    cod = cod_payment(order)
    undelivered = order.items.exclude(status__in=[OrderItemStatus.DELIVERED, OrderItemStatus.CANCELLED])
    if not cod or cod.status != PaymentStatus.INITIATED or undelivered.exists():
        return
    if not order.items.filter(status=OrderItemStatus.DELIVERED).exists():
        return  # everything was cancelled or RTO'd: the payment is voided, not collected
    now = timezone.now()
    cod.status, cod.authorized_at, cod.captured_at = PaymentStatus.CAPTURED, now, now
    cod.save(update_fields=['status', 'authorized_at', 'captured_at', 'updated_at'])
    order.paid_at = now
    order.save(update_fields=['paid_at', 'updated_at'])


def recompute_order_status(order):
    """Order status from its lines (payment-pending orders stay as they are)."""
    if order.status == OrderStatus.PENDING_PAYMENT:
        return order.status
    statuses = list(order.items.values_list('status', flat=True))
    live = [s for s in statuses if s != OrderItemStatus.CANCELLED]
    if not live:
        return OrderStatus.CANCELLED
    if all(s == OrderItemStatus.REFUND_PROCESSED for s in live):
        return OrderStatus.REFUNDED
    if all(s in {OrderItemStatus.DELIVERED} | AFTER_DELIVERY_ITEM for s in live):
        return OrderStatus.DELIVERED
    shipped = [s for s in live if s not in UNSHIPPED_ITEM]
    if shipped and len(shipped) < len(live):
        return OrderStatus.PARTIALLY_SHIPPED
    if shipped:
        return OrderStatus.SHIPPED
    if any(s in {OrderItemStatus.ALLOCATED, OrderItemStatus.PACKED} for s in live):
        return OrderStatus.PROCESSING
    return OrderStatus.PAYMENT_CONFIRMED


def allowed_actions(order, seller_items):
    """Actions the seller can take on their lines of this order right now."""
    if order.status in (OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED, OrderStatus.REFUNDED):
        return []
    statuses = {i.status for i in seller_items}
    actions = []
    if OrderItemStatus.PENDING in statuses:
        actions.append('confirm')
    if OrderItemStatus.ALLOCATED in statuses:
        actions.append('pack')
    if statuses & {OrderItemStatus.ALLOCATED, OrderItemStatus.PACKED}:
        actions.append('ship')
    if OrderItemStatus.SHIPPED in statuses:
        actions += ['add_tracking', 'mark_delivered', 'mark_rto']
    if statuses and statuses <= UNSHIPPED_ITEM:
        actions.append('cancel')
    return actions
