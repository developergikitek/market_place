'use client';

import React from 'react';

export function PopularStoresInCat({
  categoryName = 'Power Tools',
  stores = [],
  favorites = {},
  onToggleFavorite,
  onStoreClick,
  onSeeAll,
}) {
  return (
    <section className="cat-popular-stores-section">
      <div className="cat-stores-header">
        <h2 className="cat-stores-title">Popular Stores in {categoryName}</h2>
        <button
          type="button"
          className="cat-stores-see-all-btn"
          onClick={onSeeAll}
        >
          See all
        </button>
      </div>

      <div className="cat-stores-scroll-tray">
        {stores.map((store) => {
          const isFav = !!favorites[store.id];
          return (
            <div
              key={store.id}
              className="cat-store-card"
              onClick={() => onStoreClick(store)}
            >
              {/* Store Hero Banner / Logo */}
              <div className="cat-store-cover">
                <img
                  src={store.coverImage || '/images/store-sharma.jpg'}
                  alt={store.name}
                  className="cat-store-cover-img"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = '/images/store-sharma.jpg';
                  }}
                />

                {/* Brand Badge in center */}
                <div className={`cat-store-brand-pill ${store.id === 'store_2' ? 'cat-brand-buildwell' : 'cat-brand-sharma'}`}>
                  {store.id === 'store_2' ? (
                    <div className="brand-logo-text">
                      <span className="logo-roof">⌂</span>
                      <strong>BUILD</strong>
                      <span>WELL</span>
                    </div>
                  ) : (
                    <div className="brand-logo-text">
                      <span className="logo-flame">🔥</span>
                      <strong>SHARMA</strong>
                      <span>HARDWARE</span>
                    </div>
                  )}
                </div>

                {/* Heart Wishlist Button */}
                <button
                  type="button"
                  className={`cat-store-fav-btn ${isFav ? 'cat-store-fav-active' : ''}`}
                  onClick={(e) => onToggleFavorite(store.id, e)}
                  aria-label="Save Store to Favorites"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={isFav ? '#EF4444' : 'none'} stroke={isFav ? '#EF4444' : '#64748B'} strokeWidth="2.2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>

              {/* Store Details Body */}
              <div className="cat-store-body">
                <div className="cat-store-status-row">
                  <span className="cat-store-open-tag">Open</span>
                </div>

                <h3 className="cat-store-name">{store.name}</h3>

                <div className="cat-store-meta-line">
                  <span className="cat-store-star">★</span>
                  <span className="cat-store-rating">{store.rating}</span>
                  <span className="cat-store-dot">•</span>
                  <span className="cat-store-distance">{store.distance}</span>
                </div>

                <div className="cat-store-prod-count">{store.productCount || '120+ Products'}</div>

                <div className="cat-store-delivery-tag">Free delivery</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
