'use client';

import { useSyncExternalStore } from 'react';

// ============================================================
// CART MANAGER: Shared Store-Locked Cart State Across Routes
// ============================================================

const CART_STORAGE_KEY = 'superapp_cart_state';
const listeners = new Set();

export function getStoredCart() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredCart(cart) {
  if (typeof window === 'undefined') return;
  try {
    if (!cart || Object.keys(cart.items || {}).length === 0) {
      localStorage.removeItem(CART_STORAGE_KEY);
      notifyListeners(null);
    } else {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      notifyListeners(cart);
    }
  } catch {}
}

export function subscribeToCart(callback) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function notifyListeners(cart) {
  listeners.forEach((cb) => {
    try {
      cb(cart);
    } catch {}
  });
}

// Snapshot cached by the raw JSON string so useSyncExternalStore gets a stable reference
let cachedRaw;
let cachedCart = null;

function getCartSnapshot() {
  let raw = null;
  try {
    raw = localStorage.getItem(CART_STORAGE_KEY);
  } catch {}
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedCart = raw ? JSON.parse(raw) : null;
    } catch {
      cachedCart = null;
    }
  }
  return cachedCart;
}

// Shared cart as React state: null during SSR/hydration, then the stored cart, updating on every save
export function useStoredCart() {
  return useSyncExternalStore(subscribeToCart, getCartSnapshot, () => null);
}

export function computeCartTotals(cart) {
  if (!cart || !cart.items) {
    return { count: 0, amount: 0, savings: 0 };
  }

  let count = 0;
  let amount = 0;
  let originalTotal = 0;

  Object.values(cart.items).forEach(({ product, qty }) => {
    count += qty;
    amount += (product.price || 0) * qty;
    originalTotal += (product.originalPrice || product.price || 0) * qty;
  });

  const savings = Math.max(0, originalTotal - amount);

  return { count, amount, savings };
}

// ------------------------------------------------------------
// Store-locked cart mutations (one store per cart, Swiggy rules)
// ------------------------------------------------------------

/**
 * Add one unit of `product` from `store`.
 * Returns { conflict } when the cart holds another store's items, so the caller can ask
 * "Replace cart?" (CartConflictModal) and then call replaceCartWithProduct.
 */
export function addProductToCart(store, product) {
  const cart = getStoredCart();
  const hasOtherStore = cart && cart.storeId !== store.id && Object.keys(cart.items || {}).length > 0;
  if (hasOtherStore) {
    return { conflict: { currentStoreName: cart.storeName, newStore: store, productToAdd: product } };
  }
  const items = cart && cart.storeId === store.id ? { ...cart.items } : {};
  const qty = (items[product.id]?.qty || 0) + 1;
  items[product.id] = { product, qty };
  saveStoredCart({ storeId: store.id, storeName: store.name, storeCode: store.code, items });
  return { added: true };
}

export function decrementProductInCart(storeId, productId) {
  const cart = getStoredCart();
  if (!cart || cart.storeId !== storeId || !cart.items?.[productId]) return;
  const items = { ...cart.items };
  const entry = items[productId];
  if (entry.qty > 1) items[productId] = { ...entry, qty: entry.qty - 1 };
  else delete items[productId];
  // saveStoredCart clears storage when no items are left
  saveStoredCart({ ...cart, items });
}

export function replaceCartWithProduct(store, product) {
  saveStoredCart({
    storeId: store.id,
    storeName: store.name,
    storeCode: store.code,
    items: { [product.id]: { product, qty: 1 } },
  });
}
