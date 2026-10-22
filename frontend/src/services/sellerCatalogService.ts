import { BrandOption, request } from "./addProductService";

export type CatalogScope = "all" | "listed" | "my_brands";

/** Master-catalog product as the seller catalog shows it (no price, stock or SKU). */
export interface CatalogProduct {
  id: string;
  asin: string;
  title: string;
  status: string;
  status_display: string;
  brand: BrandOption | null;
  category: { id: string; name: string; path: string };
  is_parent: boolean;
  parent_asin: string | null;
  variation_theme: string | null;
  variants_count: number;
  primary_image: string | null;
  image_count: number;
  attribute_count: number;
  model_number: string | null;
  hsn_code: string | null;
  gst_rate_percent: string | null;
  listed_by_me: boolean;
  created_at: string;
  updated_at: string;
}

export interface CatalogProductDetail extends CatalogProduct {
  description: string;
  bullet_points: string[];
  search_keywords: string[];
  part_number: string | null;
  upc: string | null;
  ean: string | null;
  gtin: string | null;
  country_of_origin: string | null;
  manufacturer_details: string | null;
  package_length_inches: string | null;
  package_width_inches: string | null;
  package_height_inches: string | null;
  package_weight_pounds: string | null;
  is_hazmat: boolean;
  hazmat_details: string | null;
  images: { id: string; image_url: string; variant_tag: string; sort_order: number }[];
  attributes: { id: string; attribute_code: string; attribute_label: string; value: string; unit_of_measure: string | null }[];
  variants: { asin: string; title: string; status: string; options: string[] }[];
  parent: { asin: string; title: string } | null;
}

export interface CatalogSummary {
  total: number;
  by_status: Record<string, number>;
  variation_families: number;
  missing_images: number;
  listed_by_me: number;
  my_brands: number;
}

export interface CatalogFilters {
  scope?: CatalogScope;
  search?: string;
  category?: string;
  brand?: string;
  status?: string;
  images?: "" | "missing";
  ordering?: string;
  page?: number;
}

export type CatalogProductPatch = Partial<{
  title: string;
  description: string;
  bullet_points: string[];
  search_keywords: string[];
  model_number: string;
  part_number: string;
  hsn_code: string;
  gst_rate_percent: string;
  country_of_origin: string;
  manufacturer_details: string;
  is_hazmat: boolean;
  hazmat_details: string;
  status: "ACTIVE" | "DISCONTINUED";
}>;

export async function fetchSellerCatalog(filters: CatalogFilters) {
  const params = new URLSearchParams({ page_size: "20", page: String(filters.page ?? 1) });
  (["scope", "search", "category", "brand", "status", "images", "ordering"] as const).forEach((k) => {
    const v = filters[k];
    if (typeof v === "string" && v.trim()) params.set(k, v.trim());
  });
  return request<{ count: number; total_pages: number; current_page: number; results: CatalogProduct[] }>(
    `/api/seller/catalog/?${params}`
  );
}

export async function fetchSellerCatalogSummary(): Promise<CatalogSummary> {
  return request("/api/seller/catalog/summary/");
}

export async function fetchCatalogProduct(asin: string): Promise<CatalogProductDetail> {
  return request(`/api/seller/catalog/${encodeURIComponent(asin)}/`);
}

export async function updateCatalogProduct(asin: string, patch: CatalogProductPatch): Promise<CatalogProductDetail> {
  return request(`/api/seller/catalog/${encodeURIComponent(asin)}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}
