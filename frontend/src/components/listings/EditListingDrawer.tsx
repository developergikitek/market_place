"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, Package, Plus, Trash2, X } from "lucide-react";
import Select from "@/components/ui/Select";
import styles from "@/components/ui/sellerPage.module.css";
import { ApiError, CommerceChannel } from "@/services/addProductService";
import { Listing, ListingPatch, saveTierPrices, updateListing } from "@/services/pricingService";

interface EditListingDrawerProps {
  listing: Listing;
  onClose: () => void;
  onSaved: (listing: Listing, message: string) => void;
}

const CHANNELS: { value: CommerceChannel; title: string; text: string }[] = [
  { value: "BAZAAR", title: "Bazaar", text: "Pan-India courier" },
  { value: "QUICK_COMMERCE", title: "Quick Commerce", text: "8–10 km hyperlocal" },
  { value: "BOTH", title: "Both", text: "Local + Pan-India" },
];
const CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "REFURBISHED_EXCELLENT", label: "Refurbished – excellent" },
  { value: "REFURBISHED_GOOD", label: "Refurbished – good" },
  { value: "USED_LIKE_NEW", label: "Used – like new" },
  { value: "USED_GOOD", label: "Used – good" },
];

const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const num = (v: string | null) => (v == null ? "" : String(Number(v)));

function formFrom(l: Listing) {
  return {
    seller_sku: l.seller_sku,
    standard_price: num(l.standard_price),
    sale_price: num(l.sale_price),
    sale_starts_at: toDateInput(l.sale_starts_at),
    sale_ends_at: toDateInput(l.sale_ends_at),
    minimum_price: num(l.minimum_price),
    maximum_price: num(l.maximum_price),
    commerce_channel: l.commerce_channel,
    fulfillment_channel: l.fulfillment_channel,
    handling_time_days: String(l.handling_time_days),
    max_order_quantity: l.max_order_quantity == null ? "" : String(l.max_order_quantity),
    condition: l.condition,
    condition_note: l.condition_note ?? "",
    status: l.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
  };
}

type Form = ReturnType<typeof formFrom>;

