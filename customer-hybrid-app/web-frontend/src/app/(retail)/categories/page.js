'use client';

import React from 'react';
import { useCategoriesViewModel } from '@/retail/viewmodels/useCategoriesViewModel';
import { CategoriesHeader } from '@/retail/components/categories/CategoriesHeader';
import { CategoriesSearchBar } from '@/retail/components/categories/CategoriesSearchBar';
import { TopCategoriesGrid } from '@/retail/components/categories/TopCategoriesGrid';
import { PopularStoresInCat } from '@/retail/components/categories/PopularStoresInCat';
import { ContractorPromoBanner } from '@/retail/components/categories/ContractorPromoBanner';

import { SkeletonScreen } from '@/retail/components/SkeletonScreen';
import { LazySection } from '@/shared/components/LazySection';

export default function CategoriesPage() {
  const {
    isNativeShell,
    searchQuery,
    setSearchQuery,
    activeCategory,
    filteredCategories,
    popularStores,
    favorites,
    notificationCount,
    selectCategory,
    toggleFavorite,
    handleStoreClick,
    handleGoHome,
  } = useCategoriesViewModel();

  return (
    <div className="app-viewport categories-page-viewport">
      {/* 1. Header (Shown in standalone web without bottom tab navigation) */}
      {!isNativeShell && (
        <CategoriesHeader
          onGoBack={handleGoHome}
          notificationCount={notificationCount}
        />
      )}

      {/* 2. Search & Filter Bar */}
      <CategoriesSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFilterClick={() => {}}
      />

      {/* Main Content Area */}
      <main className={`categories-page-content ${isNativeShell ? 'native-content-pad' : ''}`}>
        {/* 3. Top Categories Grid (4-column) */}
        <TopCategoriesGrid
          categories={filteredCategories}
          onSelectCategory={selectCategory}
        />

        {/* 4. Popular Stores in Selected Category */}
        <PopularStoresInCat
          categoryName={activeCategory.name}
          stores={popularStores}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onStoreClick={handleStoreClick}
          onSeeAll={handleGoHome}
        />

        {/* 5. Contractor Promo Banner: below the first screen, rendered as you scroll near it */}
        <LazySection minHeight={180}>
          <ContractorPromoBanner
            onExplore={() => selectCategory('all_categories')}
          />
        </LazySection>

        {/* Bottom spacer for clean scrolling above native bottom bar */}
        <div className="categories-bottom-spacer" />
      </main>
    </div>
  );
}
