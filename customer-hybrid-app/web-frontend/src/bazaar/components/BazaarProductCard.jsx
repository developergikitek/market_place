'use client';

import React from 'react';
import styles from '../bazaar.module.css';

const FALLBACK_IMAGE = '/images/cat-drill-cutout.jpg';

/**
 * Blinkit / Zepto style item tile: image with the ADD control overlapping its lower edge,
 * then name, pack and price. Used by both the shelf grid and the best-sellers rail.
 */
export function BazaarProductCard({ product, qty, onAdd, onDecrement }) {
  const saving = product.originalPrice > product.price;

  return (
    <article className={styles.card}>
      <div className={styles.cardMedia}>
        {product.discount && <span className={styles.discountTag}>{product.discount}</span>}
        <img
          src={product.image}
          alt={product.name}
          className={styles.cardImg}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMAGE;
          }}
        />

        <div className={styles.addSlot}>
          {qty > 0 ? (
            <div className={styles.stepper}>
              <button
                type="button"
                className={styles.stepperBtn}
                onClick={() => onDecrement(product.id)}
                aria-label={`Remove one ${product.name}`}
              >
                −
              </button>
              <span className={styles.stepperQty}>{qty}</span>
              <button
                type="button"
                className={styles.stepperBtn}
                onClick={() => onAdd(product)}
                aria-label={`Add one more ${product.name}`}
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => onAdd(product)}
              aria-label={`Add ${product.name} to cart`}
            >
              ADD
            </button>
          )}
        </div>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardName}>{product.name}</h3>
        <p className={styles.cardPack}>{product.pack}</p>
        <div className={styles.priceRow}>
          <span className={styles.price}>₹{product.price.toLocaleString('en-IN')}</span>
          {saving && (
            <span className={styles.mrp}>₹{product.originalPrice.toLocaleString('en-IN')}</span>
          )}
        </div>
        {product.dealer && <p className={styles.dealer}>{product.dealer}</p>}
      </div>
    </article>
  );
}
