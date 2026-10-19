import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAppRouter } from '@/shared/lib/useAppRouter';
import {
  FULL_CATEGORIES_CATALOG,
  VERIFIED_STORES,
} from '@/retail/models/marketplaceModel';
import {
  sendToNative,
  subscribeToNativeEvents,
} from '@/shared/lib/nativeBridge';
import { useIsNativeShell, markNativeShell } from '@/shared/lib/useIsNativeShell';

/**
 * VIEWMODEL: Categories Screen
 * Follows strict MVVM architecture. Encapsulates state, category filtering,
 * store resolution, and native shell bridge coordination.
 */
export function useCategoriesViewModel() {
  const router = useAppRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('power_tools');
  const [favorites, setFavorites] = useState({ store_2: false, store_1: true });
  const [notificationCount, setNotificationCount] = useState(2);
  const [cartBadgeCount, setCartBadgeCount] = useState(3);
  const [activeNavTab, setActiveNavTab] = useState('categories');

  const isNativeShell = useIsNativeShell();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.nextRouter = router;
    }
  }, [router]);

  // Sync with Native Shell Bridge
  useEffect(() => {
    sendToNative('PAGE_VIEWED', { page: 'categories' });
    sendToNative('TAB_CHANGED', { tab: 'categories' });
    sendToNative('WEB_READY', { status: 'ready', page: 'categories' });

    const unsubscribe = subscribeToNativeEvents((event) => {
      markNativeShell();
      // Tab routing (NAVIGATE_TAB) is driven by the native shell via window.nextRouter. Pushing
      // here too navigated twice, and the second NAVIGATION_START left native's skeleton stuck.
      if (event.type === 'SEARCH_QUERY') {
        const { query = '' } = event.payload || {};
        setSearchQuery(query);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Filtered categories based on user search input
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return FULL_CATEGORIES_CATALOG;
    const q = searchQuery.toLowerCase().trim();
    return FULL_CATEGORIES_CATALOG.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.storeCount.toLowerCase().includes(q) ||
        (cat.query && cat.query.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Selected category entity
  const activeCategory = useMemo(() => {
    return (
      FULL_CATEGORIES_CATALOG.find((c) => c.id === selectedCategoryId) ||
      FULL_CATEGORIES_CATALOG[0]
    );
  }, [selectedCategoryId]);

  // Resolved stores for the selected category
  const popularStores = useMemo(() => {
    if (!activeCategory) return VERIFIED_STORES;
    if (activeCategory.id === 'all_categories') return VERIFIED_STORES;

    const ids = activeCategory.popularStores || [];
    const matched = VERIFIED_STORES.filter((s) => ids.includes(s.id));
    return matched.length > 0 ? matched : VERIFIED_STORES.slice(0, 2);
  }, [activeCategory]);

  const toggleFavorite = useCallback((storeId, e) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => ({
      ...prev,
      [storeId]: !prev[storeId],
    }));
    sendToNative('TOGGLE_FAVORITE', { storeId });
  }, []);

  const selectCategory = useCallback((catId) => {
    setSelectedCategoryId(catId);
    sendToNative('CATEGORY_SELECTED', { categoryId: catId });
  }, []);

  const handleStoreClick = useCallback((store) => {
    sendToNative('STORE_SELECTED', {
      storeId: store.id,
      storeName: store.name,
    });
    const targetUrl = `/store?id=${store.id}&native=1`;
    if (typeof window !== 'undefined' && window.nextRouter) {
      window.nextRouter.push(targetUrl);
    } else {
      router.push(targetUrl);
    }
  }, [router]);

  const handleGoHome = useCallback(() => {
    sendToNative('NAVIGATE_TAB', { tabId: 'stores' });
    router.push('/');
  }, [router]);

  return {
    isNativeShell,
    searchQuery,
    setSearchQuery,
    selectedCategoryId,
    activeCategory,
    filteredCategories,
    popularStores,
    favorites,
    notificationCount,
    cartBadgeCount,
    activeNavTab,
    setActiveNavTab,
    selectCategory,
    toggleFavorite,
    handleStoreClick,
    handleGoHome,
  };
}
