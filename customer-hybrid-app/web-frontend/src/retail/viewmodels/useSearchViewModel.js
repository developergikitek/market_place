'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAppRouter } from '@/shared/lib/useAppRouter';
import { searchCatalog } from '@/retail/lib/searchIndex';
import { sendToNative, subscribeToNativeEvents } from '@/shared/lib/nativeBridge';

const RECENTS_KEY = 'superapp_recent_searches';
const MAX_RECENTS = 6;
const MAX_STORE_SUGGESTIONS = 5;

export const POPULAR_SEARCHES = ['Bosch Drill', 'UltraTech Cement', 'Asian Paints', 'Fevicol', 'Taparia Screwdriver', 'WD-40'];

function readRecents() {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeRecents(list) {
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(list));
  } catch {}
}

export function rememberSearch(term) {
  const clean = term.trim();
  if (!clean) return readRecents();
  const next = [clean, ...readRecents().filter((r) => r.toLowerCase() !== clean.toLowerCase())].slice(0, MAX_RECENTS);
  writeRecents(next);
  return next;
}

/**
 * VIEWMODEL: Swiggy-style search sheet for stores & items.
 * Opened by the native shell (OPEN_SEARCH) or by the `superapp:open-search` window event
 * (web search bar, or the search results page re-opening it with its current query).
 * Typing shows a suggestion row + relevant stores; submitting opens /search results.
 */
export function useSearchViewModel() {
  const router = useAppRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState([]);
  const inputRef = useRef(null);

  const open = useCallback((initialQuery = '') => {
    setRecents(readRecents());
    setQuery(typeof initialQuery === 'string' ? initialQuery : '');
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    inputRef.current?.blur();
    sendToNative('SEARCH_CLOSED');
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToNativeEvents((event) => {
      if (event.type === 'OPEN_SEARCH') open(event.payload?.query);
      else if (event.type === 'CLOSE_SEARCH') close();
    });
    const onWindowOpen = (e) => open(e.detail?.query);
    window.addEventListener('superapp:open-search', onWindowOpen);
    return () => {
      unsubscribe();
      window.removeEventListener('superapp:open-search', onWindowOpen);
    };
  }, [open, close]);

  // Freeze the page behind the sheet: pin the body at its current offset so swipes on the
  // sheet or backdrop can't scroll it, then restore the exact position on close.
  useEffect(() => {
    if (!isOpen) return undefined;
    const { body } = document;
    const scrollY = window.scrollY;
    const prev = { position: body.style.position, top: body.style.top, width: body.style.width };
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // Focus after the sheet paints so the keyboard opens with it. Retried briefly because inside
  // the Android shell the WebView only takes native focus a moment after OPEN_SEARCH.
  useEffect(() => {
    if (!isOpen) return;
    const timers = [0, 120, 300].map((ms) =>
      setTimeout(() => {
        if (document.activeElement !== inputRef.current) inputRef.current?.focus();
      }, ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [isOpen]);

  const results = useMemo(() => {
    const found = searchCatalog(query);
    if (!found) return null;
    return {
      // Swiggy-style "Pizza · Dish" row: the typed term, pictured by its first matching item
      suggestion: found.items.length > 0
        ? { term: query.trim(), image: found.items[0].product.image, count: found.items.length }
        : null,
      stores: found.stores.slice(0, MAX_STORE_SUGGESTIONS),
    };
  }, [query]);

  const leaveSheet = useCallback((url) => {
    setIsOpen(false);
    inputRef.current?.blur();
    sendToNative('TRIGGER_HAPTIC', { style: 'light' });
    sendToNative('SEARCH_CLOSED');
    router.push(url);
  }, [router]);

  const showResults = useCallback(
    (term = query) => {
      const clean = term.trim();
      if (!clean) return;
      setRecents(rememberSearch(clean));
      leaveSheet(`/search?q=${encodeURIComponent(clean)}&native=1`);
    },
    [query, leaveSheet]
  );

  const openStore = useCallback(
    (store) => {
      setRecents(rememberSearch(query));
      leaveSheet(`/store?id=${store.id}&native=1`);
    },
    [query, leaveSheet]
  );

  const clearRecents = useCallback(() => {
    writeRecents([]);
    setRecents([]);
  }, []);

  return {
    isOpen,
    query,
    setQuery,
    recents,
    results,
    inputRef,
    close,
    submit: () => showResults(),
    showResults,
    clearRecents,
    openStore,
    // Voice input isn't wired yet; keep the mic as a focus shortcut so it never dead-ends
    voiceSearch: () => inputRef.current?.focus(),
  };
}
