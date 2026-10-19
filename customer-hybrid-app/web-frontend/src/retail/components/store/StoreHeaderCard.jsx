'use client';

import React from 'react';

export function StoreHeaderCard({
  store,
  isFavorite,
  onToggleFavorite,
  onGoBack,
  couponApplied,
  onApplyCoupon,
}) {
  return (
    <div className="store-header-wrapper">
      {/* Top Navigation Row: Back Button & Actions */}
      <div className="store-top-nav-bar">
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

        <div className="store-top-actions">
          <button
            type="button"
            className="store-action-btn"
            onClick={onToggleFavorite}
            aria-label="Favorite Store"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={isFavorite ? '#E11D48' : 'none'}
              stroke={isFavorite ? '#E11D48' : '#0F172A'}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Store Info Card */}
      <div className="store-info-hero-card">
        <div className="store-info-top-flex">
          {/* Store Logo Avatar */}
          <div className="store-logo-avatar-box">
            <div className="store-logo-roof-icon">⌂</div>
            <div className="store-logo-text-stack">
              <strong>BUILD</strong>
              <span>WELL</span>
            </div>
          </div>

          {/* Store Name & Details */}
          <div className="store-meta-details-col">
            <div className="store-title-verified-row">
              <h1 className="store-heading-title">{store.name}</h1>
              <span className="store-verified-check-badge" title="Pro Verified">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#10B981" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </span>
            </div>

            {/* Ratings & Distance Row */}
            <div className="store-rating-distance-row">
              <span className="store-star-pill">
                ⭐ {store.rating} <span className="store-rating-count">({store.ratingCount})</span>
              </span>
              <span className="store-dot-sep">•</span>
              <span className="store-sub-info-txt">{store.distance}</span>
              <span className="store-dot-sep">•</span>
              <span className="store-sub-info-txt">{store.deliverySpeed}</span>
            </div>

            {/* Inventory Count & Delivery Threshold */}
            <div className="store-inventory-delivery-row">
              <span className="store-sub-info-txt">{store.productCount}</span>
              <span className="store-dot-sep">•</span>
              <span className="store-free-del-txt">{store.deliveryInfo}</span>
            </div>

            {/* Status: Open • Closes 8:00 PM */}
            <div className="store-status-timing-row">
              <span className="store-open-pill">Open</span>
              <span className="store-dot-sep">•</span>
              <span className="store-closes-timing">{store.closingTime || "Closes 8:00 PM"}</span>
            </div>
          </div>

          {/* 20% OFF Coupon Card Pill on Right */}
          {store.coupon && (
            <button
              type="button"
              className={`store-coupon-voucher-card ${couponApplied ? 'store-coupon-applied' : ''}`}
              onClick={onApplyCoupon}
            >
              <div className="coupon-discount-val">{couponApplied ? 'APPLIED' : store.coupon.discount}</div>
              <div className="coupon-code-txt">
                {couponApplied ? '✓ 20% Saved' : `Use code: ${store.coupon.code}`}
              </div>
              <div className="coupon-order-limit">{store.coupon.minOrder}</div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
