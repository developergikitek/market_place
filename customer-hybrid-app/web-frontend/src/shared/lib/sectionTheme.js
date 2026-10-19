/**
 * Which section theme a route uses (see SECTION THEMES in globals.css).
 * 'quick' = retail screens, 'bulk' = wholesale, null = navy default (Bazaar, Construction),
 * undefined = shared screens (Orders, Profile) that keep the theme of the section you came from.
 * Both functions are self-contained so they can also be inlined as the pre-paint script.
 */
export function sectionForPath(path) {
  var p = path.replace(/\/$/, '') || '/';
  if (p.indexOf('/wholesale') === 0) return 'bulk';
  if (p.indexOf('/bazaar') === 0 || p.indexOf('/construction') === 0) return null;
  if (p === '/' || ['/categories', '/store', '/cart', '/search'].some(function (r) { return p.indexOf(r) === 0; })) {
    return 'quick';
  }
  return undefined;
}

export function applySection(section) {
  var el = document.documentElement;
  if (section === undefined) {
    if (!el.dataset.section) el.dataset.section = 'quick';
  } else if (section) {
    el.dataset.section = section;
  } else {
    delete el.dataset.section;
  }
}

/**
 * Marks pages running inside the Makaano app (<html data-shell="app">) so the layout fills the
 * phone's full width; desktop browsers keep the centred 480px column. The app's WebView user
 * agent carries "CustomerSuperAppMobileShell" on every request, unlike ?native=1.
 * A data attribute, not a class, because React owns <html className>.
 */
export function markAppShell() {
  if (/CustomerSuperAppMobileShell/.test(navigator.userAgent) || location.search.indexOf('native=1') !== -1) {
    document.documentElement.dataset.shell = 'app';
  }
}

/** Inline <head> script: themes and sizes the first paint before React hydrates. */
export const SECTION_THEME_BOOT = `(${markAppShell.toString()})();(${applySection.toString()})((${sectionForPath.toString()})(location.pathname));`;
