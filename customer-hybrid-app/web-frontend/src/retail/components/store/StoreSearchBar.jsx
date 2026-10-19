'use client';

import React from 'react';

export function StoreSearchBar({ storeName, searchQuery, onSearchChange }) {
  return (
    <div className="store-search-container">
      <div className="store-search-capsule">
        <svg
          className="store-search-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#64748B"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={`Search in ${storeName || 'Store'}`}
          className="store-search-input"
        />

        {searchQuery ? (
          <button
            type="button"
            className="store-search-clear-btn"
            onClick={() => onSearchChange('')}
            aria-label="Clear Search"
          >
            ✕
          </button>
        ) : null}
      </div>
    </div>
  );
}
