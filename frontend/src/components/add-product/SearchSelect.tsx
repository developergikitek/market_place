"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import styles from "./addProduct.module.css";

export interface SearchSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchSelectProps {
  placeholder: string;
  selected: SearchSelectOption | null;
  onChange: (option: SearchSelectOption | null) => void;
  /** Synchronous filtering over a fixed list… */
  options?: SearchSelectOption[];
  /** …or async lookup as the user types. */
  loadOptions?: (query: string) => Promise<SearchSelectOption[]>;
  invalid?: boolean;
}

export default function SearchSelect({
  placeholder,
  selected,
  onChange,
  options,
  loadOptions,
  invalid,
}: SearchSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [asyncOptions, setAsyncOptions] = useState<SearchSelectOption[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!loadOptions || !open) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      loadOptions(query)
        .then((result) => !cancelled && setAsyncOptions(result))
        .catch(() => !cancelled && setAsyncOptions([]));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open, loadOptions]);

  const q = query.trim().toLowerCase();
  const visible = loadOptions
    ? asyncOptions
    : (options ?? [])
        .filter((o) => !q || o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q))
        .slice(0, 50);

  return (
    <div className={styles.combo} ref={rootRef}>
      <input
        className={`${styles.input} ${invalid ? styles.invalid : ""}`}
        placeholder={selected ? selected.label : placeholder}
        value={open ? query : selected?.label ?? ""}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onClick={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        style={selected ? { paddingRight: 32 } : undefined}
      />
      {selected && !open && (
        <button type="button" className={styles.comboClear} onClick={() => onChange(null)} aria-label="Clear">
          <X size={15} />
        </button>
      )}
      {open && (
        <div className={styles.comboList}>
          {visible.length === 0 ? (
            <div className={styles.hint} style={{ padding: "10px" }}>
              No matches
            </div>
          ) : (
            visible.map((option) => (
              <button
                key={option.value}
                type="button"
                className={styles.comboOption}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                {option.label}
                {option.sublabel && <span>{option.sublabel}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
