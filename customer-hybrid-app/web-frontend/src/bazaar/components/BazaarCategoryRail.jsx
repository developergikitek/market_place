'use client';

import React from 'react';
import styles from '../bazaar.module.css';

/** Horizontally scrolling category chips with circular art, Blinkit-style. */
export function BazaarCategoryRail({ categories, selectedId, onSelect }) {
  return (
    <nav className={styles.rail} aria-label="Bazaar categories">
      {categories.map((category) => {
        const active = category.id === selectedId;
        return (
          <button
            key={category.id}
            type="button"
            className={`${styles.railItem} ${active ? styles.railItemActive : ''}`}
            onClick={() => onSelect(category.id)}
            aria-pressed={active}
          >
            <span className={styles.railArt}>
              <img
                src={category.image}
                alt=""
                className={styles.railImg}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.visibility = 'hidden';
                }}
              />
            </span>
            <span className={styles.railLabel}>{category.name}</span>
          </button>
        );
      })}
    </nav>
  );
}
