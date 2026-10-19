'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from '@/shared/components/orders/orders.module.css';
import { OrderCard } from '@/shared/components/orders/OrderCard';
import { useOrdersViewModel, ORDER_TYPES } from '@/shared/viewmodels/useOrdersViewModel';

function OrdersContent() {
  const vm = useOrdersViewModel();

  return (
    <div className={`app-viewport ${styles.page}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Orders</h1>
      </header>

      <main className={styles.body}>
        <section className={styles.section}>
          <div className={styles.segment} role="tablist" aria-label="Order type">
            {ORDER_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={vm.type === t.id}
                className={`${styles.segBtn} ${vm.type === t.id ? styles.segOn : ''}`}
                onClick={() => vm.setType(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {vm.orders.length === 0 ? (
            <div className={styles.empty}>
              <strong>{vm.type === 'WHOLESALE' ? 'No wholesale orders yet' : 'No store orders yet'}</strong>
              <span>
                {vm.type === 'WHOLESALE'
                  ? 'Accept a seller’s quote on a bulk requirement to see it here.'
                  : 'Orders you place from stores near you show up here.'}
              </span>
              <button
                type="button"
                className={styles.emptyBtn}
                onClick={vm.type === 'WHOLESALE' ? vm.shopWholesale : vm.shopRetail}
              >
                {vm.type === 'WHOLESALE' ? 'Go to Wholesale' : 'Browse stores'}
              </button>
            </div>
          ) : (
            vm.orders.map((order) => (
              <OrderCard key={order.orderId} order={order} onOpen={vm.openOrder} onReorder={vm.reorder} />
            ))
          )}
        </section>
      </main>
    </div>
  );
}

// Keyed by ?type so switching modes (Retail / Wholesale tab bar) re-opens the right tab
function OrdersByType() {
  const type = useSearchParams()?.get('type') || 'retail';
  return <OrdersContent key={type} />;
}

export default function OrdersPage() {
  return (
    <Suspense fallback={null}>
      <OrdersByType />
    </Suspense>
  );
}
