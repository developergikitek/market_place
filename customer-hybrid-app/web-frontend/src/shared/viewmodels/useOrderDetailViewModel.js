'use client';

import { useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppRouter } from '@/shared/lib/useAppRouter';
import { useStoredOrders, getStoredProfile } from '@/shared/models/customerStore';
import { sendToNative } from '@/shared/lib/nativeBridge';
import { orderKind, isLive, billRows } from '@/shared/lib/orderFormat';

const noopSubscribe = () => () => {};
const NO_ADDRESS = null;

let addressCache;
function defaultAddress() {
  if (addressCache !== undefined) return addressCache;
  const list = getStoredProfile()?.savedAddresses || [];
  const a = list.find((x) => x.isDefault) || list[0];
  addressCache = a ? { tag: a.tag, line: `${a.addressLine1}, ${a.landmark}, ${a.city}` } : null;
  return addressCache;
}

/** VIEWMODEL: one order (/orders/detail?id=). Live orders get the tracking view. */
export function useOrderDetailViewModel() {
  const router = useAppRouter();
  const id = useSearchParams()?.get('id');
  const orders = useStoredOrders();
  const order = orders.find((o) => o.orderId === id) || null;
  const address = useSyncExternalStore(noopSubscribe, defaultAddress, () => NO_ADDRESS);

  useEffect(() => {
    if (typeof window !== 'undefined') window.nextRouter = router;
    sendToNative('PAGE_VIEWED', { page: 'orders' });
    sendToNative('WEB_READY', { status: 'ready', page: 'orders' });
  }, [router, id]);

  const reorder = useCallback(() => {
    if (!order) return;
    sendToNative('TRIGGER_HAPTIC', { style: 'medium' });
    router.push(
      orderKind(order) === 'WHOLESALE'
        ? `/wholesale/requirement?id=${order.requirementId}&native=1`
        : `/store?id=${order.storeId}&native=1`
    );
  }, [order, router]);

  const goBack = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.push('/orders?native=1');
  }, [router]);

  return {
    loaded: orders.length > 0,
    order,
    kind: order ? orderKind(order) : null,
    live: order ? isLive(order) : false,
    bill: useMemo(() => (order ? billRows(order) : []), [order]),
    address: order?.deliveryAddress || address,
    reorder,
    goBack,
    callPartner: (phone) => {
      if (phone) window.location.href = `tel:${phone}`;
    },
  };
}
