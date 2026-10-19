/**
 * Light, premium gradient themes per header service section. Must match SECTION THEMES in
 * web-frontend globals.css: the header gradient ends on the web hero's top colour (`heroFrom`),
 * so header, top spacer and hero read as one continuous surface.
 * - gradient: header top → bottom (bottom === web --hero-from)
 * - ink / muted: text on the light header
 * - accent: active card border, indicator, pin, mic (readable on light backgrounds)
 * - tabActive: active tab colour on the white bottom bar
 */
const NEUTRAL = {
  gradient: ['#E7EBF4', '#F3F5FA'],
  ink: '#0F1B2D',
  muted: '#5B6B80',
  accent: '#F97316',
  accentInk: '#FFFFFF',
  tabActive: '#F97316',
};

export const SECTION_THEMES = {
  // Quick: soft sky blue (tints of #00A8E1), deep green ink
  retail: {
    gradient: ['#C7ECF8', '#DBF3FB'],
    ink: '#0B2E1A',
    muted: '#4E6B5A',
    accent: '#0E8A42',
    accentInk: '#FFFFFF',
    tabActive: '#0E8A42',
  },
  // Bulk: soft ice blue, steel ink
  wholesale: {
    gradient: ['#CBE0FF', '#DCEBFF'],
    ink: '#0E2238',
    muted: '#4F6580',
    accent: '#2F7FD8',
    accentInk: '#FFFFFF',
    tabActive: '#2F7FD8',
  },
  bazaar: NEUTRAL,
  construction: NEUTRAL,
};

export const themeFor = (service) => SECTION_THEMES[service] || NEUTRAL;
