'use client';

import React from 'react';

export function StoreAssuranceStrip() {
  return (
    <div className="store-assurance-strip-wrap">
      <div className="store-assurance-strip">
        <div className="assurance-item">
          <span className="assurance-icon">🛡️</span>
          <span className="assurance-text">100% Original Products</span>
        </div>
        <div className="assurance-divider" />
        <div className="assurance-item">
          <span className="assurance-icon">🔄</span>
          <span className="assurance-text">Easy Returns & Refunds</span>
        </div>
        <div className="assurance-divider" />
        <div className="assurance-item">
          <span className="assurance-icon">🚚</span>
          <span className="assurance-text">On-time Delivery</span>
        </div>
      </div>
    </div>
  );
}
