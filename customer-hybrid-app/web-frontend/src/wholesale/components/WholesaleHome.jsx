'use client';

import React from 'react';
import styles from './wholesale.module.css';
import { QuoteBanner } from './QuoteBanner';

const STEPS = [
  { n: 1, title: 'Add products', text: 'Pick items and bulk quantities from the catalog.' },
  { n: 2, title: 'Sellers quote', text: 'Wholesalers near you send rates for what they can supply.' },
  { n: 3, title: 'Pick the best', text: 'Compare quotes item by item and accept one.' },
];

const STATUS = {
  open: { label: 'Receiving quotes', cls: 'pillLive' },
  accepted: { label: 'Order confirmed', cls: 'pillDone' },
  cancelled: { label: 'Cancelled', cls: 'pillOff' },
};

const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/** Confirmed requirement = an order: vendor, total, ETA, mini tracker, Track order. */
function ConfirmedOrderCard({ requirement, order, onTrack, onOpen }) {
  return (
    <div className={`${styles.reqCard} ${styles.orderCard}`}>
      <span className={styles.reqTop}>
        <span className={styles.reqId}>#{requirement.id}</span>
        <span className={`${styles.pill} ${styles.pillDone}`}>Order confirmed</span>
      </span>

      <span className={styles.orderVendorRow}>
        <span className={styles.vendorAvatarSm}>{order.vendorCode}</span>
        <span className={styles.orderVendorText}>
          <strong>{order.vendorName}</strong>
          <span>
            {inr(order.total)} · {order.itemsCovered}/{order.itemsRequested} products
          </span>
        </span>
      </span>

      <ol className={styles.miniTrack} aria-label="Order progress">
        <li className={styles.trackDone}>Accepted</li>
        <li className={styles.trackNow}>Preparing</li>
        <li>Delivery {order.deliveryLabel.toLowerCase() === 'tomorrow' ? 'tomorrow' : order.deliveryLabel}</li>
      </ol>

      <span className={styles.orderActions}>
        <button type="button" className={styles.trackBtn} onClick={onTrack}>
          Track order
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
        <button type="button" className={styles.ghostBtn} onClick={onOpen}>View quotes</button>
      </span>
    </div>
  );
}

export function WholesaleHome({ requirementCards, draftCount, onCreate, onOpenRequirement, onTrackOrder }) {
  return (
    <main className={styles.home}>
      <QuoteBanner onCreate={onCreate} />

      {draftCount > 0 && (
        <button type="button" className={styles.draftRow} onClick={onCreate}>
          <span>
            <strong>Unfinished requirement</strong>
            <span className={styles.muted}> · {draftCount} {draftCount === 1 ? 'item' : 'items'}</span>
          </span>
          <span className={styles.link}>Continue →</span>
        </button>
      )}

      {requirementCards.length > 0 && (
        <section>
          <h3 className={styles.sectionLabel}>Your requirements</h3>
          <ul className={styles.reqList}>
            {requirementCards.map(({ requirement: r, quoteCount, bestVsMarketPct, postedAgo, order }) => {
              const status = STATUS[r.status];
              if (order) {
                return (
                  <li key={r.id}>
                    <ConfirmedOrderCard
                      requirement={r}
                      order={order}
                      onTrack={() => onTrackOrder(r)}
                      onOpen={() => onOpenRequirement(r.id)}
                    />
                  </li>
                );
              }
              return (
                <li key={r.id}>
                  <button type="button" className={styles.reqCard} onClick={() => onOpenRequirement(r.id)}>
                    <span className={styles.reqTop}>
                      <span className={styles.reqId}>#{r.id}</span>
                      <span className={`${styles.pill} ${styles[status.cls]}`}>{status.label}</span>
                    </span>
                    <span className={styles.reqMeta}>
                      {r.items.length} {r.items.length === 1 ? 'product' : 'products'} {postedAgo && ` · posted ${postedAgo}`}
                    </span>
                    <span className={styles.reqBottom}>
                      <span>
                        <strong>{quoteCount}</strong> {quoteCount === 1 ? 'quote' : 'quotes'}
                        {bestVsMarketPct !== null && bestVsMarketPct < 0 && (
                          <span className={styles.good}> · best {Math.abs(bestVsMarketPct)}% below market</span>
                        )}
                      </span>
                      <span className={styles.link}>{r.status === 'open' ? 'Compare →' : 'View →'}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <h3 className={styles.sectionLabel}>How it works</h3>
        <ol className={styles.steps}>
          {STEPS.map((s) => (
            <li key={s.n} className={styles.step}>
              <span className={styles.stepNum}>{s.n}</span>
              <span>
                <strong className={styles.stepTitle}>{s.title}</strong>
                <span className={styles.stepText}>{s.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
