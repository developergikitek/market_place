'use client';

import React from 'react';

/**
 * SkeletonScreen: Swiggy & Blinkit Style Shimmer Placeholders
 * Replaces rotating spinners with elegant, zero-buffering skeleton screens.
 * 
 * Supports:
 * - type='home': Swiggy 3 vertical cards + 2 horizontal pills + Blinkit 2x2 grid
 * - type='categories': 4-column 12-item catalog grid + stores tray
 * - hideHeader: When embedded in React Native shell, leaves native top header active!
 */
export function SkeletonScreen({ type = 'home', hideHeader = false }) {
  if (type === 'categories') {
    return (
      <div className={`skeleton-container ${hideHeader ? 'skeleton-native-pad' : ''}`} aria-busy="true" aria-label="Loading categories">
        {/* Top Header Placeholder (Only shown in standalone web) */}
        {!hideHeader && (
          <div className="skeleton-header-bar">
            <div className="skeleton-box skeleton-title-pill" />
            <div className="skeleton-box skeleton-circle-btn" />
          </div>
        )}

        {/* Search Bar Placeholder (Only shown in standalone web) */}
        {!hideHeader && (
          <div className="skeleton-box skeleton-search-capsule" />
        )}

        {/* Section Heading Placeholder */}
        <div className="skeleton-box skeleton-heading-pill" style={{ margin: '16px 14px 12px 14px' }} />

        {/* 4x3 Categories Grid Placeholder (12 items) */}
        <div className="skeleton-categories-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton-cat-card">
              <div className="skeleton-box skeleton-cat-img" />
              <div className="skeleton-box skeleton-cat-text-1" />
              <div className="skeleton-box skeleton-cat-text-2" />
            </div>
          ))}
        </div>

        {/* Popular Stores Section Placeholder */}
        <div className="skeleton-box skeleton-heading-pill" style={{ margin: '22px 14px 12px 14px' }} />
        <div className="skeleton-stores-tray">
          <div className="skeleton-box skeleton-store-card" />
          <div className="skeleton-box skeleton-store-card" />
        </div>
      </div>
    );
  }

  // Home Screen Skeleton (Exact Swiggy & Blinkit Reference Layout)
  return (
    <div className={`skeleton-container ${hideHeader ? 'skeleton-native-pad' : ''}`} aria-busy="true" aria-label="Loading marketplace">
      {/* Navy Hero Skeleton Header (Only shown in standalone web) */}
      {!hideHeader && (
        <div className="skeleton-navy-hero">
          <div className="skeleton-box skeleton-loc-bar" />
          <div className="skeleton-box skeleton-tabs-bar" />
          <div className="skeleton-box skeleton-search-bar" />
        </div>
      )}

      {/* Content Shimmer Body */}
      <div className="skeleton-swiggy-content-body">
        {/* ============================================================
            SWIGGY SIGNATURE: 3 VERTICAL TALL ROUNDED CARDS
        ============================================================ */}
        <div className="skeleton-swiggy-vertical-cards-row">
          <div className="skeleton-box skeleton-swiggy-card" />
          <div className="skeleton-box skeleton-swiggy-card" />
          <div className="skeleton-box skeleton-swiggy-card" />
        </div>

        {/* ============================================================
            SWIGGY SIGNATURE: 2 HORIZONTAL PILL BARS
        ============================================================ */}
        <div className="skeleton-box skeleton-swiggy-pill" />
        <div className="skeleton-box skeleton-swiggy-pill" />

        {/* ============================================================
            BLINKIT SIGNATURE: 2x2 GRID PRODUCT/STORE PLACEHOLDERS
        ============================================================ */}
        <div className="skeleton-box skeleton-heading-pill" style={{ marginTop: '22px' }} />
        
        <div className="skeleton-blinkit-2x2-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-blinkit-card-box">
              <div className="skeleton-box skeleton-blinkit-card-img" />
              <div className="skeleton-box skeleton-blinkit-line-title" />
              <div className="skeleton-box skeleton-blinkit-line-sub" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
