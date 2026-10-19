'use client';

import React from 'react';

export function CartHeader({ store, itemCount, onGoBack, onOpenStore }) {
  return (
    <div className="cart-header-bar">
      <button
        type="button"
        className="store-back-icon-btn"
        onClick={onGoBack}
        aria-label="Go Back"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>

      {store ? (
        <button type="button" className="cart-header-store" onClick={onOpenStore}>
          <span className="cart-header-store-name">{store.name}</span>
          <span className="cart-header-store-meta">
            {itemCount} item{itemCount === 1 ? '' : 's'} • {store.deliverySpeed}
          </span>
        </button>
      ) : (
        <div className="cart-header-store">
          <span className="cart-header-store-name">Your Cart</span>
        </div>
      )}
    </div>
  );
}
