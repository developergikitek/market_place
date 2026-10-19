import { useSyncExternalStore } from 'react';
import { Alert, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { fetchProfile, patchProfile } from './profileApi';

/**
 * Native owns the profile. The server is the source of truth; this is the phone's copy:
 * - shown instantly from storage (works offline), refreshed quietly in the background
 * - edits apply at once and wait in `pending` until the server accepts them (survives restarts)
 * - pending edits are per field, each with the version it was based on, so the server can merge
 *   edits from other phones and reject only same-field conflicts
 * WebView screens get the profile over the bridge (PROFILE_UPDATED) and send edits back
 * (PROFILE_EDIT); they never write their own copy.
 */

const CACHE_KEY = '@profile/cache/v1';
// Profile tab refreshes on open when the copy is older than this
const STALE_MS = 5 * 60 * 1000;
// Fields the app may change; everything else (wallet balance, membership) is server-owned
const EDITABLE_FIELDS = ['name', 'phone', 'email', 'savedAddresses', 'gstDetails'];
const FIELD_LABELS = {
  name: 'Name',
  phone: 'Phone',
  email: 'Email',
  savedAddresses: 'Addresses',
  gstDetails: 'GST details',
};

// Server-confirmed copy + local edits not yet accepted
let server = null; // { profile, version, updatedAt, fetchedAt }
let pending = {}; // { field: { value, baseVersion } }
let hydrated = false;
let syncing = false;
let syncPromise = null;
let syncAgain = false;

const listeners = new Set();
let snapshot = buildSnapshot();

function buildSnapshot() {
  const pendingFields = Object.keys(pending);
  const edits = {};
  pendingFields.forEach((field) => {
    edits[field] = pending[field].value;
  });
  return {
    profile: server ? { ...server.profile, ...edits } : null,
    version: server?.version ?? null,
    fetchedAt: server?.fetchedAt ?? null,
    pendingFields,
    syncing,
    hydrated,
  };
}

function emit() {
  snapshot = buildSnapshot();
  listeners.forEach((fn) => fn(snapshot));
}

let persistQueue = Promise.resolve();
function persist() {
  const data = JSON.stringify({ server, pending });
  // Serialised so an older write can never land after a newer one
  persistQueue = persistQueue.then(() => AsyncStorage.setItem(CACHE_KEY, data)).catch(() => {});
}

function setSyncing(value) {
  if (syncing === value) return;
  syncing = value;
  emit();
}

export function subscribeToProfile(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const getProfileSnapshot = () => snapshot;

/** { profile, version, fetchedAt, pendingFields, syncing, hydrated } */
export function useProfile() {
  return useSyncExternalStore(subscribeToProfile, getProfileSnapshot);
}

async function hydrate() {
  if (hydrated) return;
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      server = saved.server || null;
      pending = saved.pending || {};
    }
  } catch {}
  hydrated = true;
  emit();
}

/** Send queued edits. Server answer replaces the confirmed copy; rejected fields fall back to it. */
async function flushPending() {
  const sent = { ...pending };
  const fields = Object.keys(sent);
  if (!fields.length || !server) return;

  const changes = {};
  const baseVersions = {};
  fields.forEach((field) => {
    changes[field] = sent[field].value;
    baseVersions[field] = sent[field].baseVersion;
  });

  const result = await patchProfile(changes, baseVersions);
  server = { profile: result.profile, version: result.version, updatedAt: result.updatedAt, fetchedAt: Date.now() };

  const next = { ...pending };
  fields.forEach((field) => {
    if (next[field]?.value === sent[field].value) {
      // Saved, or rejected (server wins): either way the server copy is now the truth
      delete next[field];
    } else if (next[field] && !result.rejected.includes(field)) {
      // Edited again while this save was in flight: it now builds on our own saved value
      next[field] = { ...next[field], baseVersion: result.version };
    }
  });
  pending = next;
  persist();
  emit();

  if (result.rejected.length) {
    const names = result.rejected.map((f) => FIELD_LABELS[f] || f).join(', ');
    Alert.alert(
      'Profile updated on another device',
      `Your change to ${names} wasn't saved because it was changed somewhere else first. You're now seeing the latest details.`
    );
  }
}

async function fetchLatest() {
  const result = await fetchProfile(server?.version ?? null);
  if (result.notModified) {
    server = { ...server, fetchedAt: Date.now() };
  } else if (!server || result.version >= server.version) {
    // Never let an older copy overwrite a newer one
    server = { profile: result.profile, version: result.version, updatedAt: result.updatedAt, fetchedAt: Date.now() };
  }
  persist();
  emit();
}

/**
 * Push queued edits, then pull the latest. Safe to call any time: offline it quietly does
 * nothing (the copy and the queue stay as they are), and overlapping calls share one run.
 */
export function syncProfile() {
  if (syncPromise) {
    // An edit made mid-sync wasn't in this run's batch: go again once it finishes
    syncAgain = true;
    return syncPromise;
  }
  syncPromise = (async () => {
    await hydrate();
    setSyncing(true);
    let online = true;
    try {
      if (server) await flushPending();
      await fetchLatest();
    } catch (err) {
      online = !err?.offline;
      if (online) console.log('[Profile] sync failed:', err?.message);
    } finally {
      setSyncing(false);
      syncPromise = null;
    }
    if (syncAgain) {
      syncAgain = false;
      if (online) await syncProfile();
    }
  })();
  return syncPromise;
}

/** Profile tab opened: refresh only if the copy is old (or missing). */
export function refreshProfileIfStale() {
  if (!server || !server.fetchedAt || Date.now() - server.fetchedAt > STALE_MS) syncProfile();
}

/**
 * Apply an edit now (screen + storage), then try to save it. Offline it stays queued and is sent
 * on the next sync. Each field keeps the version it was first edited on, so a later conflict
 * check compares against what the user actually saw.
 */
export function editProfile(changes) {
  if (!server) return;
  const next = { ...pending };
  Object.keys(changes || {}).forEach((field) => {
    if (!EDITABLE_FIELDS.includes(field)) return;
    next[field] = { value: changes[field], baseVersion: next[field]?.baseVersion ?? server.version };
  });
  pending = next;
  persist();
  emit();
  syncProfile();
}

/**
 * Load the stored copy and keep it fresh: on start, when the app returns to the foreground and
 * when the internet comes back. Returns a cleanup function.
 */
export function startProfileSync() {
  syncProfile();

  const appStateSub = AppState.addEventListener('change', (state) => {
    if (state === 'active') syncProfile();
  });

  let wasOnline = true;
  const networkSub = Network.addNetworkStateListener((state) => {
    const online = state.isConnected !== false && state.isInternetReachable !== false;
    if (online && !wasOnline) syncProfile();
    wasOnline = online;
  });

  return () => {
    appStateSub.remove();
    networkSub.remove();
  };
}
