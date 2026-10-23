import { request } from "./addProductService";

export type ReturnStatus =
  | "REQUESTED"
  | "SELLER_APPROVED"
  | "AUTO_AUTHORIZED"
  | "RETURN_LABEL_GENERATED"
  | "IN_TRANSIT_TO_FC"
  | "DELIVERED_TO_FC"
  | "INSPECTED_SELLABLE"
  | "INSPECTED_DAMAGED"
  | "REFUND_ISSUED"
  | "REJECTED"
  | "CANCELLED";

export type ReturnGroup = "action_required" | "in_progress" | "completed" | "closed";

export type ReturnAction =
  | "approve"
  | "reject"
  | "generate_label"
  | "mark_in_transit"
  | "mark_received"
  | "inspect"
  | "issue_refund";

export interface ReturnRequest {
  id: string;
  rma_number: string;
  status: ReturnStatus;
  status_display: string;
  reason: string;
  reason_display: string;
  customer_comment: string | null;
  evidence_images: string[];
  order_number: string;
  order_placed_at: string;
  order_item_id: string;
  quantity: number;
  unit_price: string;
  item_total: string;
  seller_sku: string;
  fulfillment_channel: "MF" | "SF";
  product: { asin: string; title: string; brand: string | null; image: string | null };
  customer: { name: string; phone: string | null; city: string | null; state: string | null };
  return_carrier: string | null;
  return_tracking_number: string | null;
  return_label_url: string | null;
  restocking_fee_rate: string;
  restocking_fee_amount: string;
  restocking_fee_allowed: boolean;
  refund_amount: string;
  refunded_at: string | null;
  allowed_actions: ReturnAction[];
  created_at: string;
  updated_at: string;
}

export interface ReturnsSummary {
  total: number;
  groups: Record<ReturnGroup, number>;
  by_status: Record<ReturnStatus, number>;
  refunded_total: string;
  pending_refund_total: string;
  return_rate_30d: number;
  top_reasons: { reason: string; label: string; count: number }[];
}

export interface ReturnFilters {
  group?: ReturnGroup | "";
  search?: string;
  reason?: string;
  fulfillment?: string;
  ordering?: string;
  page?: number;
}

export interface Paginated<T> {
  count: number;
  total_pages: number;
  current_page: number;
  results: T[];
}

export type ClaimStatus =
  | "FILED"
  | "UNDER_INVESTIGATION"
  | "WAITING_FOR_SELLER_RESPONSE"
  | "GRANTED_BUYER_REFUNDED_BY_SELLER"
  | "GRANTED_BUYER_FUNDED_BY_BUILDMART"
  | "GRANTED_BUYER_FUNDED_BY_AMAZON"
  | "CLAIM_DENIED"
  | "WITHDRAWN";

export interface AtoZClaim {
  id: string;
  claim_number: string;
  status: ClaimStatus;
  status_display: string;
  order_number: string;
  order_total: string;
  customer_name: string;
  claim_reason: string;
  buyer_explanation: string;
  seller_response_text: string | null;
  seller_responded_at: string | null;
  refund_amount: string | null;
  resolved_at: string | null;
  can_respond: boolean;
  created_at: string;
}

export interface ClaimsSummary {
  total: number;
  awaiting_response: number;
}

export const RETURN_REASONS: { value: string; label: string }[] = [
  { value: "DEFECTIVE_OR_DOES_NOT_WORK", label: "Defective or does not work" },
  { value: "WRONG_ITEM_SENT", label: "Wrong item sent" },
  { value: "ITEM_NOT_AS_DESCRIBED", label: "Item not as described" },
  { value: "ACCIDENTAL_ORDER", label: "Accidental order" },
  { value: "FOUND_BETTER_PRICE", label: "Found better price" },
  { value: "MISSING_PARTS_OR_ACCESSORIES", label: "Missing parts or accessories" },
  { value: "SHIPPING_BOX_AND_ITEM_DAMAGED", label: "Box and item damaged" },
  { value: "ARRIVED_TOO_LATE", label: "Arrived too late" },
  { value: "UNAUTHORIZED_PURCHASE", label: "Unauthorized purchase" },
];

export async function fetchReturns(filters: ReturnFilters): Promise<Paginated<ReturnRequest>> {
  const params = new URLSearchParams({ page_size: "20", page: String(filters.page ?? 1) });
  if (filters.group) params.set("group", filters.group);
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.reason) params.set("reason", filters.reason);
  if (filters.fulfillment) params.set("fulfillment", filters.fulfillment);
  if (filters.ordering) params.set("ordering", filters.ordering);
  return request(`/api/portal/returns/?${params}`);
}

export async function fetchReturnsSummary(): Promise<ReturnsSummary> {
  return request("/api/portal/returns/summary/");
}

import { triggerPortalBadgesRefresh } from "@/context/BadgesContext";

/** Run a lifecycle action; `body` carries the action's inputs (fee rate, carrier, condition…). */
export async function runReturnAction(
  id: string,
  action: ReturnAction,
  body: Record<string, unknown> = {}
): Promise<ReturnRequest> {
  const result = await request<ReturnRequest>(`/api/portal/returns/${id}/${action}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  triggerPortalBadgesRefresh();
  return result;
}

export async function fetchClaims(): Promise<Paginated<AtoZClaim>> {
  return request("/api/portal/returns/claims/?page_size=50");
}

export async function fetchClaimsSummary(): Promise<ClaimsSummary> {
  return request("/api/portal/returns/claims/summary/");
}

export async function respondToClaim(id: string, response: string): Promise<AtoZClaim> {
  const result = await request<AtoZClaim>(`/api/portal/returns/claims/${id}/respond/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ response }),
  });
  triggerPortalBadgesRefresh();
  return result;
}
