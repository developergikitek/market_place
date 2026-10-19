'use client';

import React from 'react';

export function CategoryGrid({ config, onSelectCategory, onViewAll }) {
  if (config.sections?.categoryTiles === false) return null;

  const categories = (config.categoryTiles || []).filter((c) => c.enabled);

  return (
    <>
      <div className="retail-section-header">
        <h3 className="retail-section-title">Shop by Category</h3>
        <a
          href="/categories"
          className="retail-see-all-btn"
          onClick={(e) => {
            if (onViewAll) {
              e.preventDefault();
              onViewAll();
            }
          }}
        >
          View All →
        </a>
      </div>

      <div className="category-visual-grid">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className="category-visual-btn"
            onClick={() => onSelectCategory(cat.query)}
          >
            <div className="category-image-circle">
              <img
                src={cat.image}
                alt={cat.name}
                referrerPolicy="no-referrer"
                onError={(e) => { e.currentTarget.src = "/images/cat-powertools.jpg"; }}
              />
            </div>
            <span className="category-visual-label">{cat.name}</span>
          </button>
        ))}
      </div>
    </>
  );
}
