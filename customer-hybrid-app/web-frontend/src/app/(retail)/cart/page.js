'use client';

import React from 'react';
import { useCartViewModel } from '@/retail/viewmodels/useCartViewModel';
import { CartHeader } from '@/retail/components/cart/CartHeader';
import { CartItemsCard } from '@/retail/components/cart/CartItemsCard';
import { CartBillCard, CartOffersCard } from '@/retail/components/cart/CartBillCard';
import { CartCheckoutBar } from '@/retail/components/cart/CartCheckoutBar';
import { CartEmptyState, OrderPlacedState } from '@/retail/components/cart/CartEmptyState';

export default function CartPage() {
  const {
    hydrated,
    store,
    items,
    totals,
    bill,
    placingOrder,
    placedOrder,
    incrementItem,
    decrementItem,
    clearCart,
    placeOrder,
    goBack,
    openStore,
    browseStores,
    trackOrder,
  } = useCartViewModel();

  const hasItems = hydrated && items.length > 0 && bill;

  return (
    <div className="app-viewport cart-page-viewport">

      <CartHeader
        store={placedOrder ? null : store}
        itemCount={totals.count}
        onGoBack={goBack}
        onOpenStore={openStore}
      />

      {!hydrated ? (
        <div className="cart-loading-placeholder" />
      ) : placedOrder ? (
        <OrderPlacedState order={placedOrder} onTrack={trackOrder} onDone={browseStores} />
      ) : !hasItems ? (
        <CartEmptyState onBrowseStores={browseStores} />
      ) : (
        <>
          <main className="cart-page-content">
            <CartItemsCard
              items={items}
              onIncrement={incrementItem}
              onDecrement={decrementItem}
              onAddMore={openStore}
              onClearCart={clearCart}
            />
            <CartOffersCard bill={bill} />
            <CartBillCard bill={bill} />
            <p className="cart-policy-note">
              Orders are delivered directly by {store.name}. Cancel free of charge before the store accepts your order.
            </p>
          </main>

          <CartCheckoutBar toPay={bill.toPay} placingOrder={placingOrder} onPlaceOrder={placeOrder} />
        </>
      )}
    </div>
  );
}
