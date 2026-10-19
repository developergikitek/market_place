'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppRouter } from '@/shared/lib/useAppRouter';
import { useStoredOrders } from '@/shared/models/customerStore';
import { sendToNative } from '@/shared/lib/nativeBridge';
import { orderKind, isLive } from '@/shared/lib/orderFormat';

export const ORDER_TYPES = [
  { id: 'RETAIL', label: 'Retail' },
  { id: 'WHOLESALE', label: 'Wholesale' },
];

/**
 * VIEWMODEL: My Orders list (shared by retail & wholesale), Swiggy layout:
 * Retail | Wholesale switch; live orders show Track order instead of Reorder.
 */
export function useOrdersViewModel() {
  const router = useAppRouter();
  const orders = useStoredOrders();
  // ?type=wholesale (from the Wholesale tab bar) opens on the Wholesale tab
  const initialType = useSearchParams()?.get('type') === 'wholesale' ? 'WHOLESALE' : 'RETAIL';
  const [type, setType] = useState(initialType);

  useEffect(() => {
    if (typeof window !== 'undefined') window.nextRouter = router;
    sendToNative('PAGE_VIEWED', { page: 'orders' });
    sendToNative('WEB_READY', { status: 'ready', page: 'orders' });
  }, [router]);

  const counts = useMemo(() => {
    const c = { RETAIL: 0, WHOLESALE: 0 };
    orders.forEach((o) => {
      c[orderKind(o)] += 1;
    });
    return c;
  }, [orders]);

  // One list per type; trackable (live) orders first
  const list = useMemo(() => {
    const ofType = orders.filter((o) => orderKind(o) === type);
    return [...ofType.filter(isLive), ...ofType.filter((o) => !isLive(o))];
  }, [orders, type]);

  const openOrder = useCallback(
    (order) => router.push(`/orders/detail?id=${order.orderId}&native=1`),
    [router]
  );

  const reorder = useCallback((order) => {
    sendToNative('TRIGGER_HAPTIC', { style: 'medium' });
    router.push(
      orderKind(order) === 'WHOLESALE'
        ? `/wholesale/requirement?id=${order.requirementId}&native=1`
        : `/store?id=${order.storeId}&native=1`
    );
  }, [router]);

  return {
    type,
    setType,
    counts,
    orders: list,
    openOrder,
    reorder,
    shopRetail: () => router.push('/?native=1'),
    shopWholesale: () => router.push('/wholesale?native=1'),
  };
}
