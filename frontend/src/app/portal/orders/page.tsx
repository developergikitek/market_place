"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  AlarmClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  IndianRupee,
  Inbox,
  Package,
  Search,
  ShoppingBag,
  Truck,
  Wallet,
} from "lucide-react";
import SellerShell from "@/components/layout/SellerShell";
import OrderDrawer from "@/components/orders/OrderDrawer";
import { ORDER_LABEL, ORDER_TONE } from "@/components/orders/orderMeta";
import { formatDate, formatINR } from "@/components/returns/returnMeta";
import Select from "@/components/ui/Select";
import styles from "@/components/ui/sellerPage.module.css";
import { ApiError } from "@/services/addProductService";
import { OrderRow, OrderSummary, OrderTab, fetchOrderSummary, fetchOrders, ordersExportUrl } from "@/services/ordersService";

const TABS: { value: OrderTab | ""; label: string }[] = [
  { value: "unshipped", label: "Unshipped" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "pending_payment", label: "Pending payment" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
  { value: "", label: "All orders" },
];

const ACTION_CTA: Record<string, string> = {
  confirm: "Confirm",
  pack: "Pack",
  ship: "Ship",
  mark_delivered: "Update delivery",
};

type Page = { count: number; total_pages: number; current_page: number; results: OrderRow[] };

export default function OrdersPage() {
  const [tab, setTab] = useState<OrderTab | "">("unshipped");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [fulfillment, setFulfillment] = useState("");
  const [payment, setPayment] = useState<"" | "COD" | "PREPAID">("");
  const [late, setLate] = useState(false);
  const [ordering, setOrdering] = useState("newest");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page | null>(null);
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filters = { tab, search, date_from: dateFrom, date_to: dateTo, fulfillment, payment, late, ordering, page };

  useEffect(() => {
    let cancelled = false;
    fetchOrders({ tab, search, date_from: dateFrom, date_to: dateTo, fulfillment, payment, late, ordering, page })
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setError(null);
      })
      .catch((err) => !cancelled && setError(err instanceof ApiError ? err.messages[0] : "Couldn't load orders."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tab, search, dateFrom, dateTo, fulfillment, payment, late, ordering, page, reloadKey]);

  const loadSummary = useCallback(() => {
    fetchOrderSummary().then(setSummary).catch(() => setSummary(null));
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
  const filtered = !!(search || dateFrom || dateTo || fulfillment || payment || late);

  return (
    <SellerShell active="Orders">
      <div className={styles.page}>
        <div className={styles.head}>
          <div>
            <h1>Orders</h1>
            <p>Confirm, pack and ship your orders, and track them until they&apos;re delivered.</p>
          </div>
          <a className={`${styles.btn} ${styles.headBtn}`} href={ordersExportUrl(filters)} download>
            <Download size={15} /> Export CSV
          </a>
        </div>

        <div className={`${styles.kpis} ${styles.kpis6}`}>
          <button type="button" className={styles.kpi} onClick={() => changeFilter(() => { setTab("unshipped"); setLate(false); })}>
            <div className={styles.kpiTop}>
              To ship
              <span className={styles.kpiIcon} style={{ background: "#fef3c7", color: "#b45309" }}>
                <Inbox size={17} />
              </span>
            </div>
            <div className={styles.kpiValue}>{summary ? summary.tabs.unshipped : "—"}</div>
            <div className={styles.kpiNote}>Paid orders waiting to be dispatched</div>
          </button>
          <button type="button" className={styles.kpi} onClick={() => changeFilter(() => { setTab(""); setLate(true); })}>
            <div className={styles.kpiTop}>
              Late to ship
              <span className={styles.kpiIcon} style={{ background: "#fee2e2", color: "#b91c1c" }}>
                <AlarmClock size={17} />
              </span>
            </div>
            <div className={styles.kpiValue} style={{ color: summary?.late_shipments ? "#b91c1c" : undefined }}>
              {summary ? summary.late_shipments : "—"}
            </div>
            <div className={styles.kpiNote}>Past their ship-by date</div>
          </button>
          <button type="button" className={styles.kpi} onClick={() => changeFilter(() => { setTab("shipped"); setLate(false); })}>
            <div className={styles.kpiTop}>
              In transit
              <span className={styles.kpiIcon} style={{ background: "#ede9fe", color: "#6d28d9" }}>
                <Truck size={17} />
              </span>
            </div>
            <div className={styles.kpiValue}>{summary ? summary.tabs.shipped : "—"}</div>
            <div className={styles.kpiNote}>Shipped, not yet delivered</div>
          </button>
          <div className={styles.kpi}>
            <div className={styles.kpiTop}>
              Sales · 30 days
              <span className={styles.kpiIcon} style={{ background: "#dcfce7", color: "#15803d" }}>
                <IndianRupee size={17} />
              </span>
            </div>
            <div className={styles.kpiValue}>{summary ? formatINR(summary.sales_30d) : "—"}</div>
            <div className={styles.kpiNote}>{summary ? `${summary.orders_30d} orders · ${summary.units_30d} units` : " "}</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiTop}>
              Avg order value
              <span className={styles.kpiIcon} style={{ background: "#fff7ed", color: "#c2410c" }}>
                <ShoppingBag size={17} />
              </span>
            </div>
            <div className={styles.kpiValue}>{summary ? formatINR(summary.avg_order_value_30d) : "—"}</div>
            <div className={styles.kpiNote}>Your items per order, last 30 days</div>
          </div>
          <button type="button" className={styles.kpi} onClick={() => changeFilter(() => { setTab(""); setLate(false); setPayment("COD"); })}>
            <div className={styles.kpiTop}>
              COD to collect
              <span className={styles.kpiIcon} style={{ background: "#e0f2fe", color: "#0369a1" }}>
                <Wallet size={17} />
              </span>
            </div>
            <div className={styles.kpiValue}>{summary ? formatINR(summary.cod_to_collect) : "—"}</div>
            <div className={styles.kpiNote}>
              {summary ? `${summary.cod_open_orders} cash-on-delivery order${summary.cod_open_orders === 1 ? "" : "s"} not yet delivered` : " "}
            </div>
          </button>
        </div>

        <div className={styles.card}>
          <div className={styles.chips}>
            {TABS.map((t) => {
              const n = t.value ? summary?.tabs[t.value] : summary?.total;
              return (
                <button
                  key={t.value || "all"}
                  type="button"
                  className={`${styles.chip} ${tab === t.value && !late ? styles.chipOn : ""}`}
                  onClick={() => changeFilter(() => { setTab(t.value); setLate(false); })}
                >
                  {t.label}
                  {n !== undefined && <span className={styles.count}>{n}</span>}
                </button>
              );
            })}
            {late && (
              <button type="button" className={`${styles.chip} ${styles.chipOn}`} onClick={() => changeFilter(() => setLate(false))}>
                Late to ship ✕
              </button>
            )}
          </div>

          <div className={styles.toolbar}>
            <div className={styles.search}>
              <Search size={16} />
              <input
                placeholder="Search order number, buyer, phone, SKU, ASIN or tracking"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setLoading(true);
                }}
              />
            </div>
            <input
              type="date"
              className={styles.input}
              style={{ width: 150 }}
              value={dateFrom}
              onChange={(e) => changeFilter(() => setDateFrom(e.target.value))}
              aria-label="Placed from"
              title="Placed from"
            />
            <input
              type="date"
              className={styles.input}
              style={{ width: 150 }}
              value={dateTo}
              onChange={(e) => changeFilter(() => setDateTo(e.target.value))}
              aria-label="Placed until"
              title="Placed until"
            />
            <Select value={fulfillment} onChange={(e) => changeFilter(() => setFulfillment(e.target.value))} className={styles.filterSelect}>
              <option value="">All fulfilment</option>
              <option value="MF">Makaano Fulfilled (MF)</option>
              <option value="SF">Seller Fulfilled (SF)</option>
            </Select>
            <Select value={payment} onChange={(e) => changeFilter(() => setPayment(e.target.value as "" | "COD" | "PREPAID"))} className={styles.filterSelect}>
              <option value="">All payments</option>
              <option value="COD">Cash on delivery</option>
              <option value="PREPAID">Prepaid</option>
            </Select>
            <Select value={ordering} onChange={(e) => changeFilter(() => setOrdering(e.target.value))} className={styles.filterSelect}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="total_desc">Highest value</option>
              <option value="total_asc">Lowest value</option>
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
              {[0, 1, 2, 3, 4].map((i) => (
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
              {filtered ? <Search size={36} /> : <CheckCircle2 size={36} />}
              <strong>{filtered ? "No orders match these filters" : tab === "unshipped" ? "Nothing to ship" : "No orders here"}</strong>
              {filtered ? "Try a different search or clear the filters." : tab === "unshipped" ? "You're all caught up." : "Orders in this state will show up here."}
            </div>
          ) : (
            <div className={styles.tableWrap} style={{ opacity: loading ? 0.55 : 1, transition: "opacity 0.15s" }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Items</th>
                    <th>Buyer</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th style={{ width: 146, textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((o) => {
                    const tone = ORDER_TONE[o.status] ?? ORDER_TONE.PENDING_PAYMENT;
                    const first = o.items[0];
                    const units = o.items.reduce((s, i) => s + i.quantity, 0);
                    const next = o.allowed_actions.find((a) => ACTION_CTA[a]);
                    return (
                      <tr key={o.id} className={`${styles.row} ${open === o.order_number ? styles.rowOn : ""}`} onClick={() => setOpen(o.order_number)}>
                        <td className={styles.nowrap}>
                          <div className={styles.rma}>{o.order_number}</div>
                          <div className={styles.sub}>{formatDate(o.placed_at, true)}</div>
                          {o.is_late ? (
                            <div className={styles.sub} style={{ color: "#b91c1c", fontWeight: 600 }}>Late · ship by {formatDate(o.ship_by)}</div>
                          ) : o.allowed_actions.includes("ship") || o.allowed_actions.includes("confirm") ? (
                            <div className={styles.sub}>Ship by {formatDate(o.ship_by)}</div>
                          ) : null}
                        </td>
                        <td>
                          <div className={styles.product}>
                            <span className={styles.thumb} style={first?.product.image ? { backgroundImage: `url(${first.product.image})` } : undefined}>
                              {!first?.product.image && <Package size={18} />}
                            </span>
                            <div style={{ minWidth: 0 }}>
                              <div className={styles.productTitle}>{first?.product.title}</div>
                              <div className={styles.sub}>
                                {o.items.length > 1 ? `+${o.items.length - 1} more · ` : ""}
                                {units} unit{units > 1 ? "s" : ""}
                                {first && <span className={styles.fc}>{first.fulfillment_channel}</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{o.customer.name}</div>
                          <div className={styles.sub}>{o.customer.city}</div>
                        </td>
                        <td className={styles.money}>{formatINR(o.seller_total)}</td>
                        <td>
                          {o.payment?.is_cod ? (
                            <>
                              <span className={styles.pill} style={{ background: "#e0f2fe", color: "#075985" }}>COD</span>
                              <div className={styles.sub}>
                                {o.payment.cod_to_collect
                                  ? `Collect ${formatINR(o.payment.cod_to_collect)}`
                                  : o.payment.status === "CAPTURED" ? "Cash collected" : "Not collected"}
                              </div>
                            </>
                          ) : (
                            <>
                              <div style={{ fontSize: 13 }}>{o.payment?.method ?? "—"}</div>
                              <div className={styles.sub}>{o.payment?.status_display}</div>
                            </>
                          )}
                        </td>
                        <td>
                          <span className={styles.pill} style={{ background: tone.bg, color: tone.fg }}>
                            {ORDER_LABEL[o.status] ?? o.status_display}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          {next ? (
                            <button
                              type="button"
                              className={`${styles.btnPrimary} ${styles.sm} ${styles.tableActionBtn}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpen(o.order_number);
                              }}
                            >
                              {ACTION_CTA[next]}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={`${styles.btn} ${styles.sm} ${styles.tableActionBtn}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpen(o.order_number);
                              }}
                            >
                              View
                            </button>
                          )}
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
                Page {data.current_page} of {data.total_pages} · {data.count} orders
              </span>
              <div className={styles.pagerButtons}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.sm} ${styles.pagerBtn}`}
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
                  className={`${styles.btn} ${styles.sm} ${styles.pagerBtn}`}
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

      {open && (
        <OrderDrawer
          key={open}
          orderNumber={open}
          onClose={() => setOpen(null)}
          onUpdated={(updated, msg) => {
            setToast(msg);
            setData((d) =>
              d
                ? {
                    ...d,
                    results: d.results.map((r) =>
                      r.order_number === updated.order_number
                        ? { ...r, status: updated.status, status_display: updated.status_display, items: updated.items, allowed_actions: updated.allowed_actions, is_late: updated.is_late, payment: updated.payment }
                        : r
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
