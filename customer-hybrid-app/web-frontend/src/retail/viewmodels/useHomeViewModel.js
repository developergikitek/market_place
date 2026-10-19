'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppRouter } from '@/shared/lib/useAppRouter';
import { sendToNative, subscribeToNativeEvents } from '@/shared/lib/nativeBridge';
import { saveStoredCart, useStoredCart } from '@/retail/lib/cartManager';
import {
  VERIFIED_STORES,
  TRENDING_PRODUCTS,
  PRO_PICKS,
  DEFAULT_SDUI_CONFIG,
  calculateCartTotals,
  FULL_CATEGORIES_CATALOG,
} from '@/retail/models/marketplaceModel';
import {
  fetchRemoteConfig,
  toggleSectionConfig,
  toggleFeatureConfig,
  applyRemotePreset,
} from '@/shared/models/configService';
import { useCachedResource } from '@/shared/lib/dataCache';
import { useIsNativeShell, markNativeShell } from '@/shared/lib/useIsNativeShell';

const isUsableConfig = (data) => Boolean(data && data.version);

/**
 * VIEWMODEL: Hardware Marketplace Home Screen
 * Encapsulates all state, business logic, cart rules, and native bridge events.
 */
export function useHomeViewModel() {
  const router = useAppRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.nextRouter = router;
    }
  }, [router]);

  const [currentView, setCurrentView] = useState('home'); // 'home' | 'categories'
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [activeService, setActiveService] = useState('retail');
  const [searchQuery, setSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('power_tools');
  const [activeFilterPill, setActiveFilterPill] = useState('ALL');
  const [fastOnly, setFastOnly] = useState(false);
  const [activeSubFilter, setActiveSubFilter] = useState('TOP_RATED');
  const [favorites, setFavorites] = useState({});

  // Remote SDUI Configuration: last known config renders instantly, a fresh copy loads in the background
  const [config, setConfig] = useCachedResource(
    'remote-config',
    fetchRemoteConfig,
    DEFAULT_SDUI_CONFIG,
    isUsableConfig
  );
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);

  // Store-Locked Cart State (persisted in cartManager, shared with Store & Cart screens)
  const cart = useStoredCart();

  // Store Conflict Modal State
  const [conflictModal, setConflictModal] = useState(null);

  const isNativeShell = useIsNativeShell();

  // "View All" opens the real /categories route. The old in-page categories view kept the URL
  // at "/", so the next section switch could land back on it.
  const navigateToCategories = useCallback(() => {
    router.push(isNativeShell ? '/categories?native=1' : '/categories');
  }, [router, isNativeShell]);

  const navigateToHome = useCallback(() => {
    setCurrentView('home');
    if (!window._nativeSwitching) {
      sendToNative('TAB_CHANGED', { tab: 'home' });
    }
  }, []);

  // Tell native which in-page view is rendered; this is what clears its tab-switch skeleton
  useEffect(() => {
    sendToNative('PAGE_VIEWED', { page: currentView });
  }, [currentView]);

  // Fetch SDUI Remote Config & Subscribe to Native Shell Events
  useEffect(() => {
    sendToNative('WEB_READY', { status: 'ready', page: 'home' });

    const unsubscribe = subscribeToNativeEvents((event) => {
      markNativeShell();

      if (event.type === 'NAVIGATE_TAB') {
        const { tabId } = event.payload || {};
        if (tabId === 'categories') {
          // Navigation already handled by injectJavaScript in the native shell
          // (window.nextRouter.push with scroll:false). Calling router.push here
          // a second time — without scroll:false — is what caused the visible
          // home-page scroll before the categories screen appeared.
        } else if (tabId === 'home' || tabId === 'stores') {
          setCurrentView('home');
          setActiveFilterPill('ALL');
        } else if (tabId === 'bolt') {
          setCurrentView('home');
          setActiveFilterPill('SAME_DAY');
        } else if (tabId === 'store99') {
          setCurrentView('home');
          setActiveFilterPill('STORE99');
        } else if (tabId === 'orders') {
        } else if (tabId === 'account') {
        }
      } else if (event.type === 'SEARCH_QUERY') {
        const { query = '' } = event.payload || {};
        setSearchQuery(query);
        setCategorySearchQuery(query);
      } else if (event.type === 'SELECT_SERVICE') {
        const { service } = event.payload || {};
        if (service) {
          setActiveService(service);
        }
      } else if (event.type === 'TOGGLE_FAST') {
        setFastOnly((prev) => {
          const next = !prev;
          return next;
        });
      } else if (event.type === 'FILTER_PILL') {
        const { pillId, label } = event.payload || {};
        if (pillId) setActiveFilterPill(pillId);
      } else if (event.type === 'OPEN_CONFIG_DRAWER') {
        setShowConfigDrawer(true);
      } else if (event.type === 'TRIGGER_VOICE_SEARCH') {
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Service Selector Action
  // Retail / Wholesale switcher (browser). Wholesale is a separate section at /wholesale.
  const selectService = useCallback((serviceId) => {
    if (serviceId === 'wholesale') {
      router.push('/wholesale?native=1');
    } else {
      setActiveService(serviceId);
    }
  }, [router]);

  // Search Action
  const updateSearchQuery = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // Filter Pill Action
  const selectFilterPill = useCallback((pillId, label) => {
    setActiveFilterPill(pillId);
    if (pillId === 'ALL') {
    } else {
    }
  }, []);

  // Fast Express / Same-Day Toggle Action
  const toggleFastOnly = useCallback(() => {
    setFastOnly((prev) => {
      const next = !prev;
      sendToNative('TRIGGER_HAPTIC', { style: 'light' });
      return next;
    });
  }, []);

  // Cart Actions
  const addToCart = useCallback((store, product) => {
    sendToNative('TRIGGER_HAPTIC', { style: 'light' });

    // Scenario 1: Cart is empty or belongs to SAME store
    if (!cart || cart.storeId === store.id || Object.keys(cart.items || {}).length === 0) {
      const currentItems = cart && cart.storeId === store.id ? { ...cart.items } : {};
      const existingQty = currentItems[product.id]?.qty || 0;

      currentItems[product.id] = {
        product,
        qty: existingQty + 1,
      };

      saveStoredCart({
        storeId: store.id,
        storeName: store.name,
        storeCode: store.code,
        items: currentItems,
      });
    } 
    // Scenario 2: Cart belongs to DIFFERENT store -> Conflict Modal
    else {
      setConflictModal({
        currentStoreName: cart.storeName,
        newStore: store,
        productToAdd: product,
      });
    }
  }, [cart]);

  const decrementCart = useCallback((storeId, productId) => {
    if (!cart || cart.storeId !== storeId) return;
    sendToNative('TRIGGER_HAPTIC', { style: 'light' });

    const currentItems = { ...cart.items };
    if (!currentItems[productId]) return;

    if (currentItems[productId].qty > 1) {
      currentItems[productId] = { ...currentItems[productId], qty: currentItems[productId].qty - 1 };
    } else {
      delete currentItems[productId];
    }

    // saveStoredCart clears storage when no items are left
    saveStoredCart({ ...cart, items: currentItems });
  }, [cart]);

  const confirmReplaceCart = useCallback(() => {
    if (!conflictModal) return;
    const { newStore, productToAdd } = conflictModal;
    saveStoredCart({
      storeId: newStore.id,
      storeName: newStore.name,
      storeCode: newStore.code,
      items: {
        [productToAdd.id]: { product: productToAdd, qty: 1 }
      }
    });
    setConflictModal(null);
    sendToNative('TRIGGER_HAPTIC', { style: 'medium' });
  }, [conflictModal]);

  const clearCart = useCallback(() => {
    saveStoredCart(null);
    sendToNative('TRIGGER_HAPTIC', { style: 'light' });
  }, []);

  const dismissConflictModal = useCallback(() => {
    setConflictModal(null);
  }, []);

  const toggleFavorite = useCallback((storeId) => {
    setFavorites((prev) => {
      const next = !prev[storeId];
      return { ...prev, [storeId]: next };
    });
  }, []);

  // SDUI Remote Console Actions
  const toggleSection = useCallback(async (sectionKey) => {
    const res = await toggleSectionConfig(sectionKey);
    if (res?.success && res.updatedConfig) {
      setConfig(res.updatedConfig);
    } else {
      setConfig((prev) => ({
        ...prev,
        sections: { ...prev.sections, [sectionKey]: !prev.sections?.[sectionKey] }
      }));
    }
  }, [setConfig]);

  const toggleFeature = useCallback(async (featureKey) => {
    const res = await toggleFeatureConfig(featureKey);
    if (res?.success && res.updatedConfig) {
      setConfig(res.updatedConfig);
    } else {
      setConfig((prev) => ({
        ...prev,
        features: { ...prev.features, [featureKey]: !prev.features?.[featureKey] }
      }));
    }
  }, [setConfig]);

  const applyPreset = useCallback(async (presetKey, label) => {
    const res = await applyRemotePreset(presetKey);
    if (res?.success && res.updatedConfig) {
      setConfig(res.updatedConfig);
    } else {
    }
  }, [setConfig]);

  // Computed Cart Totals
  const { totalCount: totalCartCount, totalAmount: totalCartAmount } = useMemo(
    () => calculateCartTotals(cart),
    [cart]
  );

  // Keep the native Cart tab badge in sync
  useEffect(() => {
    sendToNative('CART_UPDATED', { count: totalCartCount, amount: totalCartAmount, storeName: cart?.storeName });
  }, [totalCartCount, totalCartAmount, cart?.storeName]);

  // Filtered Stores Logic
  const filteredStores = useMemo(() => {
    return VERIFIED_STORES.filter((store) => {
      if (fastOnly && !store.isSameDay) return false;
      if (activeFilterPill === 'SAME_DAY' && !store.isSameDay) return false;
      if (activeFilterPill === 'TOP_RATED' && parseFloat(store.rating) < 4.8) return false;
      if (activeFilterPill === 'OFFERS' && !store.offerText.includes('OFF')) return false;
      if (activeFilterPill === 'STORE99' && !store.hasBudgetPicks) return false;
      if (activeSubFilter === 'TOP_RATED' && activeFilterPill === 'ALL' && parseFloat(store.rating) < 4.7) return false;

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const storeMatches = store.name.toLowerCase().includes(q) || store.locality.toLowerCase().includes(q);
        const productMatches = store.products.some((p) => p.name.toLowerCase().includes(q));
        return storeMatches || productMatches;
      }
      return true;
    });
  }, [fastOnly, activeFilterPill, activeSubFilter, searchQuery]);

  // Categories State & Filtering
  const filteredCategories = useMemo(() => {
    if (!categorySearchQuery.trim()) return FULL_CATEGORIES_CATALOG;
    const q = categorySearchQuery.toLowerCase().trim();
    return FULL_CATEGORIES_CATALOG.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.storeCount.toLowerCase().includes(q) ||
        (cat.query && cat.query.toLowerCase().includes(q))
    );
  }, [categorySearchQuery]);

  const activeCategory = useMemo(() => {
    return (
      FULL_CATEGORIES_CATALOG.find((c) => c.id === selectedCategoryId) ||
      FULL_CATEGORIES_CATALOG[0]
    );
  }, [selectedCategoryId]);

  const popularStoresForCategory = useMemo(() => {
    if (!activeCategory) return VERIFIED_STORES;
    if (activeCategory.id === 'all_categories') return VERIFIED_STORES;
    const ids = activeCategory.popularStores || [];
    const matched = VERIFIED_STORES.filter((s) => ids.includes(s.id));
    return matched.length > 0 ? matched : VERIFIED_STORES.slice(0, 2);
  }, [activeCategory]);

  return {
    // Models / Datasets
    trendingProducts: TRENDING_PRODUCTS,
    proPicks: PRO_PICKS,
    filteredStores,
    filteredCategories,
    activeCategory,
    popularStoresForCategory,

    // Reactive State
    isNativeShell,
    currentView,
    isViewLoading,
    activeService,
    searchQuery,
    categorySearchQuery,
    selectedCategoryId,
    activeFilterPill,
    fastOnly,
    config,
    cart,
    totalCartCount,
    totalCartAmount,
    conflictModal,
    showConfigDrawer,
    favorites,

    // State Mutators & Handlers
    setCurrentView,
    setCategorySearchQuery,
    setSelectedCategoryId,
    navigateToCategories,
    navigateToHome,
    selectService,
    updateSearchQuery,
    selectFilterPill,
    toggleFastOnly,
    addToCart,
    decrementCart,
    clearCart,
    confirmReplaceCart,
    dismissConflictModal,
    toggleFavorite,
    toggleSection,
    toggleFeature,
    applyPreset,
    openConfigDrawer: () => setShowConfigDrawer(true),
    closeConfigDrawer: () => setShowConfigDrawer(false),
  };
}
