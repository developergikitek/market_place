"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import type { CategoryNode } from "@/services/addProductService";
import { CategoryIndex, categoryPath, pathLabel } from "./categoryTree";
import styles from "./addProduct.module.css";

interface CategoryPickerProps {
  index: CategoryIndex;
  /** Initially opened path (e.g. when coming back to change category). */
  initialLeafId?: string | null;
  onLeafChange: (leaf: CategoryNode | null) => void;
}

const COLUMN_TITLES = ["Category", "Sub-category", "Type", "Product type", "Variant type"];

export default function CategoryPicker({ index, initialLeafId, onLeafChange }: CategoryPickerProps) {
  const [path, setPath] = useState<string[]>(() =>
    initialLeafId ? categoryPath(index, initialLeafId).map((c) => c.id) : []
  );
  const [query, setQuery] = useState("");
  const columnsRef = useRef<HTMLDivElement>(null);

  // Keep the newest column in view as the seller drills down.
  useEffect(() => {
    const el = columnsRef.current;
    if (el) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
  }, [path.length]);

  const columns = useMemo(() => {
    const result: CategoryNode[][] = [index.children.get(null) ?? []];
    for (const id of path) {
      const node = index.byId.get(id);
      if (!node || node.is_leaf) break;
      const kids = index.children.get(id) ?? [];
      if (kids.length) result.push(kids);
    }
    return result;
  }, [index, path]);

  const leafMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const matches: { leaf: CategoryNode; label: string }[] = [];
    for (const node of index.byId.values()) {
      if (!node.is_leaf) continue;
      const label = pathLabel(categoryPath(index, node.id));
      if (label.toLowerCase().includes(q)) matches.push({ leaf: node, label });
      if (matches.length >= 40) break;
    }
    return matches;
  }, [index, query]);

  function select(node: CategoryNode, columnIndex: number) {
    setPath([...path.slice(0, columnIndex), node.id]);
    onLeafChange(node.is_leaf ? node : null);
  }

  function selectFromSearch(leaf: CategoryNode) {
    setPath(categoryPath(index, leaf.id).map((c) => c.id));
    setQuery("");
    onLeafChange(leaf);
  }

  return (
    <div>
      <div className={styles.searchBox}>
        <Search size={17} />
        <input
          className={styles.input}
          placeholder="Search a category, e.g. OPC 53, PVC pipe, wall tiles"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {query.trim().length >= 2 ? (
        <div className={styles.searchResults}>
          {leafMatches.length === 0 ? (
            <div className={styles.empty}>No category matches “{query}”. Try a shorter word or browse below.</div>
          ) : (
            leafMatches.map(({ leaf, label }) => (
              <button key={leaf.id} type="button" className={styles.searchResult} onClick={() => selectFromSearch(leaf)}>
                <strong>{leaf.name}</strong>
                <span>{label}</span>
              </button>
            ))
          )}
        </div>
      ) : (
        <div className={styles.columns} ref={columnsRef}>
          {columns.map((items, columnIndex) => (
            <div key={columnIndex} className={styles.column}>
              <div className={styles.columnTitle}>{COLUMN_TITLES[columnIndex] ?? `Level ${columnIndex + 1}`}</div>
              {items.map((node) => {
                const active = path[columnIndex] === node.id;
                return (
                  <button
                    key={node.id}
                    type="button"
                    className={`${styles.catItem} ${active ? styles.catItemOn : ""}`}
                    onClick={() => select(node, columnIndex)}
                  >
                    <span>{node.name}</span>
                    {node.is_leaf ? <span className={styles.leafTag}>Select</span> : <ChevronRight size={15} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
