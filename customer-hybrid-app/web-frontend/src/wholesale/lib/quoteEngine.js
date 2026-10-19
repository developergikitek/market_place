import { getCatalogItem } from '../models/wholesaleCatalog';
import { WHOLESALE_VENDORS } from '../models/wholesaleVendors';

// ============================================================
// SIMULATED VENDOR QUOTES
// Deterministic per (requirement, vendor, item) so a quote never changes between
// renders or reloads. Replace getQuotesForRequirement with an API call later;
// the rest of the UI only depends on the quote shape below.
// ============================================================

function seededRandom(seedText) {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function buildQuote(requirement, vendor) {
  const rand = seededRandom(`${requirement.id}:${vendor.id}`);

  let lines = requirement.items.map(({ itemId, qty: requestedQty }) => {
    const item = getCatalogItem(itemId);
    const skip = rand() < vendor.skipChance;
    const fullStock = rand() < vendor.stockFactor;
    const partialShare = 0.5 + rand() * 0.4;
    const rateJitter = 0.97 + rand() * 0.06;

    if (!item || skip) {
      return { itemId, item, requestedQty, offeredQty: 0, rate: 0, amount: 0, available: false };
    }
    let offeredQty = requestedQty;
    if (!fullStock) {
      const step = item.step || 1;
      offeredQty = Math.max(step, Math.floor((requestedQty * partialShare) / step) * step);
      offeredQty = Math.min(offeredQty, requestedQty);
    }
    const rate = Math.round(item.marketRate * vendor.priceFactor * rateJitter);
    return { itemId, item, requestedQty, offeredQty, rate, amount: offeredQty * rate, available: true };
  });

  // A vendor only sends a quote if they can supply something
  if (!lines.some((l) => l.available)) {
    const i = Math.floor(rand() * lines.length);
    const l = lines[i];
    const rate = Math.round(l.item.marketRate * vendor.priceFactor);
    lines = lines.map((x, idx) =>
      idx === i ? { ...x, offeredQty: x.requestedQty, rate, amount: x.requestedQty * rate, available: true } : x
    );
  }

  const available = lines.filter((l) => l.available);
  const subtotal = available.reduce((s, l) => s + l.amount, 0);
  const marketValue = available.reduce((s, l) => s + l.offeredQty * l.item.marketRate, 0);
  const qtyCoverage = lines.reduce((s, l) => s + l.offeredQty / l.requestedQty, 0) / lines.length;
  const gst = Math.round(subtotal * 0.18);

  return {
    vendor,
    receivedAt: requirement.createdAt + vendor.replyAfterSec * 1000,
    lines,
    itemsCovered: available.length,
    itemsRequested: lines.length,
    isComplete: lines.every((l) => l.available && l.offeredQty === l.requestedQty),
    qtyCoverage, // 0..1, average share of each requested quantity
    subtotal,
    gst,
    total: subtotal + gst,
    vsMarketPct: marketValue ? Math.round(((subtotal - marketValue) / marketValue) * 100) : 0,
    deliveryDays: vendor.deliveryDays,
    validForHours: 24,
  };
}

/**
 * Quotes received so far. Bidding stays open until the customer accepts one,
 * so more vendors keep replying over time; after acceptance the list is frozen.
 */
export function getQuotesForRequirement(requirement, now = Date.now()) {
  if (!requirement) return [];
  const cutoff = requirement.status === 'accepted' ? requirement.acceptedAt
    : requirement.status === 'cancelled' ? requirement.cancelledAt
    : now;
  return WHOLESALE_VENDORS
    .filter((v) => requirement.createdAt + v.replyAfterSec * 1000 <= cutoff)
    .map((v) => buildQuote(requirement, v));
}

/** Seconds until the next vendor replies (null when everyone has replied). */
export function nextReplyInSec(requirement, now = Date.now()) {
  const pending = WHOLESALE_VENDORS
    .map((v) => requirement.createdAt + v.replyAfterSec * 1000 - now)
    .filter((ms) => ms > 0);
  return pending.length ? Math.ceil(Math.min(...pending) / 1000) : null;
}

/** Tags that help compare quotes at a glance. */
export function quoteHighlights(quotes) {
  if (quotes.length < 2) return {};
  const tags = {};
  const add = (vendorId, tag) => (tags[vendorId] = [...(tags[vendorId] || []), tag]);
  const best = (fn) => quotes.reduce((a, b) => (fn(b) < fn(a) ? b : a));
  add(best((q) => q.vsMarketPct).vendor.id, 'Best rates');
  add(best((q) => -q.qtyCoverage).vendor.id, 'Most items');
  add(best((q) => q.deliveryDays).vendor.id, 'Fastest delivery');
  return tags;
}
