"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Ban, Check, Clock, Gift, Loader2, MapPin, Package, Printer, Truck, Undo2, Wallet, X } from "lucide-react";
import { CARRIERS, formatDate, formatINR } from "@/components/returns/returnMeta";
import Select from "@/components/ui/Select";
import styles from "@/components/ui/sellerPage.module.css";
import { ApiError } from "@/services/addProductService";
import { OrderAction, OrderDetail, fetchOrder, runOrderAction } from "@/services/ordersService";
import { ORDER_TONE } from "./orderMeta";

interface OrderDrawerProps {
  orderNumber: string;
  onClose: () => void;
  onUpdated: (order: OrderDetail, message: string) => void;
}

const STEPS = ["Placed", "Paid", "Confirmed", "Shipped", "Delivered"];
// COD orders are accepted without payment; the cash is collected at the door.
const COD_STEPS = ["Placed", "COD accepted", "Confirmed", "Shipped", "Delivered & paid"];
const RTO_REASONS = ["Buyer refused the parcel", "Buyer not reachable", "Wrong / incomplete address", "Buyer asked to cancel at the door"];
const STEP_OF: Record<string, number> = {
  PENDING_PAYMENT: 0,
  PAYMENT_CONFIRMED: 1,
  PROCESSING: 2,
  PARTIALLY_SHIPPED: 3,
  SHIPPED: 3,
  DELIVERED: 4,
};
const SUCCESS: Record<OrderAction, string> = {
  confirm: "Order confirmed — stock reserved",
  pack: "Marked as packed",
  ship: "Shipment created and stock dispatched",
  add_tracking: "Tracking updated",
  mark_delivered: "Marked as delivered",
  mark_rto: "Marked as returned to origin — stock is back on the shelf",
  cancel: "Order cancelled",
};

