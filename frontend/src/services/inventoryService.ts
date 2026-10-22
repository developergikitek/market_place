import { InventoryItemListing, InventoryStats, InventoryStockStatus } from "@/types/inventory";
import {
  getLocalInventoryItemsSync,
  computeInventoryStats,
  updateStockInLocalDb,
  updateListingInLocalDb,
  resetLocalDatabase,
} from "./localDbService";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function mapBackendListingToInventoryItem(item: any, index: number): InventoryItemListing {
  const productTitle = item.product?.title || item.title || `Construction Item ${index + 1}`;
  const brandName =
    item.product?.brand_name ||
    (typeof item.brand === "object" ? item.brand?.name : item.brand) ||
    "Makaano Certified";
  const categoryName =
    item.product?.category_name ||
    (typeof item.category === "object" ? item.category?.name : item.category) ||
    "Building Materials";
  const stockVal = typeof item.available_stock === "number" ? item.available_stock : 50;

  let status: InventoryStockStatus = "In Stock";
  if (stockVal === 0) status = "Out of Stock";
  else if (stockVal <= 15) status = "Low Stock";

  const sku = item.seller_sku || item.product?.asin || `SKU-${index + 1}`;
  const listingId = item.id || `inv-${sku}`;
  const productId = item.product?.id || `prod-${sku}`;

  const titleLower = productTitle.toLowerCase();
  let icon = "drill";
  if (titleLower.includes("cement")) icon = "cement";
  else if (titleLower.includes("steel") || titleLower.includes("tmt")) icon = "steel";
  else if (titleLower.includes("hammer")) icon = "hammer";
  else if (titleLower.includes("paint") || titleLower.includes("apex")) icon = "paint";
  else if (titleLower.includes("pipe") || titleLower.includes("pvc")) icon = "pipe";
  else if (titleLower.includes("bulb") || titleLower.includes("led")) icon = "bulb";
  else if (titleLower.includes("switch")) icon = "switch";
  else if (titleLower.includes("grinder")) icon = "grinder";
  else if (titleLower.includes("tank")) icon = "tank";

  return {
    id: String(listingId),
    productId: String(productId),
    title: productTitle,
    brand: brandName,
    sku: sku,
    category: categoryName,
    availableStock: stockVal,
    reservedStock: Math.floor(stockVal * 0.05),
    safetyStock: 15,
    status: status,
    warehouse: "Makaano FC-Pune (MH-01)",
    lastUpdated: item.updated_at
      ? new Date(item.updated_at).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Recently",
    iconType: icon,
  };
}

// Deduplication cache to prevent duplicate in-flight network requests
const inFlightInventoryRequests = new Map<
  string,
  Promise<{ items: InventoryItemListing[]; stats: InventoryStats; isFromApi: boolean }>
>();

/**
 * Fetch inventory listings from real Django Backend API (`GET /api/listings/`)
 * Visible in browser Network tab. Gracefully falls back to local data if server is unreachable.
 * Deduplicates in-flight calls so only ONE request goes across the network.
 */
export async function getInventoryListings(
  search?: string,
  statusFilter?: string
): Promise<{
  items: InventoryItemListing[];
  stats: InventoryStats;
  isFromApi: boolean;
}> {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append("search", search.trim());
  if (statusFilter && statusFilter !== "All Status") {
    params.append(
      "status",
      statusFilter === "In Stock" ? "ACTIVE" : statusFilter.toUpperCase()
    );
  }

  const queryString = params.toString() ? `?${params.toString()}` : "";
  const baseUrl = typeof window !== "undefined" ? "/api/backend/portal" : `${API_BASE_URL}/api/portal`;
  const url = `${baseUrl}/listings/${queryString}`;

  if (inFlightInventoryRequests.has(url)) {
    return inFlightInventoryRequests.get(url)!;
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        const rawList = Array.isArray(data) ? data : data.results || [];
        const mapped = rawList.map((item: any, idx: number) =>
          mapBackendListingToInventoryItem(item, idx)
        );

        let totalUnits = 0;
        let inStock = 0;
        let lowStock = 0;
        let outOfStock = 0;

        mapped.forEach((i: InventoryItemListing) => {
          totalUnits += i.availableStock;
          if (i.status === "In Stock") inStock += 1;
          else if (i.status === "Low Stock") lowStock += 1;
          else if (i.status === "Out of Stock") outOfStock += 1;
        });

        return {
          items: mapped,
          stats: {
            totalSKUs: typeof data.count === "number" ? data.count : mapped.length,
            totalStock: totalUnits,
            inStock,
            lowStock,
            outOfStock,
          },
          isFromApi: true,
        };
      }
    } catch (err) {
      console.warn("Backend API /api/listings/ unreachable, using fallback dataset:", err);
    } finally {
      // Clear after request completes
      setTimeout(() => inFlightInventoryRequests.delete(url), 200);
    }

    const fallbackItems = getLocalInventoryItemsSync();
    return {
      items: fallbackItems,
      stats: computeInventoryStats(fallbackItems),
      isFromApi: false,
    };
  })();

  inFlightInventoryRequests.set(url, fetchPromise);
  return fetchPromise;
}

