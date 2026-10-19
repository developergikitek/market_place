"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, ChevronRight, Loader2 } from "lucide-react";
import {
  ApiError,
  AttributeValueInput,
  CategoryAttribute,
  CategoryNode,
  CreateProductRequest,
  CreateProductResponse,
  createProduct,
  fetchCategoryAttributes,
  searchBrands,
} from "@/services/addProductService";
import AttributeField, { AttributeValue } from "./AttributeField";
import ImageUploader, { UploadedImage } from "./ImageUploader";
import SearchSelect, { SearchSelectOption } from "./SearchSelect";
import VariationBuilder, { EMPTY_ROW, VariantRow, buildCombos } from "./VariationBuilder";
import styles from "./addProduct.module.css";

// Rates after the Sept 2025 GST rationalisation; cement, tiles, sanitaryware etc. sit at 18%.
const GST_RATES = ["0", "5", "18", "40"];
const BULLET_COUNT = 5;
const OTHERS = "others";

type SectionId = "identity" | "specs" | "pricing" | "images" | "description" | "tax" | "shipping";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "identity", label: "Product name & brand" },
  { id: "specs", label: "Specifications" },
  { id: "pricing", label: "Variations, price & stock" },
  { id: "images", label: "Photos" },
  { id: "description", label: "Description" },
  { id: "tax", label: "GST & compliance" },
  { id: "shipping", label: "Package & shipping" },
];

function sectionOf(errorKey: string): SectionId {
  if (["title", "brand", "brandName"].includes(errorKey)) return "identity";
  if (errorKey.startsWith("attr:")) return "specs";
  if (errorKey.startsWith("var") || errorKey.startsWith("single:")) return "pricing";
  if (errorKey === "images") return "images";
  if (errorKey === "description") return "description";
  if (errorKey.startsWith("ship:")) return "shipping";
  return "tax";
}

const toFixed2 = (n: number) => (Number.isFinite(n) && n > 0 ? n.toFixed(2) : null);

function validatePrice(mrp: string, price: string, stock: string, prefix: string, errors: Record<string, string>) {
  const mrpNum = Number(mrp);
  const priceNum = Number(price);
  if (!mrp || mrpNum <= 0) errors[`${prefix}mrp`] = "Enter MRP";
  if (!price || priceNum <= 0) errors[`${prefix}price`] = "Enter selling price";
  else if (mrpNum > 0 && priceNum > mrpNum) errors[`${prefix}price`] = "Can't exceed MRP";
  if (stock === "" || !Number.isInteger(Number(stock)) || Number(stock) < 0) errors[`${prefix}stock`] = "Enter stock";
}

interface NewProductFormProps {
  leaf: CategoryNode;
  path: CategoryNode[];
  onChangeCategory: () => void;
  onCreated: (result: CreateProductResponse) => void;
}

