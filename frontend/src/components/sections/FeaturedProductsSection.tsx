"use client";

import React, { useState } from "react";
import { ProductItem } from "@/types";
import { PRODUCTS, CATEGORIES } from "@/data/marketplaceData";
import {
  Truck,
  Star,
  FileCheck,
  Plus,
  Minus,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";

interface FeaturedProductsSectionProps {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  searchQuery: string;
  onAddToRFQ: (product: ProductItem, qty: number) => void;
  onViewMTC: (product: ProductItem) => void;
}

export default function FeaturedProductsSection({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onAddToRFQ,
  onViewMTC,
}: FeaturedProductsSectionProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  const filteredProducts = PRODUCTS.filter((p) => {
    const matchesCategory =
      selectedCategory === "all" || p.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.grade.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getQty = (prod: ProductItem) => quantities[prod.id] || prod.minimumOrder;

  const handleQtyChange = (prodId: string, minOrder: number, delta: number) => {
    setQuantities((prev) => {
      const current = prev[prodId] || minOrder;
      const updated = Math.max(minOrder, current + delta);
      return { ...prev, [prodId]: updated };
    });
  };

  const handleAdd = (prod: ProductItem) => {
    const qty = getQty(prod);
    onAddToRFQ(prod, qty);
    setAddedNotice(prod.id);
    setTimeout(() => setAddedNotice(null), 2500);
  };

  return (
    <section
      id="products"
      style={{
        position: "relative",
        padding: "100px 28px",
        zIndex: 10,
        maxWidth: "1320px",
        margin: "0 auto",
      }}
    >
      {/* SECTION HEADER */}
      <div style={{ marginBottom: "40px" }}>
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
            PRIMARY MILL CATALOG
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
              Direct Producer Allocations
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "15px", marginTop: "6px" }}>
              Commercial structural lots directly dispatched from authorized mill depots with digital MTC inspection.
            </p>
          </div>

          {/* FILTER PILLS */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => onSelectCategory("all")}
              style={{
                background: selectedCategory === "all" ? "var(--accent-amber)" : "rgba(255, 255, 255, 0.05)",
                color: selectedCategory === "all" ? "#080c14" : "var(--text-secondary)",
                border: "1px solid var(--border-card)",
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              All Items
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                style={{
                  background: selectedCategory === cat.id ? "var(--accent-amber)" : "rgba(255, 255, 255, 0.05)",
                  color: selectedCategory === cat.id ? "#080c14" : "var(--text-secondary)",
                  border: "1px solid var(--border-card)",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)",
                  cursor: "pointer",
                  fontWeight: selectedCategory === cat.id ? 700 : 500,
                }}
              >
                {cat.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PRODUCTS GRID */}
      {filteredProducts.length === 0 ? (
        <div className="arch-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
          No matching products found. Try selecting another category or resetting the search term.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
            gap: "26px",
          }}
        >
          {filteredProducts.map((prod) => {
            const currentQty = getQty(prod);
            const lineTotal = prod.pricePerUnit * currentQty;
            const isAdded = addedNotice === prod.id;

            return (
              <div
                key={prod.id}
                className="arch-card"
                style={{
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  {/* TOP BADGE */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span className="stamp-seal" style={{ padding: "2px 8px" }}>
                      {prod.featuredTag || "CERTIFIED"}
                    </span>

                    <button
                      type="button"
                      onClick={() => onViewMTC(prod)}
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid var(--border-card)",
                        color: "var(--accent-amber)",
                        fontSize: "11px",
                        fontFamily: "var(--font-mono)",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontWeight: 600,
                      }}
                    >
                      <FileCheck size={12} />
                      <span>VIEW MTC</span>
                    </button>
                  </div>

                  {/* TITLE */}
                  <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#ffffff", lineHeight: 1.3, marginBottom: "4px" }}>
                    {prod.name}
                  </h3>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "14px" }}>
                    Mill: <strong style={{ color: "#e2e8f0" }}>{prod.manufacturer}</strong> • {prod.grade}
                  </div>

                  {/* SELLER & SLA */}
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid var(--border-card)",
                      borderRadius: "6px",
                      padding: "10px 12px",
                      marginBottom: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{prod.sellerName}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "2px", color: "var(--accent-amber)", fontSize: "11px", fontWeight: 700 }}>
                        <Star size={11} fill="#f59e0b" color="#f59e0b" />
                        {prod.sellerRating}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-secondary)" }}>
                      <Truck size={12} color="var(--accent-amber)" />
                      <span>{prod.deliveryEta}</span>
                    </div>
                  </div>

                  {/* SPECS */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "18px" }}>
                    {Object.entries(prod.specs).slice(0, 4).map(([key, val]) => (
                      <div
                        key={key}
                        style={{
                          background: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid rgba(255, 255, 255, 0.05)",
                          padding: "6px 8px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        <span style={{ color: "var(--text-muted)" }}>{key}: </span>
                        <span style={{ color: "#f8fafc", fontWeight: 600 }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BOTTOM: PRICE, QTY & ACTIONS */}
                <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
                    <div>
                      <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                        EX-WORKS SPOT PRICE
                      </div>
                      <div style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#ffffff" }}>
                        ₹{prod.pricePerUnit.toLocaleString()}
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
                          {" "}/ {prod.unit}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                        STOCK DISPATCH
                      </div>
                      <div style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--accent-amber)" }}>
                        {prod.availableStock} {prod.unit} available
                      </div>
                    </div>
                  </div>

                  {/* QTY COUNTER */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid var(--border-card)",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      marginBottom: "12px",
                    }}
                  >
                    <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                      Lot Size ({prod.unit}):
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => handleQtyChange(prod.id, prod.minimumOrder, -1)}
                        style={{
                          background: "rgba(255, 255, 255, 0.08)",
                          border: "none",
                          color: "#ffffff",
                          width: "24px",
                          height: "24px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-mono)", minWidth: "36px", textAlign: "center" }}>
                        {currentQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQtyChange(prod.id, prod.minimumOrder, 1)}
                        style={{
                          background: "rgba(255, 255, 255, 0.08)",
                          border: "none",
                          color: "#ffffff",
                          width: "24px",
                          height: "24px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* LOT VALUE */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", fontSize: "11px", fontFamily: "var(--font-mono)" }}>
                    <span style={{ color: "var(--text-muted)" }}>Lot Value (Pre-Tax):</span>
                    <strong style={{ color: "var(--accent-amber)" }}>₹{lineTotal.toLocaleString()}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAdd(prod)}
                    className="btn-primary"
                    style={{
                      width: "100%",
                      padding: "11px 16px",
                      fontSize: "12px",
                      background: isAdded ? "#10b981" : undefined,
                    }}
                  >
                    {isAdded ? (
                      <>
                        <CheckCircle2 size={15} />
                        <span>ADDED TO RFQ</span>
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet size={15} />
                        <span>ADD TO BULK RFQ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
