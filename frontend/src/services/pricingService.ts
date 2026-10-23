import { CommerceChannel, request } from "./addProductService";

export interface TierPrice {
  min_quantity: number;
  discounted_price: string;
}

/** A seller's offer on a catalog ASIN (the Listing model). */
export interface Listing {
  id: string;
  seller_sku: string;
  product: {
    id: string;
    asin: string;
    title: string;
    brand_name: string | null;
    category_name: string | null;
    primary_image: string | null;
  };
  condition: string;
  condition_note: string | null;
  fulfillment_channel: "MF" | "SF";
  fulfillment_channel_display: string;
  commerce_channel: CommerceChannel;
  commerce_channel_display: string;
  status: string;
  standard_price: string;
  sale_price: string | null;
  effective_price: string;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  minimum_price: string | null;
  maximum_price: string | null;
  handling_time_days: number;
  max_order_quantity: number | null;
  is_buy_box_winner: boolean;
  available_stock: number;
  b2b_tier_prices: TierPrice[];
  updated_at: string;
}

export interface ListingSummary {
  total_listings: number;
  active_listings: number;
  inactive_listings: number;
  on_sale_listings: number;
  buy_box_winners: number;
  listings_by_commerce_channel: Record<CommerceChannel, number>;
}

export interface ListingFilters {
  search?: string;
  status?: string;
  commerce_channel?: string;
  fulfillment?: string;
  page?: number;
}

export interface ListingPage {
  count: number;
  total_pages: number;
  current_page: number;
  results: Listing[];
}

export type ListingPatch = Partial<{
  seller_sku: string;
  standard_price: string;
  sale_price: string | null;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  minimum_price: string | null;
  maximum_price: string | null;
  commerce_channel: CommerceChannel;
  fulfillment_channel: "MF" | "SF";
  handling_time_days: number;
  max_order_quantity: number | null;
  condition: string;
  condition_note: string | null;
  status: string;
}>;

export async function fetchListings(filters: ListingFilters): Promise<ListingPage> {
  const params = new URLSearchParams({ page_size: "20", page: String(filters.page ?? 1) });
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.status) params.set("status", filters.status);
  if (filters.commerce_channel) params.set("commerce_channel", filters.commerce_channel);
  if (filters.fulfillment) params.set("fulfillment", filters.fulfillment);
  return request(`/api/listings/?${params}`);
}

export async function fetchListingSummary(): Promise<ListingSummary> {
  return request("/api/listings/summary/");
}

export async function updateListing(id: string, patch: ListingPatch): Promise<Listing> {
  return request(`/api/listings/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

/** Replaces all B2B quantity tiers of the listing. */
export async function saveTierPrices(id: string, tiers: TierPrice[]): Promise<Listing> {
  return request(`/api/listings/${id}/tier_prices/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tiers),
  });
}
