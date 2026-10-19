'use client';

import React from 'react';
import { ShieldCheckIcon } from '@/shared/components/Icons';
import { useNativeOverlay } from '@/shared/lib/nativeBridge';

export function CartConflictModal({
  conflictModal,
  onDismiss,
  onConfirmReplace,
}) {
  useNativeOverlay(Boolean(conflictModal));
  if (!conflictModal) return null;

  return (
    <div className="modal-overlay-backdrop" onClick={onDismiss}>
      <div className="sheet-bottom-container" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header-badge">
          <ShieldCheckIcon size={24} color="#D97706" />
        </div>
        <h3 className="sheet-heading-title">Replace cart items?</h3>
        <p className="sheet-text-body">
          Your cart currently contains items from <strong>{conflictModal.currentStoreName}</strong>. 
          Orders are placed store-by-store to ensure express direct delivery. Do you want to discard your existing cart and start a new order with <strong>{conflictModal.newStore.name}</strong>?
        </p>
        <div className="sheet-buttons-flex-row">
          <button
            className="sheet-btn-discard"
            type="button"
            onClick={onDismiss}
          >
            No, Keep Cart
          </button>
          <button
            className="sheet-btn-confirm-replace"
            type="button"
            onClick={onConfirmReplace}
          >
            Yes, Replace Cart
          </button>
        </div>
      </div>
    </div>
  );
}
