import { request } from "./addProductService";

export interface PortalBadges {
  orders: number;
  returns: number;
  bulk_orders: number;
}

/**
 * Fetch real-time action-required badge counters for the seller portal sidebar.
 * Calls Django GET /api/portal/badges/ via Next.js BFF proxy.
 */
export async function fetchPortalBadges(): Promise<PortalBadges> {
  try {
    return await request<PortalBadges>("/api/portal/badges/");
  } catch (err) {
    console.warn("[fetchPortalBadges] Failed to fetch portal badges:", err);
    return { orders: 0, returns: 0, bulk_orders: 0 };
  }
}
