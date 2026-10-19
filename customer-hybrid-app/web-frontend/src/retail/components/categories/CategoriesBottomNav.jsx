'use client';

import React from 'react';

export function CategoriesBottomNav({
  activeTab = 'categories',
  cartBadgeCount = 3,
  onTabPress,
}) {
  return (
    <nav className="categories-bottom-navbar" aria-label="Bottom Navigation">
      {/* Home */}
      <button
        type="button"
        className={`cat-nav-btn ${activeTab === 'home' ? 'cat-nav-active' : ''}`}
        onClick={() => onTabPress('home')}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span className="cat-nav-label">Home</span>
      </button>

      {/* Categories */}
      <button
        type="button"
        className={`cat-nav-btn ${activeTab === 'categories' ? 'cat-nav-active' : ''}`}
        onClick={() => onTabPress('categories')}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill={activeTab === 'categories' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.1">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
        <span className="cat-nav-label">Categories</span>
      </button>

      {/* Orders */}
      <button
        type="button"
        className={`cat-nav-btn ${activeTab === 'orders' ? 'cat-nav-active' : ''}`}
        onClick={() => onTabPress('orders')}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </svg>
        <span className="cat-nav-label">Orders</span>
      </button>

      {/* Cart */}
      <button
        type="button"
        className={`cat-nav-btn ${activeTab === 'cart' ? 'cat-nav-active' : ''}`}
        onClick={() => onTabPress('cart')}
      >
        <div className="cat-nav-cart-wrapper">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {cartBadgeCount > 0 && (
            <span className="cat-nav-badge">{cartBadgeCount}</span>
          )}
        </div>
        <span className="cat-nav-label">Cart</span>
      </button>

      {/* Profile */}
      <button
        type="button"
        className={`cat-nav-btn ${activeTab === 'profile' ? 'cat-nav-active' : ''}`}
        onClick={() => onTabPress('profile')}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span className="cat-nav-label">Profile</span>
      </button>
    </nav>
  );
}
