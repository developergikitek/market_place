'use client';

import React, { Suspense } from 'react';
import styles from '@/shared/components/orders/orderDetail.module.css';
import { KindBadge } from '@/shared/components/orders/OrderCard';
import { useOrderDetailViewModel } from '@/shared/viewmodels/useOrderDetailViewModel';
import { inr, qtyText, STATUS_LABEL, orderProgress } from '@/shared/lib/orderFormat';

const PinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m3 11 19-9-9 19-2-8-8-2Z" />
  </svg>
);

function Route({ order, address }) {
  return (
    <section className={styles.route}>
      <div className={styles.routeStop}>
        <span className={styles.routeIcon}><PinIcon /></span>
        <span>
          <span className={styles.routeFrom}>{order.storeName}</span>
          <span className={styles.routeLine}>{order.storeAddress}</span>
        </span>
      </div>
      <span className={styles.routeDash} aria-hidden="true" />
      <div className={styles.routeStop}>
        <span className={styles.routeIcon}><PinIcon /></span>
        <span>
          <span className={styles.routeTo}>{address?.tag || 'Delivery address'}</span>
          <span className={styles.routeLine}>{address?.line || '—'}</span>
        </span>
      </div>
    </section>
  );
}

function LiveTracking({ order, onCall }) {
  const current = order.trackingSteps?.find((s) => s.active);
  return (
    <>
      <section className={styles.liveHero}>
        <span className={styles.liveTag}><span className={styles.liveDot} /> {STATUS_LABEL[order.status]}</span>
        <h2 className={styles.liveHeadline}>{current?.title || order.statusLabel}</h2>
        {order.deliveryEta && (
          <p className={styles.liveEta}>Delivery {order.deliveryEta === 'Tomorrow' ? 'tomorrow' : order.deliveryEta}</p>
        )}
        <span className={styles.liveBar}><span style={{ width: `${Math.round(orderProgress(order) * 100)}%` }} /></span>
      </section>

      {order.trackingSteps?.length > 0 && (
        <ol className={styles.timeline}>
          {order.trackingSteps.map((step, i) => (
            <li key={i} className={step.done ? styles.stepDone : step.active ? styles.stepNow : ''}>
              <span>{step.title}</span>
              <span className={styles.stepTime}>{step.time}</span>
            </li>
          ))}
        </ol>
      )}

      {order.status === 'IN_TRANSIT' && order.deliveryPartner && (
        <section className={styles.partner}>
          <span>
            <strong>{order.deliveryPartner.name}</strong>
            <span>{order.deliveryPartner.vehicle}</span>
          </span>
          <button type="button" className={styles.callBtn} onClick={() => onCall(order.deliveryPartner.phone)}>
            Call
          </button>
        </section>
      )}
    </>
  );
}

function OrderDetailContent() {
  const vm = useOrderDetailViewModel();
  const { order } = vm;

  if (!order) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button type="button" className={styles.backBtn} onClick={vm.goBack} aria-label="Back">←</button>
          <span className={styles.headTitle}>Order</span>
        </header>
        {vm.loaded && <p className={styles.missing}>This order isn’t on this device.</p>}
      </div>
    );
  }

  const itemCount = order.items?.length || 0;
  const wholesale = vm.kind === 'WHOLESALE';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={vm.goBack} aria-label="Back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span className={styles.headText}>
          <span className={styles.headTitle}>Order #{order.orderId}</span>
          <span className={styles.headSub}>
            {STATUS_LABEL[order.status]}, {itemCount} {itemCount === 1 ? 'item' : 'items'}, {inr(order.totalAmount)}
          </span>
        </span>
        <KindBadge kind={vm.kind} />
      </header>

      <main className={styles.body}>
        {vm.live && <LiveTracking order={order} onCall={vm.callPartner} />}

        <div className={styles.block}>
          <Route order={order} address={vm.address} />
          {!vm.live && (
            <p className={styles.deliveredLine}>
              <span className={styles.check}>✓</span>
              <span>
                {order.status === 'CANCELLED' ? 'Order cancelled' : order.statusLabel || 'Order delivered'}
                <span className={styles.deliveredSub}>Ordered {order.placedAt}</span>
              </span>
            </p>
          )}
        </div>

        <h3 className={styles.billLabel}>Bill details</h3>
        <section className={styles.bill}>
          <ul className={styles.billItems}>
            {order.items?.map((it, i) => (
              <li key={i}>
                <span>{it.name} <span className={styles.billQty}>× {qtyText(it).replace(/×$/, '')}</span></span>
                <span>{inr(it.price * it.qty)}</span>
              </li>
            ))}
          </ul>
          <div className={styles.billRows}>
            {vm.bill.map((row) => (
              <div key={row.label} className={row.amount < 0 ? styles.billGood : ''}>
                <span>{row.label}</span>
                <span>{row.free ? 'FREE' : row.amount < 0 ? `−${inr(-row.amount)}` : inr(row.amount)}</span>
              </div>
            ))}
          </div>
          <div className={styles.billTotal}>
            <span className={styles.paidVia}>{order.paidVia ? `Paid via ${order.paidVia}` : ''}</span>
            <span>Bill Total <strong>{inr(order.totalAmount)}</strong></span>
          </div>
        </section>
      </main>

      <div className={styles.footer}>
        <button type="button" className={styles.reorder} onClick={vm.reorder}>
          {wholesale ? 'VIEW QUOTES' : 'REORDER'}
        </button>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={null}>
      <OrderDetailContent />
    </Suspense>
  );
}
