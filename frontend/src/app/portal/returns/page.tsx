"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  IndianRupee,
  Inbox,
  Package,
  PercentCircle,
  RefreshCw,
  Search,
  Truck,
} from "lucide-react";
import SellerShell from "@/components/layout/SellerShell";
import ClaimsPanel from "@/components/returns/ClaimsPanel";
import ReturnDrawer from "@/components/returns/ReturnDrawer";
import { ACTION_CTA, STATUS_TONE, formatDate, formatINR } from "@/components/returns/returnMeta";
import styles from "@/components/ui/sellerPage.module.css";
import Select from "@/components/ui/Select";
import { ApiError } from "@/services/addProductService";
import {
  AtoZClaim,
  ClaimsSummary,
  Paginated,
  RETURN_REASONS,
  ReturnGroup,
  ReturnRequest,
  ReturnsSummary,
  fetchClaims,
  fetchClaimsSummary,
  fetchReturns,
  fetchReturnsSummary,
} from "@/services/returnsService";

const GROUPS: { value: ReturnGroup | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "action_required", label: "Action required" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Refunded" },
  { value: "closed", label: "Rejected / cancelled" },
];

const message = (err: unknown, fallback: string) => (err instanceof ApiError ? err.messages[0] : fallback);

export default function ReturnsPage() {
  const [tab, setTab] = useState<"returns" | "claims">("returns");
  const [group, setGroup] = useState<ReturnGroup | "">("action_required");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("");
  const [fulfillment, setFulfillment] = useState("");
  const [ordering, setOrdering] = useState("newest");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<Paginated<ReturnRequest> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ReturnsSummary | null>(null);
  const [claims, setClaims] = useState<AtoZClaim[] | null>(null);
  const [claimsError, setClaimsError] = useState<string | null>(null);
  const [claimsSummary, setClaimsSummary] = useState<ClaimsSummary | null>(null);
  const [selected, setSelected] = useState<ReturnRequest | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Debounce typing so the list isn't refetched on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    fetchReturns({ group, search, reason, fulfillment, ordering, page })
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setError(null);
      })
      .catch((err) => !cancelled && setError(message(err, "Couldn't load returns.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [group, search, reason, fulfillment, ordering, page, reloadKey]);

  const loadSummaries = useCallback(() => {
    fetchReturnsSummary().then(setSummary).catch(() => setSummary(null));
    fetchClaimsSummary().then(setClaimsSummary).catch(() => setClaimsSummary(null));
    fetchClaims()
      .then((res) => {
        setClaims(res.results);
        setClaimsError(null);
      })
      .catch((err) => setClaimsError(message(err, "Couldn't load claims.")));
  }, []);

  useEffect(() => {
    loadSummaries();
  }, [loadSummaries]);

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

  function refresh() {
    setLoading(true);
    setReloadKey((k) => k + 1);
    loadSummaries();
  }

  function handleUpdated(updated: ReturnRequest, msg: string) {
    setSelected(updated);
    setToast(msg);
    setData((d) => (d ? { ...d, results: d.results.map((r) => (r.id === updated.id ? updated : r)) } : d));
    loadSummaries();
  }

  const groups = summary?.groups;
  const results = data?.results ?? [];
  const hasFilters = !!(search || reason || fulfillment);

  return (
    <SellerShell active="Returns" returnsBadge={groups?.action_required || undefined}>
      <div className={styles.page}>
        <div className={styles.head}>
          <div>
            <h1>Returns</h1>
            <p>Review return requests, track parcels coming back and refund buyers.</p>
          </div>
          <button type="button" className={`${styles.btn} ${styles.headBtn}`} onClick={refresh}>
            <RefreshCw size={15} className={loading ? styles.spin : undefined} /> Refresh
          </button>
        </div>

        <div className={styles.kpis}>
          <button type="button" className={styles.kpi} onClick={() => { setTab("returns"); changeFilter(() => setGroup("action_required")); }}>
            <div className={styles.kpiTop}>
              Action required
              <span className={styles.kpiIcon} style={{ background: "#fef3c7", color: "#b45309" }}>
                <Inbox size={17} />
              </span>
            </div>
            <div className={styles.kpiValue}>{groups ? groups.action_required : "—"}</div>
            <div className={styles.kpiNote}>Waiting on you to review, inspect or refund</div>
          </button>
          <button type="button" className={styles.kpi} onClick={() => { setTab("returns"); changeFilter(() => setGroup("in_progress")); }}>
            <div className={styles.kpiTop}>
              In progress
              <span className={styles.kpiIcon} style={{ background: "#ede9fe", color: "#6d28d9" }}>
                <Truck size={17} />
              </span>
            </div>
            <div className={styles.kpiValue}>{groups ? groups.in_progress : "—"}</div>
            <div className={styles.kpiNote}>Approved or on the way back</div>
          </button>
          <div className={styles.kpi}>
            <div className={styles.kpiTop}>
              Refunded
              <span className={styles.kpiIcon} style={{ background: "#dcfce7", color: "#15803d" }}>
                <CheckCircle2 size={17} />
              </span>
            </div>
            <div className={styles.kpiValue}>{summary ? formatINR(summary.refunded_total) : "—"}</div>
            <div className={styles.kpiNote}>{groups ? `${groups.completed} returns closed with a refund` : " "}</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiTop}>
              Open refund value
              <span className={styles.kpiIcon} style={{ background: "#fff7ed", color: "#c2410c" }}>
                <IndianRupee size={17} />
              </span>
            </div>
            <div className={styles.kpiValue}>{summary ? formatINR(summary.pending_refund_total) : "—"}</div>
            <div className={styles.kpiNote}>Could still be refunded on open returns</div>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiTop}>
              Return rate · 30 days
              <span className={styles.kpiIcon} style={{ background: "#f1f5f9", color: "#334155" }}>
                <PercentCircle size={17} />
              </span>
            </div>
            <div className={styles.kpiValue}>{summary ? `${summary.return_rate_30d}%` : "—"}</div>
            <div className={styles.kpiNote}>
              {summary?.top_reasons[0] ? `Top reason: ${summary.top_reasons[0].label}` : "Returns per order line"}
            </div>
          </div>
        </div>

        <div className={styles.tabs}>
          <button type="button" className={`${styles.tab} ${tab === "returns" ? styles.tabOn : ""}`} onClick={() => setTab("returns")}>
            Return requests <span className={styles.count}>{summary?.total ?? "·"}</span>
          </button>
          <button type="button" className={`${styles.tab} ${tab === "claims" ? styles.tabOn : ""}`} onClick={() => setTab("claims")}>
            A-to-z claims
            {claimsSummary && claimsSummary.awaiting_response > 0 ? (
              <span className={styles.count} style={{ background: "#b91c1c", color: "#fff" }}>
                {claimsSummary.awaiting_response} need reply
              </span>
            ) : (
              <span className={styles.count}>{claimsSummary?.total ?? "·"}</span>
            )}
          </button>
        </div>

        {tab === "claims" ? (
          <div className={styles.card}>
            <ClaimsPanel
              claims={claims}
              error={claimsError}
              onResponded={(claim) => {
                setClaims((list) => list?.map((c) => (c.id === claim.id ? claim : c)) ?? null);
                setToast("Response sent to Makaano");
                fetchClaimsSummary().then(setClaimsSummary).catch(() => undefined);
              }}
            />
          </div>
        ) : (
          <div className={styles.card}>
            <div className={styles.chips}>
              {GROUPS.map((g) => {
                const n = g.value ? groups?.[g.value] : summary?.total;
                return (
                  <button
                    key={g.value || "all"}
                    type="button"
                    className={`${styles.chip} ${group === g.value ? styles.chipOn : ""}`}
                    onClick={() => changeFilter(() => setGroup(g.value))}
                  >
                    {g.label}
                    {n !== undefined && <span className={styles.count}>{n}</span>}
                  </button>
                );
              })}
            </div>

            <div className={styles.toolbar}>
              <div className={styles.search}>
                <Search size={16} />
                <input
                  placeholder="Search RMA, order, product, ASIN, SKU, buyer or tracking"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setLoading(true);
                  }}
                />
              </div>
              <Select value={reason} onChange={(e) => changeFilter(() => setReason(e.target.value))} className={styles.filterSelect}>
                <option value="">All reasons</option>
                {RETURN_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Select>
              <Select value={fulfillment} onChange={(e) => changeFilter(() => setFulfillment(e.target.value))} className={styles.filterSelect}>
                <option value="">All fulfilment</option>
                <option value="MAKAANO_FULFILLED">⚡ Makaano Fulfilled</option>
                <option value="SELLER_FULFILLED">📦 Seller Fulfilled (Self ship)</option>
              </Select>
              <Select value={ordering} onChange={(e) => changeFilter(() => setOrdering(e.target.value))} className={styles.filterSelect}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="refund_desc">Highest refund</option>
                <option value="refund_asc">Lowest refund</option>
              </Select>
            </div>

            {error ? (
              <div style={{ padding: 16 }}>
                <div className={styles.alert}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ flex: 1 }}>{error}</div>
                  <button type="button" className={`${styles.btn} ${styles.sm}`} onClick={refresh}>
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
                {hasFilters ? <Search size={36} /> : <CheckCircle2 size={36} />}
                <strong>{hasFilters ? "No returns match these filters" : "You're all caught up"}</strong>
                {hasFilters
                  ? "Try a different search or clear the filters."
                  : group === "action_required"
                  ? "No return needs your attention right now."
                  : "No returns in this view yet."}
              </div>
            ) : (
              <div className={styles.tableWrap} style={{ opacity: loading ? 0.55 : 1, transition: "opacity 0.15s" }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Return</th>
                      <th>Product</th>
                      <th>Buyer</th>
                      <th>Reason</th>
                      <th>Refund</th>
                      <th>Status</th>
                      <th style={{ width: 140, textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => {
                      const tone = STATUS_TONE[r.status];
                      const next = r.allowed_actions[0];
                      return (
                        <tr
                          key={r.id}
                          className={`${styles.row} ${selected?.id === r.id ? styles.rowOn : ""}`}
                          onClick={() => setSelected(r)}
                        >
                          <td className={styles.nowrap}>
                            <div className={styles.rma}>{r.rma_number}</div>
                            <div className={styles.sub} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <Clock size={11} /> {formatDate(r.created_at)}
                            </div>
                          </td>
                          <td>
                            <div className={styles.product}>
                              <span
                                className={styles.thumb}
                                style={r.product.image ? { backgroundImage: `url(${r.product.image})` } : undefined}
                              >
                                {!r.product.image && <Package size={18} />}
                              </span>
                              <div style={{ minWidth: 0 }}>
                                <div className={styles.productTitle}>{r.product.title}</div>
                                <div className={styles.sub}>
                                  {r.order_number} · Qty {r.quantity}
                                  <span className={styles.fc}>{r.fulfillment_channel}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{r.customer.name}</div>
                            <div className={styles.sub}>{r.customer.city ?? "—"}</div>
                          </td>
                          <td style={{ maxWidth: 200 }}>{r.reason_display}</td>
                          <td>
                            <div className={styles.money}>
                              {formatINR(r.refunded_at ? r.refund_amount : Number(r.item_total) - Number(r.restocking_fee_amount))}
                            </div>
                            {Number(r.restocking_fee_rate) > 0 && (
                              <div className={styles.sub}>−{Number(r.restocking_fee_rate)}% fee</div>
                            )}
                          </td>
                          <td>
                            <span className={styles.pill} style={{ background: tone.bg, color: tone.fg }}>
                              {r.status_display}
                            </span>
                          </td>
                          <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                            {next ? (
                              <button
                                type="button"
                                className={`${styles.btnPrimary} ${styles.sm} ${styles.tableActionBtn}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelected(r);
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
                                  setSelected(r);
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
                  Page {data.current_page} of {data.total_pages} · {data.count} returns
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
        )}
      </div>

      {selected && <ReturnDrawer item={selected} onClose={() => setSelected(null)} onUpdated={handleUpdated} />}

      {toast && (
        <div className={styles.toast} role="status">
          <CheckCircle2 size={17} color="#4ade80" /> {toast}
        </div>
      )}
    </SellerShell>
  );
}
