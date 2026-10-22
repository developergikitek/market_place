"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Layers,
  Package,
  Plus,
  Search,
  Store,
} from "lucide-react";
import { buildCategoryIndex, categoryPath, pathLabel } from "@/components/add-product/categoryTree";
import CatalogProductDrawer from "@/components/catalog/CatalogProductDrawer";
import SellerShell from "@/components/layout/SellerShell";
import { formatDate } from "@/components/returns/returnMeta";
import Select from "@/components/ui/Select";
import styles from "@/components/ui/sellerPage.module.css";
import { ApiError, CategoryNode, fetchBrandDirectory, fetchCategoryTree } from "@/services/addProductService";
import {
  CatalogProduct,
  CatalogScope,
  CatalogSummary,
  fetchSellerCatalog,
  fetchSellerCatalogSummary,
} from "@/services/sellerCatalogService";

const SCOPES: { value: CatalogScope; label: string; key: keyof CatalogSummary }[] = [
  { value: "all", label: "All catalog", key: "total" },
  { value: "listed", label: "Listed by you", key: "listed_by_me" },
  { value: "my_brands", label: "Your brands", key: "my_brands" },
];

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  ACTIVE: { bg: "#dcfce7", fg: "#166534" },
  DISCONTINUED: { bg: "#f1f5f9", fg: "#475569" },
  SUPPRESSED: { bg: "#fee2e2", fg: "#991b1b" },
  PENDING_APPROVAL: { bg: "#fef3c7", fg: "#92400e" },
  DRAFT: { bg: "#e0e7ff", fg: "#3730a3" },
};

type Page = { count: number; total_pages: number; current_page: number; results: CatalogProduct[] };

