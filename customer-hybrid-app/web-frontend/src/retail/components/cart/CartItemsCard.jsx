'use client';

import React from 'react';

export function CartItemsCard({ items, onIncrement, onDecrement, onAddMore, onClearCart }) {
  return (
    <section className="cart-section-card">
      <div className="cart-section-head">
        <h3 className="cart-section-title">Items in cart</h3>
        <button type="button" className="cart-text-btn cart-text-btn-danger" onClick={onClearCart}>
          Clear cart
        </button>
      </div>

      <ul className="cart-items-list">
        {items.map(({ product, qty }) => (
          <li key={product.id} className="cart-item-row">
            <div className="cart-item-thumb">
              <img
                src={product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                onError={(e) => { e.currentTarget.src = '/images/cat-powertools.jpg'; }}
              />
            </div>

            <div className="cart-item-info">
              <div className="cart-item-name">{product.name}</div>
              {product.pack && <div className="cart-item-pack">{product.pack}</div>}
            </div>

            <div className="cart-item-actions">
              <div className="cart-qty-stepper">
                <button type="button" onClick={() => onDecrement(product.id)} aria-label={`Remove one ${product.name}`}>
                  −
                </button>
                <span>{qty}</span>
                <button type="button" onClick={() => onIncrement(product.id)} aria-label={`Add one ${product.name}`}>
                  +
                </button>
              </div>
              <div className="cart-item-price">
                <span className="cart-item-price-now">₹{(product.price * qty).toLocaleString('en-IN')}</span>
                {product.originalPrice > product.price && (
                  <span className="cart-item-price-mrp">
                    ₹{(product.originalPrice * qty).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <button type="button" className="cart-add-more-btn" onClick={onAddMore}>
        + Add more items
      </button>
    </section>
  );
}
