"use client";

import React from "react";
import { CATEGORIES } from "@/data/marketplaceData";
import {
  Layers,
  Boxes,
  Square,
  Sparkles,
  Activity,
  Grid,
  Shield,
  ArrowUpRight,
  PackageCheck,
} from "lucide-react";

interface CategoriesSectionProps {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Layers: <Layers size={22} color="var(--accent-amber)" />,
  Boxes: <Boxes size={22} color="var(--accent-amber)" />,
  Square: <Square size={22} color="var(--accent-amber)" />,
  Sparkles: <Sparkles size={22} color="var(--accent-amber)" />,
  Activity: <Activity size={22} color="var(--accent-amber)" />,
  Grid: <Grid size={22} color="var(--accent-amber)" />,
  Shield: <Shield size={22} color="var(--accent-amber)" />,
};

export default function CategoriesSection({
  selectedCategory,
  onSelectCategory,
}: CategoriesSectionProps) {
  const handleCategoryClick = (id: string) => {
    onSelectCategory(id === selectedCategory ? "all" : id);
    const prodEl = document.getElementById("products");
    if (prodEl) {
      prodEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="categories"
      style={{
        position: "relative",
        padding: "100px 28px",
        zIndex: 10,
        maxWidth: "1320px",
        margin: "0 auto",
      }}
    >
      {/* SECTION HEADER */}
      <div style={{ marginBottom: "48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <span style={{ width: "24px", height: "3px", background: "var(--accent-amber)" }} />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--accent-amber)",
              letterSpacing: "1.5px",
              fontWeight: 700,
            }}
          >
            STRUCTURAL COMMODITY TAXONOMY
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 42px)",
                fontWeight: 800,
                color: "#ffffff",
                fontFamily: "var(--font-heading)",
              }}
            >
              Essential Construction Materials
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px", maxWidth: "600px", marginTop: "6px" }}>
              Direct procurement across 7 verified structural categories with IS-codes and spot factory gate pricing.
            </p>
          </div>

          {selectedCategory !== "all" && (
            <button
              onClick={() => onSelectCategory("all")}
              style={{
                background: "rgba(245, 158, 11, 0.15)",
                border: "1px solid var(--accent-amber)",
                color: "var(--accent-amber)",
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              ✕ Reset Filter (Showing: {selectedCategory.toUpperCase()})
            </button>
          )}
        </div>
      </div>

      {/* CARDS GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
          gap: "24px",
        }}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className="arch-card"
              style={{
                padding: "24px",
                cursor: "pointer",
                border: isSelected
                  ? "1px solid var(--accent-amber)"
                  : "1px solid var(--border-card)",
                background: isSelected
                  ? "rgba(30, 41, 68, 0.95)"
                  : "var(--bg-card)",
                boxShadow: isSelected
                  ? "0 0 30px rgba(245, 158, 11, 0.3)"
                  : "none",
              }}
            >
              {/* TOP: ICON & STOCK */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--border-card)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {ICON_MAP[cat.iconName]}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    padding: "4px 8px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <PackageCheck size={12} color="var(--accent-amber)" />
                  <span>{cat.inStockCount.toLocaleString()} {cat.unit}</span>
                </div>
              </div>

              {/* TITLES */}
              <div style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#ffffff" }}>
                    {cat.name}
                  </h3>
                  <span style={{ fontSize: "12px", color: "var(--accent-amber)" }}>
                    ({cat.hindiName})
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.4 }}>
                  {cat.tagline}
                </p>
              </div>

              {/* SPEC */}
              <div style={{ marginBottom: "18px" }}>
                <div
                  style={{
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-secondary)",
                    background: "rgba(255, 255, 255, 0.03)",
                    padding: "6px 10px",
                    borderRadius: "4px",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <span style={{ color: "var(--accent-amber)", fontWeight: 700 }}>STANDARD:</span> {cat.specs}
                </div>
              </div>

              {/* BOTTOM: PRICE */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  paddingTop: "14px",
                }}
              >
                <div>
                  <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                    SPOT STARTING RATE
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff", fontFamily: "var(--font-mono)" }}>
                      {cat.basePrice}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      / {cat.unit}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: isSelected ? "var(--accent-amber)" : "rgba(255, 255, 255, 0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isSelected ? "#080c14" : "var(--accent-amber)",
                  }}
                >
                  <ArrowUpRight size={16} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