export default function NewProductForm({ leaf, path, onChangeCategory, onCreated }: NewProductFormProps) {
  const [attributes, setAttributes] = useState<CategoryAttribute[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState<SearchSelectOption | null>(null);
  const [brandName, setBrandName] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [attrValues, setAttrValues] = useState<Record<string, AttributeValue>>({});

  const [selection, setSelection] = useState<Record<string, string[]>>({});
  const [units, setUnits] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<Record<string, VariantRow>>({});
  const [single, setSingle] = useState<VariantRow>(EMPTY_ROW);
  const [fulfillment, setFulfillment] = useState<"FBM" | "FBA">("FBM");
  const [handlingDays, setHandlingDays] = useState("2");
  const [maxOrderQty, setMaxOrderQty] = useState("");

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [description, setDescription] = useState("");
  const [bullets, setBullets] = useState<string[]>(Array(BULLET_COUNT).fill(""));
  const [keywords, setKeywords] = useState("");

  const [hsn, setHsn] = useState("");
  const [gst, setGst] = useState("18");
  const [countryOfOrigin, setCountryOfOrigin] = useState("India");
  const [manufacturer, setManufacturer] = useState("");
  const [ean, setEan] = useState("");

  const [weightKg, setWeightKg] = useState("");
  const [dims, setDims] = useState({ l: "", w: "", h: "" });
  const [isHazmat, setIsHazmat] = useState(false);

  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchCategoryAttributes(leaf.id)
      .then((list) => !cancelled && setAttributes(list))
      .catch((err) => !cancelled && setLoadError(err instanceof ApiError ? err.messages[0] : "Couldn't load attributes."));
    return () => {
      cancelled = true;
    };
  }, [leaf.id]);

  const brandAttr = attributes?.find((a) => a.code === "brand");
  const variationAttrs = useMemo(
    () => (attributes ?? []).filter((a) => a.is_variation_attribute && a.code !== "brand"),
    [attributes]
  );
  const specAttrs = useMemo(
    () =>
      (attributes ?? [])
        .filter((a) => !a.is_variation_attribute && a.code !== "brand")
        .sort((a, b) => Number(b.is_required) - Number(a.is_required)),
    [attributes]
  );
  const combos = useMemo(() => buildCombos(variationAttrs, selection, units), [variationAttrs, selection, units]);
  const isMulti = combos.length > 1;

  const brandOptions = useMemo<SearchSelectOption[] | undefined>(() => {
    const opts = brandAttr?.allowed_options_json;
    if (!opts?.length) return undefined;
    return opts.map((o) =>
      typeof o === "string" ? { value: o, label: o } : { value: o.id, label: o.name }
    );
  }, [brandAttr]);

  const loadBrands = useCallback(async (query: string) => {
    const found = await searchBrands(query);
    return [...found.map((b) => ({ value: b.id, label: b.name })), { value: OTHERS, label: "Others (enter brand name)" }];
  }, []);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (title.trim().length < 10) e.title = "Enter a product name of at least 10 characters";
    if (!brand) e.brand = "Select a brand";
    else if (brand.value.toLowerCase() === OTHERS && !brandName.trim()) e.brandName = "Enter the brand name";

    for (const attr of specAttrs) {
      if (attr.is_required && !attrValues[attr.id]?.value?.trim()) e[`attr:${attr.id}`] = `${attr.label} is required`;
    }
    for (const attr of variationAttrs) {
      if (attr.is_required && !(selection[attr.id] ?? []).length) e[`variationAttr:${attr.id}`] = `Pick at least one ${attr.label.toLowerCase()}`;
    }

    if (combos.length) {
      const skus = new Map<string, number>();
      for (const combo of combos) {
        const row = { ...EMPTY_ROW, ...rows[combo.key] };
        validatePrice(row.mrp, row.price, row.stock, `var:${combo.key}:`, e);
        if (row.sku.trim()) skus.set(row.sku.trim(), (skus.get(row.sku.trim()) ?? 0) + 1);
        if (row.imageStatus === "uploading") e[`var:${combo.key}:sku`] = "Photo still uploading";
      }
      for (const combo of combos) {
        const sku = rows[combo.key]?.sku?.trim();
        if (sku && (skus.get(sku) ?? 0) > 1) e[`var:${combo.key}:sku`] = "Duplicate SKU";
      }
    } else {
      validatePrice(single.mrp, single.price, single.stock, "single:", e);
    }

    if (!images.some((img) => img.status === "done")) e.images = "Add at least one product photo";
    else if (images.some((img) => img.status === "uploading")) e.images = "Wait for photos to finish uploading";

    if (description.trim().length < 30) e.description = "Write at least 30 characters";
    if (!/^(\d{4}|\d{6}|\d{8})$/.test(hsn)) e.hsn = "Enter a 4, 6 or 8 digit HSN code";
    if (!gst) e.gst = "Select GST rate";
    if (ean && !/^\d{8,14}$/.test(ean)) e.ean = "Barcode must be 8–14 digits";
    return e;
  }, [title, brand, brandName, specAttrs, variationAttrs, attrValues, selection, combos, rows, single, images, description, hsn, gst, ean]);

  const visibleErrors = showErrors ? errors : {};
  const sectionHasError = (id: SectionId) => Object.keys(errors).some((key) => sectionOf(key) === id);

  function scrollTo(id: SectionId) {
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function buildPayload(): CreateProductRequest {
    const isOthers = brand?.value.toLowerCase() === OTHERS;
    const resolvedBrandName = isOthers ? brandName.trim() : brand?.label ?? "";
    // Plain-string brand options carry names, not Brand ids; the backend then matches or creates by name.
    const brandIsCatalogId = !isOthers && !brandAttr?.allowed_options_json?.every((o) => typeof o === "string");

    const sharedAttributes: AttributeValueInput[] = specAttrs
      .filter((attr) => attrValues[attr.id]?.value?.trim())
      .map((attr) => ({
        attribute_id: attr.id,
        value: attrValues[attr.id].value.trim(),
        unit_of_measure: attrValues[attr.id].unit ?? attr.unit_of_measure_options?.[0],
      }));
    if (brandAttr) sharedAttributes.push({ attribute_id: brandAttr.id, value: resolvedBrandName });

    const comboAttributes = (index: number): AttributeValueInput[] =>
      combos[index].values.map((v) => ({ attribute_id: v.attribute.id, value: v.value, unit_of_measure: v.unit }));

    const listingBase = {
      fulfillment_channel: fulfillment,
      handling_time_days: Number(handlingDays) || 1,
      max_order_quantity: maxOrderQty ? Number(maxOrderQty) : null,
      condition: "NEW",
    };

    const onlyRow = combos.length === 1 ? { ...EMPTY_ROW, ...rows[combos[0].key] } : single;
    const mainImages = images.filter((img) => img.status === "done" && img.url).map((img) => ({ image_url: img.url! }));
    if (combos.length === 1 && onlyRow.imageUrl) mainImages.unshift({ image_url: onlyRow.imageUrl });

    return {
      category_id: leaf.id,
      brand_id: brandIsCatalogId ? brand?.value : undefined,
      brand_name: resolvedBrandName,
      title: title.trim(),
      description: description.trim(),
      bullet_points: bullets.map((b) => b.trim()).filter(Boolean),
      search_keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
      model_number: modelNumber.trim() || undefined,
      ean: !isMulti && ean ? ean : undefined,
      hsn_code: hsn,
      gst_rate_percent: gst,
      country_of_origin: countryOfOrigin.trim() || "India",
      manufacturer_details: manufacturer.trim() || undefined,
      package_length_inches: toFixed2(Number(dims.l) / 2.54),
      package_width_inches: toFixed2(Number(dims.w) / 2.54),
      package_height_inches: toFixed2(Number(dims.h) / 2.54),
      package_weight_pounds: toFixed2(Number(weightKg) * 2.20462),
      is_hazmat: isHazmat,
      images: mainImages,
      attributes: combos.length === 1 ? [...sharedAttributes, ...comboAttributes(0)] : sharedAttributes,
      initial_listing: {
        ...listingBase,
        seller_sku: onlyRow.sku.trim() || undefined,
        standard_price: onlyRow.mrp,
        sale_price: onlyRow.price,
        initial_stock: Number(onlyRow.stock) || 0,
      },
      variations: isMulti
        ? combos.map((combo, i) => {
            const row = { ...EMPTY_ROW, ...rows[combo.key] };
            return {
              attributes: comboAttributes(i),
              seller_sku: row.sku.trim() || undefined,
              standard_price: row.mrp,
              sale_price: row.price,
              initial_stock: Number(row.stock) || 0,
              images: row.imageUrl ? [{ image_url: row.imageUrl }, ...mainImages] : undefined,
            };
          })
        : undefined,
    };
  }

  async function handleSubmit() {
    setShowErrors(true);
    setSubmitErrors([]);
    const firstError = Object.keys(errors)[0];
    if (firstError) {
      scrollTo(sectionOf(firstError));
      return;
    }
    setSubmitting(true);
    try {
      onCreated(await createProduct(buildPayload()));
    } catch (err) {
      setSubmitErrors(err instanceof ApiError ? err.messages : ["Something went wrong. Please try again."]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <div className={`${styles.alert} ${styles.alertError}`}>
        <AlertCircle size={16} /> {loadError}
      </div>
    );
  }
  if (!attributes) {
    return (
      <div className={styles.loading}>
        <Loader2 size={18} className={styles.spin} /> Loading attributes for {leaf.name}…
      </div>
    );
  }

  const errorCount = Object.keys(errors).length;

  return (
    <>
      <div className={styles.twoCol}>
        <div>
          {submitErrors.length > 0 && (
            <div className={`${styles.alert} ${styles.alertError}`}>
              <AlertCircle size={16} />
              <div>
                <strong>We couldn&apos;t save this product.</strong>
                <ul>
                  {submitErrors.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Identity */}
          <section id="sec-identity" className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h2>Product name & brand</h2>
                <p>Buyers search by these — be specific about grade, size and pack.</p>
              </div>
            </div>
            <div className={styles.grid2}>
              <div className={`${styles.field} ${styles.spanAll}`}>
                <label className={styles.label}>
                  Product name <span className={styles.req}>*</span>
                </label>
                <input
                  className={`${styles.input} ${visibleErrors.title ? styles.invalid : ""}`}
                  maxLength={200}
                  placeholder={`e.g. ${brand?.label && brand.value !== OTHERS ? brand.label : "Brand"} ${leaf.name}, grade / size, pack`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <span className={visibleErrors.title ? styles.error : styles.hint}>
                  {visibleErrors.title ?? `${title.length}/200 · Brand + product type + key spec + pack size`}
                </span>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  Brand <span className={styles.req}>*</span>
                </label>
                <SearchSelect
                  placeholder="Search brand"
                  selected={brand}
                  onChange={setBrand}
                  options={brandOptions}
                  loadOptions={brandOptions ? undefined : loadBrands}
                  invalid={!!visibleErrors.brand}
                />
                {visibleErrors.brand && <span className={styles.error}>{visibleErrors.brand}</span>}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Model / part number</label>
                <input className={styles.input} value={modelNumber} onChange={(e) => setModelNumber(e.target.value)} />
              </div>
              {brand?.value.toLowerCase() === OTHERS && (
                <div className={styles.field}>
                  <label className={styles.label}>
                    Brand name <span className={styles.req}>*</span>
                  </label>
                  <input
                    className={`${styles.input} ${visibleErrors.brandName ? styles.invalid : ""}`}
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="As printed on the product"
                  />
                  {visibleErrors.brandName && <span className={styles.error}>{visibleErrors.brandName}</span>}
                </div>
              )}
            </div>
          </section>

          {/* Specifications */}
          <section id="sec-specs" className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h2>Specifications</h2>
                <p>Attributes for {leaf.name}. Fields marked * are required.</p>
              </div>
            </div>
            {specAttrs.length === 0 ? (
              <p className={styles.hint}>No extra specifications for this category.</p>
            ) : (
              <div className={styles.grid2}>
                {specAttrs.map((attr) => (
                  <AttributeField
                    key={attr.id}
                    attribute={attr}
                    value={attrValues[attr.id]}
                    onChange={(v) => setAttrValues((prev) => ({ ...prev, [attr.id]: v }))}
                    error={visibleErrors[`attr:${attr.id}`]}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Variations & pricing */}
          <section id="sec-pricing" className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h2>{variationAttrs.length ? "Variations, price & stock" : "Price & stock"}</h2>
                <p>
                  {variationAttrs.length
                    ? `Select every ${variationAttrs.map((a) => a.label.toLowerCase()).join(" and ")} you sell. Each combination becomes its own variant with price and stock.`
                    : "Set what buyers pay and how many units you have ready to ship."}
                </p>
              </div>
            </div>

            {variationAttrs.length > 0 && (
              <VariationBuilder
                attributes={variationAttrs}
                selection={selection}
                onSelectionChange={setSelection}
                units={units}
                onUnitsChange={setUnits}
                combos={combos}
                rows={rows}
                onRowsChange={setRows}
                errors={visibleErrors}
              />
            )}

            {combos.length === 0 && (
              <div className={styles.grid4} style={variationAttrs.length ? { marginTop: 16 } : undefined}>
                <div className={styles.field}>
                  <label className={styles.label}>
                    MRP (₹) <span className={styles.req}>*</span>
                  </label>
                  <input
                    className={`${styles.input} ${visibleErrors["single:mrp"] ? styles.invalid : ""}`}
                    type="number"
                    min={0}
                    value={single.mrp}
                    onChange={(e) => setSingle({ ...single, mrp: e.target.value })}
                  />
                  {visibleErrors["single:mrp"] && <span className={styles.error}>{visibleErrors["single:mrp"]}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    Selling price (₹) <span className={styles.req}>*</span>
                  </label>
                  <input
                    className={`${styles.input} ${visibleErrors["single:price"] ? styles.invalid : ""}`}
                    type="number"
                    min={0}
                    value={single.price}
                    onChange={(e) => setSingle({ ...single, price: e.target.value })}
                  />
                  {visibleErrors["single:price"] && <span className={styles.error}>{visibleErrors["single:price"]}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>
                    Stock <span className={styles.req}>*</span>
                  </label>
                  <input
                    className={`${styles.input} ${visibleErrors["single:stock"] ? styles.invalid : ""}`}
                    type="number"
                    min={0}
                    value={single.stock}
                    onChange={(e) => setSingle({ ...single, stock: e.target.value })}
                  />
                  {visibleErrors["single:stock"] && <span className={styles.error}>{visibleErrors["single:stock"]}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Seller SKU</label>
                  <input
                    className={styles.input}
                    placeholder="Auto-generated"
                    value={single.sku}
                    onChange={(e) => setSingle({ ...single, sku: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 20, paddingTop: 18 }}>
              <span className={styles.label} style={{ marginBottom: 10 }}>
                Fulfilment
              </span>
              <div className={styles.radioCards}>
                <button
                  type="button"
                  className={`${styles.radioCard} ${fulfillment === "FBM" ? styles.radioCardOn : ""}`}
                  onClick={() => setFulfillment("FBM")}
                >
                  <strong>Self ship</strong>
                  <span>You deliver with your own vehicles or courier.</span>
                </button>
                <button
                  type="button"
                  className={`${styles.radioCard} ${fulfillment === "FBA" ? styles.radioCardOn : ""}`}
                  onClick={() => setFulfillment("FBA")}
                >
                  <strong>Makaano fulfilled</strong>
                  <span>Makaano picks up and delivers to the buyer.</span>
                </button>
              </div>
              <div className={styles.grid2} style={{ marginTop: 16 }}>
                <div className={styles.field}>
                  <label className={styles.label}>Dispatch within</label>
                  <select className={styles.select} value={handlingDays} onChange={(e) => setHandlingDays(e.target.value)}>
                    {[1, 2, 3, 5, 7].map((d) => (
                      <option key={d} value={d}>
                        {d} {d === 1 ? "day" : "days"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Max quantity per order</label>
                  <input
                    className={styles.input}
                    type="number"
                    min={1}
                    placeholder="No limit"
                    value={maxOrderQty}
                    onChange={(e) => setMaxOrderQty(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Images */}
          <section id="sec-images" className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h2>
                  Photos <span className={styles.req}>*</span>
                </h2>
                <p>The first photo is shown in search results. Add up to 8.</p>
              </div>
            </div>
            <ImageUploader images={images} onChange={setImages} invalid={!!visibleErrors.images} />
            {visibleErrors.images && <p className={styles.error} style={{ marginTop: 8 }}>{visibleErrors.images}</p>}
          </section>

          {/* Description */}
          <section id="sec-description" className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h2>Description</h2>
                <p>Explain where the product is used, how it is packed and what makes it different.</p>
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>
                Product description <span className={styles.req}>*</span>
              </label>
              <textarea
                className={`${styles.textarea} ${visibleErrors.description ? styles.invalid : ""}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
              />
              <span className={visibleErrors.description ? styles.error : styles.hint}>
                {visibleErrors.description ?? `${description.length}/2000`}
              </span>
            </div>
            <div className={styles.field} style={{ marginTop: 16 }}>
              <label className={styles.label}>Key features</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {bullets.map((bullet, i) => (
                  <input
                    key={i}
                    className={styles.input}
                    placeholder={i === 0 ? "e.g. Conforms to IS 269:2015, 28-day strength 53 MPa" : `Feature ${i + 1}`}
                    value={bullet}
                    maxLength={200}
                    onChange={(e) => setBullets(bullets.map((b, j) => (j === i ? e.target.value : b)))}
                  />
                ))}
              </div>
            </div>
            <div className={styles.field} style={{ marginTop: 16 }}>
              <label className={styles.label}>Search keywords</label>
              <input
                className={styles.input}
                placeholder="Comma separated, e.g. opc cement, 53 grade, construction cement"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>
          </section>

          {/* Tax */}
          <section id="sec-tax" className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h2>GST & compliance</h2>
                <p>Printed on every invoice. Your GSTIN is taken from your seller registration.</p>
              </div>
            </div>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>
                  HSN code <span className={styles.req}>*</span>
                </label>
                <input
                  className={`${styles.input} ${visibleErrors.hsn ? styles.invalid : ""}`}
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="e.g. 2523"
                  value={hsn}
                  onChange={(e) => setHsn(e.target.value.replace(/\D/g, ""))}
                />
                {visibleErrors.hsn && <span className={styles.error}>{visibleErrors.hsn}</span>}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  GST rate <span className={styles.req}>*</span>
                </label>
                <div className={styles.chips}>
                  {GST_RATES.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      className={`${styles.chip} ${gst === rate ? styles.chipOn : ""}`}
                      onClick={() => setGst(rate)}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Country of origin</label>
                <input className={styles.input} value={countryOfOrigin} onChange={(e) => setCountryOfOrigin(e.target.value)} />
              </div>
              {!isMulti && (
                <div className={styles.field}>
                  <label className={styles.label}>Barcode (EAN / GTIN)</label>
                  <input
                    className={`${styles.input} ${visibleErrors.ean ? styles.invalid : ""}`}
                    inputMode="numeric"
                    placeholder="Optional"
                    value={ean}
                    onChange={(e) => setEan(e.target.value.replace(/\D/g, ""))}
                  />
                  {visibleErrors.ean && <span className={styles.error}>{visibleErrors.ean}</span>}
                </div>
              )}
              <div className={`${styles.field} ${styles.spanAll}`}>
                <label className={styles.label}>Manufacturer / packer name & address</label>
                <textarea
                  className={styles.textarea}
                  style={{ minHeight: 70 }}
                  placeholder="Required on packaged goods under Legal Metrology rules"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Shipping */}
          <section id="sec-shipping" className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <h2>Package & shipping</h2>
                <p>Packed size of one unit. Used to calculate delivery charges.</p>
              </div>
            </div>
            <div className={styles.grid4}>
              <div className={styles.field}>
                <label className={styles.label}>Weight</label>
                <div className={styles.inputGroup}>
                  <input className={styles.input} type="number" min={0} value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
                  <span className={styles.inputAddon}>kg</span>
                </div>
              </div>
              {(["l", "w", "h"] as const).map((k) => (
                <div key={k} className={styles.field}>
                  <label className={styles.label}>{{ l: "Length", w: "Width", h: "Height" }[k]}</label>
                  <div className={styles.inputGroup}>
                    <input
                      className={styles.input}
                      type="number"
                      min={0}
                      value={dims[k]}
                      onChange={(e) => setDims({ ...dims, [k]: e.target.value })}
                    />
                    <span className={styles.inputAddon}>cm</span>
                  </div>
                </div>
              ))}
            </div>
            <label className={styles.checkboxRow} style={{ marginTop: 16 }}>
              <input type="checkbox" checked={isHazmat} onChange={(e) => setIsHazmat(e.target.checked)} />
              Contains hazardous material (flammable, corrosive or pressurised)
            </label>
          </section>
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.card}>
            <div className={styles.label} style={{ marginBottom: 8 }}>
              Category
            </div>
            <div className={styles.breadcrumb}>
              {path.map((node, i) => (
                <span key={node.id} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {i === path.length - 1 ? <strong>{node.name}</strong> : node.name}
                  {i < path.length - 1 && <ChevronRight size={12} />}
                </span>
              ))}
            </div>
            <button type="button" className={styles.linkBtn} style={{ marginTop: 10 }} onClick={onChangeCategory}>
              Change category
            </button>
          </div>
          <div className={styles.card}>
            <div className={styles.label} style={{ marginBottom: 8 }}>
              Checklist
            </div>
            <ul className={styles.summaryList}>
              {SECTIONS.map((section) => {
                const hasError = sectionHasError(section.id);
                const cls = hasError ? (showErrors ? styles.summaryError : "") : styles.summaryDone;
                return (
                  <li key={section.id}>
                    <button type="button" className={`${styles.summaryItem} ${cls}`} onClick={() => scrollTo(section.id)}>
                      <span className={styles.summaryIcon}>
                        {!hasError ? <Check size={12} strokeWidth={3} /> : showErrors ? "!" : null}
                      </span>
                      {section.label}
                    </button>
                  </li>
                );
              })}
            </ul>
            {isMulti && (
              <p className={styles.sidebarNote} style={{ marginTop: 12 }}>
                {combos.length} variants will be created under one parent listing, each with its own ASIN.
              </p>
            )}
          </div>
        </aside>
      </div>

      <div className={styles.actionBar}>
        <div className={styles.actionBarInner}>
          <span className={styles.actionBarInfo}>
            {showErrors && errorCount > 0
              ? `${errorCount} field${errorCount > 1 ? "s" : ""} need attention`
              : "Products go live after a quick quality check."}
          </span>
          <div className={styles.actionBarButtons}>
            <button type="button" className={styles.btnSecondary} onClick={onChangeCategory}>
              Back
            </button>
            <button type="button" className={styles.btnPrimary} onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 size={16} className={styles.spin} />}
              {submitting ? "Submitting…" : isMulti ? `Submit ${combos.length} variants` : "Submit product"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
