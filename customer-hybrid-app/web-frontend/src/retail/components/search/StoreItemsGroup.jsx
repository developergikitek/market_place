'use client';

import React from 'react';
import { StarIcon } from '@/shared/components/Icons';

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

function AddControl({ qty, onAdd, onRemove }) {
  if (qty > 0) {
    return (
      <div className="sr-add-btn sr-stepper">
        <button type="button" onClick={onRemove} aria-label="Remove one">−</button>
        <span>{qty}</span>
        <button type="button" onClick={onAdd} aria-label="Add one">+</button>
      </div>
    );
  }
  return (
    <button type="button" className="sr-add-btn" onClick={onAdd}>
      ADD
    </button>
  );
}

/** Items tab: one store with its matching items in a horizontal row (Swiggy "Dishes" layout) */
export function StoreItemsGroup({ store, products, qtyFor, onAdd, onRemove, onOpenStore }) {
  return (
    <section className="sr-group-card">
      <button type="button" className="sr-group-head" onClick={() => onOpenStore(store)}>
        <span className="sr-group-info">
          <span className="sr-group-name">{store.name}</span>
          <span className="sr-group-meta">
            <span className="sr-star-dot"><StarIcon size={9} color="#FFFFFF" fill="#FFFFFF" /></span>
            {store.rating} ({store.ratingCount}) • {store.deliverySpeed}
          </span>
          {store.offerText && (
            <span className="sr-group-offer">
              <span className="sr-offer-badge">%</span>
              {store.offerText}
            </span>
          )}
        </span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>

      {store.deliveryInfo && <div className="sr-perk-strip">🚚 {store.deliveryInfo}</div>}

      <div className="sr-item-scroller">
        {products.map((product) => (
          <article key={product.id} className="sr-item-card">
            <div className="sr-item-text">
              {product.isBestSeller && <span className="sr-bestseller">★ Bestseller</span>}
              <h4 className="sr-item-name">{product.name}</h4>
              {product.pack && <p className="sr-item-pack">{product.pack}</p>}
              <div className="sr-item-price">
                <span>{inr(product.price)}</span>
                {product.originalPrice > product.price && <s>{inr(product.originalPrice)}</s>}
              </div>
            </div>
            <div className="sr-item-media">
              <img
                src={product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                onError={(e) => { e.currentTarget.src = '/images/cat-powertools.jpg'; }}
              />
              {product.discount && <span className="sr-discount-tag">{product.discount}</span>}
              <AddControl
                qty={qtyFor(store.id, product.id)}
                onAdd={() => onAdd(store, product)}
                onRemove={() => onRemove(store, product)}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Stores tab: Swiggy "featured restaurant" row card */
export function StoreResultCard({ store, onOpenStore }) {
  return (
    <button type="button" className="sr-store-card" onClick={() => onOpenStore(store)}>
      <span className="sr-store-cover">
        <img
          src={store.coverImage}
          alt=""
          referrerPolicy="no-referrer"
          onError={(e) => { e.currentTarget.src = '/images/store-sharma.jpg'; }}
        />
        {store.offerText && <span className="sr-store-cover-offer">{store.offerText}</span>}
      </span>
      <span className="sr-store-body">
        {store.hasOne && <span className="sr-pro-tag">✓ Pro Verified</span>}
        <span className="sr-store-name">{store.name}</span>
        <span className="sr-group-meta">
          <span className="sr-star-dot"><StarIcon size={9} color="#FFFFFF" fill="#FFFFFF" /></span>
          {store.rating} ({store.ratingCount}) • {store.deliverySpeed}
        </span>
        <span className="sr-store-cats">{store.categoriesLine}</span>
        {store.deliveryInfo && <span className="sr-store-perk">{store.deliveryInfo}</span>}
      </span>
    </button>
  );
}
