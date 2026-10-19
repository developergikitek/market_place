import { Platform } from 'react-native';

// For local testing on Android Emulator, localhost is 10.0.2.2; on iOS Simulator or Web it's localhost
const LOCALHOST = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

// Production web app on Vercel (project: web-frontend)
const PRODUCTION_WEB_URL = 'https://web-frontend-indol-gamma.vercel.app';

// Release builds (EAS build / OTA update) load production. Dev (Expo Go) loads the local
// Next.js server, unless EXPO_PUBLIC_WEB_URL is set to test against any other URL.
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || (__DEV__ ? LOCALHOST : PRODUCTION_WEB_URL);

export const DEFAULT_CONFIG = {
  webviewUrl: WEB_URL,
  remoteConfigApiUrl: `${WEB_URL}/api/config`,
  appName: "Customer SuperApp",
  version: "1.0.0",
  enableOtaCheckOnStart: true,
  theme: {
    backgroundColor: '#07090e',
    headerColor: '#0f1523',
    textColor: '#f8fafc',
    accentColor: '#6366f1',
  }
};

/**
 * Fetch remote config from API with fallback to hardcoded defaults
 */
export async function fetchRemoteConfig() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const res = await fetch(DEFAULT_CONFIG.remoteConfigApiUrl, {
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const remoteData = await res.json();
      console.log('[RemoteConfig] Fetched latest config:', remoteData.version);
      return { ...DEFAULT_CONFIG, remote: remoteData };
    }
  } catch (error) {
    console.warn('[RemoteConfig] Failed to fetch remote config, using cache/defaults:', error.message);
  }
  return DEFAULT_CONFIG;
}
