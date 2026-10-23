'use client';

import React from 'react';
import { useBazaarViewModel } from '@/bazaar/viewmodels/useBazaarViewModel';
import { BAZAAR_DELIVERY_ETA, BAZAAR_OFFERS, BAZAAR_PRODUCTS } from '@/bazaar/models/bazaarModel';
import { BazaarHero } from '@/bazaar/components/BazaarHero';
import { BazaarCategoryRail } from '@/bazaar/components/BazaarCategoryRail';
import { BazaarOfferStrip } from '@/bazaar/components/BazaarOfferStrip';
import { BazaarShelves } from '@/bazaar/components/BazaarShelves';
import { FloatingCartBar } from '@/retail/components/FloatingCartBar';
import { CartConflictModal } from '@/retail/components/CartConflictModal';
import styles from '@/bazaar/bazaar.module.css';

export default function BazaarPage() {
  const {
    categories,
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
  } = useBazaarViewModel();

  return (
    <div className={`app-viewport ${styles.screen}`}>
      <BazaarHero
        eta={BAZAAR_DELIVERY_ETA}
        itemCount={BAZAAR_PRODUCTS.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <BazaarCategoryRail
        categories={categories}
        selectedId={selectedCategoryId}
        onSelect={(id) => {
          setSearchQuery('');
          setSelectedCategoryId(id);
        }}
      />

      <BazaarOfferStrip offers={BAZAAR_OFFERS} />

      <BazaarShelves
        shelves={shelves}
        products={visibleProducts}
        searchQuery={searchQuery}
        getItemQty={getItemQty}
        onAdd={addToCart}
        onDecrement={decrementCart}
        onSeeAll={setSelectedCategoryId}
      />

      {!conflictModal && (
        <FloatingCartBar
          storeName={cart?.storeName}
          count={cartTotals.count}
          amount={cartTotals.amount}
          onViewCart={openCart}
        />
      )}

      <CartConflictModal
        conflictModal={conflictModal}
        onDismiss={dismissConflictModal}
        onConfirmReplace={confirmReplaceCart}
      />
    </div>
  );
}
