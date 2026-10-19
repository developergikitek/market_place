'use client';

import React from 'react';

/**
 * Swiggy-style floating cart bar shown on Home and Store screens.
 * One tap target: the whole bar opens the cart.
 */
export function FloatingCartBar({ storeName, count, amount, onViewCart, hidden }) {
  if (hidden || !count || count <= 0) return null;

  return (
    <button type="button" className="cart-bar" onClick={onViewCart}>
      <span className="cart-bar-info">
        <span className="cart-bar-summary">
          {count} {count === 1 ? 'item' : 'items'} | ₹{Number(amount).toLocaleString('en-IN')}
        </span>
        {storeName && <span className="cart-bar-store">From {storeName}</span>}
      </span>

      <span className="cart-bar-cta">
        View Cart
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </span>
    </button>
  );
}
