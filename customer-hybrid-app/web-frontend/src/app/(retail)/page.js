'use client';

import React from 'react';
import { useAppRouter } from '@/shared/lib/useAppRouter';
import { useHomeViewModel } from '@/retail/viewmodels/useHomeViewModel';
import { sendToNative } from '@/shared/lib/nativeBridge';

// View Components (MVVM Presentation Layer)
import { HeaderSection } from '@/retail/components/HeaderSection';
import { ShoppingModeSelector } from '@/retail/components/ShoppingModeSelector';
import { SearchBar } from '@/retail/components/SearchBar';
import { FilterChipsRow } from '@/retail/components/FilterChipsRow';
import { CampaignBanner } from '@/retail/components/CampaignBanner';
import { StoryCardsTray } from '@/retail/components/StoryCardsTray';
import { CategoryGrid } from '@/retail/components/CategoryGrid';
import { StoreCardsFeed } from '@/retail/components/StoreCardsFeed';
import { ProPicksSection } from '@/retail/components/ProPicksSection';
import { TrendingProductsTray } from '@/retail/components/TrendingProductsTray';
import { FloatingCartBar } from '@/retail/components/FloatingCartBar';
import { CartConflictModal } from '@/retail/components/CartConflictModal';
import { ConfigDrawerModal } from '@/retail/components/ConfigDrawerModal';
import { SkeletonScreen } from '@/retail/components/SkeletonScreen';
import { LazySection } from '@/shared/components/LazySection';

// Categories Views for Instant SPA Switching (Zero Reload)
import { CategoriesHeader } from '@/retail/components/categories/CategoriesHeader';
import { CategoriesSearchBar } from '@/retail/components/categories/CategoriesSearchBar';
import { TopCategoriesGrid } from '@/retail/components/categories/TopCategoriesGrid';
import { PopularStoresInCat } from '@/retail/components/categories/PopularStoresInCat';
import { ContractorPromoBanner } from '@/retail/components/categories/ContractorPromoBanner';

/**
 * Hardware Marketplace Root View (MVVM Architecture)
 * Orchestrates presentation components bound directly to useHomeViewModel.
 * Preserves exact .app-viewport, .navy-hero-container (#031B3B gradient),
 * and .feed-content-wrapper design hierarchy.
 */
