"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  Calculator,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface BulkProcurementSectionProps {
  activeCity: string;
  onLaunchBidding: (data: {
    material: string;
    qty: number;
    unit: string;
    pincode: string;
    totalCost: number;
  }) => void;
}

const BULK_MATERIALS = [
  { id: "steel-550d", name: "TMT Rebar Steel (Fe-550D)", unit: "MT", baseRate: 57800, min: 10, max: 300, step: 5 },
  { id: "cement-opc53", name: "UltraTech / Ambuja OPC 53", unit: "Bags", baseRate: 385, min: 200, max: 5000, step: 50 },
  { id: "aac-blocks", name: "Autoclaved Aerated Concrete Blocks", unit: "Pcs", baseRate: 58, min: 1000, max: 30000, step: 500 },
  { id: "robo-msand", name: "VSI Robo M-Sand (Zone II)", unit: "Brass", baseRate: 1450, min: 5, max: 100, step: 2 },
  { id: "blue-metal-20mm", name: "Crushed Aggregates (20mm)", unit: "MT", baseRate: 1850, min: 20, max: 500, step: 10 },
];

export default function BulkProcurementSection({
  activeCity,
  onLaunchBidding,
}: BulkProcurementSectionProps) {
  const [selectedMatId, setSelectedMatId] = useState(BULK_MATERIALS[0].id);
  const currentMat = BULK_MATERIALS.find((m) => m.id === selectedMatId) || BULK_MATERIALS[0];

  const [quantity, setQuantity] = useState(30);
  const [pincode, setPincode] = useState("400001");
  const [unloadingType, setUnloadingType] = useState<"crane" | "dumper" | "manual">("crane");

  const rawCost = currentMat.baseRate * quantity;

  // Bulk Tier Discount
  let discountRate = 0;
  if (quantity >= currentMat.min * 5) discountRate = 0.085;
  else if (quantity >= currentMat.min * 2) discountRate = 0.05;
  else if (quantity >= currentMat.min * 1.5) discountRate = 0.025;

  const discountAmount = rawCost * discountRate;
  const discountedCost = rawCost - discountAmount;

  const freightRatePerUnit = currentMat.unit === "MT" ? 650 : currentMat.unit === "Bags" ? 18 : 220;
  const unloadingAddon = unloadingType === "crane" ? 1800 : unloadingType === "dumper" ? 950 : 0;
  const freightTotal = (freightRatePerUnit * quantity) + unloadingAddon;

  const subTotal = discountedCost + freightTotal;
  const gstAmount = subTotal * 0.18;
  const grandTotalDelivered = Math.round(subTotal + gstAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLaunchBidding({
      material: currentMat.name,
      qty: quantity,
      unit: currentMat.unit,
      pincode,
      totalCost: grandTotalDelivered,
    });
  };

  return (
    <section
      id="procurement"
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
            BULK PROCUREMENT & REVERSE AUCTION
          </span>
        </div>

        <h2
          style={{
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 800,
            color: "#ffffff",
            fontFamily: "var(--font-heading)",
          }}
        >
          High-Volume Site Quotation Engine
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px", maxWidth: "680px", marginTop: "6px" }}>
          Calculate exact site-delivered pricing with mill tier volume discounts, computerized freight matching, and automated multi-seller reverse bidding.
        </p>
      </div>

      {/* CALCULATOR & BIDDING CARD */}
      <div
        className="arch-card"
        style={{
          padding: "36px",
          background: "rgba(13, 18, 31, 0.95)",
        }}
      >
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "36px",
            }}
          >
            {/* LEFT COLUMN: PARAMETER CONTROLS */}
            <div>
              {/* MATERIAL SELECTOR */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: "8px", fontWeight: 700 }}>
                  1. SELECT STRUCTURAL COMMODITY
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {BULK_MATERIALS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedMatId(m.id);
                        setQuantity(m.min * 2);
                      }}
                      style={{
                        textAlign: "left",
                        background: m.id === selectedMatId ? "rgba(245, 158, 11, 0.15)" : "rgba(255, 255, 255, 0.03)",
                        border: m.id === selectedMatId ? "1px solid var(--accent-amber)" : "1px solid var(--border-card)",
                        padding: "10px 14px",
                        borderRadius: "6px",
                        color: "#ffffff",
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontWeight: m.id === selectedMatId ? 700 : 500 }}>{m.name}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: m.id === selectedMatId ? "var(--accent-amber)" : "var(--text-muted)" }}>
                        Base: ₹{m.baseRate.toLocaleString()} / {m.unit}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* QUANTITY SLIDER */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                  <label style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", fontWeight: 700 }}>
                    2. PROCUREMENT VOLUME
                  </label>
                  <span style={{ fontSize: "18px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--accent-amber)" }}>
                    {quantity} {currentMat.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={currentMat.min}
                  max={currentMat.max}
                  step={currentMat.step}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  style={{
                    width: "100%",
                    accentColor: "var(--accent-amber)",
                    cursor: "pointer",
                    height: "6px",
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginTop: "4px" }}>
                  <span>Min: {currentMat.min} {currentMat.unit}</span>
                  {discountRate > 0 && (
                    <span style={{ color: "#10b981", fontWeight: 700 }}>
                      🔥 {(discountRate * 100).toFixed(1)}% Bulk Tier Applied!
                    </span>
                  )}
                  <span>Max: {currentMat.max} {currentMat.unit}</span>
                </div>
              </div>

              {/* SITE PINCODE & UNLOADING */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: "6px" }}>
                    SITE PINCODE ({activeCity})
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    style={{
                      width: "100%",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid var(--border-card)",
                      borderRadius: "6px",
                      padding: "8px 12px",
                      color: "#f8fafc",
                      fontSize: "13px",
                      fontFamily: "var(--font-mono)",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: "6px" }}>
                    OFFLOADING METHOD
                  </label>
                  <select
                    value={unloadingType}
                    onChange={(e) => setUnloadingType(e.target.value as any)}
                    style={{
                      width: "100%",
                      background: "#111827",
                      border: "1px solid var(--border-card)",
                      borderRadius: "6px",
                      padding: "8px 10px",
                      color: "#f8fafc",
                      fontSize: "12px",
                    }}
                  >
                    <option value="crane">Mobile Crane Unload</option>
                    <option value="dumper">Hydraulic Dumper Tip</option>
                    <option value="manual">Client's Labor (No Surcharge)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: INVOICE BREAKDOWN */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "10px",
                border: "1px solid var(--border-card)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <Calculator size={16} color="var(--accent-amber)" />
                  <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--accent-amber)", fontWeight: 700 }}>
                    ESTIMATED COMMERCIAL COST BREAKDOWN
                  </span>
                </div>

                {/* BREAKDOWN ROWS */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Base Factory Gate Cost ({quantity} {currentMat.unit}):</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "#ffffff" }}>₹{rawCost.toLocaleString()}</span>
                  </div>

                  {discountRate > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#10b981" }}>
                      <span>Volume Discount ({(discountRate * 100).toFixed(1)}%):</span>
                      <span style={{ fontFamily: "var(--font-mono)" }}>- ₹{Math.round(discountAmount).toLocaleString()}</span>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Multi-Axle Freight & Tolls ({pincode}):</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "#ffffff" }}>₹{freightTotal.toLocaleString()}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Applicable GST (18% Statutory):</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "#ffffff" }}>₹{Math.round(gstAmount).toLocaleString()}</span>
                  </div>

                  <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.12)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontWeight: 700, color: "#ffffff", fontSize: "15px" }}>Estimated Delivered Total:</span>
                    <span style={{ fontSize: "26px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--accent-amber)" }}>
                      ₹{grandTotalDelivered.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(245, 158, 11, 0.06)",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                    borderRadius: "6px",
                    padding: "10px 12px",
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "20px",
                  }}
                >
                  <ShieldCheck size={16} color="var(--accent-amber)" />
                  <span>
                    Price lock valid for 24 hours. Includes digital weighbridge slip and NABL Mill Test Certificate.
                  </span>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <button
                type="submit"
                className="btn-primary"
                style={{
                  width: "100%",
                  padding: "14px 20px",
                  fontSize: "13px",
                }}
              >
                <Zap size={16} />
                <span>LAUNCH REVERSE AUCTION BIDDING</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
