'use client';

import { useSyncExternalStore } from 'react';

// One shared 1-second ticker for all wholesale screens (drives quote arrival).
// Time is only read on the client: the server snapshot is 0, so nothing time-based
// gets baked into the prerender.
const subscribers = new Set();
let current = 0;
let timer = null;

function subscribe(cb) {
  subscribers.add(cb);
  if (!timer) {
    current = Date.now();
    timer = setInterval(() => {
      current = Date.now();
      subscribers.forEach((fn) => fn());
    }, 1000);
  }
  return () => {
    subscribers.delete(cb);
    if (subscribers.size === 0) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const getSnapshot = () => current || (current = Date.now());
const noopSubscribe = () => () => {};

/** Current time in ms, refreshed every second while `active`. 0 during server render. */
export function useNow(active = true) {
  return useSyncExternalStore(active ? subscribe : noopSubscribe, getSnapshot, () => 0);
}
