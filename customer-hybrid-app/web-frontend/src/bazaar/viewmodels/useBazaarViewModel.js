'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppRouter } from '@/shared/lib/useAppRouter';
import { sendToNative, subscribeToNativeEvents } from '@/shared/lib/nativeBridge';
import { saveStoredCart, useStoredCart, computeCartTotals } from '@/retail/lib/cartManager';
import { useIsNativeShell, markNativeShell } from '@/shared/lib/useIsNativeShell';
import {
  BAZAAR_STORE,
  BAZAAR_CATEGORIES,
  BAZAAR_PRODUCTS,
  getBazaarBestSellers,
  groupBazaarByCategory,
} from '@/bazaar/models/bazaarModel';

/**
 * VIEWMODEL: Bazaar browse screen.
 * Item-first catalogue with category filtering, search and the shared store-locked cart.
 * Everything in Bazaar belongs to one storefront (BAZAAR_STORE), so the only cart conflict
 * possible is against a Quick store — handled by the same CartConflictModal as retail.
 */
export function useBazaarViewModel() {
  const router = useAppRouter();
  const isNativeShell = useIsNativeShell();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [conflictModal, setConflictModal] = useState(null);

  const cart = useStoredCart();

  // Keep the native cart badge in step
  useEffect(() => {
    const totals = computeCartTotals(cart);
    sendToNative('CART_UPDATED', { count: totals.count, amount: totals.amount, storeName: cart?.storeName });
  }, [cart]);

  useEffect(() => {
    sendToNative('PAGE_VIEWED', { page: 'bazaar' });
    sendToNative('WEB_READY', { status: 'ready', page: 'bazaar' });

    if (typeof window !== 'undefined') window.nextRouter = router;

    const unsubscribe = subscribeToNativeEvents((event) => {
      markNativeShell();
      if (event.type === 'SEARCH_QUERY') {
        setSearchQuery(event.payload?.query || '');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const getItemQty = useCallback(
    (productId) => {
      if (!cart || cart.storeId !== BAZAAR_STORE.id || !cart.items) return 0;
      return cart.items[productId]?.qty || 0;
    },
    [cart]
  );

  const addToCart = useCallback(
    (product) => {
      sendToNative('TRIGGER_HAPTIC', { style: 'light' });

      const isOtherStore =
        cart && cart.storeId !== BAZAAR_STORE.id && Object.keys(cart.items || {}).length > 0;

      if (isOtherStore) {
        setConflictModal({
          currentStoreName: cart.storeName,
          newStore: BAZAAR_STORE,
          productToAdd: product,
        });
        return;
      }

      const items = cart && cart.storeId === BAZAAR_STORE.id ? { ...cart.items } : {};
      items[product.id] = { product, qty: (items[product.id]?.qty || 0) + 1 };
      saveStoredCart({
        storeId: BAZAAR_STORE.id,
        storeName: BAZAAR_STORE.name,
        storeCode: BAZAAR_STORE.code,
        items,
      });
    },
    [cart]
  );

  const decrementCart = useCallback(
    (productId) => {
      if (!cart || cart.storeId !== BAZAAR_STORE.id || !cart.items?.[productId]) return;
      sendToNative('TRIGGER_HAPTIC', { style: 'light' });

      const items = { ...cart.items };
      if (items[productId].qty > 1) items[productId] = { ...items[productId], qty: items[productId].qty - 1 };
      else delete items[productId];

      // saveStoredCart clears storage once the last item goes
      saveStoredCart({ ...cart, items });
    },
    [cart]
  );

  const confirmReplaceCart = useCallback(() => {
    if (!conflictModal) return;
    const { productToAdd } = conflictModal;
    saveStoredCart({
      storeId: BAZAAR_STORE.id,
      storeName: BAZAAR_STORE.name,
      storeCode: BAZAAR_STORE.code,
      items: { [productToAdd.id]: { product: productToAdd, qty: 1 } },
    });
    setConflictModal(null);
  }, [conflictModal]);

  const dismissConflictModal = useCallback(() => setConflictModal(null), []);

  const openCart = useCallback(() => {
    sendToNative('TRIGGER_HAPTIC', { style: 'light' });
    router.push('/cart?native=1');
  }, [router]);

  // Search wins over the category rail: a query searches the whole catalogue
  const visibleProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      return BAZAAR_PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q) ||
          (p.pack && p.pack.toLowerCase().includes(q)) ||
          (p.dealer && p.dealer.toLowerCase().includes(q))
      );
    }
    if (selectedCategoryId === 'all') return BAZAAR_PRODUCTS;
    return BAZAAR_PRODUCTS.filter((p) => p.category === selectedCategoryId);
  }, [searchQuery, selectedCategoryId]);

  // Shelves only while browsing everything; a filter or query reads better as one flat grid
  const shelves = useMemo(
    () => (!searchQuery.trim() && selectedCategoryId === 'all' ? groupBazaarByCategory(visibleProducts) : null),
    [visibleProducts, searchQuery, selectedCategoryId]
  );

  const cartTotals = useMemo(() => computeCartTotals(cart), [cart]);

  return {
    categories: BAZAAR_CATEGORIES,
    bestSellers: getBazaarBestSellers(),
    visibleProducts,
    shelves,
    searchQuery,
    setSearchQuery,
    selectedCategoryId,
    setSelectedCategoryId,
    cart,
    cartTotals,
    getItemQty,
    addToCart,
    decrementCart,
    conflictModal,
    confirmReplaceCart,
    dismissConflictModal,
    openCart,
    isNativeShell,
  };
}
