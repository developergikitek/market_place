import { CatalogProductListing, StockStatusType } from "@/types/catalog";
import {
  getLocalCatalogProductsSync,
  addProductToLocalDb,
  updateProductInLocalDb,
  resetLocalDatabase,
} from "./localDbService";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface CreateProductPayload {
  title: string;
  brand: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  condition?: string;
  fulfillmentChannel?: "FBA" | "FBM";
  b2bTier?: string;
  modelNumber?: string;
}

function mapBackendProductToCatalogItem(item: any, index: number): CatalogProductListing {
  const brandName = typeof item.brand === "object" ? item.brand?.name || "Generic" : item.brand || "Generic";
  const categoryName = typeof item.category === "object" ? item.category?.name || "General" : item.category || "General";
  const priceVal = item.buy_box_listing?.effective_price
    ? parseFloat(item.buy_box_listing.effective_price)
    : item.buy_box_listing?.standard_price
    ? parseFloat(item.buy_box_listing.standard_price)
    : item.standard_price
    ? parseFloat(item.standard_price)
    : 450;
  
  const stockVal = item.buy_box_listing?.available_stock ?? item.available_stock ?? (index % 3 === 0 ? 0 : index % 2 === 0 ? 8 : 120);

  let stockStatus: StockStatusType = "in_stock";
  if (stockVal === 0) stockStatus = "out_of_stock";
  else if (stockVal <= 10) stockStatus = "low_stock";

  const titleLower = (item.title || "").toLowerCase();
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
    id: item.id || `api-prod-${item.asin || index}`,
    asin: item.asin || `BM${String(index + 1).padStart(2, "0")}ITEM`,
    title: item.title,
    brand: brandName,
    sku: item.buy_box_listing?.seller_sku || item.seller_sku || `SKU-${item.asin || index}`,
    category: categoryName,
    categoryPath: item.category?.browse_node_id || `${categoryName}`,
    price: priceVal,
    stock: stockVal,
    stockStatus: stockStatus,
    status: item.status === "ACTIVE" || !item.status ? "Active" : "Inactive",
    lastUpdated: item.created_at
      ? new Date(item.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "Recently",
    condition: item.condition || "NEW",
    fulfillmentChannel: item.buy_box_listing?.fulfillment_channel || "FBA",
    isBuyBoxWinner: item.buy_box_listing?.is_buy_box_winner ?? true,
    modelNumber: item.model_number || "",
    iconType: icon,
  };
}

// Deduplication cache to prevent duplicate in-flight network requests
const inFlightCatalogRequests = new Map<
  string,
  Promise<{ products: CatalogProductListing[]; isFromApi: boolean; totalCount: number }>
>();

/**
 * Fetch catalog products from real Django Backend API (`GET /api/catalog/products/`)
 * Visible in browser Network tab. Gracefully falls back to local data if server is unreachable.
 * Deduplicates in-flight calls so only ONE request goes across the network.
 */
export async function getCatalogProducts(
  search?: string,
  category?: string
): Promise<{
  products: CatalogProductListing[];
  isFromApi: boolean;
  totalCount: number;
}> {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append("search", search.trim());
  if (category && category !== "All Categories") params.append("category", category);

  const queryString = params.toString() ? `?${params.toString()}` : "";
  const url = `${API_BASE_URL}/api/catalog/products/${queryString}`;

  if (inFlightCatalogRequests.has(url)) {
    return inFlightCatalogRequests.get(url)!;
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
          mapBackendProductToCatalogItem(item, idx)
        );
        return {
          products: mapped,
          isFromApi: true,
          totalCount: typeof data.count === "number" ? data.count : mapped.length,
        };
      }
    } catch (err) {
      console.warn("Backend API /api/catalog/products/ unreachable, using fallback dataset:", err);
    } finally {
      // Clear after request completes
      setTimeout(() => inFlightCatalogRequests.delete(url), 200);
    }

    const fallback = getLocalCatalogProductsSync();
    return {
      products: fallback,
      isFromApi: false,
      totalCount: fallback.length,
    };
  })();

  inFlightCatalogRequests.set(url, fetchPromise);
  return fetchPromise;
}

/**
 * Create a new product in Catalog (POST to Django Backend API /api/catalog/products/)
 */
export async function createCatalogProduct(payload: CreateProductPayload): Promise<{
  product: CatalogProductListing;
  isFromApi: boolean;
}> {
  // Save in Local DB for immediate reactivity
  const localResult = addProductToLocalDb(payload);

  // POST to Django Backend API
  try {
    const res = await fetch(`${API_BASE_URL}/api/catalog/products/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        title: payload.title,
        brand: payload.brand,
        category: payload.category,
        sku: payload.sku,
        price: payload.price,
        stock: payload.stock,
        fulfillment_channel: payload.fulfillmentChannel || "FBA",
        condition: payload.condition || "NEW",
        model_number: payload.modelNumber || "",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const mapped = mapBackendProductToCatalogItem(data, 0);
      return {
        product: {
          ...mapped,
          sku: payload.sku || mapped.sku,
          price: payload.price,
          stock: payload.stock,
        },
        isFromApi: true,
      };
    }
  } catch (err) {
    console.warn("POST /api/catalog/products/ failed, stored in local database:", err);
  }

  return {
    product: localResult.product,
    isFromApi: false,
  };
}

/**
 * Update an existing product (PUT /api/catalog/products/<id>/)
 */
export async function updateCatalogProduct(
  id: string,
  updates: Partial<CatalogProductListing>
): Promise<{
  product: CatalogProductListing;
  isFromApi: boolean;
}> {
  // Update in local DB immediately
  updateProductInLocalDb(id, updates);

  try {
    const res = await fetch(`${API_BASE_URL}/api/catalog/products/${id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        title: updates.title,
        status: updates.status ? updates.status.toUpperCase() : undefined,
        price: updates.price,
        stock: updates.stock,
        sku: updates.sku,
        brand: updates.brand,
        category: updates.category,
        fulfillment_channel: updates.fulfillmentChannel,
        model_number: updates.modelNumber,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        product: mapBackendProductToCatalogItem(data, 0),
        isFromApi: true,
      };
    }
  } catch (err) {
    console.warn(`PUT /api/catalog/products/${id}/ failed:`, err);
  }

  const localList = getLocalCatalogProductsSync();
  const found = localList.find((p) => p.id === id || p.asin === id);
  return {
    product: found || (updates as CatalogProductListing),
    isFromApi: false,
  };
}

export function resetCatalogSampleData() {
  return resetLocalDatabase();
}
