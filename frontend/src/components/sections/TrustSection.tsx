"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Scale,
  Lock,
  FileText,
  Navigation,
  Radio,
  CheckCircle2,
} from "lucide-react";

export default function TrustSection() {
  const [activeTab, setActiveTab] = useState<"tracking" | "weighbridge" | "escrow">("tracking");

  return (
    <section
      id="trust"
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
            DISPATCH ASSURANCE & LOGISTICS INTEGRITY
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
          Engineering Trust & Live Fleet Telemetry
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px", maxWidth: "680px", marginTop: "6px" }}>
          Eliminate site shortages, off-grade steel, and transit theft with automated weighbridge tare verification, live GPS vehicle tracking, and escrow milestones.
        </p>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "28px", flexWrap: "wrap" }}>
        {[
          { id: "tracking", label: "Live Fleet GPS Tracking", icon: <Navigation size={14} /> },
          { id: "weighbridge", label: "Digital Weighbridge Slips", icon: <Scale size={14} /> },
          { id: "escrow", label: "Milestone Escrow Protection", icon: <Lock size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              background: activeTab === tab.id ? "rgba(245, 158, 11, 0.15)" : "rgba(255, 255, 255, 0.04)",
              border: activeTab === tab.id ? "1px solid var(--accent-amber)" : "1px solid var(--border-card)",
              color: activeTab === tab.id ? "var(--accent-amber)" : "var(--text-secondary)",
              padding: "10px 18px",
              borderRadius: "8px",
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: activeTab === tab.id ? 700 : 500,
              transition: "all 0.15s",
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT CARDS */}
      {activeTab === "tracking" && (
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
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "28px",
            }}
          >
            {/* LEFT: STATUS */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Radio size={16} color="var(--accent-amber)" />
                  <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--accent-amber)", fontWeight: 700 }}>
                    VEHICLE #MH-04-KP-8821 // ACTIVE TRANSIT
                  </span>
                </div>
                <span style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10b981", color: "#10b981", fontSize: "11px", fontFamily: "var(--font-mono)", padding: "2px 8px", borderRadius: "4px" }}>
                  E-SEAL: INTACT
                </span>
              </div>

              <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-card)", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "13px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Manifest Cargo:</span>
                  <strong style={{ color: "#ffffff" }}>40 MT Tata Tiscon 550D (12mm & 16mm)</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "13px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Dispatch Mill Origin:</span>
                  <strong style={{ color: "var(--accent-amber)" }}>Jamshedpur Primary Mill Yard #04</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Destination Site:</span>
                  <strong style={{ color: "#ffffff" }}>Metro Tower Project, Mumbai MMR</strong>
                </div>
              </div>

              {/* GAUGES */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "10px", borderRadius: "6px", textAlign: "center", border: "1px solid var(--border-card)" }}>
                  <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>CURRENT SPEED</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#ffffff" }}>58 km/h</div>
                </div>
                <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "10px", borderRadius: "6px", textAlign: "center", border: "1px solid var(--border-card)" }}>
                  <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>SITE ETA</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent-amber)" }}>2h 15m</div>
                </div>
                <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "10px", borderRadius: "6px", textAlign: "center", border: "1px solid var(--border-card)" }}>
                  <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>DISTANCE LEFT</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#ffffff" }}>78 km</div>
                </div>
              </div>
            </div>

            {/* RIGHT: ROUTE TIMELINE */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border-card)",
                borderRadius: "8px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-around",
              }}
            >
              {[
                { title: "Mill Loading & RFID Tag Attached", time: "06:30 AM", done: true },
                { title: "Digital Weighbridge Net Tare Recorded (54.2 MT Gross)", time: "07:15 AM", done: true },
                { title: "Expressway Highway Transit Via NH-48", time: "09:40 AM (Current)", done: true, active: true },
                { title: "Site Geofence Entry Trigger (Estimated)", time: "11:55 AM", done: false },
                { title: "Mobile Crane Offloading & Slip Verification", time: "12:30 PM", done: false },
              ].map((step, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: step.active
                        ? "var(--accent-amber)"
                        : step.done
                        ? "#10b981"
                        : "rgba(255, 255, 255, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: "2px",
                      flexShrink: 0,
                    }}
                  >
                    {step.done ? <CheckCircle2 size={12} color="#ffffff" /> : <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ffffff" }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: step.active ? 700 : 500, color: step.active ? "var(--accent-amber)" : step.done ? "#ffffff" : "var(--text-muted)" }}>
                      {step.title}
                    </div>
                    <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                      {step.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "weighbridge" && (
        <div className="arch-card" style={{ padding: "32px", background: "rgba(13, 18, 31, 0.95)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "20px", borderRadius: "8px", border: "1px solid var(--border-card)" }}>
              <Scale size={24} color="var(--accent-amber)" style={{ marginBottom: "12px" }} />
              <h3 style={{ fontSize: "16px", color: "#ffffff", fontWeight: 700, marginBottom: "8px" }}>
                Tamper-Proof Automated Tare Weights
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Every multi-axle dumper passes through certified electronic weighbridges at the factory exit and on arrival at your project site. Dual tare slips guarantee zero quantity discrepancies.
              </p>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "20px", borderRadius: "8px", border: "1px solid var(--border-card)" }}>
              <FileText size={24} color="var(--accent-amber)" style={{ marginBottom: "12px" }} />
              <h3 style={{ fontSize: "16px", color: "#ffffff", fontWeight: 700, marginBottom: "8px" }}>
                Cryptographic QR Inspection
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Each weighment certificate is accompanied by a unique QR code linked directly to the mill's ERP database. Scan instantly with any smartphone on-site to inspect batch metallurgy.
              </p>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "20px", borderRadius: "8px", border: "1px solid var(--border-card)" }}>
              <ShieldCheck size={24} color="#10b981" style={{ marginBottom: "12px" }} />
              <h3 style={{ fontSize: "16px", color: "#ffffff", fontWeight: 700, marginBottom: "8px" }}>
                100% Shortage Reimbursement
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                If on-site weighment shows any variance exceeding statutory moisture tolerance (&gt;0.5%), the difference is credited back to your account immediately with zero administrative friction.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "escrow" && (
        <div className="arch-card" style={{ padding: "32px", background: "rgba(13, 18, 31, 0.95)" }}>
          <div style={{ maxWidth: "750px" }}>
            <Lock size={28} color="var(--accent-amber)" style={{ marginBottom: "12px" }} />
            <h3 style={{ fontSize: "20px", color: "#ffffff", fontWeight: 700, marginBottom: "10px" }}>
              Milestone Escrow: Payment Released Only After Physical Site Inspection
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "20px" }}>
              When placing high-value procurement orders (₹5 Lakhs to ₹10 Crores), your capital is held safely in a scheduled RBI-regulated escrow account. The supplier only receives payout once your project manager signs the digital gate-pass and confirms lab conformity.
            </p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--accent-amber)" }}>
              <span>✓ Regulated Banking Escrow</span>
              <span>✓ Zero Advance Supplier Default Risk</span>
              <span>✓ Instant Dispute Arbitrage within 4 Hours</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
