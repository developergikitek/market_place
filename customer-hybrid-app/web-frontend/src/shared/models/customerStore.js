'use client';

import { useSyncExternalStore } from 'react';
import { isInsideReactNative, sendToNative, subscribeToNativeEvents } from '@/shared/lib/nativeBridge';

// ============================================================
// ORDERS & PROFILE STORAGE & STORE HELPERS (Swiggy / Enterprise Pattern)
// ============================================================

const ORDERS_STORAGE_KEY = 'superapp_customer_orders';
const PROFILE_STORAGE_KEY = 'superapp_customer_profile';
const orderListeners = new Set();
const profileListeners = new Set();

export const INITIAL_ORDERS = [
  {
    orderId: 'HW-894210',
    placedAt: 'Today, 1:15 PM',
    status: 'IN_TRANSIT', // 'IN_TRANSIT' | 'DELIVERED' | 'PREPARING'
    statusLabel: 'Out for Delivery • Arriving in 18 mins',
    storeId: 'store_1',
    storeName: 'Sharma Hardware & Pro Tools',
    storeAddress: 'Vijay Nagar, Indore',
    itemCount: 4,
    totalAmount: 2648,
    deliveryType: 'Same-Day Express',
    deliveryPartner: {
      name: 'Ramesh Patel',
      phone: '+91 98260 12345',
      vehicle: 'Hero Electric (MP-09-EV-4412)',
    },
    items: [
      { id: 'p_101', name: 'Bosch Impact Drill 550W', qty: 1, price: 2199 },
      { id: 'p_103', name: 'Anchor Roma Modular Switches 6A (Pack of 10)', qty: 1, price: 449 },
    ],
    invoiceDownloadUrl: '#',
    trackingSteps: [
      { title: 'Order Confirmed', time: '1:16 PM', done: true },
      { title: 'Packed at Store', time: '1:28 PM', done: true },
      { title: 'Partner Picked Up', time: '1:34 PM', done: true },
      { title: 'Delivering to Site', time: 'Estimated 1:52 PM', active: true },
    ],
  },
  {
    orderId: 'HW-873914',
    placedAt: 'Yesterday, 4:45 PM',
    status: 'DELIVERED',
    statusLabel: 'Delivered at Site Gate 2',
    storeId: 'store_2',
    storeName: 'BuildWell Traders & Paints',
    storeAddress: 'Sapna Sangeeta Road, Indore',
    itemCount: 8,
    totalAmount: 4890,
    deliveryType: 'Scheduled Contractor Delivery',
    items: [
      { id: 'p_102', name: 'Stanley 16oz Claw Hammer', qty: 2, price: 449 },
      { id: 'p_104', name: 'Asian Paints Apex Ultima White 4L', qty: 1, price: 1850 },
      { id: 'p_105', name: 'Stainless Steel Screws 1.5 inch Box', qty: 5, price: 428.4 },
    ],
    invoiceDownloadUrl: '#',
  },
  {
    orderId: 'HW-792015',
    placedAt: '5 Oct 2026, 11:20 AM',
    status: 'DELIVERED',
    statusLabel: 'Delivered • Verified by OTP',
    storeId: 'store_1',
    storeName: 'Sharma Hardware & Pro Tools',
    storeAddress: 'Vijay Nagar, Indore',
    itemCount: 2,
    totalAmount: 1120,
    deliveryType: 'Standard Delivery',
    items: [
      { id: 'p_106', name: 'Fevicol SH Synthetic Adhesive 1kg', qty: 2, price: 280 },
      { id: 'p_107', name: 'Precision Screwdriver Set 8-in-1', qty: 1, price: 560 },
    ],
    invoiceDownloadUrl: '#',
  },
];

export const INITIAL_PROFILE = {
  name: 'Harshdeep Singh',
  phone: '+91 98930 77412',
  email: 'harshdeep.singh@builderpro.in',
  role: 'Contractor & Site Lead',
  membershipTier: 'PRO Contractor Plus',
  membershipValidity: 'Active till Dec 2026',
  cashbackBalance: 840,
  savedAddresses: [
    {
      id: 'addr_1',
      tag: 'Current Worksite',
      isDefault: true,
      addressLine1: 'Tower B, Plot 42, Scheme 78 Part 2',
      landmark: 'Near Prestige Institute',
      city: 'Indore, MP - 452010',
      contactPerson: 'Harshdeep (Site Supervisor)',
    },
    {
      id: 'addr_2',
      tag: 'Office / Warehouse',
      isDefault: false,
      addressLine1: 'Warehouse 14, Pologround Industrial Estate',
      landmark: 'Behind Bank of India',
      city: 'Indore, MP - 452015',
      contactPerson: 'Sanjay Storekeeper',
    },
    {
      id: 'addr_3',
      tag: 'Home',
      isDefault: false,
      addressLine1: 'B-402, Royal Palms Heights',
      landmark: 'Mahalaxmi Nagar',
      city: 'Indore, MP - 452010',
      contactPerson: 'Harshdeep Singh',
    },
  ],
  gstDetails: {
    registeredName: 'SINGH BUILDCON & HARDWARE SOLUTIONS',
    gstin: '23AAECS4418P1ZH',
    verified: true,
  },
};

