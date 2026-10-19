'use client';

import React, { useState } from 'react';
import styles from './wholesale.module.css';
import { BackHeader } from './NewRequirementScreen';
import { unitLabel } from '../models/wholesaleCatalog';
import { QUOTE_SORTS } from '../viewmodels/useRequirementViewModel';
import { useNativeOverlay } from '@/shared/lib/nativeBridge';

const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

function vsMarketText(pct) {
  if (pct < 0) return { text: `${Math.abs(pct)}% below market`, cls: styles.good };
  if (pct > 0) return { text: `${pct}% above market`, cls: styles.warn };
  return { text: 'At market rate', cls: styles.muted };
}

function gapsSummary(quote) {
  const missing = quote.lines.filter((l) => !l.available).map((l) => l.item?.name);
  const short = quote.lines.filter((l) => l.available && l.offeredQty < l.requestedQty);
  const parts = [];
  if (missing.length) parts.push(`Can't supply: ${missing.join(', ')}`);
  if (short.length) parts.push(`Less qty: ${short.map((l) => `${l.item.name} (${l.offeredQty}/${l.requestedQty})`).join(', ')}`);
  return parts;
}

function StatusCard({ requirement, quotesCount, nextReplySec, acceptedQuote, deliveryLabel, onTrackOrder }) {
  if (requirement.status === 'accepted' && acceptedQuote) {
    return (
      <section className={`${styles.statusCard} ${styles.statusDone}`}>
        <span className={styles.statusTitle}>✓ Order confirmed</span>
        <span className={styles.statusText}>
          {acceptedQuote.vendor.name} is preparing {acceptedQuote.itemsCovered} of {acceptedQuote.itemsRequested} products.
          {' '}Delivery {deliveryLabel === 'Tomorrow' ? 'tomorrow' : deliveryLabel} · {inr(acceptedQuote.total)} incl. GST.
        </span>
        <button type="button" className={`${styles.trackBtn} ${styles.trackBtnWide}`} onClick={onTrackOrder}>
          Track order in My Orders
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </section>
    );
  }
  if (requirement.status === 'cancelled') {
    return (
      <section className={`${styles.statusCard} ${styles.statusOff}`}>
        <span className={styles.statusTitle}>Requirement cancelled</span>
        <span className={styles.statusText}>Sellers can no longer quote on this list.</span>
      </section>
    );
  }
  return (
    <section className={styles.statusCard}>
      <span className={styles.statusTitle}>
        <span className={styles.liveDot} aria-hidden="true" /> Receiving quotes
      </span>
      <span className={styles.statusText}>
        {quotesCount === 0 ? 'Your list was sent to wholesale sellers near Indore Central.' : `${quotesCount} ${quotesCount === 1 ? 'seller has' : 'sellers have'} replied.`}
        {nextReplySec !== null && ` Next quote expected in ~${nextReplySec}s.`}
        {' '}Bidding stays open until you accept a quote.
      </span>
    </section>
  );
}

function QuoteCard({ quote, tags, accepted, onOpen }) {
  const market = vsMarketText(quote.vsMarketPct);
  const gaps = gapsSummary(quote);
  const coveragePct = Math.round(quote.qtyCoverage * 100);
  return (
    <li>
      <button type="button" className={`${styles.quoteCard} ${accepted ? styles.quoteAccepted : ''}`} onClick={onOpen}>
        <span className={styles.quoteHead}>
          <span className={styles.vendorAvatar}>{quote.vendor.code}</span>
          <span className={styles.quoteVendor}>
            <span className={styles.vendorName}>{quote.vendor.name}</span>
            <span className={styles.vendorMeta}>★ {quote.vendor.rating} ({quote.vendor.ratingCount}) · {quote.vendor.locality}</span>
          </span>
        </span>

        {(tags?.length > 0 || quote.isComplete || accepted) && (
          <span className={styles.tagRow}>
            {accepted && <span className={`${styles.tag} ${styles.tagAccepted}`}>Accepted</span>}
            {quote.isComplete && <span className={`${styles.tag} ${styles.tagGood}`}>Full list</span>}
            {tags?.map((t) => <span key={t} className={styles.tag}>{t}</span>)}
          </span>
        )}

        <span className={styles.coverage}>
          <span className={styles.coverageText}>
            {quote.itemsCovered}/{quote.itemsRequested} products · {coveragePct}% of quantity
          </span>
          <span className={styles.coverageBar}><span style={{ width: `${coveragePct}%` }} /></span>
        </span>

        {gaps.length > 0 && (
          <span className={styles.gaps}>{gaps.map((g) => <span key={g}>{g}</span>)}</span>
        )}

        <span className={styles.quoteFoot}>
          <span>
            <span className={styles.quoteTotal}>{inr(quote.total)}</span>
            <span className={styles.muted}> incl. GST</span>
            <span className={`${styles.quoteMarket} ${market.cls}`}>{market.text}</span>
          </span>
          <span className={styles.quoteDelivery}>
            {quote.deliveryDays === 1 ? 'Next-day' : `${quote.deliveryDays}-day`} delivery
            <span className={styles.link}>View quote →</span>
          </span>
        </span>
      </button>
    </li>
  );
}

