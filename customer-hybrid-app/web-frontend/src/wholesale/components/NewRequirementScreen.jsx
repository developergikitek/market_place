'use client';

import React, { useEffect, useRef } from 'react';
import styles from './wholesale.module.css';
import { unitLabel } from '../models/wholesaleCatalog';
import { useNativeOverlay } from '@/shared/lib/nativeBridge';

const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export function BackHeader({ title, subtitle, onBack }) {
  return (
    <header className={styles.backHeader}>
      <button type="button" className={styles.backBtn} onClick={onBack} aria-label="Go back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <span className={styles.backTitles}>
        <span className={styles.backTitle}>{title}</span>
        {subtitle && <span className={styles.backSub}>{subtitle}</span>}
      </span>
    </header>
  );
}

function QtyControl({ item, qty, onInc, onDec, onSet, onCommit }) {
  if (!qty) {
    return (
      <button type="button" className={styles.addBtn} onClick={() => onInc(item)}>
        ADD
      </button>
    );
  }
  return (
    <div className={styles.qtyControl}>
      <button type="button" onClick={() => onDec(item)} aria-label={`Less ${item.name}`}>−</button>
      <input
        type="number"
        inputMode="numeric"
        min={item.moq}
        step={item.step}
        value={qty}
        onChange={(e) => onSet(item, e.target.value)}
        onBlur={() => onCommit(item)}
        aria-label={`Quantity of ${item.name} in ${item.unit}s`}
      />
      <button type="button" onClick={() => onInc(item)} aria-label={`More ${item.name}`}>+</button>
    </div>
  );
}

function ReviewSheet({ lines, estimate, onClose, onPost }) {
  useNativeOverlay(true);
  return (
    <div className={styles.sheetBackdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Review requirement">
        <h3 className={styles.sheetTitle}>Review requirement</h3>
        <p className={styles.sheetText}>Sellers near Indore Central will see this list and send quotes. Bidding stays open until you accept one.</p>
        <ul className={styles.reviewList}>
          {lines.map(({ item, qty }) => (
            <li key={item.id}>
              <span>{item.name}</span>
              <strong>{qty} {unitLabel(item.unit, qty)}</strong>
            </li>
          ))}
        </ul>
        <div className={styles.estimateRow}>
          <span>Market estimate</span>
          <strong>~{inr(estimate)}</strong>
        </div>
        <div className={styles.sheetActions}>
          <button type="button" className={styles.secondaryBtn} onClick={onClose}>Edit</button>
          <button type="button" className={styles.primaryBtn} onClick={onPost}>Post to sellers</button>
        </div>
      </div>
    </div>
  );
}

export function NewRequirementScreen(vm) {
  const count = vm.draftLines.length;
  const searchRef = useRef(null);
  const { focusSearch } = vm;

  useEffect(() => {
    if (!focusSearch) return undefined;
    // Retried briefly: inside the Android shell the WebView takes native focus a moment later
    const timers = [0, 150, 400].map((ms) =>
      setTimeout(() => {
        if (document.activeElement !== searchRef.current) searchRef.current?.focus();
      }, ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [focusSearch]);
  return (
    <div className={styles.page}>
      <div className={styles.stickyTop}>
        <BackHeader title="Create requirement" subtitle="Add products and bulk quantities" onBack={vm.goBack} />
        <div className={styles.searchBox}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            id="wholesale-catalog-search"
            ref={searchRef}
            type="search"
            placeholder="Search cement, TMT, wires…"
            value={vm.query}
            onChange={(e) => vm.setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className={styles.catRow}>
          {vm.categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`${styles.catChip} ${vm.category === c.id ? styles.catChipOn : ''}`}
              onClick={() => vm.setCategory(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <ul className={styles.catalogList}>
        {vm.items.length === 0 && (
          <li className={styles.emptyNote}>No products match “{vm.query}”.</li>
        )}
        {vm.items.map((item) => (
          <li key={item.id} className={styles.catalogRow}>
            <img src={item.image} alt="" className={styles.catalogImg} onError={(e) => { e.currentTarget.src = '/images/cat-cement-cutout.jpg'; }} />
            <div className={styles.catalogInfo}>
              <span className={styles.catalogName}>{item.name}</span>
              <span className={styles.catalogSpec}>{item.spec}</span>
              <span className={styles.catalogMeta}>
                Market ~{inr(item.marketRate)}/{item.unit} · MOQ {item.moq} {unitLabel(item.unit, item.moq)}
              </span>
            </div>
            <QtyControl
              item={item}
              qty={vm.draft[item.id] || 0}
              onInc={vm.increment}
              onDec={vm.decrement}
              onSet={vm.setQty}
              onCommit={vm.commitQty}
            />
          </li>
        ))}
      </ul>

      {count > 0 && (
        <div className={styles.bottomBar}>
          <span className={styles.bottomInfo}>
            <strong>{count} {count === 1 ? 'product' : 'products'}</strong>
            <span>Market estimate ~{inr(vm.estimate)}</span>
          </span>
          <button type="button" className={styles.primaryBtn} onClick={vm.openReview}>
            Get quotes
          </button>
        </div>
      )}

      {vm.reviewOpen && (
        <ReviewSheet lines={vm.draftLines} estimate={vm.estimate} onClose={vm.closeReview} onPost={vm.post} />
      )}
    </div>
  );
}
