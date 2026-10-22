import { request } from "./addProductService";

export type OrderTab = "pending_payment" | "unshipped" | "shipped" | "delivered" | "cancelled" | "refunded";
export type OrderAction = "confirm" | "pack" | "ship" | "add_tracking" | "mark_delivered" | "mark_rto" | "cancel";

export interface OrderLine {
  id: string;
  status: string;
  status_display: string;
  seller_sku: string;
  fulfillment_channel: "FBA" | "FBM";
  product: { asin: string; title: string; image: string | null };
  quantity: number;
  unit_price: string;
  total_price: string;
  item_tax_amount: string;
  item_shipping_fee: string;
  item_discount_amount: string;
  referral_fee_charged: string;
  closing_fee_charged: string;
  fba_fulfillment_fee: string;
  gift_wrap_requested: boolean;
  fees_total: string;
  net_earning: string;
  shipment_number: string | null;
}

export interface PaymentInfo {
  method: string;
  status: string;
  status_display: string;
  is_cod: boolean;
  /** Cash the courier still has to collect (COD orders not yet delivered), else null. */
  cod_to_collect: string | null;
}

export interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  status_display: string;
  placed_at: string;
  paid_at: string | null;
  currency: string;
  grand_total: string;
  seller_total: string;
  shipping_speed: string;
  is_gift: boolean;
  customer: { name: string; phone: string; city: string; state: string };
  items: OrderLine[];
  payment: PaymentInfo | null;
  ship_by: string;
  is_late: boolean;
  allowed_actions: OrderAction[];
}

export interface Address {
  full_name: string;
  phone: string;
  company: string | null;
  lines: string[];
  city: string;
  state: string;
  postal_code: string;
  instructions: string | null;
}

export interface Shipment {
  id: string;
  shipment_number: string;
  status: string;
  status_display: string;
  carrier_name: string;
  tracking_number: string | null;
  tracking_url: string | null;
  warehouse: string | null;
  estimated_delivery_at: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  events: { id: string; event_time: string; location: string; status_text: string }[];
}

export interface OrderDetail extends OrderRow {
  items_subtotal: string;
  shipping_total: string;
  tax_total: string;
  promotion_discount: string;
  gift_message: string | null;
  shipping_address: Address;
  billing_address: Address;
  payments: (PaymentInfo & { provider: string; reference: string; amount: string; captured_at: string | null })[];
  shipments: Shipment[];
  other_sellers_items: number;
  updated_at: string;
}

export interface OrderSummary {
  tabs: Record<OrderTab, number>;
  total: number;
  sales_30d: string;
  orders_30d: number;
  units_30d: number;
  avg_order_value_30d: string;
  late_shipments: number;
  cod_open_orders: number;
  cod_to_collect: string;
}

export interface OrderFilters {
  tab?: OrderTab | "";
  search?: string;
  date_from?: string;
  date_to?: string;
  fulfillment?: string;
  payment?: "" | "COD" | "PREPAID";
  late?: boolean;
  ordering?: string;
  page?: number;
}

function query(filters: OrderFilters) {
  const params = new URLSearchParams({ page_size: "20", page: String(filters.page ?? 1) });
  (["tab", "search", "date_from", "date_to", "fulfillment", "payment", "ordering"] as const).forEach((k) => {
    const v = filters[k];
    if (v && String(v).trim()) params.set(k, String(v).trim());
  });
  if (filters.late) params.set("late", "true");
  return params;
}

export async function fetchOrders(filters: OrderFilters) {
  return request<{ count: number; total_pages: number; current_page: number; results: OrderRow[] }>(`/api/orders/?${query(filters)}`);
}

export const fetchOrderSummary = (): Promise<OrderSummary> => request("/api/orders/summary/");
export const fetchOrder = (orderNumber: string): Promise<OrderDetail> => request(`/api/orders/${encodeURIComponent(orderNumber)}/`);

export async function runOrderAction(orderNumber: string, action: OrderAction, body: Record<string, unknown> = {}): Promise<OrderDetail> {
  return request(`/api/orders/${encodeURIComponent(orderNumber)}/${action}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** CSV of the orders matching the filters (download URL for an <a href>). */
export function ordersExportUrl(filters: OrderFilters) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const params = query(filters);
  params.delete("page");
  params.delete("page_size");
  return `${base}/api/orders/export/?${params}`;
}
