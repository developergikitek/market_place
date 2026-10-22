"use client";

import { useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { ApiError, CategoryAttribute, optionValue, uploadProductImage } from "@/services/addProductService";
import { validateImageFile } from "./ImageUploader";
import styles from "./addProduct.module.css";
import Select from "@/components/ui/Select";

/** Per-variant extras; price and stock belong to listings, so only an optional photo lives here. */
export interface VariantRow {
  imageUrl?: string;
  imagePreview?: string;
  imageStatus?: "uploading" | "done" | "error";
}

export interface VariantCombo {
  key: string;
  label: string;
  values: { attribute: CategoryAttribute; value: string; unit?: string }[];
}

export const EMPTY_ROW: VariantRow = {};

/** Cartesian product of the values picked for each variation attribute. */
export function buildCombos(
  attributes: CategoryAttribute[],
  selection: Record<string, string[]>,
  units: Record<string, string>
): VariantCombo[] {
  const active = attributes.filter((a) => (selection[a.id] ?? []).length > 0);
  if (!active.length) return [];
  let combos: VariantCombo["values"][] = [[]];
  for (const attribute of active) {
    const unit = units[attribute.id] ?? attribute.unit_of_measure_options?.[0];
    combos = combos.flatMap((combo) =>
      selection[attribute.id].map((value) => [...combo, { attribute, value, unit }])
    );
  }
  return combos.map((values) => ({
    key: values.map((v) => `${v.attribute.id}=${v.value}`).join("|"),
    label: values.map((v) => (v.unit ? `${v.value} ${v.unit}` : v.value)).join(" / "),
    values,
  }));
}

interface VariationBuilderProps {
  attributes: CategoryAttribute[];
  selection: Record<string, string[]>;
  onSelectionChange: (next: Record<string, string[]>) => void;
  units: Record<string, string>;
  onUnitsChange: (next: Record<string, string>) => void;
  combos: VariantCombo[];
  rows: Record<string, VariantRow>;
  onRowsChange: (update: (prev: Record<string, VariantRow>) => Record<string, VariantRow>) => void;
  errors: Record<string, string>;
}

export default function VariationBuilder({
  attributes,
  selection,
  onSelectionChange,
  units,
  onUnitsChange,
  combos,
  rows,
  onRowsChange,
  errors,
}: VariationBuilderProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  function toggleValue(attributeId: string, value: string) {
    const current = selection[attributeId] ?? [];
    onSelectionChange({
      ...selection,
      [attributeId]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    });
  }

  function addTypedValue(attributeId: string) {
    const value = (drafts[attributeId] ?? "").trim();
    if (!value) return;
    if (!(selection[attributeId] ?? []).includes(value)) toggleValue(attributeId, value);
    setDrafts({ ...drafts, [attributeId]: "" });
  }

  function updateRow(key: string, patch: Partial<VariantRow>) {
    onRowsChange((prev) => ({ ...prev, [key]: { ...EMPTY_ROW, ...prev[key], ...patch } }));
  }

  function uploadRowImage(key: string, file: File | undefined) {
    if (!file) return;
    if (validateImageFile(file)) {
      updateRow(key, { imageStatus: "error", imagePreview: undefined, imageUrl: undefined });
      return;
    }
    updateRow(key, { imagePreview: URL.createObjectURL(file), imageStatus: "uploading", imageUrl: undefined });
    uploadProductImage(file)
      .then((url) => updateRow(key, { imageUrl: url, imageStatus: "done" }))
      .catch((err) => {
        console.warn(err instanceof ApiError ? err.messages : err);
        updateRow(key, { imageStatus: "error" });
      });
  }

  return (
    <div>
      {attributes.map((attribute) => {
        const options = (attribute.allowed_options_json ?? []).map(optionValue);
        const picked = selection[attribute.id] ?? [];
        const unitOptions = attribute.unit_of_measure_options ?? [];
        const unit = units[attribute.id] ?? unitOptions[0];
        const typed = picked.filter((v) => !options.includes(v));

        return (
          <div key={attribute.id} className={styles.variationAttr}>
            <div className={styles.variationAttrHead}>
              <span className={styles.label}>
                {attribute.label}
                {unit && <span className={styles.hint}>({unit})</span>}
                {attribute.is_required && <span className={styles.req}>*</span>}
              </span>
              {unitOptions.length > 1 && (
                <Select
                  className={styles.select}
                  style={{ width: "auto", padding: "5px 10px", fontSize: 13 }}
                  value={unit}
                  onChange={(e) => onUnitsChange({ ...units, [attribute.id]: e.target.value })}
                >
                  {unitOptions.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </Select>
              )}
            </div>

            {options.length > 0 && (
              <div className={styles.chips}>
                {options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`${styles.chip} ${picked.includes(option) ? styles.chipOn : ""}`}
                    onClick={() => toggleValue(attribute.id, option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {options.length === 0 && (
              <>
                {typed.length > 0 && (
                  <div className={styles.chips}>
                    {typed.map((value) => (
                      <span key={value} className={`${styles.chip} ${styles.chipOn}`}>
                        {value}
                        <button
                          type="button"
                          className={styles.chipRemove}
                          onClick={() => toggleValue(attribute.id, value)}
                          aria-label={`Remove ${value}`}
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className={styles.tagInputRow}>
                  <input
                    className={styles.input}
                    placeholder={`Add ${attribute.label.toLowerCase()} and press Enter`}
                    value={drafts[attribute.id] ?? ""}
                    onChange={(e) => setDrafts({ ...drafts, [attribute.id]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTypedValue(attribute.id);
                      }
                    }}
                  />
                  <button type="button" className={styles.btnSecondary} onClick={() => addTypedValue(attribute.id)}>
                    Add
                  </button>
                </div>
              </>
            )}
            {errors[`variationAttr:${attribute.id}`] && (
              <span className={styles.error}>{errors[`variationAttr:${attribute.id}`]}</span>
            )}
          </div>
        );
      })}

      {combos.length > 0 && (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Variant</th>
                  <th style={{ width: 120 }}>Photo</th>
                </tr>
              </thead>
              <tbody>
                {combos.map((combo) => {
                  const row = { ...EMPTY_ROW, ...rows[combo.key] };
                  const err = (field: string) => errors[`var:${combo.key}:${field}`];
                  return (
                    <tr key={combo.key}>
                      <td className={styles.variantName}>{combo.label}</td>
                      <td>
                        <label className={styles.miniUpload} title="Photo for this variant (optional)">
                          {row.imagePreview ? (
                            // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                            <img src={row.imagePreview} alt={combo.label} />
                          ) : (
                            <ImagePlus size={16} />
                          )}
                          {row.imageStatus === "uploading" && (
                            <span className={styles.imageOverlay}>
                              <Loader2 size={14} className={styles.spin} />
                            </span>
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => {
                              uploadRowImage(combo.key, e.target.files?.[0]);
                              e.target.value = "";
                            }}
                          />
                        </label>
                        {row.imageStatus === "error" && <div className={styles.error}>Failed</div>}
                        {err("image") && <div className={styles.error}>{err("image")}</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className={styles.hint} style={{ marginTop: 8 }}>
            Variant photo is optional — without it, the main product photos are used.
          </p>
        </>
      )}
    </div>
  );
}
