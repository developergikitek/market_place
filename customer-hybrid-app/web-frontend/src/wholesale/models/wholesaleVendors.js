// ============================================================
// MOCK WHOLESALE VENDORS (until the vendor app / API exists)
// replyAfterSec : when this vendor's quote appears after posting
// priceFactor   : quoted rate vs market rate (0.95 = 5% below market)
// stockFactor   : share of requested qty they can usually supply
// skipChance    : chance they can't supply a given item at all
// ============================================================

export const WHOLESALE_VENDORS = [
  { id: 'v_buildwell', name: 'BuildWell Traders & Materials', code: 'BW', rating: 4.8, ratingCount: 512, locality: 'Palasia', replyAfterSec: 8, priceFactor: 0.97, stockFactor: 1, skipChance: 0.1, deliveryDays: 1, gstInvoice: true },
  { id: 'v_maheshwari', name: 'Maheshwari Cement Depot', code: 'MC', rating: 4.6, ratingCount: 318, locality: 'Bhawarkua', replyAfterSec: 20, priceFactor: 0.94, stockFactor: 0.75, skipChance: 0.35, deliveryDays: 2, gstInvoice: true },
  { id: 'v_gupta', name: 'Gupta Electricals Wholesale', code: 'GE', rating: 4.7, ratingCount: 540, locality: 'Siyaganj', replyAfterSec: 35, priceFactor: 1.01, stockFactor: 1, skipChance: 0.2, deliveryDays: 1, gstInvoice: true },
  { id: 'v_indore_steel', name: 'Indore Steel & Hardware Co.', code: 'IS', rating: 4.4, ratingCount: 207, locality: 'Loha Mandi', replyAfterSec: 55, priceFactor: 0.92, stockFactor: 0.6, skipChance: 0.3, deliveryDays: 3, gstInvoice: false },
  { id: 'v_apex', name: 'Apex Paints & Decor Distributors', code: 'AP', rating: 4.7, ratingCount: 540, locality: 'Vijay Nagar', replyAfterSec: 80, priceFactor: 0.99, stockFactor: 0.9, skipChance: 0.25, deliveryDays: 2, gstInvoice: true },
];

export function getVendor(id) {
  return WHOLESALE_VENDORS.find((v) => v.id === id);
}
