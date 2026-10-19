"use client";

import {
  Children,
  CSSProperties,
  Fragment,
  ReactNode,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import styles from "./Select.module.css";

/** Same shape handlers already read from a native <select>: `e.target.value`. */
export interface SelectChangeEvent {
  target: { value: string };
}

interface SelectProps {
  value: string | number;
  onChange?: (event: SelectChangeEvent) => void;
  /** Plain <option value="…">Label</option> elements, exactly as for a native select. */
  children: ReactNode;
  /** Applied to the trigger button, so existing inline select styles keep working. */
  style?: CSSProperties;
  className?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  /** Show a search box in the menu. Defaults to on for lists longer than 8. */
  searchable?: boolean;
}

interface ParsedOption {
  value: string;
  label: string;
  disabled: boolean;
}

function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

function parseOptions(children: ReactNode): ParsedOption[] {
  const out: ParsedOption[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>(child)) return;
    if (child.type === Fragment) {
      out.push(...parseOptions(child.props.children));
      return;
    }
    if (child.type !== "option") return;
    const label = textOf(child.props.children).replace(/\s+/g, " ").trim();
    out.push({ value: String(child.props.value ?? label), label, disabled: !!child.props.disabled });
  });
  return out;
}

const MENU_GAP = 6;
const MENU_MAX_HEIGHT = 320;

export default function Select({
  value,
  onChange,
  children,
  style,
  className,
  disabled,
  id,
  "aria-label": ariaLabel,
  searchable,
}: SelectProps) {
  const options = parseOptions(children);
  const current = options.find((o) => o.value === String(value));
  const showSearch = searchable ?? options.length > 8;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const q = query.trim().toLowerCase();
  const visible = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;

  const place = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const below = window.innerHeight - rect.bottom;
    const openUp = below < 240 && rect.top > below;
    setPosition({
      left: Math.min(rect.left, window.innerWidth - Math.max(rect.width, 200) - 8),
      minWidth: rect.width,
      maxHeight: Math.min(MENU_MAX_HEIGHT, (openUp ? rect.top : below) - MENU_GAP - 8),
      ...(openUp ? { bottom: window.innerHeight - rect.top + MENU_GAP } : { top: rect.bottom + MENU_GAP }),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) menuRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function openMenu() {
    if (disabled) return;
    setQuery("");
    setActive(Math.max(0, options.findIndex((o) => o.value === String(value))));
    setOpen(true);
    if (showSearch) requestAnimationFrame(() => searchRef.current?.focus());
  }

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function choose(option: ParsedOption) {
    if (option.disabled) return;
    if (option.value !== String(value)) onChange?.({ target: { value: option.value } });
    close();
  }

  function move(step: number) {
    if (!visible.length) return;
    let next = active;
    for (let i = 0; i < visible.length; i++) {
      next = (next + step + visible.length) % visible.length;
      if (!visible[next].disabled) break;
    }
    setActive(next);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (visible[active]) choose(visible[active]);
    } else if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.preventDefault();
      close();
    } else if (!showSearch && e.key.length === 1) {
      // Type-ahead: jump to the next option starting with the typed letter.
      const letter = e.key.toLowerCase();
      const start = active + 1;
      for (let i = 0; i < visible.length; i++) {
        const idx = (start + i) % visible.length;
        if (visible[idx].label.toLowerCase().startsWith(letter)) {
          setActive(idx);
          break;
        }
      }
    }
  }

  const menu = open && (
    <div
      ref={menuRef}
      className={`${styles.menu} ${position.bottom !== undefined ? styles.menuUp : ""}`}
      style={position}
      onKeyDown={onKeyDown}
    >
      {showSearch && (
        <div className={styles.searchRow}>
          <Search size={14} />
          <input
            ref={searchRef}
            className={styles.search}
            placeholder={`Search ${options.length} options`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
          />
        </div>
      )}
      <div className={styles.list} role="listbox" id={listId}>
        {visible.length === 0 ? (
          <div className={styles.empty}>No match for “{query.trim()}”</div>
        ) : (
          visible.map((option, index) => {
            const selected = option.value === String(value);
            const at = q ? option.label.toLowerCase().indexOf(q) : -1;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                data-index={index}
                disabled={option.disabled}
                className={`${styles.option} ${index === active ? styles.optionActive : ""} ${
                  selected ? styles.optionSelected : ""
                }`}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(option)}
              >
                <span className={styles.optionLabel}>
                  {at < 0 ? (
                    option.label
                  ) : (
                    <>
                      {option.label.slice(0, at)}
                      <mark className={styles.mark}>{option.label.slice(at, at + q.length)}</mark>
                      {option.label.slice(at + q.length)}
                    </>
                  )}
                </span>
                {selected && <Check size={15} className={styles.check} />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        disabled={disabled}
        className={`${styles.trigger} ${className ?? ""} ${open ? styles.triggerOpen : ""}`}
        style={style}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onKeyDown}
      >
        <span className={styles.value}>{current?.label ?? ""}</span>
        <ChevronDown size={15} className={styles.chevron} />
      </button>
      {menu && typeof document !== "undefined" && createPortal(menu, document.body)}
    </>
  );
}
