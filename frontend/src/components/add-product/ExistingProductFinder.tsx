"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ChevronRight, Loader2, Search } from "lucide-react";
import {
  ApiError,
  CatalogSearchResult,
  CategoryBrand,
  CategoryNode,
  fetchBrandDirectory,
  searchCatalog,
} from "@/services/addProductService";
import CategoryPicker from "./CategoryPicker";
import { CategoryIndex, categoryPath } from "./categoryTree";
import ProductThumb from "./ProductThumb";
import SearchSelect, { SearchSelectOption } from "./SearchSelect";
import styles from "./addProduct.module.css";

interface ExistingProductFinderProps {
  index: CategoryIndex;
  onPick: (product: CatalogSearchResult) => void;
  onCreateNew: () => void;
}

const ALL = "all";

const formatINR = (value: string) => `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function ExistingProductFinder({ index, onPick, onCreateNew }: ExistingProductFinderProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryNode | null>(null);
  const [browsing, setBrowsing] = useState(false);
  const [brand, setBrand] = useState<SearchSelectOption | null>(null);
  const [results, setResults] = useState<CatalogSearchResult[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Keyed by category (or ALL) so a late response for a previous category is never shown.
  const [brandsFor, setBrandsFor] = useState<{ key: string; brands: CategoryBrand[]; error: string | null } | null>(null);

  const categoryCrumbs = useMemo(() => (category ? categoryPath(index, category.id) : []), [index, category]);

  // All brands: the whole marketplace, or the chosen category down to its last-level sub-categories.
  const brandsKey = category?.id ?? ALL;
  useEffect(() => {
    let cancelled = false;
    fetchBrandDirectory(brandsKey === ALL ? undefined : brandsKey)
      .then((list) => {
        if (cancelled) return;
        setBrandsFor({ key: brandsKey, brands: list, error: null });
        // Drop a brand picked earlier that doesn't exist under the new category.
        setBrand((current) => (current && !list.some((b) => b.id === current.value) ? null : current));
      })
      .catch((err) => {
        if (cancelled) return;
        const error = err instanceof ApiError ? err.messages[0] : "Couldn't load brands.";
        setBrandsFor({ key: brandsKey, brands: [], error });
      });
    return () => {
      cancelled = true;
    };
  }, [brandsKey]);

  const loaded = brandsFor?.key === brandsKey ? brandsFor : null;
  const categoryBrands = loaded && !loaded.error ? loaded.brands : null;
  const brandsError = loaded?.error ?? null;

  const brandScope = category ? `Brands in ${category.name}` : "All brands";
  const brandPlaceholder =
    brandsError ?? (categoryBrands ? `${brandScope} (${categoryBrands.length})` : "Loading brands…");

  const brandOptions = useMemo<SearchSelectOption[] | undefined>(
    () =>
      categoryBrands?.map((b) => ({
        value: b.id,
        label: b.name,
        badge: b.product_count ? `${b.product_count} ${b.product_count === 1 ? "product" : "products"}` : undefined,
      })),
    [categoryBrands]
  );

  const hasFilter = query.trim().length >= 2 || !!category || !!brand;

  useEffect(() => {
    if (!hasFilter) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      searchCatalog({ search: query, categoryId: category?.id, brandId: brand?.value })
        .then((data) => {
          if (cancelled) return;
          // Parent ASINs are not sellable; sellers pick the exact child variant.
          setResults(data.results.filter((p) => !p.is_parent));
          setCount(data.count);
        })
        .catch((err) => !cancelled && setError(err instanceof ApiError ? err.messages[0] : "Search failed."))
        .finally(() => !cancelled && setLoading(false));
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, category, brand, hasFilter]);

  return (
    <div className={styles.card}>
      <div className={styles.filters}>
        <div className={styles.searchBox} style={{ margin: 0 }}>
          <Search size={17} />
          <input
            className={styles.input}
            placeholder="Search by ASIN, product name or model number"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <SearchSelect
          placeholder={brandPlaceholder}
          selected={brand}
          onChange={setBrand}
          options={brandOptions ?? []}
          loading={!categoryBrands && !brandsError}
          noun="brand"
          avatars
        />
      </div>

      <div className={styles.categoryFilter}>
        <span className={styles.categoryFilterLabel}>Category</span>
        <span className={styles.breadcrumb}>
          {categoryCrumbs.length === 0
            ? "All categories"
            : categoryCrumbs.map((node, i) => (
                <span key={node.id} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {i === categoryCrumbs.length - 1 ? <strong>{node.name}</strong> : node.name}
                  {i < categoryCrumbs.length - 1 && <ChevronRight size={12} />}
                </span>
              ))}
        </span>
        <span className={styles.categoryFilterActions}>
          {category && (
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => {
                setCategory(null);
                setBrowsing(false);
              }}
            >
              Clear
            </button>
          )}
          <button type="button" className={styles.linkBtn} onClick={() => setBrowsing(!browsing)}>
            {browsing ? "Done" : category ? "Change" : "Browse categories"}
          </button>
        </span>
      </div>

      {browsing && (
        <div style={{ marginBottom: 18 }}>
          <CategoryPicker index={index} initialLeafId={category?.id} onLeafChange={setCategory} anyLevel />
          <p className={styles.hint} style={{ marginTop: 8 }}>
            Pick any level — products from all its sub-categories are included.
          </p>
        </div>
      )}

      {error && (
        <div className={`${styles.alert} ${styles.alertError}`}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {!hasFilter ? (
        <div className={styles.empty}>
          Enter an ASIN or product name, or pick a category / brand to browse the Makaano catalog.
        </div>
      ) : loading ? (
        <div className={styles.loading}>
          <Loader2 size={18} className={styles.spin} /> Searching catalog…
        </div>
      ) : results.length === 0 ? (
        <div className={styles.empty}>
          <p style={{ marginBottom: 12 }}>No matching product in the catalog.</p>
          <button type="button" className={styles.btnPrimary} onClick={onCreateNew}>
            Create a new product instead
          </button>
        </div>
      ) : (
        <>
          <p className={styles.hint} style={{ marginBottom: 10 }}>
            {count > results.length ? `Showing ${results.length} of ${count} — refine your search to narrow down` : `${results.length} products`}
          </p>
          <div className={styles.resultList}>
            {results.map((product) => (
              <div key={product.id} className={styles.resultRow}>
                <ProductThumb src={product.primary_image} />
                <div style={{ minWidth: 0 }}>
                  <div className={styles.resultTitle}>{product.title}</div>
                  <div className={styles.resultMeta}>
                    <span>
                      ASIN <span className={styles.mono}>{product.asin}</span>
                    </span>
                    {product.brand && <span>{product.brand.name}</span>}
                    {product.category && <span>{product.category.name}</span>}
                  </div>
                  {product.buy_box_listing && (
                    <div className={styles.resultPrice}>
                      Lowest price {formatINR(product.buy_box_listing.effective_price)} by {product.buy_box_listing.seller_name}
                    </div>
                  )}
                </div>
                <button type="button" className={styles.btnSecondary} onClick={() => onPick(product)}>
                  View details
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
