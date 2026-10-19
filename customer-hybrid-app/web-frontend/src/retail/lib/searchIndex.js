import { VERIFIED_STORES } from '@/retail/models/marketplaceModel';

// Every product once per store (a store's best sellers repeat its catalogue)
export const SEARCHABLE_ITEMS = VERIFIED_STORES.flatMap((store) => {
  const seen = new Set();
  return [...(store.products || []), ...(store.bestSellers || [])]
    .filter((p) => !seen.has(p.id) && seen.add(p.id))
    .map((product) => ({ product, store }));
});

// "Bosch Drills" -> ["bosch", "drill"]: words match in any order, plurals match singulars
export function tokenize(text = '') {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((t) => (t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t));
}

function matchesAll(tokens, fields) {
  const haystack = fields.filter(Boolean).join(' ').toLowerCase();
  return tokens.every((t) => haystack.includes(t));
}

export function itemMatches(tokens, { product, store }) {
  return matchesAll(tokens, [product.name, product.categoryName, product.pack, store.name]);
}

/**
 * Search stores and items.
 * - items: every product matching all query words
 * - stores: stores matching by name/categories, plus stores that sell a matching item
 */
export function searchCatalog(query) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return null;

  const items = SEARCHABLE_ITEMS.filter((entry) => itemMatches(tokens, entry));
  const storeIdsWithItems = new Set(items.map((i) => i.store.id));
  const stores = VERIFIED_STORES.filter(
    (s) => storeIdsWithItems.has(s.id) || matchesAll(tokens, [s.name, s.locality, s.categoriesLine])
  );

  return { tokens, items, stores };
}
