"use client";

import { CategoryAttribute, optionValue } from "@/services/addProductService";
import styles from "./addProduct.module.css";

export interface AttributeValue {
  value: string;
  unit?: string;
}

interface AttributeFieldProps {
  attribute: CategoryAttribute;
  value: AttributeValue | undefined;
  onChange: (value: AttributeValue) => void;
  error?: string;
}

export default function AttributeField({ attribute, value, onChange, error }: AttributeFieldProps) {
  const current = value?.value ?? "";
  const units = attribute.unit_of_measure_options ?? [];
  const unit = value?.unit ?? units[0];
  const options = attribute.allowed_options_json ?? [];
  const invalidClass = error ? styles.invalid : "";

  let control: React.ReactNode;

  if (attribute.data_type === "BOOLEAN") {
    control = (
      <div className={styles.chips}>
        {["Yes", "No"].map((label) => (
          <button
            key={label}
            type="button"
            className={`${styles.chip} ${current === label ? styles.chipOn : ""}`}
            onClick={() => onChange({ value: current === label ? "" : label })}
          >
            {label}
          </button>
        ))}
      </div>
    );
  } else if (attribute.data_type === "ENUM" && options.length > 0) {
    const select = (
      <select
        className={`${styles.select} ${invalidClass}`}
        value={current}
        onChange={(e) => onChange({ value: e.target.value, unit })}
      >
        <option value="">Select {attribute.label.toLowerCase()}</option>
        {options.map((option) => {
          const v = optionValue(option);
          return (
            <option key={v} value={v}>
              {v}
            </option>
          );
        })}
      </select>
    );
    control = units.length ? (
      <div className={styles.inputGroup}>
        {select}
        <span className={styles.inputAddon}>{units[0]}</span>
      </div>
    ) : (
      select
    );
  } else {
    const input = (
      <input
        className={`${styles.input} ${invalidClass}`}
        type={attribute.data_type === "NUMBER" ? "number" : "text"}
        inputMode={attribute.data_type === "NUMBER" ? "decimal" : undefined}
        min={attribute.data_type === "NUMBER" ? 0 : undefined}
        value={current}
        placeholder={attribute.data_type === "NUMBER" ? "0" : `Enter ${attribute.label.toLowerCase()}`}
        onChange={(e) => onChange({ value: e.target.value, unit })}
      />
    );
    if (units.length > 1) {
      control = (
        <div className={styles.inputGroup}>
          {input}
          <select className={styles.select} value={unit} onChange={(e) => onChange({ value: current, unit: e.target.value })}>
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      );
    } else if (units.length === 1) {
      control = (
        <div className={styles.inputGroup}>
          {input}
          <span className={styles.inputAddon}>{units[0]}</span>
        </div>
      );
    } else {
      control = input;
    }
  }

  return (
    <div className={styles.field}>
      <label className={styles.label}>
        {attribute.label}
        {attribute.is_required && <span className={styles.req}>*</span>}
      </label>
      {control}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
