'use client';

import React from 'react';

export function TopCategoriesGrid({
  categories = [],
  onSelectCategory,
}) {
  return (
    <section className="categories-grid-section">
      <div className="categories-section-header">
        <h2 className="categories-section-heading">Top Categories</h2>
      </div>

      <div className="categories-card-grid">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className="category-item-card"
            style={{
              outline: 'none',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
            }}
            onClick={() => onSelectCategory(cat.id)}
          >
            <div className="category-item-img-box">
              {cat.isIcon ? (
                <div className="category-all-icon-box">
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
                  className="category-item-img"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = '/images/cat-drill-cutout.jpg';
                  }}
                />
              )}
            </div>

            <span className="category-item-name">{cat.name}</span>
            <span className="category-item-count">{cat.storeCount}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
