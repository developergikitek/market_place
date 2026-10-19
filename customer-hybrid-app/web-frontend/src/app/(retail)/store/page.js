'use client';

import React, { Suspense } from 'react';
import { useStoreViewModel } from '@/retail/viewmodels/useStoreViewModel';
import { StoreHeaderCard } from '@/retail/components/store/StoreHeaderCard';
import { StoreSearchBar } from '@/retail/components/store/StoreSearchBar';
import { StoreAssuranceStrip } from '@/retail/components/store/StoreAssuranceStrip';
import { StoreBestSellersTray } from '@/retail/components/store/StoreBestSellersTray';
import { StoreCategoriesTray } from '@/retail/components/store/StoreCategoriesTray';
import { StoreProductList } from '@/retail/components/store/StoreProductList';
import { FloatingCartBar } from '@/retail/components/FloatingCartBar';
import { CartConflictModal } from '@/retail/components/CartConflictModal';

function StorePageContent() {
  const {
    store,
    searchQuery,
    setSearchQuery,
    selectedCategoryId,
    setSelectedCategoryId,
    activeSortPill,
    setActiveSortPill,
    filteredProducts,
    bestSellers,
    storeCategories,
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
  } = useStoreViewModel();

  const selectedCategoryObj = storeCategories.find((c) => c.id === selectedCategoryId);
  const selectedCategoryName = selectedCategoryObj ? selectedCategoryObj.name : 'All Products';

  return (
    <div className="app-viewport store-page-viewport">

      {/* 1. Store Header Info Hero Card */}
      <StoreHeaderCard
        store={store}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        onGoBack={handleGoBack}
        couponApplied={couponApplied}
        onApplyCoupon={applyCoupon}
      />

      {/* 2. In-Store Search Bar */}
      <StoreSearchBar
        storeName={store.name}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 3. 100% Original / Easy Returns / On-Time Delivery Assurance Strip */}
      <StoreAssuranceStrip />

      {/* 4. Best Sellers Horizontal Tray */}
      <StoreBestSellersTray
        bestSellers={bestSellers}
        getItemQty={getItemQty}
        onAddToCart={addToCart}
        onDecrementCart={decrementCart}
        onSeeAll={() => setSelectedCategoryId('all')}
      />

      {/* 5. Circular Category Avatars Tray */}
      <StoreCategoriesTray
        categories={storeCategories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        onViewAll={() => setSelectedCategoryId('all')}
      />

      {/* 6. All Products / Menu List with Sort Pills */}
      <StoreProductList
        products={filteredProducts}
        activeSortPill={activeSortPill}
        onSelectSortPill={setActiveSortPill}
        selectedCategoryName={selectedCategoryName}
        getItemQty={getItemQty}
        onAddToCart={addToCart}
        onDecrementCart={decrementCart}
      />

      {/* 7. Swiggy-Style Floating Cart Bar (hidden when conflict modal is active) */}
      {!conflictModal && (
        <FloatingCartBar
          storeName={cart?.storeName}
          count={cartTotals.count}
          amount={cartTotals.amount}
          onViewCart={openCart}
        />
      )}

      {/* Store Conflict Resolution Bottom Sheet Modal */}
      <CartConflictModal
        conflictModal={conflictModal}
        onDismiss={dismissConflictModal}
        onConfirmReplace={confirmReplaceCart}
      />

      {/* Bottom spacer for clean scrolling above native bottom nav */}
      <div className="store-bottom-spacer" />
    </div>
  );
}

export default function StorePage() {
  return (
    <Suspense fallback={<div className="store-page-loading" />}>
      <StorePageContent />
    </Suspense>
  );
}
