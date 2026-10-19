'use client';

import React from 'react';

export function StoreBestSellersTray({
  bestSellers = [],
  getItemQty,
  onAddToCart,
  onDecrementCart,
  onSeeAll,
}) {
  if (!bestSellers || bestSellers.length === 0) return null;

  return (
    <section className="store-bestsellers-section">
      <div className="store-section-header-flex">
        <h2 className="store-section-title">Best Sellers</h2>
        <button
          type="button"
          className="store-section-link-btn"
          onClick={onSeeAll}
        >
          See all
        </button>
      </div>

      <div className="store-bestsellers-scroll-tray">
        {bestSellers.map((item) => {
          const qty = getItemQty(item.id);

          return (
            <div key={item.id} className="store-bestseller-card">
              <div className="bestseller-img-wrap">
                <img
                  src={item.image}
                  alt={item.name}
                  className="bestseller-prod-img"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = '/images/cat-drill-cutout.jpg';
                  }}
                />
              </div>

              <h3 className="bestseller-prod-name" title={item.name}>
                {item.name}
              </h3>

              <div className="bestseller-price-stepper-row">
                <span className="bestseller-price-val">₹{item.price.toLocaleString('en-IN')}</span>

                {qty > 0 ? (
                  <div className="swiggy-stepper-pill">
                    <button
                      type="button"
                      className="swiggy-stepper-minus"
                      onClick={() => onDecrementCart(item.id)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="swiggy-stepper-count">{qty}</span>
                    <button
                      type="button"
                      className="swiggy-stepper-plus"
                      onClick={() => onAddToCart(item)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="bestseller-add-pill-btn"
                    onClick={() => onAddToCart(item)}
                    aria-label={`Add ${item.name} to cart`}
                  >
                    +
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
