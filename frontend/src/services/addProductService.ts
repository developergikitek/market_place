const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface CategoryNode {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  level: number;
  is_leaf: boolean;
  browse_node_id: string;
}

export type AttributeOption = string | { id: string; name: string; slug?: string };

export interface CategoryAttribute {
  id: string;
  code: string;
  label: string;
  data_type: "ENUM" | "TEXT" | "NUMBER" | "BOOLEAN" | string;
  is_required: boolean;
  is_variation_attribute: boolean;
  allowed_options_json: AttributeOption[] | null;
  unit_of_measure_options: string[];
}

export interface BrandOption {
  id: string;
  name: string;
}

export interface CatalogSearchResult {
  id: string;
  asin: string;
  title: string;
  brand: BrandOption | null;
  category: CategoryNode | null;
  primary_image: string | null;
  is_parent: boolean;
  model_number: string | null;
  buy_box_listing: {
    seller_name: string;
    effective_price: string;
    standard_price: string;
  } | null;
}

export interface AttributeValueInput {
  attribute_id: string;
  value: string;
  unit_of_measure?: string;
}

export interface ImageInput {
  image_url: string;
}

export type CommerceChannel = "BAZAAR" | "QUICK_COMMERCE" | "BOTH";

export interface OfferInput {
  seller_sku?: string;
  condition?: string;
  fulfillment_channel: "FBA" | "FBM";
  commerce_channel?: CommerceChannel;
  handling_time_days: number;
  max_order_quantity?: number | null;
  standard_price?: string;
  sale_price?: string | null;
  initial_stock?: number;
}

export interface VariationInput {
  attributes: AttributeValueInput[];
  seller_sku?: string;
  standard_price: string;
  sale_price?: string | null;
  initial_stock: number;
  images?: ImageInput[];
}

export interface CreateProductRequest {
  category_id: string;
  brand_id?: string;
  brand_name?: string;
  title: string;
  description: string;
  bullet_points: string[];
  search_keywords: string[];
  model_number?: string;
  ean?: string;
  gtin?: string;
  hsn_code: string;
  gst_rate_percent: string;
  country_of_origin: string;
  manufacturer_details?: string;
  package_length_inches?: string | null;
  package_width_inches?: string | null;
  package_height_inches?: string | null;
  package_weight_pounds?: string | null;
  is_hazmat: boolean;
  images: ImageInput[];
  attributes: AttributeValueInput[];
  initial_listing: OfferInput;
  variations?: VariationInput[];
}

export interface CreateProductResponse {
  asin: string;
  title: string;
  is_parent: boolean;
  variations: { asin: string; title: string }[];
}

export class ApiError extends Error {
  messages: string[];
  constructor(messages: string[]) {
    super(messages.join(" "));
    this.messages = messages;
  }
}

// DRF errors arrive as nested {field: [msg]} / [msg] / {detail}; flatten them for display.
function flattenErrors(body: unknown, prefix = ""): string[] {
  if (body == null) return [];
  if (typeof body === "string") return [prefix ? `${prefix}: ${body}` : body];
  if (Array.isArray(body)) return body.flatMap((item) => flattenErrors(item, prefix));
  if (typeof body === "object") {
    return Object.entries(body as Record<string, unknown>).flatMap(([key, value]) => {
      const label = key === "non_field_errors" || key === "detail" || key === "error" ? prefix : key.replace(/_/g, " ");
      return flattenErrors(value, label);
    });
  }
  return [String(body)];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { Accept: "application/json", ...(init?.headers || {}) },
    });
  } catch {
    throw new ApiError(["Can't reach the Makaano server. Check that the backend is running."]);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const messages = flattenErrors(body);
    throw new ApiError(messages.length ? messages : [`Request failed (${res.status}).`]);
  }
  return body as T;
}

export async function fetchCategoryTree(): Promise<CategoryNode[]> {
  const data = await request<CategoryNode[] | { results: CategoryNode[] }>("/api/catalog/categories/");
  return Array.isArray(data) ? data : data.results;
}

export async function fetchCategoryAttributes(categoryId: string): Promise<CategoryAttribute[]> {
  const data = await request<{ attributes: CategoryAttribute[] }>(`/api/catalog/categories/${categoryId}/attributes/`);
  return data.attributes;
}

export async function searchBrands(
  query: string,
  scope: { mine?: boolean; categoryId?: string } = {}
): Promise<BrandOption[]> {
  const params = new URLSearchParams({ page_size: "20" });
  if (query.trim()) params.set("search", query.trim());
  // mine: only brands registered to the seller. categoryId: brands possible anywhere under that category.
  if (scope.mine) params.set("mine", "true");
  if (scope.categoryId) params.set("category", scope.categoryId);
  const data = await request<{ results: BrandOption[] } | BrandOption[]>(`/api/catalog/brands/?${params}`);
  return Array.isArray(data) ? data : data.results;
}

export interface CategoryBrand extends BrandOption {
  product_count: number;
}

/** Every brand on the marketplace, or every brand possible under a category and its sub-categories; brands with products first. */
export async function fetchBrandDirectory(categoryId?: string): Promise<CategoryBrand[]> {
  const path = categoryId ? `/api/catalog/categories/${categoryId}/brands/` : "/api/catalog/brands/directory/";
  const data = await request<{ brands: CategoryBrand[] }>(path);
  return data.brands;
}

export async function searchCatalog(filters: {
  search?: string;
  categoryId?: string;
  brandId?: string;
}): Promise<{ results: CatalogSearchResult[]; count: number }> {
  const params = new URLSearchParams({ page_size: "24" });
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.categoryId) params.set("category", filters.categoryId);
  if (filters.brandId) params.set("brand", filters.brandId);
  const data = await request<{ results: CatalogSearchResult[]; count: number }>(`/api/catalog/products/?${params}`);
  return { results: data.results, count: data.count };
}

export async function uploadProductImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const data = await request<{ image_url: string }>("/api/seller/uploads/product-images/", {
    method: "POST",
    body: form,
  });
  return data.image_url;
}

export async function createProduct(payload: CreateProductRequest): Promise<CreateProductResponse> {
  return request<CreateProductResponse>("/api/seller/products/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function createOffer(asin: string, offer: OfferInput): Promise<{ id: string; seller_sku: string }> {
  return request("/api/listings/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_asin: asin, ...offer }),
  });
}

export function optionValue(option: AttributeOption): string {
  return typeof option === "string" ? option : option.name;
}
