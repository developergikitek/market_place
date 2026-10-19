/**
 * Profile backend calls. Backed by the on-device mock until the real API exists; swapping in
 * the real one only means replacing these two functions with fetch() calls that keep the same
 * contract (see mockProfileServer.js):
 *
 *   fetchProfile(knownVersion)
 *     -> { notModified: true, version } | { profile, version, updatedAt }
 *   patchProfile(changes, baseVersions)
 *     -> { profile, version, updatedAt, rejected: [field] }
 *
 * Both throw an error with `offline: true` when there is no internet.
 */
export { fetchProfile, patchProfile } from './mockProfileServer';
