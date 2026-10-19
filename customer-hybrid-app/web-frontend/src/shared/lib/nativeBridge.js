/**
 * Native Bridge for WebViews (Next.js <-> React Native Expo Shell)
 * 
 * Works seamlessly inside React Native WebView and provides a mock/fallback
 * in regular desktop/mobile browsers for smooth local development.
 */

'use client';

import { useEffect } from 'react';

export const isInsideReactNative = () => {
  return typeof window !== 'undefined' && Boolean(window.ReactNativeWebView);
};

// Inside the shell, a route change hides the current screen on the same frame as the tap (the
// native skeleton covers the WebView a moment later), so the previous screen is never visible
// under the next screen's header. The next screen's PAGE_VIEWED shows the page again.
const NAVIGATING_CLASS = 'shell-navigating';
const NAVIGATING_MAX_MS = 4000;
let navigatingTimer = null;

export const showCurrentScreen = () => {
  clearTimeout(navigatingTimer);
  if (typeof document !== 'undefined') document.documentElement.classList.remove(NAVIGATING_CLASS);
};

export const hideScreenUntilNextPage = () => {
  if (!isInsideReactNative()) return;
  document.documentElement.classList.add(NAVIGATING_CLASS);
  clearTimeout(navigatingTimer);
  // Safety: a push to the URL already on screen never sends PAGE_VIEWED
  navigatingTimer = setTimeout(showCurrentScreen, NAVIGATING_MAX_MS);
};

// These tell native the screen is ready, which lifts its skeleton. Effects run before the browser
// has painted the screen (and a screen re-shown after display:none must repaint from scratch), so
// they are sent only after two frames: the screen is drawn under the skeleton first, never blank.
const READY_ACTIONS = ['PAGE_VIEWED', 'WEB_READY'];

export const sendToNative = (action, payload = {}) => {
  if (READY_ACTIONS.includes(action) && isInsideReactNative()) {
    showCurrentScreen();
    requestAnimationFrame(() => requestAnimationFrame(() => postToNative(action, payload)));
    return true;
  }
  return postToNative(action, payload);
};

const postToNative = (action, payload) => {
  const message = {
    action,
    payload,
    timestamp: Date.now(),
  };

  if (isInsideReactNative()) {
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
    console.log('[NativeBridge] Sent to Native:', message);
    return true;
  } else {
    console.warn('[NativeBridge] Running in standalone browser (not in WebView). Emulating action:', message);
    // Emulate in browser console and show simulated alert/toast
    return false;
  }
};

export const subscribeToNativeEvents = (handler) => {
  if (typeof window === 'undefined') return () => {};

  const listener = (event) => {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data && data.type) {
        handler(data);
      }
    } catch {
      // Ignore non-json messages
    }
  };

  // Both window and document listeners for cross-platform compatibility (iOS WKWebView vs Android)
  window.addEventListener('message', listener);
  document.addEventListener('message', listener);

  return () => {
    window.removeEventListener('message', listener);
    document.removeEventListener('message', listener);
  };
};

/**
 * Tell the native shell a web popup (bottom sheet / modal) is open, so it hides its own
 * floating cart bar and tab bar, which are drawn above the WebView and would cover the popup.
 */
export function useNativeOverlay(isOpen) {
  useEffect(() => {
    if (!isOpen) return undefined;
    sendToNative('OVERLAY_OPEN');
    return () => {
      sendToNative('OVERLAY_CLOSED');
    };
  }, [isOpen]);
}
