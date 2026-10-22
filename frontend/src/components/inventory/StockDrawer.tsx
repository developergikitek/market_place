"use client";

import { useEffect, useState } from "react";
import { Check, History, Minus, Package, Plus, RotateCcw, X } from "lucide-react";
import { formatDate } from "@/components/returns/returnMeta";
import styles from "@/components/ui/sellerPage.module.css";
import { ApiError } from "@/services/addProductService";
import { AdjustMode, InventoryRow, Movement, fetchMovements, updateSafetyStock } from "@/services/inventoryApi";

export const STOCK_TONE: Record<string, { bg: string; fg: string; label: string }> = {
  IN_STOCK: { bg: "#dcfce7", fg: "#166534", label: "In stock" },
  LOW_STOCK: { bg: "#fef3c7", fg: "#92400e", label: "Low stock" },
  OUT_OF_STOCK: { bg: "#fee2e2", fg: "#991b1b", label: "Out of stock" },
};

interface StockDrawerProps {
  row: InventoryRow;
  onClose: () => void;
  onAdjust: (mode: AdjustMode) => void;
  onSafetySaved: (message: string) => void;
}

function SafetyInput({ itemId, value, onSaved }: { itemId: string; value: number; onSaved: (v: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const changed = draft !== String(value);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const item = await updateSafetyStock(itemId, Number(draft));
      onSaved(item.safety_stock);
    } catch (err) {
      setError(err instanceof ApiError ? err.messages[0] : "Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          className={styles.input}
          style={{ height: 32, width: 80 }}
          type="number"
          min={0}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && changed && save()}
        />
        {changed && (
          <button type="button" className={`${styles.btnPrimary} ${styles.sm}`} disabled={saving || draft === ""} onClick={save} aria-label="Save safety stock">
            <Check size={14} />
          </button>
        )}
      </div>
      {error && <div className={styles.fieldError}>{error}</div>}
    </div>
  );
}

/** Stock of one listing: per-warehouse breakdown, low-stock threshold and the movement history. */
export default function StockDrawer({ row, onClose, onAdjust, onSafetySaved }: StockDrawerProps) {
  const [movements, setMovements] = useState<Movement[] | null>(null);
  const [safety, setSafety] = useState<Record<string, number>>(() =>
    Object.fromEntries(row.items.map((i) => [i.id, i.safety_stock]))
  );
  const tone = STOCK_TONE[row.stock_status];

  useEffect(() => {
    let cancelled = false;
    fetchMovements(row.id)
      .then((res) => !cancelled && setMovements(res.results))
      .catch(() => !cancelled && setMovements([]));
    return () => {
      cancelled = true;
    };
  }, [row.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <aside className={styles.drawer} role="dialog" aria-label={`Stock for ${row.seller_sku}`}>
        <div className={styles.drawerHead}>
          <div style={{ display: "flex", gap: 12, minWidth: 0 }}>
            <span className={styles.thumb} style={row.product.image ? { backgroundImage: `url(${row.product.image})` } : undefined}>
              {!row.product.image && <Package size={18} />}
            </span>
            <div style={{ minWidth: 0 }}>
              <div className={styles.productTitle} style={{ fontSize: 15 }}>{row.product.title}</div>
              <div className={styles.sub} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                <span className={styles.rma} style={{ fontSize: 12 }}>{row.seller_sku}</span>
                <span className={styles.pill} style={{ background: tone.bg, color: tone.fg }}>{tone.label}</span>
              </div>
            </div>
          </div>
          <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className={styles.drawerBody}>
          <div className={styles.actions}>
            <button type="button" className={styles.btnPrimary} onClick={() => onAdjust("add")}>
              <Plus size={15} /> Add stock
            </button>
            <button type="button" className={styles.btn} onClick={() => onAdjust("remove")}>
              <Minus size={15} /> Remove
            </button>
            <button type="button" className={styles.btn} onClick={() => onAdjust("set")}>
              <RotateCcw size={15} /> Set count
            </button>
          </div>

          <div className={styles.kpis} style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
            {[
              ["Available", row.available],
              ["Reserved", row.reserved],
              ["Inbound", row.inbound],
              ["Damaged", row.damaged],
            ].map(([label, value]) => (
              <div key={label} className={styles.kpi} style={{ padding: "12px 14px" }}>
                <div className={styles.kpiTop}>{label}</div>
                <div className={styles.kpiValue} style={{ fontSize: 22 }}>{value}</div>
              </div>
            ))}
          </div>

          <section className={styles.section}>
            <h3>By warehouse</h3>
            {row.items.length === 0 ? (
              <span className={styles.hint}>No stock in any warehouse yet. Use “Add stock” to receive units.</span>
            ) : (
              <div className={styles.tableWrap} style={{ border: "1px solid var(--line)", borderRadius: 10 }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Warehouse</th>
                      <th>Available</th>
                      <th>Reserved</th>
                      <th>Damaged</th>
                      <th>Safety stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.items.map((i) => (
                      <tr key={i.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{i.warehouse.name}</div>
                          <div className={styles.sub}>{i.warehouse.code} · {i.warehouse.city}</div>
                        </td>
                        <td className={styles.money}>{i.available_stock}</td>
                        <td>{i.reserved_stock}</td>
                        <td>{i.damaged_stock}</td>
                        <td>
                          <SafetyInput
                            itemId={i.id}
                            value={safety[i.id]}
                            onSaved={(v) => {
                              setSafety({ ...safety, [i.id]: v });
                              onSafetySaved(`Low-stock alert for ${row.seller_sku} now at ${v} units`);
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className={styles.hint} style={{ marginTop: 8 }}>
              Safety stock is the level at which the listing is flagged as low stock.
            </p>
          </section>

          <section className={styles.section}>
            <h3>Stock history</h3>
            {!movements ? (
              <div className={styles.skeleton} style={{ height: 60 }} />
            ) : movements.length === 0 ? (
              <span className={styles.hint} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <History size={14} /> No stock changes recorded yet.
              </span>
            ) : (
              <div className={styles.ledger}>
                {movements.map((m) => (
                  <div key={m.id} style={{ fontWeight: 400, background: "#fff", alignItems: "flex-start", gap: 12 }}>
                    <span style={{ minWidth: 0 }}>
                      <strong style={{ fontSize: 13 }}>{m.reason_display}</strong>
                      <span className={styles.sub} style={{ display: "block" }}>
                        {formatDate(m.created_at, true)} · {m.warehouse}
                        {m.reference_note && ` · ${m.reference_note}`}
                      </span>
                    </span>
                    <span style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <strong style={{ color: m.quantity_change > 0 ? "#15803d" : "#b91c1c" }}>
                        {m.quantity_change > 0 ? "+" : ""}
                        {m.quantity_change}
                      </strong>
                      <span className={styles.sub} style={{ display: "block" }}>balance {m.balance_after}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </aside>
    </>
  );
}
