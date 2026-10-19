'use client';

import React from 'react';
import { SearchIcon, MicIcon, StarIcon } from '@/shared/components/Icons';
import { useSearchViewModel, POPULAR_SEARCHES } from '@/retail/viewmodels/useSearchViewModel';
import { useNativeOverlay } from '@/shared/lib/nativeBridge';

const HistoryIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const TrendIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m22 7-8.5 8.5-5-5L2 17" />
    <path d="M16 7h6v6" />
  </svg>
);

function Chip({ icon, label, onClick }) {
  return (
    <button type="button" className="search-chip" onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function SectionLabel({ children, action }) {
  return (
    <div className="search-section-label">
      <span>{children}</span>
      <span className="search-section-rule" />
      {action}
    </div>
  );
}

export function SearchSheet() {
  const {
    isOpen,
    query,
    setQuery,
    recents,
    results,
    inputRef,
    close,
    submit,
    clearRecents,
    openStore,
    showResults,
    voiceSearch,
  } = useSearchViewModel();
  // Hide the native floating cart bar while the sheet is up
  useNativeOverlay(isOpen);

  if (!isOpen) return null;

  const hasResults = results && (results.suggestion || results.stores.length > 0);

  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search for stores and items">
      <div className="search-sheet">
        <div className="search-sheet-top">
          <button type="button" className="search-back-btn" onClick={close} aria-label="Close search">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="search-sheet-title">Search for stores &amp; items</span>
        </div>

        <form
          className="search-sheet-input"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <SearchIcon size={18} color="#64748B" />
          <input
            ref={inputRef}
            id="global-search-input"
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="Drills, cement, paints, wires…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query ? (
            <button type="button" className="search-clear-btn" onClick={() => setQuery('')} aria-label="Clear search">
              ×
            </button>
          ) : null}
          <span className="search-input-divider" />
          <button type="button" className="search-mic-btn" onClick={voiceSearch} aria-label="Voice search">
            <MicIcon size={20} />
          </button>
        </form>

        <div className="search-sheet-body">
          {!results && (
            <>
              {recents.length > 0 && (
                <section>
                  <SectionLabel
                    action={
                      <button type="button" className="search-clear-recents" onClick={clearRecents}>
                        Clear
                      </button>
                    }
                  >
                    Recent searches
                  </SectionLabel>
                  <div className="search-chip-wrap">
                    {recents.map((term) => (
                      <Chip key={term} icon={<HistoryIcon />} label={term} onClick={() => showResults(term)} />
                    ))}
                  </div>
                </section>
              )}

              <section>
                <SectionLabel>Popular in Indore</SectionLabel>
                <div className="search-chip-wrap">
                  {POPULAR_SEARCHES.map((term) => (
                    <Chip key={term} icon={<TrendIcon />} label={term} onClick={() => showResults(term)} />
                  ))}
                </div>
              </section>
            </>
          )}

          {results && !hasResults && (
            <div className="search-empty">
              <strong>No matches for “{query.trim()}”</strong>
              <span>Try a brand, a tool name or a category like “paint”.</span>
            </div>
          )}

          {results?.suggestion && (
            <button type="button" className="search-suggestion-row" onClick={() => showResults(results.suggestion.term)}>
              <span className="search-suggestion-thumb">
                <img
                  src={results.suggestion.image}
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.src = '/images/cat-powertools.jpg'; }}
                />
              </span>
              <span className="search-result-text">
                <span className="search-suggestion-term">{results.suggestion.term}</span>
                <span className="search-result-meta">
                  Item • {results.suggestion.count} {results.suggestion.count === 1 ? 'match' : 'matches'}
                </span>
              </span>
              <SearchIcon size={20} color="#94A3B8" />
            </button>
          )}

          {results && results.stores.length > 0 && (
            <section>
              <SectionLabel>Stores relevant for ‘{query.trim()}’</SectionLabel>
              <ul className="search-result-list">
                {results.stores.map((store) => (
                  <li key={store.id}>
                    <button type="button" className="search-result-row" onClick={() => openStore(store)}>
                      <span className="search-store-avatar">{store.code}</span>
                      <span className="search-result-text">
                        <span className="search-result-name">{store.name}</span>
                        <span className="search-result-meta">
                          <StarIcon size={10} color="#0E8A42" fill="#0E8A42" /> {store.rating} ({store.ratingCount}) • {store.deliverySpeed}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* Tapping the dimmed page below closes the sheet */}
      <button type="button" className="search-backdrop" onClick={close} aria-label="Close search" />
    </div>
  );
}
