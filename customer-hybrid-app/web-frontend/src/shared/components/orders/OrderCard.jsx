'use client';

import React from 'react';
import styles from './orders.module.css';
import { inr, orderKind, isLive, qtyText, storeInitials, STATUS_LABEL } from '@/shared/lib/orderFormat';

const MAX_LINES = 3;

export function KindBadge({ kind }) {
  return (
    <span className={`${styles.kindBadge} ${kind === 'WHOLESALE' ? styles.kindWholesale : styles.kindRetail}`}>
      {kind === 'WHOLESALE' ? 'Wholesale' : 'Retail'}
    </span>
  );
}

function StoreThumb({ order }) {
  const kind = orderKind(order);
  return (
    <span className={`${styles.thumb} ${kind === 'WHOLESALE' ? styles.thumbWholesale : styles.thumbRetail}`}>
      {storeInitials(order.storeName)}
    </span>
  );
}

/** Swiggy-style order card. Live orders show their status and Track order; past ones Reorder. */
export function OrderCard({ order, onOpen, onReorder }) {
  const kind = orderKind(order);
  const items = order.items || [];
  const extra = items.length - MAX_LINES;
  const cancelled = order.status === 'CANCELLED';
  const live = isLive(order);
  return (
    <article className={styles.pastCard}>
      <button type="button" className={styles.pastOpen} onClick={() => onOpen(order)}>
        <span className={styles.storeRow}>
          <StoreThumb order={order} />
          <span className={styles.storeText}>
            <span className={styles.storeName}>{order.storeName}</span>
            <span className={styles.storeArea}>{order.storeAddress}</span>
          </span>
          {live ? (
            <span className={order.status === 'IN_TRANSIT' ? styles.onTheWay : styles.preparing}>
              <span className={styles.liveDot} aria-hidden="true" />
              {STATUS_LABEL[order.status]}
            </span>
          ) : (
          <span className={cancelled ? styles.cancelled : styles.delivered}>
            {cancelled ? 'Cancelled' : 'Delivered'}
            {!cancelled && (
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" fill="currentColor" />
                <path d="m7.5 12.5 3 3 6-6.5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          )}
        </span>

        <span className={styles.lines}>
          {items.slice(0, MAX_LINES).map((it, i) => (
            <span key={i} className={styles.line}>
              <span className={styles.qtyChip}>{qtyText(it)}</span>
              <span className={styles.lineName}>{it.name}</span>
            </span>
          ))}
          {extra > 0 && <span className={styles.more}>+ {extra} more</span>}
        </span>
      </button>

      <div className={styles.pastBottom}>
        {live ? (
          <button type="button" className={styles.trackBtn} onClick={() => onOpen(order)}>
            Track order
          </button>
        ) : (
          <button type="button" className={`${styles.reorderBtn} ${kind === 'WHOLESALE' ? styles.reorderWholesale : ''}`} onClick={() => onReorder(order)}>
            {kind === 'WHOLESALE' ? 'View quotes' : 'Reorder'}
          </button>
        )}
        <p className={styles.pastMeta}>
          Ordered: {order.placedAt} • Bill Total: {inr(order.totalAmount)}
        </p>
      </div>
    </article>
  );
}
