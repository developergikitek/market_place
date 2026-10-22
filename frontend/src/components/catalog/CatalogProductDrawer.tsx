"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Loader2, Package, Pencil, X } from "lucide-react";
import Select from "@/components/ui/Select";
import styles from "@/components/ui/sellerPage.module.css";
import { ApiError } from "@/services/addProductService";
import {
  CatalogProductDetail,
  CatalogProductPatch,
  fetchCatalogProduct,
  updateCatalogProduct,
} from "@/services/sellerCatalogService";

interface CatalogProductDrawerProps {
  asin: string;
  onClose: () => void;
  onSaved: (product: CatalogProductDetail) => void;
}

const GST_RATES = ["0", "5", "18", "40"];
const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  ACTIVE: { bg: "#dcfce7", fg: "#166534" },
  DISCONTINUED: { bg: "#f1f5f9", fg: "#475569" },
  SUPPRESSED: { bg: "#fee2e2", fg: "#991b1b" },
  PENDING_APPROVAL: { bg: "#fef3c7", fg: "#92400e" },
  DRAFT: { bg: "#e0e7ff", fg: "#3730a3" },
};

const inches = (v: string | null) => (v ? `${(Number(v) * 2.54).toFixed(1)} cm` : null);

function editFormFrom(p: CatalogProductDetail) {
  return {
    title: p.title,
    description: p.description,
    bullets: [...p.bullet_points, "", "", "", "", ""].slice(0, 5),
    model_number: p.model_number ?? "",
    part_number: p.part_number ?? "",
    hsn_code: p.hsn_code ?? "",
    gst_rate_percent: p.gst_rate_percent ? String(Number(p.gst_rate_percent)) : "18",
    country_of_origin: p.country_of_origin ?? "",
    manufacturer_details: p.manufacturer_details ?? "",
    status: (p.status === "DISCONTINUED" ? "DISCONTINUED" : "ACTIVE") as "ACTIVE" | "DISCONTINUED",
  };
}