/** Everything on the Listing model a seller manages: price, sale, guardrails, delivery, condition and B2B tiers. */
export default function EditListingDrawer({ listing, onClose, onSaved }: EditListingDrawerProps) {
  const initial = useMemo(() => formFrom(listing), [listing]);
  const [form, setForm] = useState<Form>(initial);
  const [tiers, setTiers] = useState(listing.b2b_tier_prices.map((t) => ({ qty: String(t.min_quantity), price: num(t.discounted_price) })));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (key: keyof Form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });

  const mrp = Number(form.standard_price) || 0;
  const sale = Number(form.sale_price) || 0;
  const discount = sale > 0 && mrp > 0 && sale < mrp ? Math.round(((mrp - sale) / mrp) * 100) : 0;
  const initialTiers = JSON.stringify(listing.b2b_tier_prices.map((t) => [t.min_quantity, Number(t.discounted_price)]));
  const tiersChanged = JSON.stringify(tiers.filter((t) => t.qty || t.price).map((t) => [Number(t.qty), Number(t.price)])) !== initialTiers;

  // Only send what changed; blank optional fields are sent as null to clear them.
  function buildPatch(): ListingPatch {
    const patch: Record<string, unknown> = {};
    (Object.keys(form) as (keyof Form)[]).forEach((k) => {
      if (form[k] === initial[k]) return;
      const v = form[k].trim();
      if (k === "handling_time_days") patch[k] = Number(v);
      else if (k === "max_order_quantity") patch[k] = v ? Number(v) : null;
      else if (["sale_price", "minimum_price", "maximum_price", "sale_starts_at", "sale_ends_at", "condition_note"].includes(k))
        patch[k] = v || null;
      else patch[k] = v;
    });
    return patch as ListingPatch;
  }

  const patch = buildPatch();
  const dirty = Object.keys(patch).length > 0 || tiersChanged;

  async function save() {
    setSaving(true);
    setErrors([]);
    try {
      let updated = listing;
      if (Object.keys(patch).length) updated = await updateListing(listing.id, patch);
      if (tiersChanged) {
        updated = await saveTierPrices(
          listing.id,
          tiers.filter((t) => t.qty || t.price).map((t) => ({ min_quantity: Number(t.qty), discounted_price: t.price }))
        );
      }
      onSaved(updated, "Listing updated");
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.messages);
      else setErrors(["Something went wrong. Please try again."]);
    } finally {
      setSaving(false);
    }
  }

  const input = (key: keyof Form, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input className={styles.input} value={form[key]} onChange={set(key)} {...props} />
  );

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <aside className={styles.drawer} role="dialog" aria-label={`Edit listing ${listing.seller_sku}`}>
        <div className={styles.drawerHead}>
          <div style={{ display: "flex", gap: 12, minWidth: 0 }}>
            <span
              className={styles.thumb}
              style={listing.product.primary_image ? { backgroundImage: `url(${listing.product.primary_image})` } : undefined}
            >
              {!listing.product.primary_image && <Package size={18} />}
            </span>
            <div style={{ minWidth: 0 }}>
              <div className={styles.productTitle} style={{ fontSize: 15 }}>
                {listing.product.title}
              </div>
              <div className={styles.sub}>
                ASIN {listing.product.asin} · Stock {listing.available_stock}{" "}
                <Link href="/inventory" className={styles.btnGhost} style={{ height: "auto", padding: 0, fontSize: 12 }}>
                  Manage stock
                </Link>
              </div>
            </div>
          </div>
          <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className={styles.drawerBody}>
          {errors.length > 0 && (
            <div className={styles.alert}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>{errors.length === 1 ? errors[0] : <ul>{errors.map((m) => <li key={m}>{m}</li>)}</ul>}</div>
            </div>
          )}

          <section className={styles.section}>
            <h3>Price</h3>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>MRP (₹)</label>
                {input("standard_price", { type: "number", min: 0 })}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Sale price (₹)</label>
                {input("sale_price", { type: "number", min: 0, placeholder: "No sale" })}
                <span className={styles.hint}>{discount ? `${discount}% off MRP` : "Leave empty to sell at MRP"}</span>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Sale starts</label>
                {input("sale_starts_at", { type: "date", disabled: !form.sale_price })}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Sale ends</label>
                {input("sale_ends_at", { type: "date", disabled: !form.sale_price })}
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h3>Repricing guardrails</h3>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>Minimum price (₹)</label>
                {input("minimum_price", { type: "number", min: 0, placeholder: "No floor" })}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Maximum price (₹)</label>
                {input("maximum_price", { type: "number", min: 0, placeholder: "No ceiling" })}
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h3>B2B quantity pricing</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tiers.length === 0 && <span className={styles.hint}>No bulk discounts. Add a tier to reward larger orders.</span>}
              {tiers.map((t, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 34px", gap: 8, alignItems: "center" }}>
                  <input
                    className={styles.input}
                    type="number"
                    min={2}
                    placeholder="Min quantity"
                    value={t.qty}
                    onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)))}
                  />
                  <input
                    className={styles.input}
                    type="number"
                    min={0}
                    placeholder="Unit price (₹)"
                    value={t.price}
                    onChange={(e) => setTiers(tiers.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))}
                  />
                  <button type="button" className={styles.iconBtn} onClick={() => setTiers(tiers.filter((_, j) => j !== i))} aria-label="Remove tier">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={`${styles.btnGhost} ${styles.sm}`}
                style={{ alignSelf: "flex-start" }}
                onClick={() => setTiers([...tiers, { qty: "", price: "" }])}
              >
                <Plus size={14} /> Add tier
              </button>
            </div>
          </section>

          <section className={styles.section}>
            <h3>Selling channel</h3>
            <div className={styles.choice} style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
              {CHANNELS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`${styles.choiceCard} ${form.commerce_channel === c.value ? styles.choiceOn : ""}`}
                  onClick={() => setForm({ ...form, commerce_channel: c.value })}
                >
                  <strong>{c.title}</strong>
                  <span>{c.text}</span>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h3>Delivery</h3>
            <div className={styles.choice}>
              {(["FBM", "FBA"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`${styles.choiceCard} ${form.fulfillment_channel === f ? styles.choiceOn : ""}`}
                  onClick={() => setForm({ ...form, fulfillment_channel: f })}
                >
                  <strong>{f === "FBM" ? "Self ship" : "Makaano fulfilled"}</strong>
                  <span>{f === "FBM" ? "Your vehicles or courier" : "We pick up and deliver"}</span>
                </button>
              ))}
            </div>
            <div className={styles.grid2} style={{ marginTop: 12 }}>
              <div className={styles.field}>
                <label className={styles.label}>Dispatch within</label>
                <Select value={form.handling_time_days} onChange={set("handling_time_days")} className={styles.input}>
                  {[1, 2, 3, 5, 7, 10, 15].map((d) => (
                    <option key={d} value={d}>
                      {d} {d === 1 ? "day" : "days"}
                    </option>
                  ))}
                </Select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Max quantity per order</label>
                {input("max_order_quantity", { type: "number", min: 1, placeholder: "No limit" })}
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h3>Offer details</h3>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>Seller SKU</label>
                {input("seller_sku")}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Condition</label>
                <Select value={form.condition} onChange={set("condition")} className={styles.input}>
                  {CONDITIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </Select>
              </div>
            </div>
            {form.condition !== "NEW" && (
              <div className={styles.field} style={{ marginTop: 12 }}>
                <label className={styles.label}>Condition note</label>
                <textarea
                  className={styles.textarea}
                  style={{ minHeight: 70 }}
                  placeholder="Describe any wear, missing parts or packaging damage"
                  value={form.condition_note}
                  onChange={set("condition_note")}
                />
              </div>
            )}
            <div className={styles.choice} style={{ marginTop: 12 }}>
              {(["ACTIVE", "INACTIVE"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`${styles.choiceCard} ${form.status === s ? styles.choiceOn : ""}`}
                  onClick={() => setForm({ ...form, status: s })}
                >
                  <strong>{s === "ACTIVE" ? "Active" : "Paused"}</strong>
                  <span>{s === "ACTIVE" ? "Buyers can order this offer" : "Hidden from buyers"}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className={styles.toolbar} style={{ borderTop: "1px solid var(--line)", borderBottom: "none", justifyContent: "flex-end" }}>
          <button type="button" className={styles.btn} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={styles.btnPrimary} disabled={!dirty || saving} onClick={save}>
            {saving && <Loader2 size={15} className={styles.spin} />} Save changes
          </button>
        </div>
      </aside>
    </>
  );
}
