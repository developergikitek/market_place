'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useAppRouter } from '@/shared/lib/useAppRouter';
import { sendToNative } from '@/shared/lib/nativeBridge';
import { useRequirements, useDraft } from '../lib/requirementStore';
import { getQuotesForRequirement } from '../lib/quoteEngine';
import { useNow } from '../lib/useNow';
import { ensureOrderForRequirement, getAcceptedQuote, deliveryDateLabel } from '../lib/wholesaleOrders';

function timeAgo(ts, now) {
  if (!now) return '';
  const min = Math.round((now - ts) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
}

/** VIEWMODEL: Wholesale home — entry banner + the customer's posted requirements. */
export function useWholesaleHomeViewModel() {
  const router = useAppRouter();
  const requirements = useRequirements();
  const draft = useDraft();
  const hasOpen = requirements.some((r) => r.status === 'open');
  const now = useNow(hasOpen);

  // Clears the native transition skeleton and selects the Wholesale tile in the header
  useEffect(() => {
    sendToNative('PAGE_VIEWED', { page: 'wholesale' });
    sendToNative('WEB_READY', { status: 'ready', page: 'wholesale' });
    if (typeof window !== 'undefined') window.nextRouter = router;
  }, [router]);

  const requirementCards = useMemo(
    () =>
      requirements.map((r) => {
        const quotes = getQuotesForRequirement(r, now);
        const best = quotes.length ? Math.min(...quotes.map((q) => q.vsMarketPct)) : null;
        const accepted = getAcceptedQuote(r);
        return {
          requirement: r,
          quoteCount: quotes.length,
          bestVsMarketPct: best,
          postedAgo: timeAgo(r.createdAt, now),
          order: accepted && {
            vendorName: accepted.vendor.name,
            vendorCode: accepted.vendor.code,
            total: accepted.total,
            itemsCovered: accepted.itemsCovered,
            itemsRequested: accepted.itemsRequested,
            deliveryLabel: deliveryDateLabel(r.acceptedAt, accepted.deliveryDays),
          },
        };
      }),
    [requirements, now]
  );

  const draftCount = Object.keys(draft).length;

  return {
    requirementCards,
    draftCount,
    createRequirement: useCallback(() => router.push('/wholesale/new?native=1'), [router]),
    trackOrder: useCallback((requirement) => {
      const orderId = ensureOrderForRequirement(requirement);
      if (orderId) router.push(`/orders/detail?id=${orderId}&native=1`);
    }, [router]),
    openRequirement: useCallback((id) => router.push(`/wholesale/requirement?id=${id}&native=1`), [router]),
  };
}
