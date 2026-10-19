'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { sendToNative, hideScreenUntilNextPage } from '@/shared/lib/nativeBridge';

// Screen names the native shell uses to pick a skeleton and to match the target page's PAGE_VIEWED
const ROUTE_PAGES = {
  '/': 'home',
  '/categories': 'categories',
  '/store': 'store',
  '/cart': 'cart',
  '/orders': 'orders',
  '/orders/detail': 'orders',
  '/profile': 'profile',
  '/search': 'search',
  '/wholesale': 'wholesale',
  '/bazaar': 'bazaar',
  '/construction': 'construction',
  '/wholesale/new': 'wholesale-new',
  '/wholesale/requirement': 'wholesale-requirement',
};

export function pageForUrl(href) {
  try {
    const { pathname } = new URL(href, 'http://app.local');
    return ROUTE_PAGES[pathname.replace(/\/$/, '') || '/'] || null;
  } catch {
    return null;
  }
}

/**
 * Drop-in replacement for next/navigation's useRouter.
 * Before every route change it sends NAVIGATION_START so the native shell shows the
 * target screen's skeleton right away and keeps it until that screen reports PAGE_VIEWED.
 */
export function useAppRouter() {
  const router = useRouter();

  return useMemo(
    () => ({
      ...router,
      push: (href, options) => {
        hideScreenUntilNextPage();
        sendToNative('NAVIGATION_START', { page: pageForUrl(href), url: href });
        router.push(href, options);
      },
      replace: (href, options) => {
        hideScreenUntilNextPage();
        sendToNative('NAVIGATION_START', { page: pageForUrl(href), url: href });
        router.replace(href, options);
      },
      back: () => {
        // Destination unknown here; native shows a generic skeleton and the next PAGE_VIEWED clears it
        hideScreenUntilNextPage();
        sendToNative('NAVIGATION_START', { page: null });
        router.back();
      },
    }),
    [router]
  );
}
