// ============================================================
// MODEL SERVICE: Server-Driven UI (SDUI) Remote Config Service
// ============================================================

export async function fetchRemoteConfig() {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.warn('[configService] Failed to fetch remote config:', error);
    return null;
  }
}

export async function toggleSectionConfig(sectionKey) {
  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toggleSection: sectionKey }),
    });
    return await res.json();
  } catch (error) {
    console.warn('[configService] Failed to toggle section:', error);
    return { success: false, error: error.message };
  }
}

export async function toggleFeatureConfig(featureKey) {
  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toggleFeature: featureKey }),
    });
    return await res.json();
  } catch (error) {
    console.warn('[configService] Failed to toggle feature:', error);
    return { success: false, error: error.message };
  }
}

export async function applyRemotePreset(presetKey) {
  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset: presetKey }),
    });
    return await res.json();
  } catch (error) {
    console.warn('[configService] Failed to apply preset:', error);
    return { success: false, error: error.message };
  }
}
