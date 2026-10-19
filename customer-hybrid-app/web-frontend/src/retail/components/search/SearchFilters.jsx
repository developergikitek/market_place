'use client';

import React, { useState } from 'react';
import { SORT_OPTIONS } from '@/retail/viewmodels/useSearchResultsViewModel';

export function SearchFilters({
  sortBy,
  onSortChange,
  sameDayOnly,
  onToggleSameDay,
  topRatedOnly,
  onToggleTopRated,
  offersOnly,
  onToggleOffers,
  keywords,
  keyword,
  onToggleKeyword,
}) {
  const [sortOpen, setSortOpen] = useState(false);
  const sortLabel = sortBy === 'relevance' ? 'Sort By' : SORT_OPTIONS.find((o) => o.id === sortBy)?.label;

  return (
    <div className="sr-filters">
      <div className="sr-chip-row">
        <button
          type="button"
          className={`sr-filter-chip ${sortBy !== 'relevance' ? 'is-on' : ''}`}
          onClick={() => setSortOpen((v) => !v)}
          aria-expanded={sortOpen}
        >
          {sortLabel}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <button type="button" className={`sr-filter-chip ${sameDayOnly ? 'is-on' : ''}`} onClick={onToggleSameDay}>
          <span className="sr-bolt">⚡</span> Same-Day
        </button>
        <button type="button" className={`sr-filter-chip ${topRatedOnly ? 'is-on' : ''}`} onClick={onToggleTopRated}>
          Rated 4.7+
        </button>
        <button type="button" className={`sr-filter-chip ${offersOnly ? 'is-on' : ''}`} onClick={onToggleOffers}>
          Offers
        </button>
      </div>

      {sortOpen && (
        <div className="sr-sort-menu" role="listbox">
          {SORT_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              role="option"
              aria-selected={sortBy === o.id}
              className={`sr-sort-option ${sortBy === o.id ? 'is-on' : ''}`}
              onClick={() => {
                onSortChange(o.id);
                setSortOpen(false);
              }}
            >
              {o.label}
              {sortBy === o.id && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}

      {keywords.length > 0 && (
        <div className="sr-chip-row">
          {keywords.map((k) => (
            <button
              key={k}
              type="button"
              className={`sr-keyword-chip ${keyword === k ? 'is-on' : ''}`}
              onClick={() => onToggleKeyword(k)}
            >
              {k}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