/** Catalog page of one ASIN: what buyers see, plus editing the catalog fields a seller may change. */
export default function CatalogProductDrawer({ asin, onClose, onSaved }: CatalogProductDrawerProps) {
  const [product, setProduct] = useState<CatalogProductDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [editing, setEditing] = useState<ReturnType<typeof editFormFrom> | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchCatalogProduct(asin)
      .then((p) => !cancelled && setProduct(p))
      .catch((err) => !cancelled && setLoadError(err instanceof ApiError ? err.messages[0] : "Couldn't load this product."));
    return () => {
      cancelled = true;
    };
  }, [asin]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save() {
    if (!product || !editing) return;
    const before = editFormFrom(product);
    const patch: CatalogProductPatch = {};
    (["title", "description", "model_number", "part_number", "hsn_code", "gst_rate_percent", "country_of_origin", "manufacturer_details", "status"] as const).forEach(
      (k) => {
        if (editing[k] !== before[k]) (patch as Record<string, unknown>)[k] = typeof editing[k] === "string" ? editing[k].trim() : editing[k];
      }
    );
    if (JSON.stringify(editing.bullets) !== JSON.stringify(before.bullets)) patch.bullet_points = editing.bullets;
    if (!Object.keys(patch).length) {
      setEditing(null);
      return;
    }
    setSaving(true);
    setErrors([]);
    try {
      const updated = await updateCatalogProduct(product.asin, patch);
      setProduct(updated);
      setEditing(null);
      onSaved(updated);
    } catch (err) {
      setErrors(err instanceof ApiError ? err.messages : ["Something went wrong. Please try again."]);
    } finally {
      setSaving(false);
    }
  }

  const tone = product ? STATUS_TONE[product.status] ?? STATUS_TONE.DRAFT : STATUS_TONE.ACTIVE;
  const images = product ? [...product.images].sort((a, b) => a.sort_order - b.sort_order) : [];
  const specs = product?.attributes.filter((a) => a.attribute_code !== "brand") ?? [];
  const dims = product
    ? [inches(product.package_length_inches), inches(product.package_width_inches), inches(product.package_height_inches)].filter(Boolean)
    : [];
  const set = (k: keyof ReturnType<typeof editFormFrom>) => (e: { target: { value: string } }) =>
    editing && setEditing({ ...editing, [k]: e.target.value });

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <aside className={styles.drawer} style={{ width: "min(640px, 100vw)" }} role="dialog" aria-label={`Catalog product ${asin}`}>
        <div className={styles.drawerHead}>
          <div style={{ minWidth: 0 }}>
            <h2>{asin}</h2>
            {product && (
              <div className={styles.sub} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                <span className={styles.pill} style={{ background: tone.bg, color: tone.fg }}>
                  {product.status_display}
                </span>
                {product.is_parent ? `Parent of ${product.variants_count} variants` : product.parent ? `Variant of ${product.parent.asin}` : "Standalone product"}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {product && !editing && (
              <button type="button" className={`${styles.btn} ${styles.sm}`} onClick={() => setEditing(editFormFrom(product))}>
                <Pencil size={14} /> Edit
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
          ) : !product ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className={styles.skeleton} style={{ height: 220 }} />
              <div className={styles.skeleton} style={{ width: "70%" }} />
              <div className={styles.skeleton} style={{ width: "40%" }} />
            </div>
          ) : editing ? (
            <>
              {errors.length > 0 && (
                <div className={styles.alert}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>{errors.length === 1 ? errors[0] : <ul>{errors.map((m) => <li key={m}>{m}</li>)}</ul>}</div>
                </div>
              )}
              <div className={styles.field}>
                <label className={styles.label}>Product name</label>
                <input className={styles.input} maxLength={500} value={editing.title} onChange={set("title")} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Key features</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {editing.bullets.map((b, i) => (
                    <input
                      key={i}
                      className={styles.input}
                      placeholder={`Feature ${i + 1}`}
                      value={b}
                      onChange={(e) => setEditing({ ...editing, bullets: editing.bullets.map((x, j) => (j === i ? e.target.value : x)) })}
                    />
                  ))}
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea className={styles.textarea} style={{ minHeight: 120 }} value={editing.description} onChange={set("description")} />
              </div>
              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label className={styles.label}>Model number</label>
                  <input className={styles.input} value={editing.model_number} onChange={set("model_number")} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Part number</label>
                  <input className={styles.input} value={editing.part_number} onChange={set("part_number")} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>HSN code</label>
                  <input className={styles.input} inputMode="numeric" value={editing.hsn_code} onChange={set("hsn_code")} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>GST rate</label>
                  <Select value={editing.gst_rate_percent} onChange={set("gst_rate_percent")} className={styles.input}>
                    {GST_RATES.map((r) => (
                      <option key={r} value={r}>{r}%</option>
                    ))}
                  </Select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Country of origin</label>
                  <input className={styles.input} value={editing.country_of_origin} onChange={set("country_of_origin")} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Manufacturer</label>
                  <input className={styles.input} value={editing.manufacturer_details} onChange={set("manufacturer_details")} />
                </div>
              </div>
              <div className={styles.choice}>
                {(["ACTIVE", "DISCONTINUED"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`${styles.choiceCard} ${editing.status === s ? styles.choiceOn : ""}`}
                    onClick={() => setEditing({ ...editing, status: s })}
                  >
                    <strong>{s === "ACTIVE" ? "Active" : "Discontinued"}</strong>
                    <span>{s === "ACTIVE" ? "Buyers can find this product" : "No longer made or sold"}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div>
                <div
                  className={styles.thumb}
                  style={{
                    width: "100%",
                    height: 240,
                    flex: "none",
                    borderRadius: 12,
                    backgroundSize: "contain",
                    backgroundColor: "#f8fafc",
                    ...(images[activeImage] ? { backgroundImage: `url(${images[activeImage].image_url})` } : {}),
                  }}
                >
                  {!images.length && (
                    <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, fontSize: 13 }}>
                      <Package size={28} /> No photos yet
                    </span>
                  )}
                </div>
                {images.length > 1 && (
                  <div className={styles.evidence}>
                    {images.map((img, i) => (
                      <a
                        key={img.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setActiveImage(i)}
                        onKeyDown={(e) => e.key === "Enter" && setActiveImage(i)}
                        style={{ backgroundImage: `url(${img.image_url})`, borderColor: i === activeImage ? "#c2410c" : undefined, cursor: "pointer" }}
                        aria-label={`Photo ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className={styles.sub}>{product.category.path}</div>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4, lineHeight: 1.35 }}>{product.title}</div>
              </div>

              <section className={styles.section}>
                <h3>Identity</h3>
                <dl className={styles.facts}>
                  <div><dt>Brand</dt><dd>{product.brand?.name ?? "Unbranded"}</dd></div>
                  <div><dt>Model number</dt><dd>{product.model_number || "—"}</dd></div>
                  <div><dt>Part number</dt><dd>{product.part_number || "—"}</dd></div>
                  <div><dt>Barcode</dt><dd>{product.ean || product.upc || product.gtin || "—"}</dd></div>
                </dl>
              </section>

              {specs.length > 0 && (
                <section className={styles.section}>
                  <h3>Specifications</h3>
                  <dl className={styles.facts}>
                    {specs.map((a) => (
                      <div key={a.id}>
                        <dt>{a.attribute_label}</dt>
                        <dd>{a.value}{a.unit_of_measure ? ` ${a.unit_of_measure}` : ""}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              {product.variants.length > 0 && (
                <section className={styles.section}>
                  <h3>Variants · {product.variants.length}</h3>
                  <div className={styles.ledger}>
                    {product.variants.map((v) => (
                      <div key={v.asin} style={{ fontWeight: 500, background: "#fff" }}>
                        <span>{v.options.join(" / ") || v.title}</span>
                        <span className={styles.rma}>{v.asin}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {(product.bullet_points.length > 0 || product.description) && (
                <section className={styles.section}>
                  <h3>Description</h3>
                  {product.bullet_points.length > 0 && (
                    <ul style={{ margin: "0 0 10px", paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6 }}>
                      {product.bullet_points.map((b) => <li key={b}>{b}</li>)}
                    </ul>
                  )}
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "#334155", whiteSpace: "pre-line" }}>{product.description}</p>
                </section>
              )}

              <section className={styles.section}>
                <h3>Tax & shipping</h3>
                <dl className={styles.facts}>
                  <div><dt>HSN code</dt><dd>{product.hsn_code || "—"}</dd></div>
                  <div><dt>GST</dt><dd>{product.gst_rate_percent ? `${Number(product.gst_rate_percent)}%` : "—"}</dd></div>
                  <div><dt>Country of origin</dt><dd>{product.country_of_origin || "—"}</dd></div>
                  <div><dt>Hazardous</dt><dd>{product.is_hazmat ? product.hazmat_details || "Yes" : "No"}</dd></div>
                  <div><dt>Package</dt><dd>{dims.length ? dims.join(" × ") : "—"}</dd></div>
                  <div>
                    <dt>Weight</dt>
                    <dd>{product.package_weight_pounds ? `${(Number(product.package_weight_pounds) / 2.20462).toFixed(1)} kg` : "—"}</dd>
                  </div>
                </dl>
              </section>
            </>
          )}
        </div>

        {product && (
          <div className={styles.toolbar} style={{ borderTop: "1px solid var(--line)", borderBottom: "none", justifyContent: "flex-end" }}>
            {editing ? (
              <>
                <button type="button" className={styles.btn} onClick={() => setEditing(null)}>
                  Cancel
                </button>
                <button type="button" className={styles.btnPrimary} disabled={saving} onClick={save}>
                  {saving && <Loader2 size={15} className={styles.spin} />} Save changes
                </button>
              </>
            ) : product.is_parent ? (
              <span className={styles.hint}>Listings are created on a specific variant.</span>
            ) : (
              <Link
                href={product.listed_by_me ? "/pricing" : `/pricing?create_listing=${encodeURIComponent(product.asin)}`}
                className={styles.btnPrimary}
              >
                {product.listed_by_me ? "View your listing in Pricing" : "Create listing in Pricing"} <ArrowRight size={15} />
              </Link>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
