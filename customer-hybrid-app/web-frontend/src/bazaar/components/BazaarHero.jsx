'use client';

import React from 'react';
import styles from '../bazaar.module.css';

/**
 * Delivery promise plus the catalogue search field. Sits on --hero-from so it continues the
 * native header gradient rather than starting a new surface.
 */
export function BazaarHero({ eta, itemCount, searchQuery, onSearchChange }) {
  return (
    <section className={styles.hero}>
      <div className={styles.etaRow}>
        <span className={styles.etaBadge}>{eta}</span>
        <div className={styles.etaCopy}>
          <h1 className={styles.etaTitle}>Bazaar delivery in {eta}</h1>
          <p className={styles.etaSub}>{itemCount} items from your neighbourhood dealers</p>
        </div>
      </div>

      <div className={styles.searchWrap}>
        <span className={styles.searchIcon} aria-hidden="true">⌕</span>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search bolts, wires, paint, plywood…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search Bazaar items"
        />
        {searchQuery && (
          <button
            type="button"
            className={styles.searchClear}
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
    </section>
  );
}
