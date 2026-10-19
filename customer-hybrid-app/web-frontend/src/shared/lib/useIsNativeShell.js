'use client';

import { useSyncExternalStore } from 'react';

/**
 * Whether the page runs inside the Expo shell, detected once per WebView session.
 * Screens used to start at `false` and flip to `true` in an effect on every visit, which
 * rendered each page twice. Once detected, every later screen reads `true` on its first render.
 */

let detected = false;
const listeners = new Set();

function detect() {
  if (detected || typeof window === 'undefined') return detected;
  detected =
    window.location.search.includes('native=1') ||
    window.IS_NATIVE_SHELL === true ||
    Boolean(window.ReactNativeWebView) ||
    navigator.userAgent.includes('CustomerSuperAppMobileShell');
  return detected;
}

/** Called when a native message arrives: proof we are in the shell even if detection missed it. */
export function markNativeShell() {
  if (detected) return;
  detected = true;
  listeners.forEach((fn) => fn());
}

function subscribe(cb) {
  listeners.add(cb);
  // The shell's injected flag can land just after the first paint; re-check briefly
  let tries = 0;
  const interval = detected
    ? null
    : setInterval(() => {
        if (detect() || ++tries > 40) {
          clearInterval(interval);
          if (detected) listeners.forEach((fn) => fn());
        }
      }, 50);
  return () => {
    listeners.delete(cb);
    if (interval) clearInterval(interval);
  };
}

export function useIsNativeShell() {
  return useSyncExternalStore(subscribe, detect, () => false);
}
