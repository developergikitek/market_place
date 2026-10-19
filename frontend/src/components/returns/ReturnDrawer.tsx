"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Ban, Check, ExternalLink, Loader2, Package, X } from "lucide-react";
import Select from "@/components/ui/Select";
import { ApiError } from "@/services/addProductService";
import { ReturnAction, ReturnRequest, runReturnAction } from "@/services/returnsService";
import { CARRIERS, STATUS_TONE, STEP_OF, STEPS, formatDate, formatINR } from "./returnMeta";
import styles from "./returns.module.css";

interface ReturnDrawerProps {
  item: ReturnRequest;
  onClose: () => void;
  onUpdated: (updated: ReturnRequest, message: string) => void;
}

const SUCCESS: Record<ReturnAction, string> = {
  approve: "Return approved",
  reject: "Return rejected",
  generate_label: "Return shipment added",
  mark_in_transit: "Marked as shipped",
  mark_received: "Marked as received at warehouse",
  inspect: "Inspection recorded",
  issue_refund: "Refund issued to the buyer",
};

export default function ReturnDrawer({ item, onClose, onUpdated }: ReturnDrawerProps) {
  const [busy, setBusy] = useState<ReturnAction | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [fee, setFee] = useState("");
  const [confirmReject, setConfirmReject] = useState(false);
  const [carrier, setCarrier] = useState(CARRIERS[0]);
  const [tracking, setTracking] = useState("");
  const [labelUrl, setLabelUrl] = useState("");
  const [condition, setCondition] = useState<"SELLABLE" | "DAMAGED">("SELLABLE");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const can = (a: ReturnAction) => item.allowed_actions.includes(a);
  const tone = STATUS_TONE[item.status];
  const step = STEP_OF[item.status];
  const total = Number(item.item_total);
  const feeRate = Number(fee) || 0;
  const currentFee = Number(item.restocking_fee_amount);
  const refundPreview = can("issue_refund") ? total - currentFee : Number(item.refund_amount);

  async function run(action: ReturnAction, body: Record<string, unknown> = {}) {
    setBusy(action);
    setErrors([]);
    try {
      const updated = await runReturnAction(item.id, action, body);
      setFee("");
      setConfirmReject(false);
      onUpdated(updated, SUCCESS[action]);
    } catch (err) {
      setErrors(err instanceof ApiError ? err.messages : ["Something went wrong. Please try again."]);
    } finally {
      setBusy(null);
    }
  }

  const spinner = (a: ReturnAction) => busy === a && <Loader2 size={15} className={styles.spin} />;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <aside className={styles.drawer} role="dialog" aria-label={`Return ${item.rma_number}`}>
        <div className={styles.drawerHead}>
          <div>
            <h2>{item.rma_number}</h2>
            <div className={styles.sub} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
              <span className={styles.pill} style={{ background: tone.bg, color: tone.fg }}>
                {item.status_display}
              </span>
              Opened {formatDate(item.created_at, true)}
            </div>
          </div>
          <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className={styles.drawerBody}>
          {step === undefined ? (
            <div className={styles.stopped}>
              <Ban size={18} />
              {item.status === "REJECTED"
                ? "You rejected this return. The order line is back to delivered."
                : "The buyer cancelled this return before shipping it."}
            </div>
          ) : (
            <div className={styles.stepper}>
              {STEPS.map((label, i) => (
                <div
                  key={label}
                  className={`${styles.step} ${i < step || item.status === "REFUND_ISSUED" ? styles.stepDone : ""} ${
                    i === step && item.status !== "REFUND_ISSUED" ? styles.stepNow : ""
                  }`}
                >
                  <span className={styles.stepDot}>
                    {i < step || item.status === "REFUND_ISSUED" ? <Check size={13} strokeWidth={3} /> : i + 1}
                  </span>
                  {label}
                </div>
              ))}
            </div>
          )}

          {errors.length > 0 && (
            <div className={styles.alert}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                {errors.length === 1 ? errors[0] : (
                  <ul>{errors.map((m) => <li key={m}>{m}</li>)}</ul>
                )}
              </div>
            </div>
          )}

          {/* ---------- Next step for the seller ---------- */}
          {can("approve") && (
            <div className={styles.actionPanel}>
              <h3>Review this return request</h3>
              <p>
                Approve to let the buyer send it back, or reject if it doesn&apos;t meet your return policy.
              </p>
              {item.restocking_fee_allowed && (
                <div className={styles.field} style={{ maxWidth: 240 }}>
                  <label className={styles.label}>Restocking fee (%)</label>
                  <input
                    className={styles.input}
                    type="number"
                    min={0}
                    max={20}
                    placeholder="0"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                  />
                  <span className={styles.hint}>
                    Buyer changed their mind, so up to 20% can be kept
                    {feeRate > 0 && ` · ${formatINR((total * feeRate) / 100)}`}
                  </span>
                </div>
              )}
              {confirmReject ? (
                <div className={styles.confirm}>
                  Reject this return? The buyer will be notified.
                  <div className={styles.actions}>
                    <button type="button" className={`${styles.btn} ${styles.sm}`} onClick={() => setConfirmReject(false)}>
                      Keep it
                    </button>
                    <button
                      type="button"
                      className={`${styles.btnDanger} ${styles.sm}`}
                      disabled={!!busy}
                      onClick={() => run("reject")}
                    >
                      {spinner("reject")} Yes, reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    disabled={!!busy}
                    onClick={() => run("approve", item.restocking_fee_allowed && fee ? { restocking_fee_rate: fee } : {})}
                  >
                    {spinner("approve")} Approve return
                  </button>
                  <button type="button" className={styles.btnDanger} disabled={!!busy} onClick={() => setConfirmReject(true)}>
                    Reject
                  </button>
                </div>
              )}
            </div>
          )}

          {can("generate_label") && (
            <div className={styles.actionPanel}>
              <h3>Add the return shipment</h3>
              <p>Share the courier and tracking number the buyer will use to send the item back.</p>
              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label className={styles.label}>Courier</label>
                  <Select value={carrier} onChange={(e) => setCarrier(e.target.value)} className={styles.input}>
                    {CARRIERS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Tracking number</label>
                  <input
                    className={styles.input}
                    value={tracking}
                    placeholder="e.g. RT1234567890"
                    onChange={(e) => setTracking(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Label link (optional)</label>
                <input
                  className={styles.input}
                  value={labelUrl}
                  placeholder="https://…"
                  onChange={(e) => setLabelUrl(e.target.value)}
                />
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  disabled={!!busy || !tracking.trim()}
                  onClick={() => run("generate_label", { carrier, tracking_number: tracking, label_url: labelUrl })}
                >
                  {spinner("generate_label")} Save shipment
                </button>
              </div>
            </div>
          )}

          {can("mark_in_transit") && (
            <div className={styles.actionPanel}>
              <h3>Has the buyer handed over the parcel?</h3>
              <p>
                Mark it shipped once {item.return_carrier} has picked it up ({item.return_tracking_number}).
              </p>
              <div className={styles.actions}>
                <button type="button" className={styles.btnPrimary} disabled={!!busy} onClick={() => run("mark_in_transit")}>
                  {spinner("mark_in_transit")} Mark as shipped
                </button>
              </div>
            </div>
          )}

          {can("mark_received") && (
            <div className={styles.actionPanel}>
              <h3>Waiting for the parcel</h3>
              <p>Confirm when the returned item reaches your warehouse so it can be inspected.</p>
              <div className={styles.actions}>
                <button type="button" className={styles.btnPrimary} disabled={!!busy} onClick={() => run("mark_received")}>
                  {spinner("mark_received")} Mark as received
                </button>
              </div>
            </div>
          )}

          {can("inspect") && (
            <div className={styles.actionPanel}>
              <h3>Inspect the returned item</h3>
              <div className={styles.choice}>
                <button
                  type="button"
                  className={`${styles.choiceCard} ${condition === "SELLABLE" ? styles.choiceOn : ""}`}
                  onClick={() => setCondition("SELLABLE")}
                >
                  <strong>Sellable</strong>
                  <span>{item.quantity} unit{item.quantity > 1 ? "s" : ""} go back into stock</span>
                </button>
                <button
                  type="button"
                  className={`${styles.choiceCard} ${condition === "DAMAGED" ? styles.choiceOn : ""}`}
                  onClick={() => setCondition("DAMAGED")}
                >
                  <strong>Damaged</strong>
                  <span>Not restocked; keep part of the refund</span>
                </button>
              </div>
              {condition === "DAMAGED" && (
                <div className={styles.field} style={{ maxWidth: 240 }}>
                  <label className={styles.label}>Deduction (%)</label>
                  <input
                    className={styles.input}
                    type="number"
                    min={0}
                    max={50}
                    placeholder="0"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                  />
                  <span className={styles.hint}>
                    Up to 50% for damage{feeRate > 0 && ` · ${formatINR((total * feeRate) / 100)}`}
                  </span>
                </div>
              )}
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  disabled={!!busy}
                  onClick={() =>
                    run("inspect", condition === "DAMAGED" && fee ? { condition, restocking_fee_rate: fee } : { condition })
                  }
                >
                  {spinner("inspect")} Save inspection
                </button>
              </div>
            </div>
          )}

          {can("issue_refund") && (
            <div className={styles.actionPanel}>
              <h3>Refund the buyer</h3>
              <p>
                {formatINR(refundPreview)} goes back to the buyer and is deducted from your next settlement.
              </p>
              <div className={styles.actions}>
                <button type="button" className={styles.btnPrimary} disabled={!!busy} onClick={() => run("issue_refund")}>
                  {spinner("issue_refund")} Issue {formatINR(refundPreview)} refund
                </button>
              </div>
            </div>
          )}

          {/* ---------- Details ---------- */}
          <section className={styles.section}>
            <h3>Product</h3>
            <div className={styles.product} style={{ maxWidth: "none" }}>
              <span
                className={styles.thumb}
                style={item.product.image ? { backgroundImage: `url(${item.product.image})` } : undefined}
              >
                {!item.product.image && <Package size={18} />}
              </span>
              <div style={{ minWidth: 0 }}>
                <div className={styles.productTitle}>{item.product.title}</div>
                <div className={styles.sub}>
                  {item.product.brand && `${item.product.brand} · `}ASIN {item.product.asin} · SKU {item.seller_sku}
                  <span className={styles.fc}>{item.fulfillment_channel}</span>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h3>Reason</h3>
            <strong style={{ fontSize: 14 }}>{item.reason_display}</strong>
            {item.customer_comment && <p className={styles.quote}>“{item.customer_comment}”</p>}
            {item.evidence_images.length > 0 && (
              <div className={styles.evidence}>
                {item.evidence_images.map((src) => (
                  <a key={src} href={src} target="_blank" rel="noreferrer" style={{ backgroundImage: `url(${src})` }} aria-label="Buyer photo" />
                ))}
              </div>
            )}
          </section>

          <section className={styles.section}>
            <h3>Order & buyer</h3>
            <dl className={styles.facts}>
              <div>
                <dt>Order</dt>
                <dd>{item.order_number}</dd>
              </div>
              <div>
                <dt>Placed</dt>
                <dd>{formatDate(item.order_placed_at)}</dd>
              </div>
              <div>
                <dt>Buyer</dt>
                <dd>{item.customer.name}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{[item.customer.city, item.customer.state].filter(Boolean).join(", ") || "—"}</dd>
              </div>
              <div>
                <dt>Quantity</dt>
                <dd>
                  {item.quantity} × {formatINR(item.unit_price)}
                </dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{item.customer.phone ?? "—"}</dd>
              </div>
            </dl>
          </section>

          {item.return_tracking_number && (
            <section className={styles.section}>
              <h3>Return shipment</h3>
              <dl className={styles.facts}>
                <div>
                  <dt>Courier</dt>
                  <dd>{item.return_carrier}</dd>
                </div>
                <div>
                  <dt>Tracking</dt>
                  <dd className={styles.rma}>{item.return_tracking_number}</dd>
                </div>
              </dl>
              {item.return_label_url && (
                <a href={item.return_label_url} target="_blank" rel="noreferrer" className={styles.btnGhost} style={{ marginTop: 8 }}>
                  Open label <ExternalLink size={14} />
                </a>
              )}
            </section>
          )}

          <section className={styles.section}>
            <h3>Refund</h3>
            <div className={styles.ledger}>
              <div>
                <span>Item total</span>
                <span>{formatINR(item.item_total)}</span>
              </div>
              <div>
                <span>Restocking fee ({Number(item.restocking_fee_rate)}%)</span>
                <span>− {formatINR(item.restocking_fee_amount)}</span>
              </div>
              <div>
                <span>{item.refunded_at ? `Refunded on ${formatDate(item.refunded_at)}` : "Refund to buyer"}</span>
                <span>{formatINR(item.refunded_at ? item.refund_amount : total - currentFee)}</span>
              </div>
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}
