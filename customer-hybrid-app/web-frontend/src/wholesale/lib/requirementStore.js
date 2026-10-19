'use client';

import { useSyncExternalStore } from 'react';

// ============================================================
// WHOLESALE REQUIREMENTS + DRAFT (separate storage from the retail cart)
// ============================================================

const REQUIREMENTS_KEY = 'superapp_wholesale_requirements';
const DRAFT_KEY = 'superapp_wholesale_draft';
const listeners = new Set();
const EMPTY = [];
const EMPTY_DRAFT = {};

function subscribe(cb) {
  listeners.add(cb);
  // Other tabs/windows
  const onStorage = (e) => {
    if (e.key === REQUIREMENTS_KEY || e.key === DRAFT_KEY) cb();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

function notify() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch {}
  });
}

// Snapshots cached by raw string so useSyncExternalStore gets stable references
const cache = {};
function read(key, fallback) {
  let raw = null;
  try {
    raw = localStorage.getItem(key);
  } catch {}
  if (cache[key]?.raw !== raw) {
    let value = fallback;
    try {
      value = raw ? JSON.parse(raw) : fallback;
    } catch {}
    cache[key] = { raw, value };
  }
  return cache[key].value;
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
  notify();
}

// ---------- Draft: { [catalogItemId]: qty } being built before posting ----------

export function useDraft() {
  return useSyncExternalStore(subscribe, () => read(DRAFT_KEY, EMPTY_DRAFT), () => EMPTY_DRAFT);
}

export function setDraftQty(itemId, qty) {
  const next = { ...read(DRAFT_KEY, EMPTY_DRAFT) };
  if (qty > 0) next[itemId] = qty;
  else delete next[itemId];
  write(DRAFT_KEY, next);
}

export function clearDraft() {
  write(DRAFT_KEY, EMPTY_DRAFT);
}

// ---------- Posted requirements ----------

export function useRequirements() {
  return useSyncExternalStore(subscribe, () => read(REQUIREMENTS_KEY, EMPTY), () => EMPTY);
}

export function postRequirement(draft) {
  const items = Object.entries(draft).map(([itemId, qty]) => ({ itemId, qty }));
  const requirement = {
    id: `RQ${Date.now().toString().slice(-6)}`,
    createdAt: Date.now(),
    items,
    status: 'open', // 'open' | 'accepted' | 'cancelled'
    acceptedVendorId: null,
    acceptedAt: null,
  };
  write(REQUIREMENTS_KEY, [requirement, ...read(REQUIREMENTS_KEY, EMPTY)]);
  return requirement;
}

function updateRequirement(id, patch) {
  write(
    REQUIREMENTS_KEY,
    read(REQUIREMENTS_KEY, EMPTY).map((r) => (r.id === id ? { ...r, ...patch } : r))
  );
}

/** Accept one vendor's quote; returns the updated requirement. */
export function acceptQuote(requirementId, vendorId) {
  const patch = { status: 'accepted', acceptedVendorId: vendorId, acceptedAt: Date.now() };
  updateRequirement(requirementId, patch);
  return read(REQUIREMENTS_KEY, EMPTY).find((r) => r.id === requirementId) || null;
}

export function cancelRequirement(requirementId) {
  updateRequirement(requirementId, { status: 'cancelled', cancelledAt: Date.now() });
}
