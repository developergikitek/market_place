"use client";

import React from "react";
import { ProductItem } from "@/types";
import { X, Award, Download, ShieldCheck } from "lucide-react";

interface CertificateModalProps {
  product: ProductItem | null;
  onClose: () => void;
}

export default function CertificateModal({ product, onClose }: CertificateModalProps) {
  if (!product) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        background: "rgba(8, 12, 20, 0.9)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        className="arch-card"
        style={{
          width: "100%",
          maxWidth: "720px",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#0d121f",
          border: "1px solid var(--border-amber)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.9)",
          padding: "32px",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "rgba(255, 255, 255, 0.08)",
            border: "none",
            color: "#ffffff",
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={18} />
        </button>

        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "8px",
              background: "rgba(245, 158, 11, 0.15)",
              border: "1px solid var(--accent-amber)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Award size={22} color="var(--accent-amber)" />
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--accent-amber)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
              NABL ACCREDITED LAB REPORT // FORM 3.1
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff", fontFamily: "var(--font-heading)" }}>
              MILL TEST CERTIFICATE (MTC)
            </h2>
          </div>
        </div>

        {/* SPECIMEN DETAILS */}
        <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-card)", borderRadius: "8px", padding: "16px", marginBottom: "20px", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Manufacturer: </span>
              <strong style={{ color: "#ffffff" }}>{product.manufacturer}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Commodity Grade: </span>
              <strong style={{ color: "var(--accent-amber)" }}>{product.grade}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Heat / Melt Number: </span>
              <span style={{ color: "#ffffff" }}>#HT-2026-9942B</span>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Standard Specification: </span>
              <span style={{ color: "#ffffff" }}>IS 1786 / IS 269 Compliant</span>
            </div>
          </div>
        </div>

        {/* SPECTROMETRY TABLE */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--accent-amber)", fontWeight: 700, marginBottom: "8px" }}>
            1. CHEMICAL COMPOSITION SPECTROMETRY (% MASS)
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", fontFamily: "var(--font-mono)", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(255, 255, 255, 0.04)", color: "var(--text-muted)" }}>
                <th style={{ padding: "8px" }}>Element</th>
                <th style={{ padding: "8px" }}>Max Limit</th>
                <th style={{ padding: "8px" }}>Observed Value</th>
                <th style={{ padding: "8px" }}>Conformity</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                <td style={{ padding: "8px", color: "#ffffff" }}>Carbon (C)</td>
                <td style={{ padding: "8px" }}>0.25% Max</td>
                <td style={{ padding: "8px", color: "var(--accent-amber)" }}>0.21%</td>
                <td style={{ padding: "8px", color: "#10b981" }}>PASS (Within Limit)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                <td style={{ padding: "8px", color: "#ffffff" }}>Sulphur (S)</td>
                <td style={{ padding: "8px" }}>0.040% Max</td>
                <td style={{ padding: "8px", color: "var(--accent-amber)" }}>0.024%</td>
                <td style={{ padding: "8px", color: "#10b981" }}>PASS (Clean Melt)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                <td style={{ padding: "8px", color: "#ffffff" }}>Phosphorus (P)</td>
                <td style={{ padding: "8px" }}>0.040% Max</td>
                <td style={{ padding: "8px", color: "var(--accent-amber)" }}>0.028%</td>
                <td style={{ padding: "8px", color: "#10b981" }}>PASS (High Purity)</td>
              </tr>
              <tr>
                <td style={{ padding: "8px", color: "#ffffff" }}>Carbon Equivalent (CE)</td>
                <td style={{ padding: "8px" }}>0.42% Max</td>
                <td style={{ padding: "8px", color: "var(--accent-amber)" }}>0.36%</td>
                <td style={{ padding: "8px", color: "#10b981" }}>PASS (High Weldability)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* TENSILE TESTS */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--accent-amber)", fontWeight: 700, marginBottom: "8px" }}>
            2. MECHANICAL TENSILE & DUCTILITY REPORT
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "12px", borderRadius: "6px", border: "1px solid var(--border-card)" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>0.2% PROOF STRESS</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", fontFamily: "var(--font-mono)" }}>585 N/mm²</div>
              <div style={{ fontSize: "10px", color: "#10b981" }}>Standard &gt; 550 N/mm²</div>
            </div>
            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "12px", borderRadius: "6px", border: "1px solid var(--border-card)" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>TENSILE STRENGTH</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", fontFamily: "var(--font-mono)" }}>672 N/mm²</div>
              <div style={{ fontSize: "10px", color: "#10b981" }}>Ratio TS/YS = 1.15</div>
            </div>
            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "12px", borderRadius: "6px", border: "1px solid var(--border-card)" }}>
              <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>TOTAL ELONGATION</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", fontFamily: "var(--font-mono)" }}>18.5%</div>
              <div style={{ fontSize: "10px", color: "#10b981" }}>Super-Ductile Pass</div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "#10b981" }}>
            <ShieldCheck size={16} />
            <span>NABL Verified on Blockchain Audit Node #MTC-889</span>
          </div>

          <button
            onClick={() => {
              alert("Downloading official encrypted PDF certificate for Heat #HT-2026-9942B");
            }}
            className="btn-primary"
            style={{ padding: "8px 18px", fontSize: "12px" }}
          >
            <Download size={14} />
            <span>DOWNLOAD SIGNED PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
