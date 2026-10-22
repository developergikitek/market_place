"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Package,
  PauseCircle,
  Plus,
  Search,
  Tag,
  Trophy,
} from "lucide-react";
import SellerShell from "@/components/layout/SellerShell";
import CreateListingModal from "@/components/listings/CreateListingModal";
import EditListingDrawer from "@/components/listings/EditListingDrawer";
import { formatINR } from "@/components/returns/returnMeta";
import Select from "@/components/ui/Select";
import styles from "@/components/ui/sellerPage.module.css";
import { ApiError } from "@/services/addProductService";
import { Listing, ListingPage, ListingSummary, fetchListingSummary, fetchListings } from "@/services/pricingService";

const CHANNEL_TONE: Record<string, { bg: string; fg: string }> = {
  BAZAAR: { bg: "#e0e7ff", fg: "#3730a3" },
  QUICK_COMMERCE: { bg: "#ccfbf1", fg: "#115e59" },
  BOTH: { bg: "#fef3c7", fg: "#92400e" },
};
const CHANNEL_SHORT: Record<string, string> = { BAZAAR: "Bazaar", QUICK_COMMERCE: "Quick Commerce", BOTH: "Both" };

/** Opens "Create listing" when arriving with ?create_listing=<ASIN> (from the catalog). */
function CreateListingFromQuery({ onRequest }: { onRequest: (asin: string) => void }) {
  const asin = useSearchParams().get("create_listing");
  useEffect(() => {
    if (asin) onRequest(asin);
  }, [asin, onRequest]);
  return null;
}