/**
 * Post stock addition or adjustment to Django Backend API (`POST /api/listings/<id>/update_stock/`)
 */
export async function postUpdateInventoryStock(
  listingId: string,
  quantityChange: number,
  actionType: "add" | "set",
  currentStock: number,
  reason?: string,
  warehouse?: string
): Promise<{
  newStock: number;
  newStatus: InventoryStockStatus;
  isFromApi: boolean;
  message: string;
}> {
  const finalStock = Math.max(
    0,
    actionType === "add" ? currentStock + quantityChange : quantityChange
  );

  let newStatus: InventoryStockStatus = "In Stock";
  if (finalStock === 0) newStatus = "Out of Stock";
  else if (finalStock <= 15) newStatus = "Low Stock";

  // 1. Try real Backend API call
  try {
    const baseUrl = typeof window !== "undefined" ? "/api/backend/portal" : `${API_BASE_URL}/api/portal`;
    const url = `${baseUrl}/listings/${listingId}/update_stock/`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        available_stock: finalStock,
        quantity: finalStock,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      // Keep local DB in sync
      updateStockInLocalDb(listingId, quantityChange, actionType, currentStock, reason, warehouse);
      return {
        newStock: typeof data.available_stock === "number" ? data.available_stock : finalStock,
        newStatus,
        isFromApi: true,
        message: data.message || `Stock updated to ${finalStock} units in database.`,
      };
    }
  } catch (err) {
    console.warn("POST stock update to API failed:", err);
  }

  // 2. Fallback to local DB
  const localRes = updateStockInLocalDb(
    listingId,
    quantityChange,
    actionType,
    currentStock,
    reason,
    warehouse
  );

  return {
    newStock: localRes.newStock,
    newStatus: localRes.newStatus,
    isFromApi: false,
    message: localRes.message,
  };
}

/**
 * Update an existing listing (PUT /api/listings/<id>/)
 */
export async function updateInventoryListing(
  listingId: string,
  updates: Partial<InventoryItemListing>
): Promise<{
  item: InventoryItemListing;
  isFromApi: boolean;
}> {
  // Sync in local DB immediately
  updateListingInLocalDb(listingId, updates);

  try {
    const baseUrl = typeof window !== "undefined" ? "/api/backend/portal" : `${API_BASE_URL}/api/portal`;
    const url = `${baseUrl}/listings/${listingId}/`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        status: updates.status === "In Stock" ? "ACTIVE" : updates.status === "Out of Stock" ? "INACTIVE" : updates.status,
        available_stock: updates.availableStock,
        seller_sku: updates.sku,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        item: mapBackendListingToInventoryItem(data, 0),
        isFromApi: true,
      };
    }
  } catch (err) {
    console.warn(`PUT /api/listings/${listingId}/ failed:`, err);
  }

  const fallbackItems = getLocalInventoryItemsSync();
  const found = fallbackItems.find((i) => i.id === listingId || i.productId === listingId || i.sku === listingId);
  return {
    item: found || (updates as InventoryItemListing),
    isFromApi: false,
  };
}

export function resetInventorySampleData(): {
  items: InventoryItemListing[];
  stats: InventoryStats;
} {
  const res = resetLocalDatabase();
  return {
    items: res.items,
    stats: res.inventoryStats,
  };
}
