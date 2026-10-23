// ============================================================
// MODEL: Bazaar — neighbourhood market catalogue
// ============================================================
// Bazaar is browsed item-first (Blinkit / Zepto style) rather than store-first, so the whole
// section checks out as a single fulfilment partner. The shared cart is store-locked, and
// treating each dealer as its own store would pop the conflict modal on almost every second
// tap. `dealer` stays on the product as sourcing info shown on the card.

export const BAZAAR_STORE = {
  id: 'bazaar_market',
  name: 'Makaano Bazaar',
  code: 'MB',
};

export const BAZAAR_DELIVERY_ETA = '45 mins';

export const BAZAAR_CATEGORIES = [
  { id: 'all', name: 'All', image: '/images/hero-tools.jpg' },
  { id: 'hardware', name: 'Hardware', image: '/images/cat-bolts-cutout.jpg' },
  { id: 'electricals', name: 'Electricals', image: '/images/cat-electrical.jpg' },
  { id: 'sanitary', name: 'Sanitary', image: '/images/cat-plumbing.jpg' },
  { id: 'paints', name: 'Paints', image: '/images/cat-paint-cutout.jpg' },
  { id: 'plywood', name: 'Plywood', image: '/images/cat-building.jpg' },
  { id: 'tools', name: 'Tools', image: '/images/cat-powertools.jpg' },
  { id: 'cleaning', name: 'Cleaning', image: '/images/cat-cleaning.jpg' },
];

/** Offer strip above the grid. */
export const BAZAAR_OFFERS = [
  { id: 'o1', title: 'Flat ₹75 off', sub: 'on orders above ₹499', code: 'BAZAAR75' },
  { id: 'o2', title: 'Free delivery', sub: 'above ₹299 today', code: null },
  { id: 'o3', title: '₹120 cashback', sub: 'paying with UPI', code: 'UPI120' },
];

const product = (id, name, price, originalPrice, pack, image, category, categoryName, dealer, extra = {}) => ({
  id,
  name,
  price,
  originalPrice,
  pack,
  image,
  category,
  categoryName,
  dealer,
  stockStatus: 'In Stock',
  discount: originalPrice > price ? `${Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF` : null,
  ...extra,
});

