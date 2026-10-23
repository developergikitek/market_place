'use client';

import React from 'react';
import styles from '../bazaar.module.css';

/** Scrolling offer cards between the category rail and the shelves. */
export function BazaarOfferStrip({ offers }) {
  return (
    <section className={styles.offers} aria-label="Bazaar offers">
      {offers.map((offer) => (
        <div key={offer.id} className={styles.offerCard}>
          <p className={styles.offerTitle}>{offer.title}</p>
          <p className={styles.offerSub}>{offer.sub}</p>
          {offer.code && <span className={styles.offerCode}>{offer.code}</span>}
        </div>
      ))}
    </section>
  );
}
