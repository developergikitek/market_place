'use client';

import React from 'react';

export function ContractorPromoBanner({ onExplore }) {
  return (
    <section className="categories-promo-card">
      <div className="categories-promo-text-col">
        <h3 className="categories-promo-title">
          Find the right store<br />for your needs
        </h3>
        <p className="categories-promo-sub">
          Quality products • Best prices • Fast delivery
        </p>
        <button
          type="button"
          className="categories-promo-cta-btn"
          onClick={onExplore}
        >
          EXPLORE STORES
        </button>
      </div>

      <div className="categories-promo-img-col">
        <img
          src="/images/banner-toolcaddy.jpg"
          alt="Hardware Store Tools"
          className="categories-promo-img"
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
        />
      </div>
    </section>
  );
}
