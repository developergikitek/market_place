'use client';

import { getStoredOrders, upsertOrder } from '@/shared/models/customerStore';
import { getQuotesForRequirement } from './quoteEngine';

const DAY_MS = 24 * 60 * 60 * 1000;

export const orderIdFor = (requirementId) => `WS-${requirementId.replace(/^RQ/, '')}`;

const fmtTime = (ts) => new Date(ts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

/** "Tomorrow" / "Wed, 15 Oct" for the vendor's promised delivery day. */
export function deliveryDateLabel(acceptedAt, deliveryDays) {
  const due = new Date(acceptedAt + deliveryDays * DAY_MS);
  const today = new Date(acceptedAt);
  const diff = Math.round((new Date(due.toDateString()) - new Date(today.toDateString())) / DAY_MS);
  if (diff === 1) return 'Tomorrow';
  return due.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** The accepted quote of a requirement, or null. */
export function getAcceptedQuote(requirement) {
  if (requirement?.status !== 'accepted') return null;
  return getQuotesForRequirement(requirement).find((q) => q.vendor.id === requirement.acceptedVendorId) || null;
}

/** My Orders entry (shared order shape) for an accepted wholesale quote. */
function buildOrder(requirement, quote) {
  const acceptedAt = requirement.acceptedAt;
  const lines = quote.lines.filter((l) => l.available);
  const when = deliveryDateLabel(acceptedAt, quote.deliveryDays);
  return {
    orderId: orderIdFor(requirement.id),
    source: 'wholesale',
    requirementId: requirement.id,
    placedAt: new Date(acceptedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }),
    status: 'PREPARING',
    statusLabel: `Vendor is preparing your bulk order • Delivery ${when}`,
    storeId: quote.vendor.id,
    storeName: quote.vendor.name,
    storeAddress: `${quote.vendor.locality}, Indore`,
    itemCount: lines.length,
    totalAmount: quote.total,
    deliveryType: 'Wholesale bulk delivery',
    deliveryEta: when,
    items: lines.map((l) => ({ id: l.itemId, name: l.item.name, qty: l.offeredQty, unit: l.item.unit, price: l.rate })),
    bill: [
      { label: 'Subtotal', amount: quote.subtotal },
      { label: 'GST 18%', amount: quote.gst },
    ],
    paidVia: 'Pay on delivery',
    invoiceDownloadUrl: '#',
    trackingSteps: [
      { title: 'Quote accepted', time: fmtTime(acceptedAt), done: true },
      { title: 'Vendor preparing stock', time: 'In progress', active: true },
      { title: 'Loaded for delivery', time: 'Pending' },
      { title: 'Delivered to site', time: `Expected ${when}` },
    ],
  };
}

/**
 * Make sure an accepted requirement has its order in My Orders (requirements accepted
 * before orders existed get one on demand). Returns the orderId, or null if not accepted.
 */
export function ensureOrderForRequirement(requirement) {
  const quote = getAcceptedQuote(requirement);
  if (!quote) return null;
  const orderId = orderIdFor(requirement.id);
  if (!getStoredOrders().some((o) => o.orderId === orderId)) {
    upsertOrder(buildOrder(requirement, quote));
  }
  return orderId;
}
