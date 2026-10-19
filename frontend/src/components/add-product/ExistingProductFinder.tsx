"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { ApiError, CatalogSearchResult, searchBrands, searchCatalog } from "@/services/addProductService";
import { CategoryIndex, categoryPath, pathLabel } from "./categoryTree";
import ProductThumb from "./ProductThumb";
import SearchSelect, { SearchSelectOption } from "./SearchSelect";
import styles from "./addProduct.module.css";

interface ExistingProductFinderProps {
  index: CategoryIndex;
  onPick: (product: CatalogSearchResult) => void;
  onCreateNew: () => void;
}

const formatINR = (value: string) => `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function ExistingProductFinder({ index, onPick, onCreateNew }: ExistingProductFinderProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SearchSelectOption | null>(null);
  const [brand, setBrand] = useState<SearchSelectOption | null>(null);
  const [results, setResults] = useState<CatalogSearchResult[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = useMemo(
    () =>
      Array.from(index.byId.values())
        .map((node) => {
          const path = categoryPath(index, node.id);
          return { value: node.id, label: node.name, sublabel: pathLabel(path.slice(0, -1)) || "Top level" };
        })
        .sort((a, b) => a.label.localeCompare(b.label)),
    [index]
  );

  const loadBrands = useCallback(
    async (q: string) => (await searchBrands(q)).map((b) => ({ value: b.id, label: b.name })),
    []
  );

  const hasFilter = query.trim().length >= 2 || !!category || !!brand;

  useEffect(() => {
    if (!hasFilter) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      searchCatalog({ search: query, categoryId: category?.value, brandId: brand?.value })
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
        <SearchSelect placeholder="All categories" selected={category} onChange={setCategory} options={categoryOptions} />
        <SearchSelect placeholder="All brands" selected={brand} onChange={setBrand} loadOptions={loadBrands} />
      </div>

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
                  Sell this product
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
