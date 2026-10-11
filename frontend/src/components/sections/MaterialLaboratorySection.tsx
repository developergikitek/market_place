"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle,
  Layers,
  Award,
  ArrowRight,
  FlaskConical,
} from "lucide-react";

interface MaterialSpec {
  id: string;
  name: string;
  hindiName: string;
  millBrand: string;
  category: string;
  grade: string;
  properties: { label: string; value: string; pass: boolean }[];
  description: string;
  labTestReport: string;
  basePrice: string;
  unit: string;
}

const INSPECT_MATERIALS: MaterialSpec[] = [
  {
    id: "tmt-550d",
    name: "Primary TMT Steel Rebar (12mm)",
    hindiName: "प्राइमरी सरिया (Fe-550D)",
    millBrand: "Tata Tiscon / Jindal Panther Direct",
    category: "High-Ductility Rebar",
    grade: "IS 1786:2008 Grade Fe-550D",
    properties: [
      { label: "Yield Strength (0.2% Proof)", value: "585 N/mm² (Std > 550)", pass: true },
      { label: "Tensile Strength (UTS)", value: "670 N/mm² (Std > 600)", pass: true },
      { label: "Total Elongation at Break", value: "18.5% (High Ductility)", pass: true },
      { label: "Bend / Re-Bend Mandrel", value: "180° Crack-Free", pass: true },
      { label: "Phosphorus + Sulphur", value: "0.052% (Max Limit 0.075%)", pass: true },
    ],
    description:
      "Produced via German Tempcore quenching technology. Distinct transverse ribs mechanically interlock with surrounding concrete to yield 30% higher bonding strength and superior earthquake seismic resistance.",
    labTestReport: "NABL ACCREDITED TEST REPORT #MTC-9942B (VERIFIED)",
    basePrice: "₹58,400",
    unit: "MT",
  },
  {
    id: "cement-opc53",
    name: "UltraTech High Early Strength OPC 53",
    hindiName: "अल्ट्राटेक ओपीसी-53 सीमेंट",
    millBrand: "UltraTech / Ambuja Direct Depots",
    category: "Structural Clinker",
    grade: "IS 269:2015 53-Grade High Strength",
    properties: [
      { label: "28-Day Compressive Strength", value: "58.5 MPa (Std > 53.0)", pass: true },
      { label: "7-Day Early Strength", value: "41.2 MPa (Std > 37.0)", pass: true },
      { label: "Initial Setting Time", value: "48 Minutes (Std > 30m)", pass: true },
      { label: "Specific Surface (Blaine)", value: "345 m²/kg (Ultra-Fine)", pass: true },
      { label: "Insoluble Residue", value: "1.8% (Max Limit 4.0%)", pass: true },
    ],
    description:
      "Formulated with pure calcined clinker and micro-gypsum. Enables earlier formwork removal in just 7 days, cutting weeks off critical high-rise RCC cycle timelines.",
    labTestReport: "IS 269 BATCH REPORT #UT-53-0981 (VERIFIED)",
    basePrice: "₹388",
    unit: "Bag (50kg)",
  },
  {
    id: "aac-block",
    name: "Autoclaved Aerated Concrete Blocks",
    hindiName: "सिपोरेक्स AAC ब्लॉक",
    millBrand: "Siporex / Magicrete Certified Plant",
    category: "Precision Masonry",
    grade: "IS 2185 Part 3 (Class 1 Thermal)",
    properties: [
      { label: "Dry Density", value: "580 kg/m³ (3x Lighter than Brick)", pass: true },
      { label: "Compressive Strength", value: "4.2 N/mm² (Class A Structural)", pass: true },
      { label: "Thermal Conductivity (k)", value: "0.16 W/m-K (Energy Saving)", pass: true },
      { label: "Fire Resistance", value: "4 Hours (Non-Combustible)", pass: true },
      { label: "Joint Mortar Consumption", value: "70% Reduction vs Red Bricks", pass: true },
    ],
    description:
      "Formed using high-pressure steam autoclaving. Uniform micro-cellular air voids reduce dead-weight loads on foundational columns, lowering total structural steel tonnage required by up to 15%.",
    labTestReport: "GREENPRO CERTIFICATE #AAC-GR1-4412 (VERIFIED)",
    basePrice: "₹58",
    unit: "Piece",
  },
  {
    id: "robo-msand",
    name: "VSI Triple-Washed Robo M-Sand",
    hindiName: "रोबो एम-सैंड (जोन II)",
    millBrand: "Deccan Basalt Quarry Fleet",
    category: "Manufactured Fine Aggregate",
    grade: "IS 383:2016 Zone-II Sieve Spec",
    properties: [
      { label: "Silt & Clay Content", value: "2.1% (Statutory Max 3.0%)", pass: true },
      { label: "Bulk Dry Density", value: "1,680 kg/m³", pass: true },
      { label: "Fineness Modulus (FM)", value: "2.78 (Optimal Workability)", pass: true },
      { label: "Crushing Value", value: "14.2% (High Toughness)", pass: true },
      { label: "Organic Impurities", value: "0.0% (100% Machine Washed)", pass: true },
    ],
    description:
      "Crushed from virgin black basalt using Vertical Shaft Impactors (VSI). Produces perfectly cubical grains with optimal surface friction, preventing shrinkage cracks and honeycomb cavities in RCC column casting.",
    labTestReport: "IS 383 LAB REPORT #QUARRY-MS-8810 (VERIFIED)",
    basePrice: "₹1,450",
    unit: "Brass (100 cu.ft)",
  },
];

