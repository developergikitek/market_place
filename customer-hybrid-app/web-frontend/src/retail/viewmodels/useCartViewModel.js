'use client';

import { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from 'react';
import { useAppRouter } from '@/shared/lib/useAppRouter';
import { getStoreById } from '@/retail/models/marketplaceModel';
import { sendToNative, subscribeToNativeEvents } from '@/shared/lib/nativeBridge';
import { saveStoredCart, useStoredCart, computeCartTotals } from '@/retail/lib/cartManager';
import { upsertOrder } from '@/shared/models/customerStore';

const noopSubscribe = () => () => {};

const DELIVERY_FEE = 29;
const HANDLING_FEE = 5;

// "Free above ₹199" / "Free delivery above ₹499" -> 199 / 499
function parseFreeDeliveryThreshold(deliveryInfo = '') {
  const match = deliveryInfo.match(/free(?: delivery)? above ₹\s?(\d+)/i);
  return match ? Number(match[1]) : null;
}

// "FLAT ₹150 OFF ABOVE ₹999" or "20% OFF ABOVE ₹1000" -> { minOrder, discountFor(amount) }
function parseStoreOffer(offerText = '') {
  const flat = offerText.match(/flat ₹\s?(\d+) off above ₹\s?(\d+)/i);
  if (flat) {
    const off = Number(flat[1]);
    return { label: offerText, minOrder: Number(flat[2]), discountFor: () => off };
  }
  const pct = offerText.match(/(\d+)% off above ₹\s?(\d+)/i);
  if (pct) {
    const rate = Number(pct[1]) / 100;
    return { label: offerText, minOrder: Number(pct[2]), discountFor: (amt) => Math.round(amt * rate) };
  }
  return null;
}

/**
 * VIEWMODEL: Cart & Checkout Screen (Swiggy-style single-store cart)
 * One cart at a time, locked to one store. Reads/writes the shared cart in cartManager
 * so Home, Store and Cart screens stay in sync.
 */
export function useCartViewModel() {
  const router = useAppRouter();

  const cart = useStoredCart();
  // false during SSR/hydration, true on the client: avoids flashing the empty state before the cart loads
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);


  const store = useMemo(() => (cart ? getStoreById(cart.storeId) : null), [cart]);
  const items = useMemo(() => (cart ? Object.values(cart.items || {}) : []), [cart]);
  const totals = useMemo(() => computeCartTotals(cart), [cart]);

  const bill = useMemo(() => {
    if (!cart || !store) return null;
    const itemTotal = totals.amount;
    const mrpTotal = itemTotal + totals.savings;

    const freeAbove = parseFreeDeliveryThreshold(store.deliveryInfo);
    const deliveryFee = freeAbove !== null && itemTotal >= freeAbove ? 0 : DELIVERY_FEE;
    const amountForFreeDelivery = freeAbove !== null && itemTotal < freeAbove ? freeAbove - itemTotal : 0;

    const offer = parseStoreOffer(store.offerText);
    const offerUnlocked = Boolean(offer && itemTotal >= offer.minOrder);
    const offerDiscount = offerUnlocked ? offer.discountFor(itemTotal) : 0;
    const amountForOffer = offer && !offerUnlocked ? offer.minOrder - itemTotal : 0;

    const toPay = itemTotal + deliveryFee + HANDLING_FEE - offerDiscount;
    const totalSavings = totals.savings + offerDiscount + (deliveryFee === 0 ? DELIVERY_FEE : 0);

    return {
      itemTotal,
      mrpTotal,
      deliveryFee,
      standardDeliveryFee: DELIVERY_FEE,
      handlingFee: HANDLING_FEE,
      amountForFreeDelivery,
      offerLabel: offer?.label || null,
      offerDiscount,
      amountForOffer,
      toPay,
      totalSavings,
    };
  }, [cart, store, totals]);

  // Tell native which screen is showing (hides the native search header, lights the Cart tab)
  useEffect(() => {
    sendToNative('PAGE_VIEWED', { page: 'cart' });
    sendToNative('WEB_READY', { status: 'ready', page: 'cart' });
    if (typeof window !== 'undefined') {
      window.nextRouter = router;
    }
  }, [router]);

  // Keep the native Cart tab badge in sync
  useEffect(() => {
    if (!hydrated) return;
    sendToNative('CART_UPDATED', { count: totals.count, amount: totals.amount, storeName: cart?.storeName });
  }, [hydrated, totals.count, totals.amount, cart?.storeName]);

  const finishOrder = useCallback(
    (txnId) => {
      const now = Date.now();
      const orderId = `HW-${now.toString().slice(-6)}`;
      // Add to My Orders (shared with wholesale), tagged as a retail store order
      upsertOrder({
        orderId,
        source: 'retail',
        placedAt: new Date(now).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }),
        status: 'PREPARING',
        statusLabel: `${cart?.storeName} is packing your order`,
        storeId: cart?.storeId,
        storeName: cart?.storeName,
        storeAddress: store?.locality,
        itemCount: totals.count,
        totalAmount: bill?.toPay,
        deliveryType: store?.deliverySpeed,
        deliveryEta: store?.deliverySpeed,
        items: items.map(({ product, qty }) => ({ id: product.id, name: product.name, qty, price: product.price })),
        bill: [
          { label: 'Item total', amount: bill?.itemTotal },
          { label: 'Delivery fee', amount: bill?.deliveryFee, free: bill?.deliveryFee === 0 },
          { label: 'Handling fee', amount: bill?.handlingFee },
          ...(bill?.offerDiscount ? [{ label: 'Store offer', amount: -bill.offerDiscount }] : []),
        ],
        paidVia: 'UPI',
        invoiceDownloadUrl: '#',
        trackingSteps: [
          { title: 'Order placed', time: new Date(now).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }), done: true },
          { title: 'Packing at store', time: 'In progress', active: true },
          { title: 'Out for delivery', time: 'Pending' },
          { title: 'Delivered', time: store?.deliverySpeed || 'Pending' },
        ],
      });
      setPlacedOrder({
        orderId,
        txnId,
        storeName: cart?.storeName,
        amount: bill?.toPay,
        itemCount: totals.count,
        deliverySpeed: store?.deliverySpeed,
      });
      setPlacingOrder(false);
      saveStoredCart(null);
      sendToNative('TRIGGER_HAPTIC', { style: 'heavy' });
    },
    [cart, bill, totals.count, store, items]
  );

  // Native bridge: tab switches and UPI payment results
  useEffect(() => {
    return subscribeToNativeEvents((event) => {
      // Tab routing (NAVIGATE_TAB) is driven by the native shell via window.nextRouter
      if (event.type === 'UPI_PAYMENT_SUCCESS') {
        finishOrder(event.payload?.txnId);
      } else if (event.type === 'UPI_PAYMENT_CANCELLED') {
        setPlacingOrder(false);
      }
    });
  }, [finishOrder]);

  const incrementItem = useCallback(
    (productId) => {
      if (!cart?.items?.[productId]) return;
      sendToNative('TRIGGER_HAPTIC', { style: 'light' });
      const entry = cart.items[productId];
      saveStoredCart({
        ...cart,
        items: { ...cart.items, [productId]: { ...entry, qty: entry.qty + 1 } },
      });
    },
    [cart]
  );

  const decrementItem = useCallback(
    (productId) => {
      if (!cart?.items?.[productId]) return;
      sendToNative('TRIGGER_HAPTIC', { style: 'light' });
      const nextItems = { ...cart.items };
      const entry = nextItems[productId];
      if (entry.qty > 1) {
        nextItems[productId] = { ...entry, qty: entry.qty - 1 };
      } else {
        delete nextItems[productId];
      }
      // saveStoredCart clears storage when no items are left
      saveStoredCart({ ...cart, items: nextItems });
    },
    [cart]
  );

  const clearCart = useCallback(() => {
    sendToNative('TRIGGER_HAPTIC', { style: 'medium' });
    saveStoredCart(null);
  }, []);

  const placeOrder = useCallback(() => {
    if (!bill || placingOrder) return;
    setPlacingOrder(true);
    const sentToNative = sendToNative('TRIGGER_UPI', {
      amount: bill.toPay,
      merchant: cart.storeName,
    });
    // Plain browser has no native UPI sheet; simulate a successful payment
    if (!sentToNative) {
      setTimeout(() => finishOrder(`TXN_WEB_${Date.now()}`), 900);
    }
  }, [bill, placingOrder, cart, finishOrder]);

  const goBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      sendToNative('TAB_CHANGED', { tab: 'home' });
      router.push('/?native=1');
    }
  }, [router]);

  const openStore = useCallback(() => {
    if (!cart) return;
    router.push(`/store?id=${cart.storeId}&native=1`);
  }, [cart, router]);

  const trackOrder = useCallback(() => {
    if (placedOrder) router.push(`/orders/detail?id=${placedOrder.orderId}&native=1`);
  }, [placedOrder, router]);

  const browseStores = useCallback(() => {
    sendToNative('TAB_CHANGED', { tab: 'home' });
    router.push('/?native=1');
  }, [router]);

  return {
    hydrated,
    cart,
    store,
    items,
    totals,
    bill,
    placingOrder,
    placedOrder,
    incrementItem,
    decrementItem,
    clearCart,
    placeOrder,
    goBack,
    openStore,
    browseStores,
    trackOrder,
  };
}
