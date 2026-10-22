"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Package, Search, X } from "lucide-react";
import Select from "@/components/ui/Select";
import {
  ApiError,
  CommerceChannel,
  createOffer,
  fetchProductDetail,
  searchCatalog,
} from "@/services/addProductService";
import styles from "./createListing.module.css";

interface PickedProduct {
  asin: string;
  title: string;
  brand: string | null;
  image: string | null;
}

interface CreateListingModalProps {
  /** Open with this catalog product already chosen (e.g. coming from the catalog page). */
  initialAsin?: string | null;
  onClose: () => void;
  onCreated: (sku: string, title: string) => void;
}

const CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "REFURBISHED_GOOD", label: "Refurbished" },
  { value: "USED_GOOD", label: "Used – good" },
];

const CHANNELS: { value: CommerceChannel; title: string; text: string }[] = [
  { value: "BAZAAR", title: "Bazaar (Pan-India)", text: "Courier / freight shipping across India." },
  { value: "QUICK_COMMERCE", title: "Quick Commerce", text: "Hyperlocal delivery within 8–10 km." },
  { value: "BOTH", title: "Both (Hybrid)", text: "Express for local + Pan-India for others." },
];

/** A seller's offer on a catalog ASIN: price, stock, SKU, delivery and selling channel. */
export default function CreateListingModal({ initialAsin, onClose, onCreated }: CreateListingModalProps) {
  const [product, setProduct] = useState<PickedProduct | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(!!initialAsin);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickedProduct[]>([]);
  const [searching, setSearching] = useState(false);

  const [offer, setOffer] = useState({ sku: "", condition: "NEW", mrp: "", price: "", stock: "", handlingDays: "2", maxOrderQty: "" });
  const [channel, setChannel] = useState<CommerceChannel | null>(null);
  const [fulfillment, setFulfillment] = useState<"FBM" | "FBA">("FBM");
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!initialAsin) return;
    let cancelled = false;
    fetchProductDetail(initialAsin)
      .then((p) => {
        if (cancelled) return;
        if (p.is_parent) {
          setProductError("That is a parent product. Pick the exact variant you want to sell.");
          return;
        }
        const image = [...p.images].sort((a, b) => a.sort_order - b.sort_order)[0]?.image_url ?? null;
        setProduct({ asin: p.asin, title: p.title, brand: p.brand?.name ?? null, image });
      })
      .catch((err) => !cancelled && setProductError(err instanceof ApiError ? err.messages[0] : "Couldn't load that product."))
      .finally(() => !cancelled && setLoadingInitial(false));
    return () => {
      cancelled = true;
    };
  }, [initialAsin]);

  useEffect(() => {
    if (product || query.trim().length < 2) return;
    let cancelled = false;
    const t = setTimeout(() => {
      setSearching(true);
      searchCatalog({ search: query })
        .then((data) => {
          if (cancelled) return;
          // Parent ASINs aren't sellable; the seller picks the exact variant.
          setResults(
            data.results
              .filter((r) => !r.is_parent)
              .map((r) => ({ asin: r.asin, title: r.title, brand: r.brand?.name ?? null, image: r.primary_image }))
          );
        })
        .catch(() => !cancelled && setResults([]))
        .finally(() => !cancelled && setSearching(false));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, product]);

  const set = (key: keyof typeof offer) => (e: { target: { value: string } }) => setOffer({ ...offer, [key]: e.target.value });

  const errors: Record<string, string> = {};
  if (!product) errors.product = "Choose a catalog product";
  if (!offer.sku.trim()) errors.sku = "Enter your SKU";
  if (!(Number(offer.mrp) > 0)) errors.mrp = "Enter MRP";
  if (!(Number(offer.price) > 0)) errors.price = "Enter selling price";
  else if (Number(offer.mrp) > 0 && Number(offer.price) > Number(offer.mrp)) errors.price = "Can't exceed MRP";
  if (offer.stock === "" || !Number.isInteger(Number(offer.stock)) || Number(offer.stock) < 0) errors.stock = "Enter stock";
  if (!channel) errors.channel = "Choose a selling channel";
  const shown = showErrors ? errors : {};

  async function submit() {
    setShowErrors(true);
    setSubmitErrors([]);
    if (Object.keys(errors).length || !product || !channel) return;
    setSubmitting(true);
    try {
      const sameAsMrp = Number(offer.price) === Number(offer.mrp);
      const created = await createOffer(product.asin, {
        seller_sku: offer.sku.trim(),
        condition: offer.condition,
        fulfillment_channel: fulfillment,
        commerce_channel: channel,
        handling_time_days: Number(offer.handlingDays),
        max_order_quantity: offer.maxOrderQty ? Number(offer.maxOrderQty) : null,
        standard_price: offer.mrp,
        // The listing API wants the sale price strictly below MRP, so drop it when they match.
        sale_price: sameAsMrp ? null : offer.price,
        initial_stock: Number(offer.stock),
      });
      onCreated(created.seller_sku, product.title);
    } catch (err) {
      setSubmitErrors(err instanceof ApiError ? err.messages : ["Something went wrong. Please try again."]);
    } finally {
      setSubmitting(false);
    }
  }

  const input = (key: keyof typeof offer, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input className={`${styles.input} ${shown[key] ? styles.invalid : ""}`} value={offer[key]} onChange={set(key)} {...props} />
  );

  return (
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-label="Create listing">
        <div className={styles.head}>
          <div>
            <h2>Create listing</h2>
            <p>Your offer on a catalog product: price, stock and delivery.</p>
          </div>
          <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          {submitErrors.length > 0 && (
            <div className={styles.alert}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>{submitErrors.length === 1 ? submitErrors[0] : <ul>{submitErrors.map((m) => <li key={m}>{m}</li>)}</ul>}</div>
            </div>
          )}

          <section>
            <div className={styles.label}>
              Catalog product <span className={styles.req}>*</span>
            </div>
            {loadingInitial ? (
              <div className={styles.hint}>
                <Loader2 size={14} className={styles.spin} /> Loading product…
              </div>
            ) : product ? (
              <div className={styles.picked}>
                <span className={styles.thumb} style={product.image ? { backgroundImage: `url(${product.image})` } : undefined}>
                  {!product.image && <Package size={18} />}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className={styles.productTitle}>{product.title}</div>
                  <div className={styles.hint}>
                    ASIN <span className={styles.mono}>{product.asin}</span>
                    {product.brand && ` · ${product.brand}`}
                  </div>
                </div>
                <button type="button" className={styles.linkBtn} onClick={() => setProduct(null)}>
                  Change
                </button>
              </div>
            ) : (
              <>
                {productError && <div className={styles.fieldError} style={{ marginBottom: 8 }}>{productError}</div>}
                <div className={styles.search}>
                  <Search size={16} />
                  <input
                    className={`${styles.input} ${shown.product ? styles.invalid : ""}`}
                    placeholder="Search by ASIN, product name or model number"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                {query.trim().length >= 2 && (
                  <div className={styles.results}>
                    {searching && results.length === 0 ? (
                      <div className={styles.hint} style={{ padding: 12 }}>
                        <Loader2 size={14} className={styles.spin} /> Searching…
                      </div>
                    ) : results.length === 0 ? (
                      <div className={styles.hint} style={{ padding: 12 }}>No catalog product matches “{query.trim()}”.</div>
                    ) : (
                      results.map((r) => (
                        <button key={r.asin} type="button" className={styles.result} onClick={() => setProduct(r)}>
                          <span className={styles.thumb} style={r.image ? { backgroundImage: `url(${r.image})` } : undefined}>
                            {!r.image && <Package size={16} />}
                          </span>
                          <span style={{ minWidth: 0 }}>
                            <span className={styles.productTitle}>{r.title}</span>
                            <span className={styles.hint}>
                              {r.asin}
                              {r.brand && ` · ${r.brand}`}
                            </span>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
                {shown.product && <div className={styles.fieldError}>{shown.product}</div>}
              </>
            )}
          </section>

          <section className={styles.grid3}>
            <div className={styles.field}>
              <label className={styles.label}>
                Seller SKU <span className={styles.req}>*</span>
              </label>
              {input("sku", { placeholder: "Your internal code" })}
              {shown.sku && <span className={styles.fieldError}>{shown.sku}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Condition</label>
              <Select value={offer.condition} onChange={set("condition")} className={styles.input}>
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>
                Stock <span className={styles.req}>*</span>
              </label>
              {input("stock", { type: "number", min: 0 })}
              {shown.stock && <span className={styles.fieldError}>{shown.stock}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>
                MRP (₹) <span className={styles.req}>*</span>
              </label>
              {input("mrp", { type: "number", min: 0 })}
              {shown.mrp && <span className={styles.fieldError}>{shown.mrp}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>
                Selling price (₹) <span className={styles.req}>*</span>
              </label>
              {input("price", { type: "number", min: 0 })}
              {shown.price && <span className={styles.fieldError}>{shown.price}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Max quantity per order</label>
              {input("maxOrderQty", { type: "number", min: 1, placeholder: "No limit" })}
            </div>
          </section>

          <section>
            <div className={styles.label}>
              Selling channel <span className={styles.req}>*</span>
            </div>
            <div className={styles.cards3}>
              {CHANNELS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`${styles.card} ${channel === c.value ? styles.cardOn : ""} ${shown.channel ? styles.invalid : ""}`}
                  onClick={() => setChannel(c.value)}
                >
                  <strong>{c.title}</strong>
                  <span>{c.text}</span>
                </button>
              ))}
            </div>
            {shown.channel && <div className={styles.fieldError}>{shown.channel}</div>}
          </section>

          <section className={styles.deliveryRow}>
            <div>
              <div className={styles.label}>Fulfilment</div>
              <div className={styles.cards2}>
                <button
                  type="button"
                  className={`${styles.card} ${fulfillment === "FBM" ? styles.cardOn : ""}`}
                  onClick={() => setFulfillment("FBM")}
                >
                  <strong>Self ship</strong>
                  <span>Your vehicles or courier.</span>
                </button>
                <button
                  type="button"
                  className={`${styles.card} ${fulfillment === "FBA" ? styles.cardOn : ""}`}
                  onClick={() => setFulfillment("FBA")}
                >
                  <strong>Makaano fulfilled</strong>
                  <span>We pick up and deliver.</span>
                </button>
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Dispatch within</label>
              <Select value={offer.handlingDays} onChange={set("handlingDays")} className={styles.input}>
                {[1, 2, 3, 5, 7].map((d) => (
                  <option key={d} value={d}>
                    {d} {d === 1 ? "day" : "days"}
                  </option>
                ))}
              </Select>
            </div>
          </section>
        </div>

        <div className={styles.foot}>
          <button type="button" className={styles.btn} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={styles.btnPrimary} onClick={submit} disabled={submitting}>
            {submitting && <Loader2 size={15} className={styles.spin} />}
            {submitting ? "Creating…" : "Create listing"}
          </button>
        </div>
      </div>
    </div>
  );
}
