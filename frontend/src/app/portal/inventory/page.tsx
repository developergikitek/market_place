"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Package,
  PackageX,
  Plus,
  Search,
  Truck,
} from "lucide-react";
import AdjustStockModal from "@/components/inventory/AdjustStockModal";
import StockDrawer, { STOCK_TONE } from "@/components/inventory/StockDrawer";
import SellerShell from "@/components/layout/SellerShell";
import Select from "@/components/ui/Select";
import styles from "@/components/ui/sellerPage.module.css";
import { ApiError } from "@/services/addProductService";
import {
  AdjustMode,
  InventoryRow,
  InventorySummary,
  Warehouse,
  fetchInventory,
  fetchInventorySummary,
  fetchWarehouses,
} from "@/services/inventoryApi";

type Page = { count: number; total_pages: number; current_page: number; results: InventoryRow[] };

export default function InventoryPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [ordering, setOrdering] = useState("stock_asc");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page | null>(null);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openRow, setOpenRow] = useState<InventoryRow | null>(null);
  const [adjusting, setAdjusting] = useState<{ row: InventoryRow | null; mode: AdjustMode } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    fetchWarehouses().then(setWarehouses).catch(() => setWarehouses([]));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    fetchInventory({ search, stock_status: stockStatus, warehouse, ordering, page })
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setError(null);
      })
      .catch((err) => !cancelled && setError(err instanceof ApiError ? err.messages[0] : "Couldn't load inventory."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [search, stockStatus, warehouse, ordering, page, reloadKey]);

  const loadSummary = useCallback(() => {
    fetchInventorySummary().then(setSummary).catch(() => setSummary(null));
  }, []);
  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

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
  const filtered = !!(search || stockStatus || warehouse);

  return (
    <SellerShell active="Inventory">
      <div className={styles.page}>
        <div className={styles.head}>
          <div>
            <h1>Inventory</h1>
            <p>Stock of your listings in each warehouse. Every change is recorded with a reason.</p>
          </div>
          <button
            type="button"
            className={styles.btnPrimary}
            disabled={!warehouses.length}
            onClick={() => setAdjusting({ row: null, mode: "add" })}
          >
            <Plus size={16} /> Add stock
          </button>
        </div>

        <div className={styles.kpis}>
          <button type="button" className={styles.kpi} onClick={() => changeFilter(() => setStockStatus(""))}>
            <div className={styles.kpiTop}>
              Units available
              <span className={styles.kpiIcon} style={{ background: "#fff7ed", color: "#c2410c" }}>
                <Boxes size={17} />
              </span>
            </div>
            <div className={styles.kpiValue}>{summary ? summary.available_units.toLocaleString("en-IN") : "—"}</div>
            <div className={styles.kpiNote}>{summary ? `across ${summary.total_skus} listings` : " "}</div>
          </button>
          <button type="button" className={styles.kpi} onClick={() => changeFilter(() => setStockStatus("IN_STOCK"))}>
            <div className={styles.kpiTop}>
              In stock
              <span className={styles.kpiIcon} style={{ background: "#dcfce7", color: "#15803d" }}>
                <CheckCircle2 size={17} />
              </span>
            </div>
            <div className={styles.kpiValue}>{summary ? summary.in_stock : "—"}</div>
            <div className={styles.kpiNote}>Above their safety stock</div>
          </button>
          <button type="button" className={styles.kpi} onClick={() => changeFilter(() => setStockStatus("LOW_STOCK"))}>
            <div className={styles.kpiTop}>
              Low stock
              <span className={styles.kpiIcon} style={{ background: "#fef3c7", color: "#b45309" }}>
                <AlertTriangle size={17} />
              </span>
            </div>
            <div className={styles.kpiValue}>{summary ? summary.low_stock : "—"}</div>
            <div className={styles.kpiNote}>At or below safety stock — reorder soon</div>
          </button>
          <button type="button" className={styles.kpi} onClick={() => changeFilter(() => setStockStatus("OUT_OF_STOCK"))}>
            <div className={styles.kpiTop}>
              Out of stock
              <span className={styles.kpiIcon} style={{ background: "#fee2e2", color: "#b91c1c" }}>
                <PackageX size={17} />
              </span>
            </div>
            <div className={styles.kpiValue}>{summary ? summary.out_of_stock : "—"}</div>
            <div className={styles.kpiNote}>Buyers can&apos;t order these</div>
          </button>
          <div className={styles.kpi}>
            <div className={styles.kpiTop}>
              Reserved · damaged
              <span className={styles.kpiIcon} style={{ background: "#f1f5f9", color: "#334155" }}>
                <Truck size={17} />
              </span>
            </div>
            <div className={styles.kpiValue}>{summary ? `${summary.reserved_units} · ${summary.damaged_units}` : "—"}</div>
            <div className={styles.kpiNote}>{summary ? `${summary.inbound_units} units inbound` : " "}</div>
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
            <Select value={stockStatus} onChange={(e) => changeFilter(() => setStockStatus(e.target.value))} className={styles.filterSelect}>
              <option value="">All stock levels</option>
              <option value="IN_STOCK">In stock</option>
              <option value="LOW_STOCK">Low stock</option>
              <option value="OUT_OF_STOCK">Out of stock</option>
            </Select>
            <Select value={warehouse} onChange={(e) => changeFilter(() => setWarehouse(e.target.value))} className={styles.filterSelect}>
              <option value="">All warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </Select>
            <Select value={ordering} onChange={(e) => changeFilter(() => setOrdering(e.target.value))} className={styles.filterSelect}>
              <option value="stock_asc">Lowest stock first</option>
              <option value="stock_desc">Highest stock first</option>
              <option value="sku">SKU A–Z</option>
              <option value="updated">Recently updated</option>
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
              <Boxes size={36} />
              <strong>{filtered ? "No listings match these filters" : "No listings to stock yet"}</strong>
              {filtered ? "Try a different search or clear the filters." : "Create a listing in Pricing, then add its stock here."}
            </div>
          ) : (
            <div className={styles.tableWrap} style={{ opacity: loading ? 0.55 : 1, transition: "opacity 0.15s" }}>
              <table className={`${styles.table} ${styles.tableFixed}`} style={{ minWidth: 980 }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ width: 130 }}>SKU</th>
                    <th style={{ width: 88 }}>Available</th>
                    <th style={{ width: 88, textAlign: "center" }} title="Held for orders that are placed but not shipped yet">Reserved<span className={styles.thHint}>In orders</span></th>
                    <th style={{ width: 84, textAlign: "center" }} title="On its way to the warehouse, not sellable yet">Inbound<span className={styles.thHint}>On the way</span></th>
                    <th style={{ width: 88, textAlign: "center" }} title="Damaged units that cannot be sold">Damaged<span className={styles.thHint}>Can&apos;t sell</span></th>
                    <th style={{ width: 76, textAlign: "center" }} title="Minimum stock to keep. At or below this the listing shows as low stock">Safety<span className={styles.thHint}>Min. stock</span></th>
                    <th style={{ width: 130 }}>Status</th>
                    <th style={{ width: 80, textAlign: "right" }} aria-label="Action" />
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => {
                    const tone = STOCK_TONE[r.stock_status];
                    const fill = r.safety > 0 ? Math.min(100, Math.round((r.available / (r.safety * 3)) * 100)) : 100;
                    return (
                      <tr key={r.id} className={`${styles.row} ${openRow?.id === r.id ? styles.rowOn : ""}`} onClick={() => setOpenRow(r)}>
                        <td>
                          <div className={styles.product}>
                            <span className={styles.thumb} style={r.product.image ? { backgroundImage: `url(${r.product.image})` } : undefined}>
                              {!r.product.image && <Package size={18} />}
                            </span>
                            <div style={{ minWidth: 0 }}>
                              <div className={styles.productTitle}>{r.product.title}</div>
                              <div className={styles.sub}>
                                {r.product.asin}
                                {r.items.length > 0 && ` · ${r.items.map((i) => i.warehouse.code).join(", ")}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.rma} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.seller_sku}</div>
                          <div className={styles.sub}>{r.fulfillment_channel === "MF" ? "Makaano Fulfilled (MF)" : "Seller Fulfilled (SF)"}</div>
                        </td>
                        <td>
                          <div className={styles.money} style={{ fontSize: 15 }}>{r.available.toLocaleString("en-IN")}</div>
                          <div style={{ height: 4, borderRadius: 4, background: "#f1f5f9", marginTop: 4 }}>
                            <div style={{ width: `${fill}%`, height: "100%", borderRadius: 4, background: tone.fg }} />
                          </div>
                        </td>
                        <td style={{ textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{r.reserved}</td>
                        <td style={{ textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{r.inbound}</td>
                        <td style={{ textAlign: "center", fontVariantNumeric: "tabular-nums", color: r.damaged ? "#b91c1c" : undefined }}>{r.damaged}</td>
                        <td style={{ textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{r.safety}</td>
                        <td style={{ overflow: "visible", whiteSpace: "nowrap" }}>
                          <span className={styles.pill} style={{ background: tone.bg, color: tone.fg }}>{tone.label}</span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className={`${styles.btn} ${styles.sm}`}
                            style={{ minWidth: 64, height: 30, padding: "0 8px" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setAdjusting({ row: r, mode: "add" });
                            }}
                          >
                            Adjust
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

      {openRow && !adjusting && (
        <StockDrawer
          key={openRow.id}
          row={openRow}
          onClose={() => setOpenRow(null)}
          onAdjust={(mode) => setAdjusting({ row: openRow, mode })}
          onSafetySaved={(msg) => {
            setToast(msg);
            reload();
          }}
        />
      )}

      {adjusting && (
        <AdjustStockModal
          warehouses={warehouses}
          listing={adjusting.row}
          initialMode={adjusting.mode}
          onClose={() => setAdjusting(null)}
          onDone={(row, msg) => {
            setAdjusting(null);
            setToast(msg);
            if (openRow?.id === row.id) setOpenRow(row);
            setData((d) => (d ? { ...d, results: d.results.map((r) => (r.id === row.id ? row : r)) } : d));
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
