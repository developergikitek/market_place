import { request } from "./addProductService";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
export type AdjustMode = "add" | "remove" | "set";

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  type: string;
  type_display: string;
  city: string;
  state_or_province: string;
}

/** Stock of one listing in one warehouse (InventoryItem). */
export interface InventoryItem {
  id: string;
  warehouse: Warehouse;
  available_stock: number;
  reserved_stock: number;
  inbound_stock: number;
  damaged_stock: number;
  safety_stock: number;
  status: StockStatus;
  updated_at: string;
}

/** A listing with its stock summed across warehouses. */
export interface InventoryRow {
  id: string;
  seller_sku: string;
  status: string;
  fulfillment_channel: "MF" | "SF";
  product: { asin: string; title: string; brand: string | null; image: string | null };
  items: InventoryItem[];
  available: number;
  reserved: number;
  inbound: number;
  damaged: number;
  safety: number;
  stock_status: StockStatus;
  updated_at: string;
}

export interface InventorySummary {
  total_skus: number;
  available_units: number;
  reserved_units: number;
  inbound_units: number;
  damaged_units: number;
  in_stock: number;
  low_stock: number;
  out_of_stock: number;
}

export interface Movement {
  id: string;
  quantity_change: number;
  balance_after: number;
  reason: string;
  reason_display: string;
  reference_note: string | null;
  warehouse: string;
  created_at: string;
}

export type ReasonOptions = Record<AdjustMode, { value: string; label: string }[]>;

export interface InventoryFilters {
  search?: string;
  stock_status?: string;
  warehouse?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

type Paged<T> = { count: number; total_pages: number; current_page: number; results: T[] };

export async function fetchInventory(filters: InventoryFilters): Promise<Paged<InventoryRow>> {
  const params = new URLSearchParams({ page_size: String(filters.page_size ?? 20), page: String(filters.page ?? 1) });
  (["search", "stock_status", "warehouse", "ordering"] as const).forEach((k) => {
    const v = filters[k];
    if (v && v.trim()) params.set(k, v.trim());
  });
  return request(`/api/inventory/?${params}`);
}

export const fetchInventorySummary = (): Promise<InventorySummary> => request("/api/inventory/summary/");
export const fetchWarehouses = (): Promise<Warehouse[]> => request("/api/inventory/warehouses/");
export const fetchAdjustReasons = (): Promise<ReasonOptions> => request("/api/inventory/reasons/");

export async function fetchMovements(listingId: string): Promise<Paged<Movement>> {
  return request(`/api/inventory/${listingId}/movements/?page_size=50`);
}

/** Add, remove or set stock for a listing in a warehouse; every change is logged as a movement. */
export async function adjustStock(body: {
  listing_id: string;
  warehouse_id: string;
  mode: AdjustMode;
  quantity: number;
  reason: string;
  note?: string;
}): Promise<InventoryRow> {
  return request("/api/inventory/adjust/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function updateSafetyStock(itemId: string, safety_stock: number): Promise<InventoryItem> {
  return request(`/api/inventory/items/${itemId}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ safety_stock }),
  });
}
