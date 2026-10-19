'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppRouter } from '@/shared/lib/useAppRouter';
import { sendToNative } from '@/shared/lib/nativeBridge';
import { WHOLESALE_CATALOG, WHOLESALE_CATEGORIES, getCatalogItem } from '../models/wholesaleCatalog';
import { useDraft, setDraftQty, clearDraft, postRequirement } from '../lib/requirementStore';

/**
 * VIEWMODEL: Build a bulk requirement from the wholesale catalog.
 * Quantities move in the item's `step` and never go below its MOQ.
 */
export function useNewRequirementViewModel() {
  const router = useAppRouter();
  const draft = useDraft();
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  // Opened from the header search bar (?search=1): the screen focuses the catalog search
  const focusSearch = useSearchParams()?.get('search') === '1';

  useEffect(() => {
    sendToNative('PAGE_VIEWED', { page: 'wholesale-new' });
    sendToNative('WEB_READY', { status: 'ready', page: 'wholesale-new' });
    if (typeof window !== 'undefined') window.nextRouter = router;
  }, [router]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return WHOLESALE_CATALOG.filter(
      (i) =>
        (category === 'all' || i.category === category) &&
        (!q || `${i.name} ${i.spec}`.toLowerCase().includes(q))
    );
  }, [category, query]);

  const draftLines = useMemo(
    () =>
      Object.entries(draft)
        .map(([id, qty]) => ({ item: getCatalogItem(id), qty }))
        .filter((l) => l.item),
    [draft]
  );

  const estimate = draftLines.reduce((s, l) => s + l.qty * l.item.marketRate, 0);

  const increment = useCallback((item) => {
    sendToNative('TRIGGER_HAPTIC', { style: 'light' });
    const cur = draft[item.id] || 0;
    setDraftQty(item.id, cur === 0 ? item.moq : cur + item.step);
  }, [draft]);

  const decrement = useCallback((item) => {
    sendToNative('TRIGGER_HAPTIC', { style: 'light' });
    const cur = draft[item.id] || 0;
    const next = cur - item.step;
    setDraftQty(item.id, next < item.moq ? 0 : next);
  }, [draft]);

  const setQty = useCallback((item, value) => {
    const n = parseInt(value, 10);
    setDraftQty(item.id, Number.isFinite(n) && n > 0 ? n : 0);
  }, []);

  // Typed quantities below MOQ are lifted to MOQ when the field loses focus
  const commitQty = useCallback((item) => {
    const cur = draft[item.id] || 0;
    if (cur > 0 && cur < item.moq) setDraftQty(item.id, item.moq);
  }, [draft]);

  const post = useCallback(() => {
    if (draftLines.length === 0) return;
    // Enforce MOQ before posting
    const clean = Object.fromEntries(draftLines.map(({ item, qty }) => [item.id, Math.max(qty, item.moq)]));
    const requirement = postRequirement(clean);
    clearDraft();
    setReviewOpen(false);
    sendToNative('TRIGGER_HAPTIC', { style: 'medium' });
    router.replace(`/wholesale/requirement?id=${requirement.id}&native=1`);
  }, [draftLines, router]);

  const goBack = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.push('/wholesale?native=1');
  }, [router]);

  return {
    categories: WHOLESALE_CATEGORIES,
    category,
    setCategory,
    query,
    setQuery,
    focusSearch,
    items,
    draft,
    draftLines,
    estimate,
    increment,
    decrement,
    setQty,
    commitQty,
    reviewOpen,
    openReview: () => setReviewOpen(true),
    closeReview: () => setReviewOpen(false),
    post,
    goBack,
  };
}
