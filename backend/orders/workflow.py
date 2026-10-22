"""
Seller-side order lifecycle, driven by the seller's order lines (OrderItem):

PENDING ─confirm─▶ ALLOCATED ─pack─▶ PACKED ─ship─▶ SHIPPED ─deliver─▶ DELIVERED
   └──────────── cancel (before shipping) ───────────▶ CANCELLED

Stock: confirming reserves units (InventoryItem.reserved_stock); shipping takes them out of the
warehouse (available and reserved go down, with a CUSTOMER_ORDER_DISPATCHED movement); cancelling
releases the reservation. The order's own status is recomputed from all of its lines.
"""
from common.enums import OrderItemStatus, OrderStatus

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
        actions += ['add_tracking', 'mark_delivered']
    if statuses and statuses <= UNSHIPPED_ITEM:
        actions.append('cancel')
    return actions
