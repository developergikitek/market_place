"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, ChevronRight, Loader2, Store } from "lucide-react";
import { ApiError, ProductDetail, fetchProductDetail } from "@/services/addProductService";
import ProductThumb from "./ProductThumb";
import styles from "./addProduct.module.css";

interface ProductDetailPanelProps {
  asin: string;
  onBack: () => void;
}

/** Read-only catalog view of an existing ASIN; selling it is done by creating a listing from Pricing. */
export default function ProductDetailPanel({ asin, onBack }: ProductDetailPanelProps) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchProductDetail(asin)
      .then((p) => !cancelled && setProduct(p))
      .catch((err) => !cancelled && setError(err instanceof ApiError ? err.messages[0] : "Couldn't load this product."));
    return () => {
      cancelled = true;
    };
  }, [asin]);

  if (error) {
    return (
      <div className={`${styles.alert} ${styles.alertError}`}>
        <AlertCircle size={16} /> {error}
      </div>
    );
  }
  if (!product) {
    return (
      <div className={styles.loading}>
        <Loader2 size={18} className={styles.spin} /> Loading product…
      </div>
    );
  }

  const images = [...product.images].sort((a, b) => a.sort_order - b.sort_order);
  const specs = product.attributes.filter((a) => a.attribute_code !== "brand");
  const facts = [
    ["ASIN", product.asin],
    ["Brand", product.brand?.name],
    ["Model number", product.model_number],
    ["HSN code", product.hsn_code],
    ["GST", product.gst_rate_percent ? `${Number(product.gst_rate_percent)}%` : null],
    ["Country of origin", product.country_of_origin],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <>
      <div className={styles.card}>
        <div className={styles.detailLayout}>
          <div>
            <div className={styles.detailImage}>
              {images[activeImage] ? (
                // eslint-disable-next-line @next/next/no-img-element -- catalog images come from arbitrary hosts
                <img src={images[activeImage].image_url} alt={product.title} />
              ) : (
                <ProductThumb src={null} size={40} />
              )}
            </div>
            {images.length > 1 && (
              <div className={styles.detailThumbs}>
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    className={`${styles.detailThumb} ${i === activeImage ? styles.detailThumbOn : ""}`}
                    style={{ backgroundImage: `url(${img.image_url})` }}
                    onClick={() => setActiveImage(i)}
                    aria-label={`Photo ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            {product.breadcrumbs.length > 0 && (
              <div className={styles.breadcrumb} style={{ marginBottom: 8 }}>
                {product.breadcrumbs.map((c, i) => (
                  <span key={c.id} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {i === product.breadcrumbs.length - 1 ? <strong>{c.name}</strong> : c.name}
                    {i < product.breadcrumbs.length - 1 && <ChevronRight size={12} />}
                  </span>
                ))}
              </div>
            )}
            <h2 className={styles.detailTitle}>{product.title}</h2>
            <p className={styles.hint} style={{ marginTop: 6 }}>
              {product.offers_count > 0
                ? `${product.offers_count} seller${product.offers_count > 1 ? "s" : ""} already sell this product`
                : "No seller is selling this product yet"}
            </p>

            <dl className={styles.detailFacts}>
              {facts.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd className={label === "ASIN" ? styles.mono : undefined}>{value}</dd>
                </div>
              ))}
            </dl>

            {product.bullet_points.length > 0 && (
              <ul className={styles.detailBullets}>
                {product.bullet_points.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {specs.length > 0 && (
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <h2>Specifications</h2>
            </div>
          </div>
          <dl className={styles.detailFacts} style={{ marginTop: 0 }}>
            {specs.map((a) => (
              <div key={a.id}>
                <dt>{a.attribute_label}</dt>
                <dd>
                  {a.value}
                  {a.unit_of_measure ? ` ${a.unit_of_measure}` : ""}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {product.description && (
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <h2>Description</h2>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--ink-2)", whiteSpace: "pre-line" }}>
            {product.description}
          </p>
        </section>
      )}

      <div className={styles.actionBar}>
        <div className={styles.actionBarInner}>
          <span className={styles.actionBarInfo} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Store size={15} /> To sell it, create a listing with your price from Pricing.
          </span>
          <div className={styles.actionBarButtons}>
            <button type="button" className={styles.btnSecondary} onClick={onBack}>
              Back to search
            </button>
            <Link href={`/pricing?create_listing=${encodeURIComponent(product.asin)}`} className={styles.btnPrimary}>
              Create listing in Pricing <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