interface MaterialLaboratorySectionProps {
  onOpenRFQ: () => void;
}

export default function MaterialLaboratorySection({
  onOpenRFQ,
}: MaterialLaboratorySectionProps) {
  const [selectedId, setSelectedId] = useState("tmt-550d");
  const activeMat = INSPECT_MATERIALS.find((m) => m.id === selectedId) || INSPECT_MATERIALS[0];

  return (
    <section
      id="laboratory"
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
            NABL QUALITY ASSURANCE LAB
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
          Physical Material Quality Inspection
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px", maxWidth: "680px", marginTop: "6px" }}>
          Examine the exact metallurgical, chemical, and compressive stress test results before confirming high-tonnage deliveries.
        </p>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "32px", flexWrap: "wrap" }}>
        {INSPECT_MATERIALS.map((mat) => {
          const isSelected = mat.id === selectedId;
          return (
            <button
              key={mat.id}
              onClick={() => setSelectedId(mat.id)}
              style={{
                background: isSelected ? "var(--accent-amber)" : "rgba(255, 255, 255, 0.05)",
                color: isSelected ? "#080c14" : "#ffffff",
                border: isSelected ? "1px solid var(--accent-amber)" : "1px solid var(--border-card)",
                padding: "12px 20px",
                borderRadius: "8px",
                fontSize: "13px",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.15s",
              }}
            >
              <span>{mat.name.split("(")[0]}</span>
              <span style={{ fontSize: "11px", opacity: 0.8 }}>({mat.hindiName})</span>
            </button>
          );
        })}
      </div>

      {/* INSPECTION BENCH CARD */}
      <div
        className="arch-card"
        style={{
          padding: "36px",
          background: "rgba(13, 18, 31, 0.95)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "36px",
            alignItems: "center",
          }}
        >
          {/* LEFT: PHYSICAL SPECIMEN VISUALIZER */}
          <div
            style={{
              background: "linear-gradient(135deg, #111827 0%, #1e293b 100%)",
              border: "1px solid var(--border-card)",
              borderRadius: "12px",
              padding: "28px",
              minHeight: "340px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="stamp-seal">
                TEST SPECIMEN // GRADE A
              </span>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "#10b981", display: "flex", alignItems: "center", gap: "4px" }}>
                <CheckCircle size={13} />
                <span>NABL 100% VERIFIED</span>
              </span>
            </div>

            {/* CENTRAL VISUAL */}
            <div style={{ textAlign: "center", padding: "30px 10px" }}>
              {activeMat.id === "tmt-550d" && (
                <div>
                  <div
                    style={{
                      height: "38px",
                      background: "linear-gradient(90deg, #334155, #64748b 30%, #f59e0b 50%, #475569 80%)",
                      borderRadius: "6px",
                      position: "relative",
                      border: "2px solid var(--accent-amber)",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "repeating-linear-gradient(60deg, transparent, transparent 10px, rgba(255,255,255,0.2) 10px, rgba(255,255,255,0.2) 14px)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        fontSize: "11px",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 800,
                        letterSpacing: "1.5px",
                        color: "#ffffff",
                        textShadow: "0 0 6px rgba(0,0,0,0.8)",
                      }}
                    >
                      TATA TISCON 550D // HEAT HT-9942B
                    </div>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--accent-amber)", marginTop: "14px", fontFamily: "var(--font-mono)" }}>
                    DIAMETER: 12.0 mm • RIB SPACING: 7.2 mm • TEMPCORE DUCTILITY
                  </div>
                </div>
              )}

              {activeMat.id === "cement-opc53" && (
                <div>
                  <div
                    style={{
                      width: "160px",
                      height: "190px",
                      background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                      borderRadius: "14px",
                      margin: "0 auto",
                      boxShadow: "0 15px 35px rgba(0,0,0,0.7)",
                      border: "2px solid #f59e0b",
                      padding: "16px 12px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      color: "#ffffff",
                    }}
                  >
                    <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", fontWeight: 800 }}>
                      ULTRATECH CEMENT
                    </div>
                    <div style={{ fontSize: "28px", fontWeight: 800, fontFamily: "var(--font-heading)" }}>
                      OPC 53
                    </div>
                    <div style={{ fontSize: "9px", fontFamily: "var(--font-mono)", background: "rgba(0,0,0,0.3)", padding: "4px", borderRadius: "4px" }}>
                      50.0 KG • IS 269:2015
                    </div>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--accent-amber)", marginTop: "14px", fontFamily: "var(--font-mono)" }}>
                    TAMPER-PROOF HDPE • 58.5 MPa 28-DAY STRENGTH
                  </div>
                </div>
              )}

              {activeMat.id === "aac-block" && (
                <div>
                  <div
                    style={{
                      width: "220px",
                      height: "100px",
                      background: "linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)",
                      borderRadius: "6px",
                      margin: "0 auto",
                      boxShadow: "0 15px 35px rgba(0,0,0,0.6)",
                      border: "1px solid #94a3b8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#0f172a",
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      fontWeight: 800,
                    }}
                  >
                    600 x 200 x 150 mm // GRADE 1
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--accent-amber)", marginTop: "14px", fontFamily: "var(--font-mono)" }}>
                    580 KG/M³ DENSITY • 4-HOUR CLASS A FIRE RATING
                  </div>
                </div>
              )}

              {activeMat.id === "robo-msand" && (
                <div>
                  <div
                    style={{
                      width: "180px",
                      height: "90px",
                      background: "radial-gradient(ellipse at center, #d97706 0%, #78350f 100%)",
                      borderRadius: "50% 50% 10% 10%",
                      margin: "0 auto",
                      boxShadow: "0 15px 30px rgba(0,0,0,0.7)",
                      border: "1px solid #f59e0b",
                    }}
                  />
                  <div style={{ fontSize: "11px", color: "var(--accent-amber)", marginTop: "14px", fontFamily: "var(--font-mono)" }}>
                    100% CUBICAL BASALT • ZONE-II (SILT &lt; 2.1%)
                  </div>
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>MILL GATE SPOT RATE:</span>
              <strong style={{ fontSize: "20px", fontFamily: "var(--font-mono)", color: "var(--accent-amber)" }}>
                {activeMat.basePrice} <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>/ {activeMat.unit}</span>
              </strong>
            </div>
          </div>

          {/* RIGHT: QUALITY REPORT TABLE */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Award size={18} color="var(--accent-amber)" />
              <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--accent-amber)", fontWeight: 700 }}>
                {activeMat.labTestReport}
              </span>
            </div>

            <h3 style={{ fontSize: "24px", fontWeight: 800, color: "#ffffff", marginBottom: "6px" }}>
              {activeMat.name}
            </h3>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "14px" }}>
              Producer: <strong style={{ color: "#ffffff" }}>{activeMat.millBrand}</strong>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "20px" }}>
              {activeMat.description}
            </p>

            {/* CHECKLIST */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
              {activeMat.properties.map((prop, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--border-card)",
                    borderRadius: "6px",
                    padding: "8px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>{prop.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong style={{ fontFamily: "var(--font-mono)", color: "#ffffff" }}>{prop.value}</strong>
                    <span style={{ color: "#10b981", fontSize: "10px", fontWeight: 700 }}>✓ PASS</span>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={onOpenRFQ} className="btn-primary" style={{ width: "100%" }}>
              <span>ALLOCATE DIRECT LOT FOR {activeMat.name.split("(")[0].toUpperCase()}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
