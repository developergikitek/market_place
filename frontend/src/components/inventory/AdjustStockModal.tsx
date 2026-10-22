"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowRight, Loader2, Minus, Package, Plus, RotateCcw, X } from "lucide-react";
import Select from "@/components/ui/Select";
import styles from "@/components/ui/sellerPage.module.css";
import { ApiError } from "@/services/addProductService";
import {
  AdjustMode,
  InventoryRow,
  ReasonOptions,
  Warehouse,
  adjustStock,
  fetchAdjustReasons,
  fetchInventory,
} from "@/services/inventoryApi";

interface AdjustStockModalProps {
  warehouses: Warehouse[];
  /** Pre-select a listing (opened from a row) and a mode. */
  listing?: InventoryRow | null;
  initialMode?: AdjustMode;
  onClose: () => void;
  onDone: (row: InventoryRow, message: string) => void;
}

const MODES: { value: AdjustMode; label: string; icon: typeof Plus; hint: string }[] = [
  { value: "add", label: "Add stock", icon: Plus, hint: "New units received" },
  { value: "remove", label: "Remove", icon: Minus, hint: "Damaged, disposed or taken back" },
  { value: "set", label: "Set count", icon: RotateCcw, hint: "Correct to a physical count" },
];

/** Stock adjustment for one listing in one warehouse; the backend writes an InventoryMovement for it. */
export default function AdjustStockModal({ warehouses, listing, initialMode = "add", onClose, onDone }: AdjustStockModalProps) {
  const [rows, setRows] = useState<InventoryRow[] | null>(listing ? [listing] : null);
  const [listingId, setListingId] = useState(listing?.id ?? "");
  const [warehouseId, setWarehouseId] = useState(listing?.items[0]?.warehouse.id ?? warehouses[0]?.id ?? "");
  const [mode, setMode] = useState<AdjustMode>(initialMode);
  const [quantity, setQuantity] = useState("");
  const [reasons, setReasons] = useState<ReasonOptions | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    fetchAdjustReasons().then(setReasons).catch(() => setReasons(null));
    if (!listing) {
      fetchInventory({ page_size: 100, ordering: "sku" })
        .then((res) => setRows(res.results))
        .catch(() => setRows([]));
    }
  }, [listing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const reasonOptions = reasons?.[mode] ?? [];
  const chosenReason = reasonOptions.some((r) => r.value === reason) ? reason : reasonOptions[0]?.value ?? "";
  const selected = rows?.find((r) => r.id === listingId) ?? null;
  const current = useMemo(
    () => selected?.items.find((i) => i.warehouse.id === warehouseId)?.available_stock ?? 0,
    [selected, warehouseId]
  );
  const qty = Number(quantity);
  const validQty = quantity !== "" && Number.isInteger(qty) && qty >= 0 && (mode === "set" || qty > 0);
  const next = !validQty ? null : mode === "add" ? current + qty : mode === "remove" ? current - qty : qty;
  const problem = !listingId
    ? "Choose a listing"
    : !warehouseId
    ? "Choose a warehouse"
    : !validQty
    ? mode === "set"
      ? "Enter the counted quantity"
      : "Enter how many units"
    : next! < 0
    ? `Only ${current} units are in this warehouse`
    : next === current
    ? "That doesn't change the stock"
    : null;

  async function submit() {
    if (problem || !chosenReason) return;
    setSubmitting(true);
    setErrors([]);
    try {
      const row = await adjustStock({
        listing_id: listingId,
        warehouse_id: warehouseId,
        mode,
        quantity: qty,
        reason: chosenReason,
        note: note.trim() || undefined,
      });
      const delta = next! - current;
      onDone(row, `${row.seller_sku}: ${delta > 0 ? "+" : ""}${delta} units, now ${next} in stock`);
    } catch (err) {
      setErrors(err instanceof ApiError ? err.messages : ["Something went wrong. Please try again."]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <aside className={styles.drawer} style={{ width: "min(520px, 100vw)" }} role="dialog" aria-label="Adjust stock">
        <div className={styles.drawerHead}>
          <div>
            <h2 style={{ fontFamily: "inherit" }}>Adjust stock</h2>
            <div className={styles.sub}>Every change is saved to the stock history with its reason.</div>
          </div>
          <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className={styles.drawerBody}>
          {errors.length > 0 && (
            <div className={styles.alert}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>{errors.join(" ")}</div>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Listing</label>
            {listing ? (
              <div className={styles.product} style={{ maxWidth: "none" }}>
                <span className={styles.thumb} style={listing.product.image ? { backgroundImage: `url(${listing.product.image})` } : undefined}>
                  {!listing.product.image && <Package size={18} />}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div className={styles.productTitle}>{listing.product.title}</div>
                  <div className={styles.sub}>
                    {listing.seller_sku} · {listing.product.asin}
                  </div>
                </div>
              </div>
            ) : (
              <Select value={listingId} onChange={(e) => setListingId(e.target.value)} className={styles.input}>
                <option value="">{rows ? "Choose a listing" : "Loading listings…"}</option>
                {(rows ?? []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.seller_sku} — {r.product.title}
                  </option>
                ))}
              </Select>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Warehouse</label>
            <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className={styles.input}>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </Select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>What happened?</label>
            <div className={styles.choice} style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
              {MODES.map(({ value, label, icon: Icon, hint }) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.choiceCard} ${mode === value ? styles.choiceOn : ""}`}
                  onClick={() => setMode(value)}
                >
                  <strong style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon size={14} /> {label}
                  </strong>
                  <span>{hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>{mode === "set" ? "Counted quantity" : "Units"}</label>
              <input
                className={styles.input}
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                autoFocus
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Reason</label>
              <Select value={chosenReason} onChange={(e) => setReason(e.target.value)} className={styles.input}>
                {reasonOptions.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Note (optional)</label>
            <input
              className={styles.input}
              maxLength={255}
              placeholder="e.g. PO-2291, GRN number, damage report"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {selected && (
            <div className={styles.actionPanel} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div className={styles.sub}>In this warehouse now</div>
                <div style={{ fontSize: 26, fontWeight: 800 }}>{current}</div>
              </div>
              <ArrowRight size={20} color="#94a3b8" />
              <div style={{ textAlign: "right" }}>
                <div className={styles.sub}>After this change</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: next == null ? "#94a3b8" : next < 0 ? "#b91c1c" : next > current ? "#15803d" : "#c2410c" }}>
                  {next ?? "—"}
                </div>
              </div>
            </div>
          )}
          {chosenReason === "DAMAGED_IN_WAREHOUSE" && (
            <span className={styles.hint}>Damaged units move to the damaged count so you can claim or dispose of them later.</span>
          )}
        </div>

        <div className={styles.toolbar} style={{ borderTop: "1px solid var(--line)", borderBottom: "none", justifyContent: "space-between" }}>
          <span className={styles.hint}>{problem ?? " "}</span>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className={styles.btn} onClick={onClose}>
              Cancel
            </button>
            <button type="button" className={styles.btnPrimary} disabled={!!problem || !chosenReason || submitting} onClick={submit}>
              {submitting && <Loader2 size={15} className={styles.spin} />} Save
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
