"use client";

import React, { useEffect, useState } from "react";
import { Compass, HardHat, ShieldCheck, Ruler } from "lucide-react";

interface PhaseData {
  phase: string;
  name: string;
  subtitle: string;
  elevation: string;
  load: string;
  tolerance: string;
  status: string;
}

const PHASES: PhaseData[] = [
  {
    phase: "STAGE 01",
    name: "SUBSTRUCTURE & RAFT CONCRETE",
    subtitle: "Excavation, Soil Bearing Test & Raft Dowel Cage",
    elevation: "±0.00 M",
    load: "850 kN/m²",
    tolerance: "±1.5 mm",
    status: "CASTING COMPLETE",
  },
  {
    phase: "STAGE 02",
    name: "PRIMARY TMT REBAR & FRAMING",
    subtitle: "Tata Tiscon Fe-550D Heavy Structural Columns",
    elevation: "+18.40 M",
    load: "2,400 kN",
    tolerance: "±0.8 mm",
    status: "TOWER CRANE ACTIVE",
  },
  {
    phase: "STAGE 03",
    name: "OPC-53 MONOLITHIC SLAB POUR",
    subtitle: "High Early Strength Pour with Drop Beams",
    elevation: "+36.80 M",
    load: "3,850 kN",
    tolerance: "±1.0 mm",
    status: "7-DAY CURING",
  },
  {
    phase: "STAGE 04",
    name: "SUPERSTRUCTURE COMPLETION",
    subtitle: "AAC Masonry Envelope & Core Final Inspection",
    elevation: "+54.60 M",
    load: "4,920 kN",
    tolerance: "VERIFIED",
    status: "NABL CERTIFIED",
  },
];

export default function BlueprintStageHUD() {
  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const p = Math.min(Math.max(window.scrollY / totalScroll, 0), 1);
        setScrollPercent(p);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const phaseIndex = Math.min(Math.floor(scrollPercent * 4), 3);
  const current = PHASES[phaseIndex];

  return (
    <aside
      aria-label="Real-time site construction telemetry"
      style={{
        position: "fixed",
        right: "24px",
        top: "95px",
        zIndex: 40,
        maxWidth: "320px",
        pointerEvents: "auto",
      }}
      className="hidden lg:block"
    >
      <div
        className="arch-card"
        style={{
          padding: "16px 20px",
          background: "rgba(13, 18, 31, 0.9)",
          border: "1px solid var(--border-card)",
          boxShadow: "0 15px 35px rgba(0, 0, 0, 0.7)",
        }}
      >
        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="live-indicator" />
            <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--accent-amber)", letterSpacing: "0.5px", fontWeight: 700 }}>
              SITE TELEMETRY // ACTIVE
            </span>
          </div>
          <span
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "#ffffff",
              fontWeight: 800,
            }}
          >
            {Math.round(scrollPercent * 100)}% ERECTED
          </span>
        </div>

        {/* CURRENT STAGE */}
        <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "10px", marginBottom: "12px" }}>
          <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--accent-amber)", fontWeight: 700 }}>
            {current.phase}
          </div>
          <h2 style={{ fontSize: "14px", fontWeight: 800, color: "#f8fafc", margin: "3px 0", letterSpacing: "0.2px" }}>
            {current.name}
          </h2>
          <p style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
            {current.subtitle}
          </p>
        </div>

        {/* METRICS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
          <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "8px 10px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--text-muted)", fontSize: "10px" }}>
              <Compass size={11} color="var(--accent-amber)" />
              <span>ELEVATION</span>
            </div>
            <div style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#f8fafc", marginTop: "2px" }}>
              {current.elevation}
            </div>
          </div>

          <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "8px 10px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--text-muted)", fontSize: "10px" }}>
              <Ruler size={11} color="var(--accent-amber)" />
              <span>DESIGN LOAD</span>
            </div>
            <div style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#f8fafc", marginTop: "2px" }}>
              {current.load}
            </div>
          </div>
        </div>

        {/* CERTIFICATION SEAL */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            padding: "8px 12px",
            borderRadius: "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <ShieldCheck size={14} color="var(--accent-amber)" />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#f8fafc" }}>
              {current.status}
            </span>
          </div>
          <HardHat size={13} color="var(--accent-amber)" />
        </div>

        {/* PROGRESS LINE */}
        <div style={{ marginTop: "12px" }}>
          <div style={{ width: "100%", height: "3px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "2px", overflow: "hidden" }}>
            <div
              style={{
                width: `${scrollPercent * 100}%`,
                height: "100%",
                background: "var(--accent-amber)",
                transition: "width 0.15s ease-out",
              }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
