'use client';

import React from 'react';

export function StoreProductList({
  products = [],
  activeSortPill = 'RECOMMENDED',
  onSelectSortPill,
  selectedCategoryName = 'All Products',
  getItemQty,
  onAddToCart,
  onDecrementCart,
}) {
  const sortPills = [
    { id: 'RECOMMENDED', label: 'Recommended' },
    { id: 'NEW', label: 'New Arrivals' },
    { id: 'PRICE_LOW', label: 'Price: Low to High' },
    { id: 'PRICE_HIGH', label: 'Price: High to Low' },
  ];

  return (
    <section className="store-products-list-section">
      <div className="store-section-header-flex">
        <h2 className="store-section-title">
          {selectedCategoryName || 'All Products'}
          <span className="store-products-count-badge"> ({products.length})</span>
        </h2>
      </div>

      {/* Sort / Filter Pills Row */}
      <div className="store-sort-pills-scroll">
        {sortPills.map((pill) => {
          const isActive = activeSortPill === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              className={`store-sort-pill-btn ${isActive ? 'store-sort-pill-active' : ''}`}
              onClick={() => onSelectSortPill(pill.id)}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Product List Items (Swiggy / Blinkit Menu List Architecture) */}
      <div className="store-products-vertical-list">
        {products.length === 0 ? (
          <div className="store-empty-search-box">
            <div className="empty-search-icon">🔍</div>
            <p className="empty-search-title">No products found</p>
            <p className="empty-search-sub">Try searching for drills, hammers, cement, or tools</p>
          </div>
        ) : (
          products.map((product) => {
            const qty = getItemQty(product.id);

            return (
              <div key={product.id} className="store-product-row-item">
                {/* Left: Product Cutout Image */}
                <div className="store-product-thumb-wrap">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="store-product-thumb-img"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = '/images/cat-drill-cutout.jpg';
                    }}
                  />
                  {product.discount && (
                    <span className="store-product-discount-pill">{product.discount}</span>
                  )}
                </div>

                {/* Center: Metadata */}
                <div className="store-product-details-col">
                  <h3 className="store-product-name">{product.name}</h3>
                  {product.pack && (
                    <p className="store-product-spec-txt">{product.pack}</p>
                  )}

                  <div className="store-product-price-flex">
                    <span className="store-product-price-main">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="store-product-price-strikethrough">
                        ₹{product.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <div className="store-stock-status-badge">
                    <span className="stock-dot">●</span>
                    <span>{product.stockStatus || 'In Stock'}</span>
                  </div>
                </div>

                {/* Right: Swiggy Stepper / ADD Button */}
                <div className="store-product-action-col">
                  {qty > 0 ? (
                    <div className="swiggy-row-stepper">
                      <button
                        type="button"
                        className="swiggy-row-stepper-btn"
                        onClick={() => onDecrementCart(product.id)}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="swiggy-row-stepper-num">{qty}</span>
                      <button
                        type="button"
                        className="swiggy-row-stepper-btn"
                        onClick={() => onAddToCart(product)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="swiggy-row-add-btn"
                      onClick={() => onAddToCart(product)}
                      aria-label={`Add ${product.name} to cart`}
                    >
                      ADD
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
