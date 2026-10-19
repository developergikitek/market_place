'use client';

import React from 'react';

export function CategoriesSearchBar({ searchQuery, onSearchChange, onFilterClick }) {
  return (
    <div className="categories-search-container">
      <div className="categories-search-capsule">
        <svg
          className="categories-search-icon"
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
          placeholder="Search stores in all categories"
          className="categories-search-input"
        />

        {searchQuery ? (
          <button
            type="button"
            className="categories-clear-btn"
            onClick={() => onSearchChange('')}
            aria-label="Clear Search"
          >
            ✕
          </button>
        ) : null}

        <button
          type="button"
          className="categories-filter-btn"
          onClick={onFilterClick}
          aria-label="Filter Options"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