export default function PricingPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [channel, setChannel] = useState("");
  const [fulfillment, setFulfillment] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListingPage | null>(null);
  const [summary, setSummary] = useState<ListingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [creating, setCreating] = useState<{ asin: string | null } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    fetchListings({ search, status, commerce_channel: channel, fulfillment, page })
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setError(null);
      })
      .catch((err) => !cancelled && setError(err instanceof ApiError ? err.messages[0] : "Couldn't load listings."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [search, status, channel, fulfillment, page, reloadKey]);

  const loadSummary = useCallback(() => {
    fetchListingSummary().then(setSummary).catch(() => setSummary(null));
  }, []);
  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const openFromQuery = useCallback(
    (asin: string) => {
      setCreating({ asin });
      router.replace("/pricing", { scroll: false });
    },
    [router]
  );

  function changeFilter(apply: () => void) {
    apply();
    setPage(1);
    setLoading(true);
  }

  function reload() {
    setLoading(true);
    setReloadKey((k) => k + 1);
    loadSummary();
  }

  const results = data?.results ?? [];
  const byChannel = summary?.listings_by_commerce_channel;

  return (
    <SellerShell active="Pricing">
      <div className={styles.page}>
        <div className={styles.head}>
          <div>
            <h1>Pricing</h1>
            <p>Your offers on catalog products: MRP, sale price, bulk discounts, selling channel and delivery.</p>
          </div>
          <button type="button" className={styles.btnPrimary} onClick={() => setCreating({ asin: null })}>
            <Plus size={16} /> Create listing
          </button>
        </div>

        <div className={styles.kpis}>
          <div className={styles.kpi}>
            <div className={styles.kpiTop}>
              Active listings
              <span className={styles.kpiIcon} style={{ background: "#dcfce7", color: "#15803d" }}>
                <CheckCircle2 size={17} />
              </span>
            </div>
            <div className={styles.kpiValue}>{summary ? summary.active_listings : "—"}</div>
            <div className={styles.kpiNote}>{summary ? `of ${summary.total_listings} listings` : " "}</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiTop}>
              On sale
              <span className={styles.kpiIcon} style={{ background: "#fff7ed", color: "#c2410c" }}>
                <Tag size={17} />
              </span>
            </div>
            <div className={styles.kpiValue}>{summary ? summary.on_sale_listings : "—"}</div>
            <div className={styles.kpiNote}>Selling below MRP</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiTop}>
              Buy Box won
              <span className={styles.kpiIcon} style={{ background: "#fef3c7", color: "#b45309" }}>
                <Trophy size={17} />
              </span>
            </div>
            <div className={styles.kpiValue}>{summary ? summary.buy_box_winners : "—"}</div>
            <div className={styles.kpiNote}>Listings shown as the default offer</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiTop}>
              Paused
              <span className={styles.kpiIcon} style={{ background: "#f1f5f9", color: "#334155" }}>
                <PauseCircle size={17} />
              </span>
            </div>
            <div className={styles.kpiValue}>{summary ? summary.inactive_listings : "—"}</div>
            <div className={styles.kpiNote}>Hidden from buyers</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiTop}>
              By channel
              <span className={styles.kpiIcon} style={{ background: "#e0e7ff", color: "#3730a3" }}>
                <Layers size={17} />
              </span>
            </div>
            <div className={styles.kpiValue} style={{ fontSize: 15, display: "flex", flexDirection: "column", gap: 2 }}>
              {byChannel ? (
                <>
                  <span>Bazaar {byChannel.BAZAAR}</span>
                  <span>Quick {byChannel.QUICK_COMMERCE} · Both {byChannel.BOTH}</span>
                </>
              ) : (
                "—"
              )}
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.toolbar}>
            <div className={styles.search}>
              <Search size={16} />
              <input
                placeholder="Search by SKU, product name or ASIN"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setLoading(true);
                }}
              />
            </div>
            <Select value={status} onChange={(e) => changeFilter(() => setStatus(e.target.value))} className={styles.filterSelect}>
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Paused</option>
            </Select>
            <Select value={channel} onChange={(e) => changeFilter(() => setChannel(e.target.value))} className={styles.filterSelect}>
              <option value="">All channels</option>
              <option value="BAZAAR">Bazaar</option>
              <option value="QUICK_COMMERCE">Quick Commerce</option>
              <option value="BOTH">Both</option>
            </Select>
            <Select value={fulfillment} onChange={(e) => changeFilter(() => setFulfillment(e.target.value))} className={styles.filterSelect}>
              <option value="">All fulfilment</option>
              <option value="FBM">Self ship</option>
              <option value="FBA">Makaano fulfilled</option>
            </Select>
          </div>

          {error ? (
            <div style={{ padding: 16 }}>
              <div className={styles.alert}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1 }}>{error}</div>
                <button type="button" className={`${styles.btn} ${styles.sm}`} onClick={reload}>
                  Try again
                </button>
              </div>
            </div>
          ) : loading && !data ? (
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 18 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div className={styles.skeleton} style={{ width: 44, height: 44 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div className={styles.skeleton} style={{ width: "40%" }} />
                    <div className={styles.skeleton} style={{ width: "25%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className={styles.empty}>
              <Tag size={36} />
              <strong>{search || status || channel || fulfillment ? "No listings match these filters" : "No listings yet"}</strong>
              {search || status || channel || fulfillment
                ? "Try a different search or clear the filters."
                : "Create a listing to start selling a catalog product."}
            </div>
          ) : (
            <div className={`${styles.tableWrap} ${styles.tableWrapNoScroll}`} style={{ opacity: loading ? 0.55 : 1, transition: "opacity 0.15s" }}>
              <table className={`${styles.table} ${styles.tableFixed}`}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ width: 130 }}>SKU</th>
                    <th style={{ width: 85 }}>Channel</th>
                    <th style={{ width: 80 }}>MRP</th>
                    <th style={{ width: 95 }}>Selling price</th>
                    <th style={{ width: 100 }}>B2B</th>
                    <th style={{ width: 85 }}>Status</th>
                    <th style={{ width: 70, textAlign: "right" }} aria-label="Action" />
                  </tr>
                </thead>
                <tbody>
                  {results.map((l) => {
                    const mrp = Number(l.standard_price);
                    const sale = l.sale_price ? Number(l.sale_price) : null;
                    const off = sale ? Math.round(((mrp - sale) / mrp) * 100) : 0;
                    const tone = CHANNEL_TONE[l.commerce_channel];
                    return (
                      <tr key={l.id} className={`${styles.row} ${editing?.id === l.id ? styles.rowOn : ""}`} onClick={() => setEditing(l)}>
                        <td>
                          <div className={styles.product}>
                            <span
                              className={styles.thumb}
                              style={l.product.primary_image ? { backgroundImage: `url(${l.product.primary_image})` } : undefined}
                            >
                              {!l.product.primary_image && <Package size={18} />}
                            </span>
                            <div style={{ minWidth: 0 }}>
                              <div className={styles.productTitle}>{l.product.title}</div>
                              <div className={styles.sub}>
                                {l.product.asin}
                                {l.product.brand_name && ` · ${l.product.brand_name}`}
                                {l.is_buy_box_winner && (
                                  <span className={styles.fc} style={{ background: "#fef3c7", color: "#92400e" }}>
                                    Buy Box
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.rma} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.seller_sku}</div>
                          <div className={styles.sub}>{l.fulfillment_channel === "FBA" ? "Makaano fulfilled" : "Self ship"}</div>
                        </td>
                        <td>
                          <span className={styles.pill} style={{ background: tone.bg, color: tone.fg }}>
                            {CHANNEL_SHORT[l.commerce_channel]}
                          </span>
                        </td>
                        <td className={styles.money} style={sale ? { color: "#94a3b8", textDecoration: "line-through", fontWeight: 600 } : undefined}>
                          {formatINR(mrp)}
                        </td>
                        <td>
                          <div className={styles.money}>{formatINR(sale ?? mrp)}</div>
                          {off > 0 && <div className={styles.sub} style={{ color: "#15803d", fontWeight: 600 }}>{off}% off</div>}
                        </td>
                        <td>
                          {l.b2b_tier_prices.length ? (
                            <span className={styles.sub}>
                              {l.b2b_tier_prices.length} tier{l.b2b_tier_prices.length > 1 ? "s" : ""} · {l.b2b_tier_prices[0].min_quantity}+
                            </span>
                          ) : (
                            <span className={styles.sub}>—</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={styles.pill}
                            style={l.status === "ACTIVE" ? { background: "#dcfce7", color: "#166534" } : { background: "#f1f5f9", color: "#475569" }}
                          >
                            {l.status === "ACTIVE" ? "Active" : l.status === "INACTIVE" ? "Paused" : l.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button type="button" className={`${styles.btn} ${styles.sm}`} style={{ minWidth: 54, height: 30, padding: "0 8px" }}>
                            Edit
                          </button>
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
                Page {data.current_page} of {data.total_pages} · {data.count} listings
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

      <Suspense fallback={null}>
        <CreateListingFromQuery onRequest={openFromQuery} />
      </Suspense>

      {editing && (
        <EditListingDrawer
          key={editing.id}
          listing={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated, msg) => {
            setEditing(null);
            setToast(msg);
            setData((d) => (d ? { ...d, results: d.results.map((r) => (r.id === updated.id ? updated : r)) } : d));
            loadSummary();
          }}
        />
      )}

      {creating && (
        <CreateListingModal
          initialAsin={creating.asin}
          onClose={() => setCreating(null)}
          onCreated={(sku, title) => {
            setCreating(null);
            setToast(`Listing ${sku} created for ${title}`);
            reload();
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
