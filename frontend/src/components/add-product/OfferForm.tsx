"use client";

import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { ApiError, CatalogSearchResult, CommerceChannel, createOffer } from "@/services/addProductService";
import ProductThumb from "./ProductThumb";
import styles from "./addProduct.module.css";
import Select from "@/components/ui/Select";

const CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "REFURBISHED_GOOD", label: "Refurbished" },
  { value: "USED_GOOD", label: "Used – good" },
];

interface OfferFormProps {
  product: CatalogSearchResult;
  onBack: () => void;
  onCreated: (sku: string) => void;
}

export default function OfferForm({ product, onBack, onCreated }: OfferFormProps) {
  const [offer, setOffer] = useState({
    sku: "",
    condition: "NEW",
    mrp: "",
    price: "",
    stock: "",
    handlingDays: "2",
    maxOrderQty: "",
  });
  const [fulfillment, setFulfillment] = useState<"SELLER_FULFILLED" | "MAKAANO_FULFILLED">("SELLER_FULFILLED");
  const [commerceChannel, setCommerceChannel] = useState<CommerceChannel | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);

  const set = (key: keyof typeof offer) => (e: { target: { value: string } }) =>
    setOffer({ ...offer, [key]: e.target.value });

  const errors: Record<string, string> = {};
  if (!offer.sku.trim()) errors.sku = "Enter your SKU";
  if (!(Number(offer.mrp) > 0)) errors.mrp = "Enter MRP";
  if (!(Number(offer.price) > 0)) errors.price = "Enter selling price";
  else if (Number(offer.mrp) > 0 && Number(offer.price) > Number(offer.mrp)) errors.price = "Can't exceed MRP";
  if (offer.stock === "" || !Number.isInteger(Number(offer.stock)) || Number(offer.stock) < 0) errors.stock = "Enter stock";
  if (!commerceChannel) errors.channel = "Choose a selling channel";
  const shown = showErrors ? errors : {};

  async function handleSubmit() {
    setShowErrors(true);
    setSubmitErrors([]);
    if (Object.keys(errors).length || !commerceChannel) return;
    setSubmitting(true);
    try {
      const sameAsMrp = Number(offer.price) === Number(offer.mrp);
      const created = await createOffer(product.asin, {
        seller_sku: offer.sku.trim(),
        condition: offer.condition,
        fulfillment_channel: fulfillment,
        commerce_channel: commerceChannel,
        handling_time_days: Number(offer.handlingDays),
        max_order_quantity: offer.maxOrderQty ? Number(offer.maxOrderQty) : null,
        standard_price: offer.mrp,
        // Backend requires sale price strictly below MRP, so omit it when they match.
        sale_price: sameAsMrp ? null : offer.price,
        initial_stock: Number(offer.stock),
      });
      onCreated(created.seller_sku);
    } catch (err) {
      setSubmitErrors(err instanceof ApiError ? err.messages : ["Something went wrong. Please try again."]);
    } finally {
      setSubmitting(false);
    }
  }

  const input = (key: keyof typeof offer, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input
      className={`${styles.input} ${shown[key] ? styles.invalid : ""}`}
      value={offer[key]}
      onChange={set(key)}
      {...props}
    />
  );

  return (
    <>
      <div className={styles.card}>
        <div className={styles.selectedProduct}>
          <ProductThumb src={product.primary_image} size={28} />
          <div style={{ minWidth: 0 }}>
            <div className={styles.resultTitle}>{product.title}</div>
            <div className={styles.resultMeta}>
              <span>
                ASIN <span className={styles.mono}>{product.asin}</span>
              </span>
              {product.brand && <span>{product.brand.name}</span>}
              {product.category && <span>{product.category.name}</span>}
            </div>
          </div>
          <button type="button" className={styles.linkBtn} onClick={onBack}>
            Choose another
          </button>
        </div>
      </div>

      {submitErrors.length > 0 && (
        <div className={`${styles.alert} ${styles.alertError}`}>
          <AlertCircle size={16} />
          <div>
            <strong>We couldn&apos;t create your offer.</strong>
            <ul>
              {submitErrors.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <div>
            <h2>Your offer</h2>
            <p>Product details come from the catalog. You only set your own price, stock and delivery.</p>
          </div>
        </div>
        <div className={styles.grid3}>
          <div className={styles.field}>
            <label className={styles.label}>
              Seller SKU <span className={styles.req}>*</span>
            </label>
            {input("sku", { placeholder: "Your internal code" })}
            {shown.sku && <span className={styles.error}>{shown.sku}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Condition</label>
            <Select className={styles.select} value={offer.condition} onChange={set("condition")}>
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              Stock <span className={styles.req}>*</span>
            </label>
            {input("stock", { type: "number", min: 0 })}
            {shown.stock && <span className={styles.error}>{shown.stock}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              MRP (₹) <span className={styles.req}>*</span>
            </label>
            {input("mrp", { type: "number", min: 0 })}
            {shown.mrp && <span className={styles.error}>{shown.mrp}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              Selling price (₹) <span className={styles.req}>*</span>
            </label>
            {input("price", { type: "number", min: 0 })}
            {shown.price && <span className={styles.error}>{shown.price}</span>}
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Max quantity per order</label>
            {input("maxOrderQty", { type: "number", min: 1, placeholder: "No limit" })}
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <div>
            <h2>Delivery & Channels</h2>
          </div>
        </div>
        <span className={styles.label} style={{ marginBottom: 10, display: "block" }}>
          Selling channel <span className={styles.req}>*</span>
        </span>
        <div className={styles.channelCards} style={{ marginBottom: shown.channel ? 16 : 18 }}>
          <button
            type="button"
            className={`${styles.radioCard} ${commerceChannel === "BAZAAR" ? styles.radioCardOn : ""} ${shown.channel ? styles.invalid : ""}`}
            onClick={() => setCommerceChannel("BAZAAR")}
          >
            <strong>Bazaar (Pan-India)</strong>
            <span>Standard courier / freight shipping across India.</span>
          </button>
          <button
            type="button"
            className={`${styles.radioCard} ${commerceChannel === "QUICK_COMMERCE" ? styles.radioCardOn : ""} ${shown.channel ? styles.invalid : ""}`}
            onClick={() => setCommerceChannel("QUICK_COMMERCE")}
          >
            <strong>Quick Commerce</strong>
            <span>Hyperlocal delivery within 8–10 km radius.</span>
          </button>
          <button
            type="button"
            className={`${styles.radioCard} ${commerceChannel === "BOTH" ? styles.radioCardOn : ""} ${shown.channel ? styles.invalid : ""}`}
            onClick={() => setCommerceChannel("BOTH")}
          >
            <strong>Both (Hybrid)</strong>
            <span>Express for local + Pan-India for other buyers.</span>
          </button>
        </div>
        {shown.channel && (
          <span className={styles.error} style={{ display: "block", marginTop: -10, marginBottom: 18 }}>
            {shown.channel}
          </span>
        )}
        <span className={styles.label} style={{ marginBottom: 10, display: "block" }}>
          Fulfilment
        </span>
        <div className={styles.radioCards}>
          <button
            type="button"
            className={`${styles.radioCard} ${fulfillment === "SELLER_FULFILLED" ? styles.radioCardOn : ""}`}
            onClick={() => setFulfillment("SELLER_FULFILLED")}
          >
            <strong>Self ship (Seller Fulfilled)</strong>
            <span>You deliver with your own vehicles or courier.</span>
          </button>
          <button
            type="button"
            className={`${styles.radioCard} ${fulfillment === "MAKAANO_FULFILLED" ? styles.radioCardOn : ""}`}
            onClick={() => setFulfillment("MAKAANO_FULFILLED")}
          >
            <strong>Makaano fulfilled</strong>
            <span>Makaano picks up and delivers to the buyer.</span>
          </button>
        </div>
        <div className={styles.field} style={{ marginTop: 16, maxWidth: 260 }}>
          <label className={styles.label}>Dispatch within</label>
          <Select className={styles.select} value={offer.handlingDays} onChange={set("handlingDays")}>
            {[1, 2, 3, 5, 7].map((d) => (
              <option key={d} value={d}>
                {d} {d === 1 ? "day" : "days"}
              </option>
            ))}
          </Select>
        </div>
      </section>

      <div className={styles.actionBar}>
        <div className={styles.actionBarInner}>
          <span className={styles.actionBarInfo}>Your offer competes with other sellers on this ASIN.</span>
          <div className={styles.actionBarButtons}>
            <button type="button" className={styles.btnSecondary} onClick={onBack}>
              Back
            </button>
            <button type="button" className={styles.btnPrimary} onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 size={16} className={styles.spin} />}
              {submitting ? "Saving…" : "Start selling"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
