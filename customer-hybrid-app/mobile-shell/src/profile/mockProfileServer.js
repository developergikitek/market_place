import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';

/**
 * Stand-in for the real profile backend until it exists. It behaves the way the real API must:
 * - every saved change bumps `version`, and each field remembers the version it last changed in
 * - fetch with the version you already have returns `notModified` (no data)
 * - a patch says which version each field was based on; fields changed elsewhere since then are
 *   rejected (server wins), the rest are applied, so edits to different fields merge
 * - no internet = the call fails, like a real request would
 * Its "database" lives in its own storage key, separate from the app's cached copy.
 */

const DB_KEY = '@mock_server/profile/v1';
const LATENCY_MS = 450;

const SEED_PROFILE = {
  name: 'Harshdeep Singh',
  phone: '+91 98930 77412',
  email: 'harshdeep.singh@builderpro.in',
  role: 'Contractor & Site Lead',
  membershipTier: 'PRO Contractor Plus',
  membershipValidity: 'Active till Dec 2026',
  cashbackBalance: 840,
  savedAddresses: [
    {
      id: 'addr_1',
      tag: 'Current Worksite',
      isDefault: true,
      addressLine1: 'Tower B, Plot 42, Scheme 78 Part 2',
      landmark: 'Near Prestige Institute',
      city: 'Indore, MP - 452010',
      contactPerson: 'Harshdeep (Site Supervisor)',
    },
    {
      id: 'addr_2',
      tag: 'Office / Warehouse',
      isDefault: false,
      addressLine1: 'Warehouse 14, Pologround Industrial Estate',
      landmark: 'Behind Bank of India',
      city: 'Indore, MP - 452015',
      contactPerson: 'Sanjay Storekeeper',
    },
    {
      id: 'addr_3',
      tag: 'Home',
      isDefault: false,
      addressLine1: 'B-402, Royal Palms Heights',
      landmark: 'Mahalaxmi Nagar',
      city: 'Indore, MP - 452010',
      contactPerson: 'Harshdeep Singh',
    },
  ],
  gstDetails: {
    registeredName: 'SINGH BUILDCON & HARDWARE SOLUTIONS',
    gstin: '23AAECS4418P1ZH',
    verified: true,
  },
};

export class OfflineError extends Error {
  constructor() {
    super('No internet connection');
    this.offline = true;
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function ensureOnline() {
  const state = await Network.getNetworkStateAsync();
  if (state.isConnected === false || state.isInternetReachable === false) throw new OfflineError();
}

async function readDb() {
  const raw = await AsyncStorage.getItem(DB_KEY);
  if (raw) return JSON.parse(raw);
  const db = { profile: SEED_PROFILE, version: 1, fieldVersions: {}, updatedAt: Date.now() };
  await AsyncStorage.setItem(DB_KEY, JSON.stringify(db));
  return db;
}

const writeDb = (db) => AsyncStorage.setItem(DB_KEY, JSON.stringify(db));

const response = (db) => ({ profile: db.profile, version: db.version, updatedAt: db.updatedAt });

/** GET /profile, with `If-None-Match: knownVersion` */
export async function fetchProfile(knownVersion) {
  await ensureOnline();
  await wait(LATENCY_MS);
  const db = await readDb();
  if (knownVersion === db.version) return { notModified: true, version: db.version };
  return response(db);
}

/** PATCH /profile: `changes` = { field: value }, `baseVersions` = { field: version it was edited on } */
export async function patchProfile(changes, baseVersions) {
  await ensureOnline();
  await wait(LATENCY_MS);
  const db = await readDb();
  const rejected = [];
  const applied = {};
  Object.keys(changes).forEach((field) => {
    if ((db.fieldVersions[field] || 0) > (baseVersions[field] || 0)) rejected.push(field);
    else applied[field] = changes[field];
  });
  if (Object.keys(applied).length) {
    db.version += 1;
    db.profile = { ...db.profile, ...applied };
    Object.keys(applied).forEach((field) => {
      db.fieldVersions[field] = db.version;
    });
    db.updatedAt = Date.now();
    await writeDb(db);
  }
  return { ...response(db), rejected };
}

/** Dev only: change the profile "from another phone", without touching this phone's cache. */
export async function simulateRemoteEdit() {
  const db = await readDb();
  const renamed = db.profile.name.endsWith('(edited elsewhere)');
  db.version += 1;
  db.profile = {
    ...db.profile,
    name: renamed ? SEED_PROFILE.name : `${SEED_PROFILE.name} (edited elsewhere)`,
  };
  db.fieldVersions.name = db.version;
  db.updatedAt = Date.now();
  await writeDb(db);
  return db.version;
}