export function getStoredOrders() {
  if (typeof window === 'undefined') return INITIAL_ORDERS;
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    // Sample orders saved before their item prices were corrected to per-unit prices
    // (item.price is per unit everywhere) get the current sample data.
    const seeds = new Map(INITIAL_ORDERS.map((o) => [o.orderId, o]));
    return JSON.parse(raw).map((o) => (seeds.has(o.orderId) ? { ...o, items: seeds.get(o.orderId).items } : o));
  } catch {
    return INITIAL_ORDERS;
  }
}

export function saveStoredOrders(orders) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    orderListeners.forEach((fn) => fn(orders));
  } catch {}
}

export function subscribeToOrders(cb) {
  orderListeners.add(cb);
  return () => orderListeners.delete(cb);
}

// Inside the app shell, native owns the profile (stored on the phone, synced with the server).
// This copy is only a mirror: native pushes PROFILE_UPDATED, and edits go back as PROFILE_EDIT.
// In a plain browser the copy here is the only one, as before.
const EDITABLE_PROFILE_FIELDS = ['name', 'phone', 'email', 'savedAddresses', 'gstDetails'];
let nativeProfileLinked = false;

function linkNativeProfile() {
  if (nativeProfileLinked || typeof window === 'undefined' || !isInsideReactNative()) return;
  nativeProfileLinked = true;
  subscribeToNativeEvents((event) => {
    if (event.type === 'PROFILE_UPDATED' && event.payload?.profile) writeProfile(event.payload.profile);
  });
  sendToNative('PROFILE_REQUEST');
}

function writeProfile(profile) {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    profileListeners.forEach((fn) => fn(profile));
  } catch {}
}

export function getStoredProfile() {
  if (typeof window === 'undefined') return INITIAL_PROFILE;
  linkNativeProfile();
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(INITIAL_PROFILE));
      return INITIAL_PROFILE;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PROFILE;
  }
}

export function saveStoredProfile(profile) {
  if (typeof window === 'undefined') return;
  if (isInsideReactNative()) {
    const current = getStoredProfile();
    const changes = {};
    EDITABLE_PROFILE_FIELDS.forEach((field) => {
      if (JSON.stringify(profile[field]) !== JSON.stringify(current[field])) changes[field] = profile[field];
    });
    if (!Object.keys(changes).length) return;
    // Native applies, stores and syncs it, then echoes PROFILE_UPDATED; show it here meanwhile
    sendToNative('PROFILE_EDIT', { changes });
  }
  writeProfile(profile);
}

export function subscribeToProfile(cb) {
  linkNativeProfile();
  profileListeners.add(cb);
  return () => profileListeners.delete(cb);
}

/** Add (or replace by orderId) an order at the top of My Orders. Used by wholesale accept. */
export function upsertOrder(order) {
  const rest = getStoredOrders().filter((o) => o.orderId !== order.orderId);
  saveStoredOrders([order, ...rest]);
}

// Orders as React state, shared by every screen. Snapshot cached by the raw JSON so
// useSyncExternalStore gets a stable reference; server render sees an empty list.
let ordersRaw;
let ordersCache = [];
const NO_ORDERS = [];

function ordersSnapshot() {
  const list = getStoredOrders();
  const raw = JSON.stringify(list);
  if (raw !== ordersRaw) {
    ordersRaw = raw;
    ordersCache = list;
  }
  return ordersCache;
}

function subscribeOrdersStore(cb) {
  const unsub = subscribeToOrders(cb);
  const onStorage = (e) => e.key === ORDERS_STORAGE_KEY && cb();
  window.addEventListener('storage', onStorage);
  return () => {
    unsub();
    window.removeEventListener('storage', onStorage);
  };
}

export function useStoredOrders() {
  return useSyncExternalStore(subscribeOrdersStore, ordersSnapshot, () => NO_ORDERS);
}

// Profile as React state, same pattern: snapshot cached by raw JSON, null on the server
let profileRaw;
let profileCache = null;

function profileSnapshot() {
  const profile = getStoredProfile();
  const raw = JSON.stringify(profile);
  if (raw !== profileRaw) {
    profileRaw = raw;
    profileCache = profile;
  }
  return profileCache;
}

export function useStoredProfile() {
  return useSyncExternalStore(subscribeToProfile, profileSnapshot, () => null);
}