export const BAZAAR_PRODUCTS = [
  // Hardware
  product('bz_h1', 'Hex Bolt & Nut Set (M8)', 249, 399, '50 pcs • Galvanised', '/images/cat-bolts-cutout.jpg', 'hardware', 'Hardware', 'Agarwal Hardware', { isBestSeller: true }),
  product('bz_h2', 'Self-Drilling Screws', 189, 260, '100 pcs • 25mm', '/images/cat-screws-cutout.jpg', 'hardware', 'Hardware', 'Agarwal Hardware'),
  product('bz_h3', 'Door Hinges Stainless', 329, 450, '4 pcs • 4 inch', '/images/cat-fasteners.jpg', 'hardware', 'Hardware', 'Shree Traders'),
  product('bz_h4', 'Wall Anchor Plugs', 99, 150, '100 pcs • 6mm', '/images/cat-adhesive-cutout.jpg', 'hardware', 'Hardware', 'Shree Traders'),

  // Electricals
  product('bz_e1', 'Modular Switch 6A', 85, 120, '1 pc • White', '/images/cat-switch-cutout.jpg', 'electricals', 'Electricals', 'Verma Electricals', { isBestSeller: true }),
  product('bz_e2', 'Copper Wire 1.5 sqmm', 1299, 1750, '90 m coil', '/images/bulk-wire.jpg', 'electricals', 'Electricals', 'Verma Electricals'),
  product('bz_e3', '3-Pin Socket 16A', 149, 210, '1 pc • ISI', '/images/prod-socket.jpg', 'electricals', 'Electricals', 'Verma Electricals'),
  product('bz_e4', 'Insulation Tape', 45, 70, '5 pcs • 18mm', '/images/prod-tape.jpg', 'electricals', 'Electricals', 'Nagar Electric Co'),

  // Sanitary
  product('bz_s1', 'PVC Pipe 1 inch', 379, 520, '3 m • ISI', '/images/cat-plumbing.jpg', 'sanitary', 'Sanitary', 'Jain Sanitary'),
  product('bz_s2', 'Health Faucet Set', 549, 899, '1 set • Chrome', '/images/cat-plumbing.jpg', 'sanitary', 'Sanitary', 'Jain Sanitary', { isBestSeller: true }),
  product('bz_s3', 'Pipe Sealant Tape', 39, 60, '10 pcs • PTFE', '/images/prod-tape.jpg', 'sanitary', 'Sanitary', 'Jain Sanitary'),

  // Paints
  product('bz_p1', 'Interior Emulsion Paint', 1849, 2600, '10 L • Matt', '/images/cat-paints.jpg', 'paints', 'Paints', 'Rangoli Paints', { isBestSeller: true }),
  product('bz_p2', 'Wall Primer', 749, 1050, '4 L • Water based', '/images/prod-primer.jpg', 'paints', 'Paints', 'Rangoli Paints'),
  product('bz_p3', 'Enamel Paint Glossy', 489, 699, '1 L • Brilliant white', '/images/cat-paint-cutout.jpg', 'paints', 'Paints', 'Rangoli Paints'),
  product('bz_p4', 'Paint Roller & Tray', 229, 340, '1 set • 9 inch', '/images/bulk-paint.jpg', 'paints', 'Paints', 'Rangoli Paints'),

  // Plywood
  product('bz_w1', 'Commercial Plywood', 1649, 2200, '8x4 ft • 12mm', '/images/cat-building.jpg', 'plywood', 'Plywood', 'Maa Timber'),
  product('bz_w2', 'Fevicol SH Adhesive', 329, 450, '1 kg', '/images/prod-fevicol.jpg', 'plywood', 'Plywood', 'Maa Timber', { isBestSeller: true }),
  product('bz_w3', 'Laminate Sheet', 899, 1300, '8x4 ft • 1mm', '/images/cat-adhesive-cutout.jpg', 'plywood', 'Plywood', 'Maa Timber'),

  // Tools
  product('bz_t1', 'Impact Drill 550W', 2199, 3499, '1 unit • 13mm chuck', '/images/cat-drill-cutout.jpg', 'tools', 'Tools', 'Pro Tools Hub', { isBestSeller: true }),
  product('bz_t2', 'Claw Hammer 16oz', 449, 699, '1 pc • Fiberglass', '/images/cat-hammer-cutout.jpg', 'tools', 'Tools', 'Pro Tools Hub'),
  product('bz_t3', 'Angle Grinder 850W', 2749, 3900, '1 unit • 4 inch', '/images/prod-grinder.jpg', 'tools', 'Tools', 'Pro Tools Hub'),
  product('bz_t4', 'Spanner Set', 699, 1050, '8 pcs • CRV', '/images/prod-spanner.jpg', 'tools', 'Tools', 'Pro Tools Hub'),
  product('bz_t5', 'Measuring Tape 5m', 129, 199, '1 pc • Steel', '/images/cat-powertools.jpg', 'tools', 'Tools', 'Pro Tools Hub'),

  // Cleaning
  product('bz_c1', 'Heavy Duty Floor Cleaner', 219, 320, '5 L', '/images/cat-cleaning.jpg', 'cleaning', 'Cleaning', 'Shine Mart'),
  product('bz_c2', 'Safety Gloves', 159, 240, '2 pairs', '/images/cat-safety.jpg', 'cleaning', 'Cleaning', 'Shine Mart'),
];

export const getBazaarBestSellers = () => BAZAAR_PRODUCTS.filter((p) => p.isBestSeller);

/** Products for a category id, or everything for 'all'. */
export const getBazaarProductsByCategory = (categoryId) =>
  !categoryId || categoryId === 'all'
    ? BAZAAR_PRODUCTS
    : BAZAAR_PRODUCTS.filter((p) => p.category === categoryId);

/** Category id -> products, used to lay the grid out as titled shelves. */
export function groupBazaarByCategory(products) {
  const order = BAZAAR_CATEGORIES.filter((c) => c.id !== 'all').map((c) => c.id);
  return order
    .map((id) => ({
      id,
      name: BAZAAR_CATEGORIES.find((c) => c.id === id)?.name || id,
      products: products.filter((p) => p.category === id),
    }))
    .filter((group) => group.products.length > 0);
}
