'use client';

import React from 'react';

export function CartEmptyState({ onBrowseStores }) {
  return (
    <div className="cart-empty-state">
      <div className="cart-empty-icon">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
      </div>
      <h3>Your cart is empty</h3>
      <p>Add tools and supplies from any verified store near you. Each order comes from one store.</p>
      <button type="button" className="cart-primary-btn" onClick={onBrowseStores}>
        Browse stores
      </button>
    </div>
  );
}

export function OrderPlacedState({ order, onTrack, onDone }) {
  return (
    <div className="cart-empty-state cart-order-placed">
      <div className="cart-success-check">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h3>Order placed</h3>
      <p>
        {order.storeName} is packing your {order.itemCount} item{order.itemCount === 1 ? '' : 's'}.
        {order.deliverySpeed ? ` ${order.deliverySpeed}.` : ''}
      </p>
      <dl className="cart-order-meta">
        <div><dt>Order ID</dt><dd>{order.orderId}</dd></div>
        <div><dt>Paid</dt><dd>₹{(order.amount || 0).toLocaleString('en-IN')} via UPI</dd></div>
      </dl>
      <button type="button" className="cart-primary-btn" onClick={onTrack}>
        Track order
      </button>
      <button type="button" className="cart-text-btn" onClick={onDone}>
        Continue shopping
      </button>
    </div>
  );
}
