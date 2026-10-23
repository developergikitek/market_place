'use client';

import React from 'react';
import styles from '../bazaar.module.css';
import { BazaarProductCard } from './BazaarProductCard';

function Grid({ products, getItemQty, onAdd, onDecrement }) {
  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <BazaarProductCard
          key={product.id}
          product={product}
          qty={getItemQty(product.id)}
          onAdd={onAdd}
          onDecrement={onDecrement}
        />
      ))}
    </div>
  );
}

/**
 * The catalogue body. While browsing everything it reads as titled shelves per category;
 * a search or category filter collapses it to one flat grid of matches.
 */
export function BazaarShelves({
  shelves,
  products,
  searchQuery,
  getItemQty,
  onAdd,
  onDecrement,
  onSeeAll,
}) {
  if (products.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>Nothing matched “{searchQuery}”</p>
        <p className={styles.emptySub}>Try bolts, wire, paint, plywood or a dealer name.</p>
      </div>
    );
  }

  if (shelves) {
    return (
      <>
        {shelves.map((shelf) => (
          <section key={shelf.id} className={styles.shelf}>
            <header className={styles.shelfHead}>
              <h2 className={styles.shelfTitle}>{shelf.name}</h2>
              <button type="button" className={styles.shelfLink} onClick={() => onSeeAll(shelf.id)}>
                See all
              </button>
            </header>
            <Grid
              products={shelf.products.slice(0, 4)}
              getItemQty={getItemQty}
              onAdd={onAdd}
              onDecrement={onDecrement}
            />
          </section>
        ))}
      </>
    );
  }

  return (
    <section className={styles.shelf}>
      <header className={styles.shelfHead}>
        <h2 className={styles.shelfTitle}>
          {searchQuery ? 'Results' : 'All items'}
          <span className={styles.shelfCount}> ({products.length})</span>
        </h2>
      </header>
      <Grid products={products} getItemQty={getItemQty} onAdd={onAdd} onDecrement={onDecrement} />
    </section>
  );
}
