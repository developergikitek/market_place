'use client';

import React from 'react';
import { MicIcon } from '@/shared/components/Icons';

export function SearchResultsHeader({ query, tab, onTabChange, onGoBack, onEditSearch, onClearSearch }) {
  return (
    <header className="sr-header">
      <div className="sr-top-row">
        <button type="button" className="search-back-btn" onClick={onGoBack} aria-label="Go back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="sr-title">
          Showing results in <strong>Indore</strong>
        </span>
      </div>

      {/* Looks like an input; tapping re-opens the search sheet with this query */}
      <div className="sr-query-box">
        <button type="button" className="sr-query-text" onClick={() => onEditSearch()}>
          {query}
        </button>
        <button type="button" className="sr-query-clear" onClick={onClearSearch} aria-label="Clear search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <span className="search-input-divider" />
        <button type="button" className="search-mic-btn" onClick={() => onEditSearch()} aria-label="Voice search">
          <MicIcon size={20} />
        </button>
      </div>

      <div className="sr-tabs" role="tablist">
        {[
          { id: 'stores', label: 'Stores' },
          { id: 'items', label: 'Items' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`sr-tab ${tab === t.id ? 'is-active' : ''}`}
            onClick={() => onTabChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </header>
  );
}
