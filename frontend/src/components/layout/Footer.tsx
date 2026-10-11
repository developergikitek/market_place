"use client";

import React, { useState } from "react";
import {
  Building2,
  PhoneCall,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function Footer() {
  const [sellerModalOpen, setSellerModalOpen] = useState(false);
  const [sellerFormSubmitted, setSellerFormSubmitted] = useState(false);

  const handleSellerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSellerFormSubmitted(true);
    setTimeout(() => {
      setSellerFormSubmitted(false);
      setSellerModalOpen(false);
    }, 2500);
  };

  return (
    <footer
      style={{
        position: "relative",
        background: "#080c14",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        zIndex: 20,
      }}
    >
      <div style={{ height: "4px" }} className="safety-stripe" />

      <div
        style={{
          maxWidth: "1320px",
          margin: "0 auto",
          padding: "80px 28px 40px 28px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "48px",
            marginBottom: "60px",
          }}
        >
          {/* COLUMN 1: BRAND */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  background: "linear-gradient(135deg, #f59e0b 0%, #111827 100%)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #f59e0b",
                }}
              >
                <Building2 size={20} color="#080c14" />
              </div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: 800, color: "#ffffff", letterSpacing: "0.5px" }}>
                STRUKTUR <span style={{ color: "var(--accent-amber)" }}>//</span> X
              </div>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "20px" }}>
              The high-velocity institutional procurement exchange for infrastructure constructors, heavy civil developers, and primary mills. Standardizing pricing, logistics SLAs, and laboratory verification.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "var(--accent-amber)", fontFamily: "var(--font-mono)" }}>
              <ShieldCheck size={14} />
              <span>NABL LAB ASSURED • IS:1786 COMPLIANT</span>
            </div>
          </div>

          {/* COLUMN 2: CATEGORIES */}
          <div>
            <h4 style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "var(--accent-amber)", letterSpacing: "1px", marginBottom: "18px", fontWeight: 700 }}>
              MATERIAL TAXONOMIES
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <li><a href="#categories" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Primary TMT Rebar (Fe-550D)</a></li>
              <li><a href="#categories" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>OPC 53 & Pozzolana Cement</a></li>
              <li><a href="#categories" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Precision AAC Lightweight Blocks</a></li>
              <li><a href="#categories" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>VSI Robo M-Sand (Zone II)</a></li>
              <li><a href="#categories" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Graded Crushed Blue Metal (20mm)</a></li>
              <li><a href="#categories" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Industrial Anti-Corrosive Coatings</a></li>
            </ul>
          </div>

          {/* COLUMN 3: HUBS */}
          <div>
            <h4 style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "#ffffff", letterSpacing: "1px", marginBottom: "18px", fontWeight: 700 }}>
              REGIONAL DISPATCH TERMINALS
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px", color: "var(--text-secondary)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <MapPin size={14} color="var(--accent-amber)" style={{ marginTop: "2px", flexShrink: 0 }} />
                <span>Western Command: BKC Corporate Hub & Nhava Sheva Freight Yard, Mumbai MMR</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <MapPin size={14} color="var(--accent-amber)" style={{ marginTop: "2px", flexShrink: 0 }} />
                <span>Northern Command: Greater Noida Expressway Logistics Park, Delhi NCR</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <MapPin size={14} color="var(--accent-amber)" style={{ marginTop: "2px", flexShrink: 0 }} />
                <span>Southern Command: Peenya Industrial Corridor, Bengaluru</span>
              </div>
            </div>
          </div>

          {/* COLUMN 4: ONBOARDING */}
          <div>
            <h4 style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "var(--accent-amber)", letterSpacing: "1px", marginBottom: "18px", fontWeight: 700 }}>
              MILL & SELLER ONBOARDING
            </h4>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "16px" }}>
              Are you an authorized steel rebar distributor, cement depot, or quarry owner? Join 140+ audited producers.
            </p>

            <button
              onClick={() => setSellerModalOpen(true)}
              className="btn-primary"
              style={{ width: "100%", padding: "11px 16px", fontSize: "12px" }}
            >
              <span>APPLY AS VERIFIED SUPPLIER</span>
              <ArrowRight size={14} />
            </button>

            <div style={{ marginTop: "16px", fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
              <PhoneCall size={12} color="var(--accent-amber)" />
              <span>Dedicated Mill Desk: +91 (022) 6940-8800</span>
            </div>
          </div>
        </div>

        {/* BOTTOM COMPLIANCE */}
        <div
          style={{
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            paddingTop: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
            fontSize: "12px",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <div>
            © 2026 STRUKTUR // X HEAVY MATERIALS TECHNOLOGIES LTD. ALL RIGHTS RESERVED.
          </div>

          <div style={{ display: "flex", gap: "20px" }}>
            <span>GSTIN: 27AABCS9912K1Z9</span>
            <span>CIN: U28112MH2024PTC394812</span>
            <span>NABL REG: TC-8419</span>
          </div>
        </div>
      </div>

      {/* SELLER ONBOARDING MODAL */}
      {sellerModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 120,
            background: "rgba(8, 12, 20, 0.9)",
            backdropFilter: "blur(16px)",
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
              maxWidth: "520px",
              background: "#0d121f",
              border: "1px solid var(--border-amber)",
              padding: "28px",
              position: "relative",
            }}
          >
            <button
              onClick={() => setSellerModalOpen(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "transparent",
                border: "none",
                color: "#ffffff",
                cursor: "pointer",
                fontSize: "18px",
              }}
            >
              ✕
            </button>

            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff", marginBottom: "6px", fontFamily: "var(--font-heading)" }}>
              PRODUCER & MILL REGISTRATION
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "20px" }}>
              Submit your mill license or quarry lease for expedited 24-hour verification.
            </p>

            {sellerFormSubmitted ? (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <CheckCircle2 size={40} color="#10b981" style={{ margin: "0 auto 12px auto" }} />
                <h4 style={{ color: "#ffffff", fontSize: "16px", marginBottom: "6px" }}>Application Received!</h4>
                <p style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                  Our Regional Vendor Onboarding Officer will contact your plant manager within 4 business hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSellerSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    ENTERPRISE / MILL NAME
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Steel & Rolling Mills Pvt Ltd"
                    style={{
                      width: "100%",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid var(--border-card)",
                      borderRadius: "6px",
                      padding: "8px 12px",
                      color: "#ffffff",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    CORE COMMODITY MANUFACTURED
                  </label>
                  <select
                    style={{
                      width: "100%",
                      background: "#111827",
                      border: "1px solid var(--border-card)",
                      borderRadius: "6px",
                      padding: "8px 12px",
                      color: "#ffffff",
                      fontSize: "13px",
                    }}
                  >
                    <option>Primary TMT Rebar Mill (Fe-550D / 500D)</option>
                    <option>Cement Producer / Grinding Unit (OPC / PPC)</option>
                    <option>Autoclaved Aerated Concrete (AAC) Plant</option>
                    <option>Robo M-Sand VSI Quarry</option>
                    <option>Crushed Granite Aggregates Quarry</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    GSTIN & CONTACT PHONE
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    style={{
                      width: "100%",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid var(--border-card)",
                      borderRadius: "6px",
                      padding: "8px 12px",
                      color: "#ffffff",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: "100%", marginTop: "6px" }}
                >
                  SUBMIT CREDENTIALS FOR AUDIT
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </footer>
  );
}