export default function CatalogPage() {
  const [scope, setScope] = useState<CatalogScope>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [status, setStatus] = useState("");
  const [images, setImages] = useState<"" | "missing">("");
  const [ordering, setOrdering] = useState("newest");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<Page | null>(null);
  const [summary, setSummary] = useState<CatalogSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [openAsin, setOpenAsin] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchCategoryTree().then(setCategories).catch(() => setCategories([]));
    fetchBrandDirectory()
      .then((list) => setBrands(list.map((b) => ({ id: b.id, name: b.name })).sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => setBrands([]));
  }, []);

  const categoryOptions = useMemo(() => {
    const index = buildCategoryIndex(categories);
    return categories
      .map((c) => ({ id: c.id, label: pathLabel(categoryPath(index, c.id)) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [categories]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    fetchSellerCatalog({ scope, search, category, brand, status, images, ordering, page })
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setError(null);
      })
      .catch((err) => !cancelled && setError(err instanceof ApiError ? err.messages[0] : "Couldn't load the catalog."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [scope, search, category, brand, status, images, ordering, page]);

  const loadSummary = useCallback(() => {
    fetchSellerCatalogSummary().then(setSummary).catch(() => setSummary(null));
  }, []);
  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  function changeFilter(apply: () => void) {
    apply();
    setPage(1);
    setLoading(true);
  }

  const results = data?.results ?? [];
  const filtered = !!(search || category || brand || status || images);

  return (
    <SellerShell active="Catalog">
      <div className={styles.page}>
        <div className={styles.head}>
          <div>
            <h1>Catalog</h1>
            <p>Product pages buyers see: photos, specifications and variants. Prices live in Pricing, stock in Inventory.</p>
          </div>
          <Link href="/catalog/add-product" className={styles.btnPrimary}>
            <Plus size={16} /> Add product
          </Link>
        </div>

        <div className={styles.kpis}>
          <button type="button" className={styles.kpi} onClick={() => changeFilter(() => { setScope("all"); setImages(""); setStatus(""); })}>
            <div className={styles.kpiTop}>
              Catalog products
              <span className={styles.kpiIcon} style={{ background: "#fff7ed", color: "#c2410c" }}>
                <BookOpen size={17} />
              </span>
            </div>
            <div className={styles.kpiValue}>{summary ? summary.total.toLocaleString("en-IN") : "—"}</div>
            <div className={styles.kpiNote}>{summary ? `${summary.by_status.ACTIVE ?? 0} active` : " "}</div>
          </button>
          <button type="button" className={styles.kpi} onClick={() => changeFilter(() => setScope("listed"))}>
            <div className={styles.kpiTop}>
              Listed by you
              <span className={styles.kpiIcon} style={{ background: "#dcfce7", color: "#15803d" }}>
                <Store size={17} />
              </span>
            </div>
            <div className={styles.kpiValue}>{summary ? summary.listed_by_me : "—"}</div>
            <div className={styles.kpiNote}>Products you have an offer on</div>
          </button>
          <button type="button" className={styles.kpi} onClick={() => changeFilter(() => setScope("my_brands"))}>
            <div className={styles.kpiTop}>
              Your brands
              <span className={styles.kpiIcon} style={{ background: "#e0e7ff", color: "#3730a3" }}>
                <CheckCircle2 size={17} />
              </span>
            </div>
            <div className={styles.kpiValue}>{summary ? summary.my_brands : "—"}</div>
            <div className={styles.kpiNote}>Products under a brand you registered</div>
          </button>
          <div className={styles.kpi}>
            <div className={styles.kpiTop}>
              Variation families
              <span className={styles.kpiIcon} style={{ background: "#ede9fe", color: "#6d28d9" }}>
                <Layers size={17} />
              </span>
            </div>
            <div className={styles.kpiValue}>{summary ? summary.variation_families : "—"}</div>
            <div className={styles.kpiNote}>Parent products with size / colour variants</div>
          </div>
          <button type="button" className={styles.kpi} onClick={() => changeFilter(() => setImages("missing"))}>
            <div className={styles.kpiTop}>
              Missing photos
              <span className={styles.kpiIcon} style={{ background: "#fee2e2", color: "#b91c1c" }}>
                <ImageOff size={17} />
              </span>
            </div>
            <div className={styles.kpiValue}>{summary ? summary.missing_images.toLocaleString("en-IN") : "—"}</div>
            <div className={styles.kpiNote}>Products buyers see without a picture</div>
          </button>
        </div>

        <div className={styles.card}>
          <div className={styles.chips}>
            {SCOPES.map((s) => (
              <button
                key={s.value}
                type="button"
                className={`${styles.chip} ${scope === s.value ? styles.chipOn : ""}`}
                onClick={() => changeFilter(() => setScope(s.value))}
              >
                {s.label}
                {summary && <span className={styles.count}>{(summary[s.key] as number).toLocaleString("en-IN")}</span>}
              </button>
            ))}
            {images === "missing" && (
              <button type="button" className={`${styles.chip} ${styles.chipOn}`} onClick={() => changeFilter(() => setImages(""))}>
                Missing photos ✕
              </button>
            )}
          </div>

          <div className={styles.toolbar}>
            <div className={styles.search}>
              <Search size={16} />
              <input
                placeholder="Search by product name, ASIN, model number or brand"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setLoading(true);
                }}
              />
            </div>
            <Select value={category} onChange={(e) => changeFilter(() => setCategory(e.target.value))} className={styles.filterSelect}>
              <option value="">All categories</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </Select>
            <Select value={brand} onChange={(e) => changeFilter(() => setBrand(e.target.value))} className={styles.filterSelect}>
              <option value="">All brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
            <Select value={status} onChange={(e) => changeFilter(() => setStatus(e.target.value))} className={styles.filterSelect}>
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_APPROVAL">Pending approval</option>
              <option value="SUPPRESSED">Suppressed</option>
              <option value="DISCONTINUED">Discontinued</option>
            </Select>
            <Select value={ordering} onChange={(e) => changeFilter(() => setOrdering(e.target.value))} className={styles.filterSelect}>
              <option value="newest">Newest first</option>
              <option value="updated">Recently updated</option>
              <option value="title">Name A–Z</option>
            </Select>
          </div>

          {error ? (
            <div style={{ padding: 16 }}>
              <div className={styles.alert}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>{error}</div>
              </div>
            </div>
          ) : loading && !data ? (
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 18 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div className={styles.skeleton} style={{ width: 44, height: 44 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div className={styles.skeleton} style={{ width: "45%" }} />
                    <div className={styles.skeleton} style={{ width: "25%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className={styles.empty}>
              <BookOpen size={36} />
              <strong>{filtered ? "No products match these filters" : scope === "all" ? "The catalog is empty" : "Nothing here yet"}</strong>
              {filtered
                ? "Try a different search or clear the filters."
                : scope === "listed"
                ? "Create a listing in Pricing to start selling a catalog product."
                : scope === "my_brands"
                ? "Products you add under your own brand show up here."
                : "Add the first product to the catalog."}
            </div>
          ) : (
            <div className={styles.tableWrap} style={{ opacity: loading ? 0.55 : 1, transition: "opacity 0.15s" }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Brand</th>
                    <th>Category</th>
                    <th>Variants</th>
                    <th>Content</th>
                    <th>Status</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((p) => {
                    const tone = STATUS_TONE[p.status] ?? STATUS_TONE.DRAFT;
                    return (
                      <tr key={p.id} className={`${styles.row} ${openAsin === p.asin ? styles.rowOn : ""}`} onClick={() => setOpenAsin(p.asin)}>
                        <td>
                          <div className={styles.product}>
                            <span className={styles.thumb} style={p.primary_image ? { backgroundImage: `url(${p.primary_image})` } : undefined}>
                              {!p.primary_image && <Package size={18} />}
                            </span>
                            <div style={{ minWidth: 0 }}>
                              <div className={styles.productTitle}>{p.title}</div>
                              <div className={styles.sub}>
                                <span className={styles.rma} style={{ fontSize: 11.5, fontWeight: 500 }}>{p.asin}</span>
                                {p.model_number && ` · ${p.model_number}`}
                                {p.listed_by_me && (
                                  <span className={styles.fc} style={{ background: "#dcfce7", color: "#166534" }}>
                                    Listed
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>{p.brand?.name ?? <span className={styles.sub}>Unbranded</span>}</td>
                        <td style={{ maxWidth: 220 }}>
                          <div style={{ fontWeight: 600 }}>{p.category.name}</div>
                          <div className={styles.sub} title={p.category.path} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.category.path.split(" › ").slice(0, -1).join(" › ")}
                          </div>
                        </td>
                        <td className={styles.nowrap}>
                          {p.is_parent ? `${p.variants_count} variants` : p.parent_asin ? <span className={styles.sub}>Variant of {p.parent_asin}</span> : <span className={styles.sub}>—</span>}
                        </td>
                        <td className={styles.nowrap}>
                          <div style={{ color: p.image_count ? undefined : "#b91c1c", fontWeight: 600, fontSize: 13 }}>
                            {p.image_count} photo{p.image_count === 1 ? "" : "s"}
                          </div>
                          <div className={styles.sub}>{p.attribute_count} specs</div>
                        </td>
                        <td>
                          <span className={styles.pill} style={{ background: tone.bg, color: tone.fg }}>
                            {p.status_display}
                          </span>
                        </td>
                        <td className={styles.nowrap}>
                          <span className={styles.sub}>{formatDate(p.updated_at)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {data && data.total_pages > 1 && (
            <div className={styles.pager}>
              <span>
                Page {data.current_page} of {data.total_pages} · {data.count.toLocaleString("en-IN")} products
              </span>
              <div className={styles.pagerButtons}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.sm}`}
                  disabled={page <= 1}
                  onClick={() => {
                    setLoading(true);
                    setPage(page - 1);
                  }}
                >
                  <ChevronLeft size={15} /> Previous
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.sm}`}
                  disabled={page >= data.total_pages}
                  onClick={() => {
                    setLoading(true);
                    setPage(page + 1);
                  }}
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {openAsin && (
        <CatalogProductDrawer
          key={openAsin}
          asin={openAsin}
          onClose={() => setOpenAsin(null)}
          onSaved={(updated) => {
            setToast("Product details saved");
            setData((d) =>
              d
                ? {
                    ...d,
                    results: d.results.map((r) =>
                      r.asin === updated.asin ? { ...r, title: updated.title, status: updated.status, status_display: updated.status_display, model_number: updated.model_number } : r
                    ),
                  }
                : d
            );
            loadSummary();
          }}
        />
      )}

      {toast && (
        <div className={styles.toast} role="status">
          <CheckCircle2 size={17} color="#4ade80" /> {toast}
        </div>
      )}
    </SellerShell>
  );
}
