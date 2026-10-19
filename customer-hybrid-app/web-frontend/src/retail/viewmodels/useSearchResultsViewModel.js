'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppRouter } from '@/shared/lib/useAppRouter';
import { searchCatalog, tokenize } from '@/retail/lib/searchIndex';
import { sendToNative } from '@/shared/lib/nativeBridge';
import {
  useStoredCart,
  addProductToCart,
  decrementProductInCart,
  replaceCartWithProduct,
} from '@/retail/lib/cartManager';

export const SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'rating', label: 'Rating: High to Low' },
  { id: 'price_low', label: 'Price: Low to High' },
  { id: 'price_high', label: 'Price: High to Low' },
];

const TOP_RATED_MIN = 4.7;
const MAX_KEYWORDS = 8;

const discountPercent = (product) => parseInt(product.discount, 10) || 0;

// Refinement chips: brands (first word of item names) and categories seen in the results
function keywordsFor(items, queryTokens) {
  const words = new Map();
  items.forEach(({ product }) => {
    [product.name.split(' ')[0], product.categoryName].forEach((w) => {
      if (!w || w.length < 3) return;
      const key = w.toLowerCase();
      if (queryTokens.some((t) => key.includes(t))) return;
      if (!words.has(key)) words.set(key, w);
    });
  });
  return [...words.values()].slice(0, MAX_KEYWORDS);
}

/**
 * VIEWMODEL: Search results screen (/search?q=), Swiggy layout:
 * Stores | Items tabs, sort + quick filters, keyword chips, items grouped by store.
 */
export function useSearchResultsViewModel() {
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const query = (searchParams?.get('q') || '').trim();

  const found = useMemo(() => searchCatalog(query), [query]);
  const [tab, setTab] = useState(() => (found && found.items.length === 0 ? 'stores' : 'items'));
  const [sortBy, setSortBy] = useState('relevance');
  const [sameDayOnly, setSameDayOnly] = useState(false);
  const [topRatedOnly, setTopRatedOnly] = useState(false);
  const [offersOnly, setOffersOnly] = useState(false);
  const [keyword, setKeyword] = useState(null);
  const [conflictModal, setConflictModal] = useState(null);
  const cart = useStoredCart();

  useEffect(() => {
    sendToNative('PAGE_VIEWED', { page: 'search', query });
    sendToNative('WEB_READY', { status: 'ready', page: 'search' });
    if (typeof window !== 'undefined') window.nextRouter = router;
  }, [router, query]);

  const keywords = useMemo(
    () => (found ? keywordsFor(found.items, found.tokens) : []),
    [found]
  );

  const storePasses = useCallback(
    (store) =>
      (!sameDayOnly || store.isSameDay) &&
      (!topRatedOnly || parseFloat(store.rating) >= TOP_RATED_MIN),
    [sameDayOnly, topRatedOnly]
  );

  // Items tab: matching items grouped under their store
  const itemGroups = useMemo(() => {
    if (!found) return [];
    const keywordTokens = keyword ? tokenize(keyword) : [];
    const filtered = found.items.filter(({ product, store }) => {
      if (!storePasses(store)) return false;
      if (offersOnly && discountPercent(product) < 25) return false;
      if (keywordTokens.length) {
        const text = `${product.name} ${product.categoryName || ''}`.toLowerCase();
        if (!keywordTokens.every((t) => text.includes(t))) return false;
      }
      return true;
    });

    const groups = new Map();
    filtered.forEach(({ product, store }) => {
      if (!groups.has(store.id)) groups.set(store.id, { store, products: [] });
      groups.get(store.id).products.push(product);
    });

    const list = [...groups.values()];
    list.forEach((g) => {
      if (sortBy === 'price_low') g.products.sort((a, b) => a.price - b.price);
      if (sortBy === 'price_high') g.products.sort((a, b) => b.price - a.price);
    });
    if (sortBy === 'rating') list.sort((a, b) => parseFloat(b.store.rating) - parseFloat(a.store.rating));
    if (sortBy === 'price_low') list.sort((a, b) => a.products[0].price - b.products[0].price);
    if (sortBy === 'price_high') list.sort((a, b) => b.products[0].price - a.products[0].price);
    return list;
  }, [found, keyword, storePasses, offersOnly, sortBy]);

  // Stores tab
  const stores = useMemo(() => {
    if (!found) return [];
    const list = found.stores.filter((s) => storePasses(s) && (!offersOnly || /OFF|FREE/i.test(s.offerText || '')));
    if (sortBy === 'rating') return [...list].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    return list;
  }, [found, storePasses, offersOnly, sortBy]);

  const qtyFor = useCallback(
    (storeId, productId) =>
      cart && cart.storeId === storeId ? cart.items?.[productId]?.qty || 0 : 0,
    [cart]
  );

  const addItem = useCallback((store, product) => {
    sendToNative('TRIGGER_HAPTIC', { style: 'light' });
    const result = addProductToCart(store, product);
    if (result.conflict) setConflictModal(result.conflict);
  }, []);

  const removeItem = useCallback((store, product) => {
    sendToNative('TRIGGER_HAPTIC', { style: 'light' });
    decrementProductInCart(store.id, product.id);
  }, []);

  const confirmReplaceCart = useCallback(() => {
    if (!conflictModal) return;
    replaceCartWithProduct(conflictModal.newStore, conflictModal.productToAdd);
    setConflictModal(null);
    sendToNative('TRIGGER_HAPTIC', { style: 'medium' });
  }, [conflictModal]);

  // Re-open the search sheet with this query. Inside the app the shell opens it, so it can
  // give the WebView focus first (Android won't show the keyboard otherwise).
  const editSearch = useCallback((value = query) => {
    if (!sendToNative('OPEN_SEARCH_REQUEST', { query: value })) {
      window.dispatchEvent(new CustomEvent('superapp:open-search', { detail: { query: value } }));
    }
  }, [query]);

  const goBack = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.push('/?native=1');
  }, [router]);

  return {
    query,
    hasAnyResults: Boolean(found && (found.items.length || found.stores.length)),
    tab,
    setTab,
    sortBy,
    setSortBy,
    sameDayOnly,
    toggleSameDay: () => setSameDayOnly((v) => !v),
    topRatedOnly,
    toggleTopRated: () => setTopRatedOnly((v) => !v),
    offersOnly,
    toggleOffers: () => setOffersOnly((v) => !v),
    keywords,
    keyword,
    toggleKeyword: (k) => setKeyword((cur) => (cur === k ? null : k)),
    itemGroups,
    stores,
    qtyFor,
    addItem,
    removeItem,
    conflictModal,
    confirmReplaceCart,
    dismissConflictModal: () => setConflictModal(null),
    editSearch,
    clearSearch: () => editSearch(''),
    goBack,
    openStore: (store) => router.push(`/store?id=${store.id}&native=1`),
  };
}
