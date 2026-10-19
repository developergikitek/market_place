// Display helpers shared by the My Orders list and the order detail screen.

export const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

/** Orders created before the `source` field existed are retail store orders. */
export const orderKind = (order) => (order.source === 'wholesale' ? 'WHOLESALE' : 'RETAIL');

export const isLive = (order) => order.status === 'PREPARING' || order.status === 'IN_TRANSIT';

export const STATUS_LABEL = {
  PREPARING: 'Preparing',
  IN_TRANSIT: 'On the way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const qtyText = (it) => (it.unit ? `${it.qty} ${it.unit}${it.qty === 1 ? '' : 's'}` : `${it.qty}×`);

/** Short store mark for the card thumbnail: "Sharma Hardware" -> "SH". */
export const storeInitials = (name = '') =>
  name.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

/** Share of tracking steps completed (0..1). */
export function orderProgress(order) {
  const steps = order.trackingSteps || [];
  if (!isLive(order) || steps.length === 0) return 1;
  const done = steps.filter((s) => s.done).length;
  const active = steps.some((s) => s.active) ? 0.5 : 0;
  return Math.min(1, (done + active) / steps.length);
}

/**
 * Bill rows for the detail screen. New orders store their breakdown; older ones only
 * have items + total, so the difference is shown as one "charges" / "savings" row.
 */
export function billRows(order) {
  if (order.bill?.length) return order.bill;
  const itemTotal = (order.items || []).reduce((s, it) => s + it.price * it.qty, 0);
  const diff = Math.round((order.totalAmount || 0) - itemTotal);
  const rows = [{ label: 'Item total', amount: itemTotal }];
  if (diff > 0) rows.push({ label: 'Delivery & other charges', amount: diff });
  if (diff < 0) rows.push({ label: 'Discounts', amount: diff });
  return rows;
}