export default function MarketplaceHomePage() {
  const router = useAppRouter();

  const {
    // Models / Datasets
    trendingProducts,
    proPicks,
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

    // Actions & Handlers
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
    confirmReplaceCart,
    dismissConflictModal,
    toggleFavorite,
    toggleSection,
    applyPreset,
    openConfigDrawer,
    closeConfigDrawer,
  } = useHomeViewModel();

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // No window.nativeSwitchView: the native tab bar always routes to /categories and /,
      // so there is one Categories screen and the URL always matches what's on screen.
      window.nextRouter = router;
    }
  }, [router]);

  return (
    <div className="app-viewport">

      {currentView === 'categories' ? (
        isViewLoading ? (
          <SkeletonScreen type="categories" hideHeader={isNativeShell} />
        ) : (
          <div className="categories-page-viewport" style={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
            {!isNativeShell && (
              <CategoriesHeader
                onGoBack={navigateToHome}
                notificationCount={2}
              />
            )}
            <CategoriesSearchBar
              searchQuery={categorySearchQuery}
              onSearchChange={setCategorySearchQuery}
              onFilterClick={() => {}}
            />
            <main className={`categories-page-content ${isNativeShell ? 'native-content-pad' : ''}`}>
              <TopCategoriesGrid
                categories={filteredCategories}
                onSelectCategory={setSelectedCategoryId}
              />
              <PopularStoresInCat
                categoryName={activeCategory.name}
                stores={popularStoresForCategory}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onStoreClick={(store) => {
                  const targetUrl = `/store?id=${store.id}&native=1`;
                  sendToNative('TRIGGER_HAPTIC', { style: 'light' });
                  sendToNative('STORE_SELECTED', { storeId: store.id, url: targetUrl });
                  if (typeof window !== 'undefined' && window.nextRouter) {
                    window.nextRouter.push(targetUrl);
                  } else {
                    router.push(targetUrl);
                  }
                }}
                onSeeAll={navigateToHome}
              />
              <ContractorPromoBanner
                onExplore={() => setSelectedCategoryId('all_categories')}
              />
              <div className="categories-bottom-spacer" />
            </main>
          </div>
        )
      ) : isViewLoading ? (
        <SkeletonScreen type="home" hideHeader={isNativeShell} />
      ) : (
        <>
          {/* ============================================================
              DEEP NAVY (#031B3B) HEADER & HERO CONTAINER
          ============================================================ */}
          <section className={`navy-hero-container ${isNativeShell ? 'native-shell-mode' : ''}`}>
            {/* Render web header only if not running inside Native Shell */}
            {!isNativeShell && (
              <>
                <HeaderSection
                  config={config}
                  onOpenConfigDrawer={openConfigDrawer}
                />

                <ShoppingModeSelector
                  config={config}
                  activeService={activeService}
                  onSelectService={selectService}
                />

                <SearchBar
                  config={config}
                  searchQuery={searchQuery}
                  onSearchChange={updateSearchQuery}
                  fastOnly={fastOnly}
                  onToggleFastOnly={toggleFastOnly}
                />
              </>
            )}

            {/* Quick Filter Chips */}
            <FilterChipsRow
              config={config}
              activeFilterPill={activeFilterPill}
              onSelectFilterPill={selectFilterPill}
            />

            {/* Promotional Campaign Banner */}
            <CampaignBanner
              config={config}
            />

            {/* Offer Story Cards Tray */}
            <StoryCardsTray
              config={config}
              onSelectStory={(card) => {
                if (card.query) updateSearchQuery(card.query);
              }}
            />
          </section>

          {/* ============================================================
              CLEAN WHITE FEED (INDIAN ECOMMERCE MARKETPLACE)
          ============================================================ */}
          <main className="feed-content-wrapper" role="main">
            {/* Image-Based Categories Grid */}
            <CategoryGrid
              config={config}
              onSelectCategory={(query) => {
                updateSearchQuery(query);
              }}
              onViewAll={navigateToCategories}
            />

            {/* Below the first screen: rendered as you scroll near them (Swiggy-style), so
                opening Home only builds and paints what fits on screen */}
            {/* Verified Hardware Stores Feed */}
            <LazySection minHeight={1200}>
              <StoreCardsFeed
                config={config}
                stores={filteredStores}
                cart={cart}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onAddToCart={addToCart}
                onDecrementCart={decrementCart}
              />
            </LazySection>

            {/* Distinctive Graphic Feature: Curated Pro Picks Section */}
            <LazySection minHeight={360}>
              <ProPicksSection
                proPicks={proPicks}
                cart={cart}
                onAddToCart={addToCart}
                onDecrementCart={decrementCart}
              />
            </LazySection>

            {/* Trending Hardware Products */}
            <LazySection minHeight={300}>
              <TrendingProductsTray
                trendingProducts={trendingProducts}
                cart={cart}
                onAddToCart={addToCart}
                onDecrementCart={decrementCart}
              />
            </LazySection>
          </main>
        </>
      )}

      {/* Floating Store-Locked Cart Action Bar (hidden when conflict modal is active) */}
      {!conflictModal && (
        <FloatingCartBar
          storeName={cart?.storeName}
          count={totalCartCount}
          amount={totalCartAmount}
          onViewCart={() => router.push('/cart?native=1')}
        />
      )}

      {/* Store Conflict Resolution Bottom Sheet Modal */}
      <CartConflictModal
        conflictModal={conflictModal}
        onDismiss={dismissConflictModal}
        onConfirmReplace={confirmReplaceCart}
      />

      {/* Dynamic Server-Driven UI (SDUI) Remote Drawer Modal */}
      <ConfigDrawerModal
        isOpen={showConfigDrawer}
        config={config}
        onClose={closeConfigDrawer}
        onApplyPreset={applyPreset}
        onToggleSection={toggleSection}
      />
    </div>
  );
}
