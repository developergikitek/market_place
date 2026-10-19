'use client';

import React from 'react';

const inr = (n) => `₹${n.toLocaleString('en-IN')}`;

export function CartOffersCard({ bill }) {
  if (!bill.offerLabel && bill.amountForFreeDelivery <= 0) return null;

  return (
    <section className="cart-section-card cart-offers-card">
      {bill.offerLabel && (
        <div className={`cart-offer-row ${bill.offerDiscount > 0 ? 'is-unlocked' : ''}`}>
          <span className="cart-offer-tag">%</span>
          <div>
            <div className="cart-offer-title">
              {bill.offerDiscount > 0 ? `${inr(bill.offerDiscount)} saved with store offer` : bill.offerLabel}
            </div>
            <div className="cart-offer-sub">
              {bill.offerDiscount > 0
                ? bill.offerLabel
                : `Add items worth ${inr(bill.amountForOffer)} more to unlock`}
            </div>
          </div>
        </div>
      )}

      {bill.amountForFreeDelivery > 0 && (
        <div className="cart-offer-row">
          <span className="cart-offer-tag">🚚</span>
          <div>
            <div className="cart-offer-title">Add {inr(bill.amountForFreeDelivery)} more for free delivery</div>
            <div className="cart-offer-sub">Saves the {inr(bill.standardDeliveryFee)} delivery fee</div>
          </div>
        </div>
      )}
    </section>
  );
}

export function CartBillCard({ bill }) {
  return (
    <section className="cart-section-card">
      <h3 className="cart-section-title">Bill details</h3>

      <div className="cart-bill-rows">
        <div className="cart-bill-row">
          <span>Item total</span>
          <span>
            {bill.mrpTotal > bill.itemTotal && <s className="cart-bill-strike">{inr(bill.mrpTotal)}</s>}
            {inr(bill.itemTotal)}
          </span>
        </div>
        <div className="cart-bill-row">
          <span>Delivery fee</span>
          <span>
            {bill.deliveryFee === 0 ? (
              <>
                <s className="cart-bill-strike">{inr(bill.standardDeliveryFee)}</s>
                <span className="cart-bill-free">FREE</span>
              </>
            ) : (
              inr(bill.deliveryFee)
            )}
          </span>
        </div>
        <div className="cart-bill-row">
          <span>Handling fee</span>
          <span>{inr(bill.handlingFee)}</span>
        </div>
        {bill.offerDiscount > 0 && (
          <div className="cart-bill-row cart-bill-discount">
            <span>Store offer</span>
            <span>−{inr(bill.offerDiscount)}</span>
          </div>
        )}
      </div>

      <div className="cart-bill-row cart-bill-total">
        <span>To pay</span>
        <span>{inr(bill.toPay)}</span>
      </div>

      {bill.totalSavings > 0 && (
        <div className="cart-savings-banner">You save {inr(bill.totalSavings)} on this order</div>
      )}
    </section>
  );
}