function QuoteSheet({ quote, canAccept, confirming, onClose, onStartAccept, onCancelAccept, onConfirmAccept }) {
  useNativeOverlay(true);
  const missingCount = quote.lines.filter((l) => !l.available || l.offeredQty < l.requestedQty).length;
  return (
    <div className={styles.sheetBackdrop} onClick={onClose}>
      <div className={`${styles.sheet} ${styles.sheetTall}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Quote from ${quote.vendor.name}`}>
        <div className={styles.sheetHead}>
          <span className={styles.vendorAvatar}>{quote.vendor.code}</span>
          <span className={styles.quoteVendor}>
            <span className={styles.vendorName}>{quote.vendor.name}</span>
            <span className={styles.vendorMeta}>
              ★ {quote.vendor.rating} · {quote.deliveryDays === 1 ? 'Next-day' : `${quote.deliveryDays}-day`} delivery · {quote.vendor.gstInvoice ? 'GST invoice' : 'No GST invoice'}
            </span>
          </span>
          <button type="button" className={styles.sheetClose} onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className={styles.lineTableWrap}>
          <table className={styles.lineTable}>
            <thead>
              <tr><th>Product</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
            </thead>
            <tbody>
              {quote.lines.map((l) => (
                <tr key={l.itemId} className={!l.available ? styles.lineMissing : ''}>
                  <td>
                    <span className={styles.lineName}>{l.item?.name}</span>
                    {!l.available && <span className={styles.lineFlag}>Not available</span>}
                    {l.available && l.offeredQty < l.requestedQty && (
                      <span className={styles.lineFlagWarn}>You asked {l.requestedQty}</span>
                    )}
                  </td>
                  <td>{l.available ? `${l.offeredQty} ${unitLabel(l.item.unit, l.offeredQty)}` : '—'}</td>
                  <td>{l.available ? inr(l.rate) : '—'}</td>
                  <td>{l.available ? inr(l.amount) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.billRows}>
          <div><span>Subtotal</span><span>{inr(quote.subtotal)}</span></div>
          <div><span>GST 18%</span><span>{inr(quote.gst)}</span></div>
          <div className={styles.billTotal}><span>Total</span><span>{inr(quote.total)}</span></div>
        </div>

        {canAccept && !confirming && (
          <button type="button" className={`${styles.primaryBtn} ${styles.fullBtn}`} onClick={onStartAccept}>
            Accept this quote
          </button>
        )}

        {canAccept && confirming && (
          <div className={styles.confirmBox}>
            <strong>Accept {quote.vendor.name}’s quote?</strong>
            <span>
              Bidding closes and other quotes are declined.
              {missingCount > 0 && ` ${missingCount} ${missingCount === 1 ? 'product is' : 'products are'} short or not available in this quote.`}
            </span>
            <div className={styles.sheetActions}>
              <button type="button" className={styles.secondaryBtn} onClick={onCancelAccept}>Back</button>
              <button type="button" className={styles.primaryBtn} onClick={onConfirmAccept}>Confirm {inr(quote.total)}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function RequirementScreen(vm) {
  const [listOpen, setListOpen] = useState(false);
  const [cancelAsk, setCancelAsk] = useState(false);
  const r = vm.requirement;

  if (!r) {
    return (
      <div className={styles.page}>
        <BackHeader title="Requirement" onBack={vm.goBack} />
        <p className={styles.emptyNote}>This requirement isn’t on this device anymore.</p>
        <button type="button" className={`${styles.primaryBtn} ${styles.centerBtn}`} onClick={vm.goHome}>Go to Wholesale</button>
      </div>
    );
  }

  const isOpen = r.status === 'open';
  const showSorts = isOpen && vm.quotes.length > 1;

  return (
    <div className={styles.page}>
      <div className={styles.stickyTop}>
        <BackHeader
          title={`Requirement #${r.id}`}
          subtitle={`${r.items.length} ${r.items.length === 1 ? 'product' : 'products'}`}
          onBack={vm.goBack}
        />
      </div>

      <div className={styles.reqBody}>
        <StatusCard
          requirement={r}
          quotesCount={vm.quotes.length}
          nextReplySec={vm.nextReplySec}
          acceptedQuote={vm.acceptedQuote}
          deliveryLabel={vm.deliveryLabel}
          onTrackOrder={vm.trackOrder}
        />

        <section className={styles.listCard}>
          <button type="button" className={styles.listToggle} onClick={() => setListOpen((v) => !v)} aria-expanded={listOpen}>
            <span>Your list · {vm.requestedLines.length} products</span>
            <span>{listOpen ? 'Hide' : 'Show'}</span>
          </button>
          {listOpen && (
            <ul className={styles.reviewList}>
              {vm.requestedLines.map(({ item, qty }) => (
                <li key={item.id}>
                  <span>{item.name}</span>
                  <strong>{qty} {unitLabel(item.unit, qty)}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className={styles.quotesHead}>
          <h3 className={styles.sectionLabel}>{r.status === 'accepted' ? 'Quotes received' : `Quotes (${vm.quotes.length})`}</h3>
        </div>

        {showSorts && (
          <div className={styles.catRow}>
            {QUOTE_SORTS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`${styles.catChip} ${vm.sort === s.id ? styles.catChipOn : ''}`}
                onClick={() => vm.setSort(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {vm.quotes.length === 0 && isOpen && (
          <div className={styles.waitingCard}>
            <span className={styles.waitingPulse} aria-hidden="true" />
            <strong>Waiting for the first quote</strong>
            <span>Sellers usually reply within a few minutes.</span>
          </div>
        )}

        <ul className={styles.quoteList}>
          {vm.quotes.map((q) => (
            <QuoteCard
              key={q.vendor.id}
              quote={q}
              tags={isOpen ? vm.highlights[q.vendor.id] : null}
              accepted={r.acceptedVendorId === q.vendor.id}
              onOpen={() => vm.openQuote(q.vendor.id)}
            />
          ))}
        </ul>

        {isOpen && (
          <div className={styles.cancelArea}>
            {cancelAsk ? (
              <div className={styles.confirmBox}>
                <strong>Cancel this requirement?</strong>
                <span>Sellers stop quoting and all quotes are declined.</span>
                <div className={styles.sheetActions}>
                  <button type="button" className={styles.secondaryBtn} onClick={() => setCancelAsk(false)}>Keep it</button>
                  <button type="button" className={styles.dangerBtn} onClick={vm.cancel}>Cancel requirement</button>
                </div>
              </div>
            ) : (
              <button type="button" className={styles.textDanger} onClick={() => setCancelAsk(true)}>Cancel requirement</button>
            )}
          </div>
        )}
      </div>

      {vm.selectedQuote && (
        <QuoteSheet
          quote={vm.selectedQuote}
          canAccept={isOpen}
          confirming={vm.confirming}
          onClose={vm.closeQuote}
          onStartAccept={vm.startAccept}
          onCancelAccept={vm.cancelAccept}
          onConfirmAccept={vm.confirmAccept}
        />
      )}
    </div>
  );
}
