'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';

/**
 * Stale-while-revalidate cache that outlives page changes.
 * Lives at module level, so a screen that unmounts and mounts again reads the last value
 * instantly instead of starting from its default. Values are also mirrored to localStorage
 * so the next app launch shows the last known data while fresh data loads.
 */

const STORAGE_PREFIX = 'swr:';
const REVALIDATE_AFTER_MS = 30 * 1000; // don't refetch on every quick tab switch

const entries = new Map(); // key -> { value, fetchedAt, inflight }
const listeners = new Map(); // key -> Set<fn>

function readStored(key) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function writeStored(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {}
}

function entryFor(key) {
  let entry = entries.get(key);
  if (!entry) {
    entry = { value: readStored(key), fetchedAt: 0, inflight: null };
    entries.set(key, entry);
  }
  return entry;
}

function notify(key) {
  listeners.get(key)?.forEach((fn) => fn());
}

/** Replace a cached value (or update it from the previous one) and re-render its readers. */
export function setCached(key, next) {
  const entry = entryFor(key);
  entry.value = typeof next === 'function' ? next(entry.value) : next;
  writeStored(key, entry.value);
  notify(key);
}

function revalidate(key, fetcher, accept) {
  const entry = entryFor(key);
  if (entry.inflight || Date.now() - entry.fetchedAt < REVALIDATE_AFTER_MS) return;
  entry.inflight = Promise.resolve()
    .then(fetcher)
    .then((data) => {
      entry.fetchedAt = Date.now();
      if (accept(data)) setCached(key, data);
    })
    .catch(() => {})
    .finally(() => {
      entry.inflight = null;
    });
}

/**
 * Read `key` from the cache, falling back to `initial` until something is cached.
 * On mount it refreshes in the background when the value is older than 30s.
 * `accept(data)` decides whether a fetch result is usable (e.g. not null).
 * Returns [value, setValue] like useState.
 */
export function useCachedResource(key, fetcher, initial, accept = (d) => d != null) {
  const subscribe = useCallback(
    (cb) => {
      if (!listeners.has(key)) listeners.set(key, new Set());
      listeners.get(key).add(cb);
      return () => listeners.get(key).delete(cb);
    },
    [key]
  );
  const getSnapshot = () => entryFor(key).value ?? initial;
  const getServerSnapshot = () => initial;

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    revalidate(key, fetcher, accept);
    // fetcher/accept are expected to be stable module functions; key drives refetching
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback((next) => setCached(key, next), [key]);
  return [value, setValue];
}
