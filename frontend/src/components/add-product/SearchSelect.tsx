"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Plus, Search, X } from "lucide-react";
import styles from "./addProduct.module.css";

export interface SearchSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  /** Short right-aligned tag, e.g. "12 products". */
  badge?: string;
  /** Rendered as a call to action (e.g. "Add my own brand") pinned below the regular options. */
  action?: boolean;
}

interface SearchSelectProps {
  placeholder: string;
  selected: SearchSelectOption | null;
  onChange: (option: SearchSelectOption | null) => void;
  /** Synchronous filtering over a fixed list… */
  options?: SearchSelectOption[];
  /** …or async lookup as the user types. */
  loadOptions?: (query: string) => Promise<SearchSelectOption[]>;
  /** Fixed list still being fetched by the parent. */
  loading?: boolean;
  /** Singular noun for the result count header, e.g. "brand". */
  noun?: string;
  /** Show a letter avatar before each option. */
  avatars?: boolean;
  /** Message when there are no options and nothing was typed. */
  emptyText?: string;
  invalid?: boolean;
}

// Stable soft colour per name so the same brand always gets the same avatar.
function avatarStyle(label: string) {
  let hash = 0;
  for (const ch of label) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return { background: `hsl(${hash} 70% 93%)`, color: `hsl(${hash} 45% 30%)` };
}

function Highlight({ text, query }: { text: string; query: string }) {
  const at = query ? text.toLowerCase().indexOf(query) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className={styles.comboMark}>{text.slice(at, at + query.length)}</mark>
      {text.slice(at + query.length)}
    </>
  );
}

export default function SearchSelect({
  placeholder,
  selected,
  onChange,
  options,
  loadOptions,
  loading = false,
  noun,
  avatars = false,
  emptyText = "Nothing here yet",
  invalid,
}: SearchSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [asyncOptions, setAsyncOptions] = useState<SearchSelectOption[]>([]);
  const [asyncLoading, setAsyncLoading] = useState(false);
  const [asyncError, setAsyncError] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

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
      setAsyncLoading(true);
      setAsyncError(false);
      loadOptions(query)
        .then((result) => !cancelled && setAsyncOptions(result))
        .catch(() => {
          if (cancelled) return;
          setAsyncOptions([]);
          setAsyncError(true);
        })
        .finally(() => !cancelled && setAsyncLoading(false));
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open, loadOptions]);

  const q = query.trim().toLowerCase();
  const all = loadOptions
    ? asyncOptions
    : (options ?? []).filter(
        (o) => o.action || !q || o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q)
      );
  const regular = all.filter((o) => !o.action);
  const actions = all.filter((o) => o.action);
  const visible = [...regular, ...actions];
  const busy = loadOptions ? asyncLoading && asyncOptions.length === 0 : loading;

  // Keep the keyboard-highlighted option in view.
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function openList() {
    setOpen(true);
    setQuery("");
    setActive(0);
  }

  function choose(option: SearchSelectOption) {
    onChange(option);
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      e.preventDefault();
      openList();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, visible.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && visible[active]) {
      e.preventDefault();
      choose(visible[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const header = noun && !busy && regular.length > 0
    ? `${regular.length} ${regular.length === 1 ? noun : `${noun}s`}${q ? ` matching “${query.trim()}”` : ""}`
    : null;

  const renderOption = (option: SearchSelectOption, index: number) => {
    const isSelected = selected?.value === option.value;
    return (
      <button
        key={option.value}
        type="button"
        data-index={index}
        className={`${styles.comboOption} ${option.action ? styles.comboAction : ""} ${
          index === active ? styles.comboOptionActive : ""
        } ${isSelected ? styles.comboOptionSelected : ""}`}
        onMouseEnter={() => setActive(index)}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => choose(option)}
      >
        {option.action ? (
          <span className={styles.comboActionIcon}>
            <Plus size={14} />
          </span>
        ) : (
          avatars && (
            <span className={styles.comboAvatar} style={avatarStyle(option.label)}>
              {option.label.trim().charAt(0).toUpperCase()}
            </span>
          )
        )}
        <span className={styles.comboText}>
          <span className={styles.comboLabel}>
            <Highlight text={option.label} query={option.action ? "" : q} />
          </span>
          {option.sublabel && <span className={styles.comboSublabel}>{option.sublabel}</span>}
        </span>
        {option.badge && <span className={styles.comboBadge}>{option.badge}</span>}
        {isSelected && <Check size={15} className={styles.comboCheck} />}
      </button>
    );
  };

  return (
    <div className={`${styles.combo} ${open ? styles.comboOpen : ""}`} ref={rootRef}>
      <Search size={15} className={styles.comboSearchIcon} />
      <input
        ref={inputRef}
        className={`${styles.input} ${styles.comboInput} ${invalid ? styles.invalid : ""}`}
        placeholder={selected ? selected.label : placeholder}
        value={open ? query : selected?.label ?? ""}
        onFocus={openList}
        onClick={() => !open && openList()}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
      />
      {selected && !open ? (
        <button type="button" className={styles.comboClear} onClick={() => onChange(null)} aria-label="Clear">
          <X size={15} />
        </button>
      ) : (
        <ChevronDown size={16} className={styles.comboChevron} />
      )}
      {open && (
        <div className={styles.comboList} ref={listRef} role="listbox" id={listId}>
          {header && <div className={styles.comboHeader}>{header}</div>}
          {busy ? (
            <div className={styles.comboEmpty}>
              <Loader2 size={15} className={styles.spin} /> Loading…
            </div>
          ) : asyncError ? (
            <div className={styles.comboEmpty}>Couldn&apos;t load options. Close and try again.</div>
          ) : (
            <>
              {regular.length === 0 && (
                <div className={styles.comboEmpty}>{q ? `No match for “${query.trim()}”` : emptyText}</div>
              )}
              {regular.map((option, i) => renderOption(option, i))}
              {actions.length > 0 && (
                <>
                  {regular.length > 0 && <div className={styles.comboDivider} />}
                  {actions.map((option, i) => renderOption(option, regular.length + i))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
