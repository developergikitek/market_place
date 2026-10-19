'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppRouter } from '@/shared/lib/useAppRouter';
import { sendToNative } from '@/shared/lib/nativeBridge';
import { useRequirements, acceptQuote, cancelRequirement } from '../lib/requirementStore';
import { getQuotesForRequirement, nextReplyInSec, quoteHighlights } from '../lib/quoteEngine';
import { getCatalogItem } from '../models/wholesaleCatalog';
import { useNow } from '../lib/useNow';
import { ensureOrderForRequirement, deliveryDateLabel } from '../lib/wholesaleOrders';

export const QUOTE_SORTS = [
  { id: 'match', label: 'Best match' },
  { id: 'price', label: 'Lowest rates' },
  { id: 'total', label: 'Lowest total' },
  { id: 'delivery', label: 'Fastest' },
];

/**
 * VIEWMODEL: One requirement — live quotes, comparison, accept one vendor.
 * Bidding stays open until the customer accepts a quote (or cancels).
 */
export function useRequirementViewModel() {
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const id = searchParams?.get('id');
  const requirements = useRequirements();
  const requirement = requirements.find((r) => r.id === id) || null;
  const isOpen = requirement?.status === 'open';
  const now = useNow(isOpen);

  const [sort, setSort] = useState('match');
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    sendToNative('PAGE_VIEWED', { page: 'wholesale-requirement' });
    sendToNative('WEB_READY', { status: 'ready', page: 'wholesale-requirement' });
    if (typeof window !== 'undefined') window.nextRouter = router;
  }, [router]);

  const quotes = useMemo(() => getQuotesForRequirement(requirement, now), [requirement, now]);

  // Haptic tick when a new vendor quote lands
  const quoteCount = quotes.length;
  useEffect(() => {
    if (isOpen && quoteCount > 0) sendToNative('TRIGGER_HAPTIC', { style: 'light' });
  }, [quoteCount, isOpen]);

  const sortedQuotes = useMemo(() => {
    const list = [...quotes];
    const by = {
      match: (a, b) => b.qtyCoverage - a.qtyCoverage || a.vsMarketPct - b.vsMarketPct,
      price: (a, b) => a.vsMarketPct - b.vsMarketPct,
      total: (a, b) => a.total - b.total,
      delivery: (a, b) => a.deliveryDays - b.deliveryDays || a.vsMarketPct - b.vsMarketPct,
    }[sort];
    return list.sort(by);
  }, [quotes, sort]);

  const highlights = useMemo(() => quoteHighlights(quotes), [quotes]);

  const requestedLines = useMemo(
    () => (requirement?.items || []).map((l) => ({ ...l, item: getCatalogItem(l.itemId) })).filter((l) => l.item),
    [requirement]
  );

  const selectedQuote = quotes.find((q) => q.vendor.id === selectedVendorId) || null;
  const acceptedQuote = requirement?.status === 'accepted'
    ? quotes.find((q) => q.vendor.id === requirement.acceptedVendorId) || null
    : null;

  const confirmAccept = useCallback(() => {
    if (!requirement || !selectedQuote) return;
    const accepted = acceptQuote(requirement.id, selectedQuote.vendor.id);
    // The accepted quote becomes an order in My Orders right away
    ensureOrderForRequirement(accepted);
    sendToNative('TRIGGER_HAPTIC', { style: 'heavy' });
    setConfirming(false);
    setSelectedVendorId(null);
    window.scrollTo(0, 0);
  }, [requirement, selectedQuote]);

  const trackOrder = useCallback(() => {
    const orderId = ensureOrderForRequirement(requirement);
    if (orderId) router.push(`/orders/detail?id=${orderId}&native=1`);
  }, [requirement, router]);

  const goBack = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.push('/wholesale?native=1');
  }, [router]);

  return {
    requirement,
    requestedLines,
    quotes: sortedQuotes,
    highlights,
    sort,
    setSort,
    nextReplySec: isOpen && requirement ? nextReplyInSec(requirement, now) : null,
    selectedQuote,
    openQuote: setSelectedVendorId,
    closeQuote: () => {
      setSelectedVendorId(null);
      setConfirming(false);
    },
    confirming,
    startAccept: () => setConfirming(true),
    cancelAccept: () => setConfirming(false),
    confirmAccept,
    acceptedQuote,
    deliveryLabel: acceptedQuote ? deliveryDateLabel(requirement.acceptedAt, acceptedQuote.deliveryDays) : null,
    trackOrder,
    cancel: () => requirement && cancelRequirement(requirement.id),
    goBack,
    goHome: () => router.push('/wholesale?native=1'),
  };
}
