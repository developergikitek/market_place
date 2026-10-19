'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Routes the native tab bars open. Kept warm in the client cache so switching back to a tab
// renders from memory instead of waiting on the server.
const TAB_ROUTES = ['/', '/categories', '/cart', '/orders', '/profile', '/wholesale', '/bazaar', '/construction'];
const START_DELAY_MS = 1500; // let the first screen finish loading before warming the others

function isNativeShell() {
  return (
    window.location.search.includes('native=1') ||
    window.IS_NATIVE_SHELL === true ||
    Boolean(window.ReactNativeWebView) ||
    navigator.userAgent.includes('CustomerSuperAppMobileShell')
  );
}

export function TabPrefetcher() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    // The shell pushes tab URLs with ?native=1, and the cache keys on the full URL
    const suffix = isNativeShell() ? '?native=1' : '';
    const warm = (href) => {
      if (!cancelled) router.prefetch(href, { onInvalidate: () => warm(href) });
    };
    const timer = setTimeout(() => {
      TAB_ROUTES.forEach((path) => warm(`${path}${suffix}`));
    }, START_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [router]);

  return null;
}