const esc = (v: string) => v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Opens a printable packing slip (ship-to, lines and quantities; no prices except the COD amount) in a new window. */
function printPackingSlip(order: OrderDetail) {
  const a = order.shipping_address;
  const collect = order.payments.find((p) => p.cod_to_collect)?.cod_to_collect;
  const rows = order.items
    .filter((i) => i.status !== "CANCELLED")
    .map((i) => `<tr><td>${esc(i.seller_sku)}</td><td>${esc(i.product.title)}<br><small>${esc(i.product.asin)}</small></td><td class="q">${i.quantity}</td></tr>`)
    .join("");
  const win = window.open("", "_blank", "width=720,height=900");
  if (!win) return;
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Packing slip ${esc(order.order_number)}</title>
<style>body{font:14px/1.5 system-ui,sans-serif;color:#0b1220;margin:32px}h1{font-size:20px;margin:0 0 4px}small{color:#64748b}
table{width:100%;border-collapse:collapse;margin-top:20px}th,td{text-align:left;padding:8px;border-bottom:1px solid #e5e7eb;vertical-align:top}
th{font-size:12px;text-transform:uppercase;color:#64748b}.q{text-align:right;font-weight:700}.box{border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-top:16px}.cod{border:2px solid #0b1220;font-size:16px}</style>
</head><body><h1>Packing slip</h1><small>Order ${esc(order.order_number)} · placed ${esc(new Date(order.placed_at).toLocaleDateString("en-IN"))}</small>
${collect ? `<div class="box cod"><strong>CASH ON DELIVERY</strong><br>Collect ${esc(formatINR(collect))} from the buyer</div>` : ""}
<div class="box"><strong>Ship to</strong><br>${esc(a.full_name)}${a.company ? `, ${esc(a.company)}` : ""}<br>${[...a.lines, `${a.city}, ${a.state} ${a.postal_code}`].map(esc).join("<br>")}<br>Phone: ${esc(a.phone)}</div>
<table><thead><tr><th>SKU</th><th>Item</th><th class="q">Qty</th></tr></thead><tbody>${rows}</tbody></table>
${order.gift_message ? `<div class="box"><strong>Gift message</strong><br>${esc(order.gift_message)}</div>` : ""}
<script>window.onload=()=>window.print()</script></body></html>`);
  win.document.close();
}

/** One order: what to do next, the seller's lines and earnings, buyer, payment and shipment tracking. */
export default function OrderDrawer({ orderNumber, onClose, onUpdated }: OrderDrawerProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<OrderAction | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [carrier, setCarrier] = useState(CARRIERS[0]);
  const [tracking, setTracking] = useState("");
  const [eta, setEta] = useState("");
  const [shipLines, setShipLines] = useState<string[] | null>(null);
  const [trackText, setTrackText] = useState("");
  const [trackPlace, setTrackPlace] = useState("");
  const [trackStatus, setTrackStatus] = useState("IN_TRANSIT");
  const [confirmRto, setConfirmRto] = useState(false);
  const [rtoReason, setRtoReason] = useState(RTO_REASONS[0]);

  useEffect(() => {
    let cancelled = false;
    fetchOrder(orderNumber)
      .then((o) => !cancelled && setOrder(o))
      .catch((err) => !cancelled && setLoadError(err instanceof ApiError ? err.messages[0] : "Couldn't load this order."));
    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function run(action: OrderAction, body: Record<string, unknown> = {}) {
    if (!order) return;
    setBusy(action);
    setErrors([]);
    try {
      const updated = await runOrderAction(order.order_number, action, body);
      setOrder(updated);
      setConfirmCancel(false);
      setConfirmRto(false);
      setTracking("");
      setTrackText("");
      setTrackPlace("");
      setShipLines(null);
      onUpdated(updated, SUCCESS[action]);
    } catch (err) {
      setErrors(err instanceof ApiError ? err.messages : ["Something went wrong. Please try again."]);
    } finally {
      setBusy(null);
    }
  }

  const can = (a: OrderAction) => order?.allowed_actions.includes(a) ?? false;
  const spin = (a: OrderAction) => busy === a && <Loader2 size={15} className={styles.spin} />;
  const shippable = order?.items.filter((i) => i.status === "ALLOCATED" || i.status === "PACKED") ?? [];
  const selectedShip = shipLines ?? shippable.map((i) => i.id);
  const openShipment = order?.shipments.find((s) => s.status !== "DELIVERED" && s.status !== "EXCEPTION_RETURNED");
  const cod = order?.payments.find((p) => p.is_cod);
  const wasRto = order?.shipments.some((s) => s.status === "EXCEPTION_RETURNED") ?? false;
  const cancelNote = cod ? "Nothing was collected from the buyer, so there's nothing to refund." : "The buyer is refunded.";
  const tone = order ? ORDER_TONE[order.status] ?? ORDER_TONE.PENDING_PAYMENT : ORDER_TONE.PENDING_PAYMENT;
  const step = order ? STEP_OF[order.status] : undefined;
  const earnings = order?.items.reduce((s, i) => s + Number(i.net_earning), 0) ?? 0;
  const fees = order?.items.reduce((s, i) => s + Number(i.fees_total), 0) ?? 0;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <aside className={styles.drawer} style={{ width: "min(620px, 100vw)" }} role="dialog" aria-label={`Order ${orderNumber}`}>
        <div className={styles.drawerHead}>
          <div>
            <h2>{orderNumber}</h2>
            {order && (
              <div className={styles.sub} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
                <span className={styles.pill} style={{ background: tone.bg, color: tone.fg }}>{order.status_display}</span>
                Placed {formatDate(order.placed_at, true)}
                {order.is_late && (
                  <span className={styles.pill} style={{ background: "#fee2e2", color: "#991b1b" }}>Late to ship</span>
                )}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {order && (
              <button type="button" className={`${styles.btn} ${styles.sm}`} onClick={() => printPackingSlip(order)} title="Print packing slip">
                <Printer size={14} /> Packing slip
              </button>
            )}
            <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className={styles.drawerBody}>
          {loadError ? (
            <div className={styles.alert}>
              <AlertCircle size={16} /> {loadError}
            </div>
          ) : !order ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className={styles.skeleton} style={{ height: 40 }} />
              <div className={styles.skeleton} style={{ height: 120 }} />
              <div className={styles.skeleton} style={{ width: "60%" }} />
            </div>
          ) : (
            <>
              {step === undefined ? (
                <div className={styles.stopped}>
                  <Ban size={18} />
                  {order.status === "REFUNDED"
                    ? "This order was refunded."
                    : wasRto
                      ? `Returned to you (RTO) — the parcel couldn't be delivered and the units are back in stock. ${cancelNote}`
                      : `This order was cancelled. Reserved stock was released. ${cancelNote}`}
                </div>
              ) : (
                <div className={styles.stepper}>
                  {(cod ? COD_STEPS : STEPS).map((label, i) => {
                    const done = i < step || order.status === "DELIVERED";
                    return (
                      <div key={label} className={`${styles.step} ${done ? styles.stepDone : ""} ${i === step && !done ? styles.stepNow : ""}`}>
                        <span className={styles.stepDot}>{done ? <Check size={13} strokeWidth={3} /> : i + 1}</span>
                        {label}
                      </div>
                    );
                  })}
                </div>
              )}

              {errors.length > 0 && (
                <div className={styles.alert}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>{errors.join(" ")}</div>
                </div>
              )}

              {order.status === "PENDING_PAYMENT" && (
                <div className={styles.actionPanel}>
                  <h3>Waiting for payment</h3>
                  <p>The buyer hasn&apos;t completed payment yet. Don&apos;t pack or ship until it&apos;s confirmed.</p>
                </div>
              )}

              {(can("confirm") || can("pack")) && (
                <div className={styles.actionPanel}>
                  <h3>{can("confirm") ? "New order — confirm it" : "Pack the order"}</h3>
                  <p>
                    {can("confirm")
                      ? "Confirming reserves the stock so it can't be sold twice."
                      : "Mark it packed once the parcel is ready for pickup."}{" "}
                    Ship by <strong>{formatDate(order.ship_by, true)}</strong>.
                  </p>
                  <div className={styles.actions}>
                    {can("confirm") && (
                      <button type="button" className={`${styles.btnPrimary} ${styles.drawerBtn}`} disabled={!!busy} onClick={() => run("confirm")}>
                        {spin("confirm")} Confirm order
                      </button>
                    )}
                    {can("pack") && (
                      <button type="button" className={`${can("confirm") ? styles.btn : styles.btnPrimary} ${styles.drawerBtn}`} disabled={!!busy} onClick={() => run("pack")}>
                        {spin("pack")} Mark packed
                      </button>
                    )}
                    {can("cancel") && !confirmCancel && (
                      <button
                        type="button"
                        className={`${styles.btnDanger} ${styles.drawerBtn}`}
                        disabled={!!busy}
                        onClick={() => setConfirmCancel(true)}
                      >
                        Cancel order
                      </button>
                    )}
                  </div>
                  {confirmCancel && (
                    <div className={styles.confirm} style={{ marginTop: 12 }}>
                      Cancel this order? Reserved stock is released. {cancelNote}
                      <div className={styles.actions}>
                        <button type="button" className={`${styles.btn} ${styles.drawerBtn}`} onClick={() => setConfirmCancel(false)}>
                          Keep order
                        </button>
                        <button type="button" className={`${styles.btnDanger} ${styles.drawerBtn}`} disabled={!!busy} onClick={() => run("cancel")}>
                          {spin("cancel")} Yes, cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {cod?.cod_to_collect && (
                <div className={styles.actionPanel} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <Wallet size={20} style={{ flexShrink: 0, color: "#0369a1", marginTop: 2 }} />
                  <div>
                    <h3>Cash on delivery · collect {formatINR(cod.cod_to_collect)}</h3>
                    <p>
                      Book the AWB as a COD shipment so the courier collects this amount at the door. The payment is marked
                      collected when the order is delivered; if the buyer refuses it, mark the shipment RTO.
                    </p>
                  </div>
                </div>
              )}

              {can("ship") && (
                <div className={styles.actionPanel}>
                  <h3>Ship it</h3>
                  {shippable.length > 1 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {shippable.map((i) => (
                        <label key={i.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                          <input
                            type="checkbox"
                            checked={selectedShip.includes(i.id)}
                            onChange={(e) =>
                              setShipLines(e.target.checked ? [...selectedShip, i.id] : selectedShip.filter((x) => x !== i.id))
                            }
                          />
                          {i.quantity} × {i.product.title}
                        </label>
                      ))}
                    </div>
                  )}
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
                      <label className={styles.label}>Tracking / AWB number</label>
                      <input className={styles.input} value={tracking} placeholder="AWB1234567890" onChange={(e) => setTracking(e.target.value)} />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Expected delivery</label>
                      <input className={styles.input} type="date" value={eta} onChange={(e) => setEta(e.target.value)} />
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={`${styles.btnPrimary} ${styles.drawerBtn}`}
                      disabled={!!busy || !tracking.trim() || selectedShip.length === 0}
                      onClick={() =>
                        run("ship", { carrier, tracking_number: tracking, estimated_delivery_at: eta || undefined, item_ids: selectedShip })
                      }
                    >
                      {spin("ship")} <Truck size={15} /> Ship {selectedShip.length < shippable.length ? `${selectedShip.length} of ${shippable.length} lines` : "order"}
                    </button>
                  </div>
                </div>
              )}

              {can("mark_delivered") && openShipment && (
                <div className={styles.actionPanel}>
                  <h3>In transit with {openShipment.carrier_name}</h3>
                  <div className={styles.grid2}>
                    <div className={styles.field}>
                      <label className={styles.label}>Tracking update</label>
                      <input className={styles.input} placeholder="e.g. Reached destination hub" value={trackText} onChange={(e) => setTrackText(e.target.value)} />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Location</label>
                      <input className={styles.input} placeholder={order.shipping_address.city} value={trackPlace} onChange={(e) => setTrackPlace(e.target.value)} />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Shipment status</label>
                      <Select value={trackStatus} onChange={(e) => setTrackStatus(e.target.value)} className={styles.input}>
                        <option value="IN_TRANSIT">In transit</option>
                        <option value="OUT_FOR_DELIVERY">Out for delivery</option>
                        <option value="DELIVERY_ATTEMPTED">Delivery attempted</option>
                      </Select>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.drawerBtn}`}
                      disabled={!!busy || !trackText.trim() || !trackPlace.trim()}
                      onClick={() => run("add_tracking", { shipment_id: openShipment.id, status_text: trackText, location: trackPlace, status: trackStatus })}
                    >
                      {spin("add_tracking")} Add update
                    </button>
                    <button type="button" className={`${styles.btnPrimary} ${styles.drawerBtn}`} disabled={!!busy} onClick={() => run("mark_delivered", { shipment_id: openShipment.id })}>
                      {spin("mark_delivered")} {cod?.cod_to_collect ? "Delivered · cash collected" : "Mark delivered"}
                    </button>
                    {can("mark_rto") && !confirmRto && (
                      <button type="button" className={`${styles.btnDanger} ${styles.drawerBtn}`} disabled={!!busy} onClick={() => setConfirmRto(true)}>
                        <Undo2 size={15} /> Not delivered (RTO)
                      </button>
                    )}
                  </div>
                  {confirmRto && (
                    <div className={styles.confirm} style={{ marginTop: 12 }}>
                      Parcel coming back to you? The lines are cancelled, the units go back into stock
                      {cod ? " and the COD payment is voided." : " and the buyer is refunded."}
                      <div className={styles.field} style={{ marginTop: 8 }}>
                        <label className={styles.label}>Reason</label>
                        <Select value={rtoReason} onChange={(e) => setRtoReason(e.target.value)} className={styles.input}>
                          {RTO_REASONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </Select>
                      </div>
                      <div className={styles.actions}>
                        <button type="button" className={`${styles.btn} ${styles.drawerBtn}`} onClick={() => setConfirmRto(false)}>
                          Keep in transit
                        </button>
                        <button
                          type="button"
                          className={`${styles.btnDanger} ${styles.drawerBtn}`}
                          disabled={!!busy}
                          onClick={() => run("mark_rto", { shipment_id: openShipment.id, reason: rtoReason })}
                        >
                          {spin("mark_rto")} Yes, mark RTO
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!can("confirm") && !can("pack") && can("cancel") &&
                (confirmCancel ? (
                  <div className={styles.confirm}>
                    Cancel this order? Reserved stock is released. {cancelNote}
                    <div className={styles.actions}>
                      <button type="button" className={`${styles.btn} ${styles.drawerBtn}`} onClick={() => setConfirmCancel(false)}>
                        Keep order
                      </button>
                      <button type="button" className={`${styles.btnDanger} ${styles.drawerBtn}`} disabled={!!busy} onClick={() => run("cancel")}>
                        {spin("cancel")} Yes, cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className={`${styles.btnDanger} ${styles.sm}`} style={{ alignSelf: "flex-start" }} onClick={() => setConfirmCancel(true)}>
                    Cancel order
                  </button>
                ))}

              <section className={styles.section}>
                <h3>Your items{order.other_sellers_items > 0 && ` · plus ${order.other_sellers_items} from other sellers`}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {order.items.map((i) => (
                    <div key={i.id} className={styles.product} style={{ maxWidth: "none", alignItems: "flex-start" }}>
                      <span className={styles.thumb} style={i.product.image ? { backgroundImage: `url(${i.product.image})` } : undefined}>
                        {!i.product.image && <Package size={18} />}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className={styles.productTitle}>{i.product.title}</div>
                        <div className={styles.sub}>
                          {i.seller_sku} · {i.product.asin}
                          <span className={styles.fc}>{i.fulfillment_channel}</span>
                          {i.gift_wrap_requested && <Gift size={12} style={{ marginLeft: 6 }} />}
                        </div>
                        <div className={styles.sub}>
                          {i.quantity} × {formatINR(i.unit_price)} · <strong>{i.status_display}</strong>
                          {i.shipment_number && ` · ${i.shipment_number}`}
                        </div>
                      </div>
                      <div className={styles.money}>{formatINR(i.total_price)}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.section}>
                <h3>Money</h3>
                <div className={styles.ledger}>
                  <div><span>Items</span><span>{formatINR(order.items_subtotal)}</span></div>
                  <div><span>Shipping</span><span>{formatINR(order.shipping_total)}</span></div>
                  <div><span>GST</span><span>{formatINR(order.tax_total)}</span></div>
                  {Number(order.promotion_discount) > 0 && (
                    <div><span>Promotion</span><span>− {formatINR(order.promotion_discount)}</span></div>
                  )}
                  <div>
                    <span>{cod?.cod_to_collect ? "Buyer pays on delivery" : "Buyer paid"}</span>
                    <span>{formatINR(order.grand_total)}</span>
                  </div>
                </div>
                <div className={styles.ledger} style={{ marginTop: 10 }}>
                  <div><span>Marketplace fees (referral, closing, fulfilment)</span><span>− {formatINR(fees)}</span></div>
                  <div><span>Your earnings</span><span>{formatINR(earnings)}</span></div>
                </div>
              </section>

              <section className={styles.section}>
                <h3>Buyer</h3>
                <dl className={styles.facts}>
                  <div>
                    <dt>Ship to</dt>
                    <dd>
                      {order.shipping_address.full_name}
                      {order.shipping_address.company && `, ${order.shipping_address.company}`}
                      <div style={{ fontWeight: 400, color: "#334155", fontSize: 13 }}>
                        {[...order.shipping_address.lines, `${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.postal_code}`].join(", ")}
                      </div>
                    </dd>
                  </div>
                  <div>
                    <dt>Phone</dt>
                    <dd>{order.shipping_address.phone}</dd>
                  </div>
                  <div>
                    <dt>Delivery speed</dt>
                    <dd>{order.shipping_speed.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}</dd>
                  </div>
                  <div>
                    <dt>Ship by</dt>
                    <dd style={{ color: order.is_late ? "#b91c1c" : undefined }}>{formatDate(order.ship_by, true)}</dd>
                  </div>
                </dl>
                {order.shipping_address.instructions && <p className={styles.quote}>{order.shipping_address.instructions}</p>}
                {order.gift_message && <p className={styles.quote}>Gift message: “{order.gift_message}”</p>}
              </section>

              <section className={styles.section}>
                <h3>Payment</h3>
                {order.payments.map((p) => (
                  <dl key={p.reference} className={styles.facts}>
                    <div><dt>Method</dt><dd>{p.method} · {p.provider}</dd></div>
                    <div>
                      <dt>Status</dt>
                      <dd>{p.is_cod ? (p.cod_to_collect ? "To collect on delivery" : p.status === "CAPTURED" ? "Cash collected" : "Not collected (voided)") : p.status_display}</dd>
                    </div>
                    <div><dt>Amount</dt><dd>{formatINR(p.amount)}</dd></div>
                    <div><dt>Reference</dt><dd className={styles.rma} style={{ fontSize: 12 }}>{p.reference}</dd></div>
                  </dl>
                ))}
              </section>

              {order.shipments.length > 0 && (
                <section className={styles.section}>
                  <h3>Shipments</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {order.shipments.map((s) => (
                      <div key={s.id} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                          <div>
                            <strong style={{ fontSize: 14 }}>{s.carrier_name}</strong>{" "}
                            <span className={styles.rma} style={{ fontSize: 12 }}>{s.tracking_number}</span>
                            <div className={styles.sub}>
                              {s.shipment_number}
                              {s.warehouse && ` · from ${s.warehouse}`}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span
                              className={styles.pill}
                              style={
                                s.status === "DELIVERED"
                                  ? { background: "#dcfce7", color: "#166534" }
                                  : s.status === "EXCEPTION_RETURNED"
                                    ? { background: "#fee2e2", color: "#991b1b" }
                                    : { background: "#ede9fe", color: "#5b21b6" }
                              }
                            >
                              {s.status_display}
                            </span>
                            <div className={styles.sub} style={{ marginTop: 4 }}>
                              {s.delivered_at ? `Delivered ${formatDate(s.delivered_at)}` : s.estimated_delivery_at ? `ETA ${formatDate(s.estimated_delivery_at)}` : ""}
                            </div>
                          </div>
                        </div>
                        {s.events.length > 0 && (
                          <ol style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                            {[...s.events].reverse().map((e, idx) => (
                              <li key={e.id} style={{ display: "flex", gap: 10, fontSize: 13 }}>
                                <span style={{ marginTop: 3, color: idx === 0 ? "#c2410c" : "#cbd5e1" }}>
                                  {idx === 0 ? <MapPin size={14} /> : <Clock size={14} />}
                                </span>
                                <span>
                                  <strong>{e.status_text}</strong>
                                  <span className={styles.sub} style={{ display: "block" }}>{e.location} · {formatDate(e.event_time, true)}</span>
                                </span>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
