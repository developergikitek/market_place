'use client';

import React from 'react';

export function StoreCategoriesTray({
  categories = [],
  selectedCategoryId = 'all',
  onSelectCategory,
  onViewAll,
}) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="store-categories-section">
      <div className="store-section-header-flex">
        <h2 className="store-section-title">Categories</h2>
        <button
          type="button"
          className="store-section-link-btn"
          onClick={onViewAll}
        >
          View all
        </button>
      </div>

      <div className="store-categories-scroll-tray">
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              className={`store-cat-circle-item ${isSelected ? 'store-cat-item-active' : ''}`}
              onClick={() => onSelectCategory(cat.id === selectedCategoryId ? 'all' : cat.id)}
            >
              <div className="store-cat-circle-wrap">
                {cat.isAll ? (
                  <div className="store-cat-all-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#3B82F6">
                      <rect x="3" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" />
                      <rect x="14" y="14" width="7" height="7" rx="1.5" />
                    </svg>
                  </div>
                ) : (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="store-cat-circle-img"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = '/images/cat-drill-cutout.jpg';
                    }}
                  />
                )}
              </div>
              <span className="store-cat-circle-label">{cat.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
