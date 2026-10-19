'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppRouter } from '@/shared/lib/useAppRouter';
import { getStoreById } from '@/retail/models/marketplaceModel';
import { sendToNative, subscribeToNativeEvents } from '@/shared/lib/nativeBridge';
import { saveStoredCart, useStoredCart, computeCartTotals } from '@/retail/lib/cartManager';
import { useIsNativeShell, markNativeShell } from '@/shared/lib/useIsNativeShell';

/**
 * VIEWMODEL: Dedicated Store Screen (Swiggy / Blinkit Restaurant Architecture)
 * Encapsulates store metadata, real-time in-store search, category filtering,
 * sort pills, cart management with haptics, and bridge event coordination.
 */
export function useStoreViewModel() {
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const storeIdParam = searchParams?.get('id') || 'store_2';

  const store = useMemo(() => getStoreById(storeIdParam), [storeIdParam]);
  // ?q= comes from the global search sheet (tapping an item result)
  const [searchQuery, setSearchQuery] = useState(() => searchParams?.get('q') || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [activeSortPill, setActiveSortPill] = useState('RECOMMENDED');
  const [isFavorite, setIsFavorite] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);
  const [conflictModal, setConflictModal] = useState(null);

  // Cart state synced reactively
  const cart = useStoredCart();

  const isNativeShell = useIsNativeShell();

  // Sync cart totals with Native Shell for badge updates
  useEffect(() => {
    const totals = computeCartTotals(cart);
    sendToNative('CART_UPDATED', { count: totals.count, amount: totals.amount, storeName: cart?.storeName });
  }, [cart]);


  // Bridge integration
  useEffect(() => {
    sendToNative('PAGE_VIEWED', { page: 'store', storeId: store.id });
    sendToNative('WEB_READY', { status: 'ready', page: 'store' });

    if (typeof window !== 'undefined') {
      window.nextRouter = router;
    }

    const unsubscribe = subscribeToNativeEvents((event) => {
      markNativeShell();
      // Tab routing (NAVIGATE_TAB) is driven by the native shell via window.nextRouter
      if (event.type === 'SEARCH_QUERY') {
        const { query = '' } = event.payload || {};
        setSearchQuery(query);
      }
    });

    return () => unsubscribe();
  }, [router, store.id]);

  // Helper to check item quantity in cart for this store
  const getItemQty = useCallback(
    (productId) => {
      if (!cart || cart.storeId !== store.id || !cart.items) return 0;
      return cart.items[productId]?.qty || 0;
    },
    [cart, store.id]
  );

  // Add item to cart
  const addToCart = useCallback(
    (product) => {
      sendToNative('TRIGGER_HAPTIC', { style: 'light' });

      // Scenario 1: Cart is empty or belongs to current store
      if (!cart || cart.storeId === store.id || Object.keys(cart.items || {}).length === 0) {
        const currentItems = cart && cart.storeId === store.id ? { ...cart.items } : {};
        const existingQty = currentItems[product.id]?.qty || 0;

        currentItems[product.id] = {
          product,
          qty: existingQty + 1,
        };

        const updatedCart = {
          storeId: store.id,
          storeName: store.name,
          storeCode: store.code,
          items: currentItems,
        };

        saveStoredCart(updatedCart);
      } else {
        // Scenario 2: Different store -> trigger conflict modal
        setConflictModal({
          currentStoreName: cart.storeName,
          newStore: store,
          productToAdd: product,
        });
      }
    },
    [cart, store]
  );

  // Decrement item from cart
  const decrementCart = useCallback(
    (productId) => {
      if (!cart || cart.storeId !== store.id || !cart.items) return;
      sendToNative('TRIGGER_HAPTIC', { style: 'light' });

      const currentItems = { ...cart.items };
      if (!currentItems[productId]) return;

      if (currentItems[productId].qty > 1) {
        currentItems[productId].qty -= 1;
      } else {
        delete currentItems[productId];
      }

      const updatedCart =
        Object.keys(currentItems).length === 0
          ? null
          : {
              ...cart,
              items: currentItems,
            };

      saveStoredCart(updatedCart);
    },
    [cart, store.id]
  );

  const confirmReplaceCart = useCallback(() => {
    if (!conflictModal) return;
    const { newStore, productToAdd } = conflictModal;
    const freshCart = {
      storeId: newStore.id,
      storeName: newStore.name,
      storeCode: newStore.code,
      items: {
        [productToAdd.id]: {
          product: productToAdd,
          qty: 1,
        },
      },
    };
    saveStoredCart(freshCart);
    setConflictModal(null);
  }, [conflictModal]);

  const dismissConflictModal = useCallback(() => {
    setConflictModal(null);
  }, []);

  const toggleFavorite = useCallback(() => {
    sendToNative('TRIGGER_HAPTIC', { style: 'light' });
    setIsFavorite((prev) => !prev);
  }, []);

  const applyCoupon = useCallback(() => {
    sendToNative('TRIGGER_HAPTIC', { style: 'medium' });
    setCouponApplied(true);
  }, []);

  const openCart = useCallback(() => {
    sendToNative('TRIGGER_HAPTIC', { style: 'light' });
    router.push('/cart?native=1');
  }, [router]);

  const handleGoBack = useCallback(() => {
    sendToNative('TAB_CHANGED', { tab: 'home' });
    router.push('/?native=1');
  }, [router]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = store.products || [];

    // Filter by category
    if (selectedCategoryId && selectedCategoryId !== 'all') {
      list = list.filter((p) => p.category === selectedCategoryId);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.pack && p.pack.toLowerCase().includes(q)) ||
          (p.categoryName && p.categoryName.toLowerCase().includes(q))
      );
    }

    // Sort by activeSortPill
    const sorted = [...list];
    if (activeSortPill === 'PRICE_LOW') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (activeSortPill === 'PRICE_HIGH') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (activeSortPill === 'NEW') {
      sorted.reverse();
    }

    return sorted;
  }, [store.products, selectedCategoryId, searchQuery, activeSortPill]);

  const cartTotals = useMemo(() => computeCartTotals(cart), [cart]);

  return {
    store,
    searchQuery,
    setSearchQuery,
    selectedCategoryId,
    setSelectedCategoryId,
    activeSortPill,
    setActiveSortPill,
    filteredProducts,
    bestSellers: store.bestSellers || [],
    storeCategories: store.storeCategories || [],
    cart,
    cartTotals,
    getItemQty,
    addToCart,
    decrementCart,
    confirmReplaceCart,
    dismissConflictModal,
    conflictModal,
    isFavorite,
    toggleFavorite,
    couponApplied,
    applyCoupon,
    isNativeShell,
    handleGoBack,
    openCart,
  };
}
