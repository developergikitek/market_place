'use client';

import React from 'react';

export function CartCheckoutBar({ toPay, placingOrder, onPlaceOrder }) {
  return (
    <div className="cart-checkout-bar">
      <div className="cart-checkout-address">
        <span className="cart-checkout-label">Delivering to Home</span>
        <span className="cart-checkout-address-line">B400c, Scheme No 54, Near C21 Mall, Indore</span>
      </div>

      <button
        type="button"
        className="cart-place-order-btn"
        onClick={onPlaceOrder}
        disabled={placingOrder}
      >
        <span className="cart-place-order-amount">₹{toPay.toLocaleString('en-IN')}</span>
        <span>{placingOrder ? 'Processing…' : 'Pay & Place Order →'}</span>
      </button>
    </div>
  );
}
