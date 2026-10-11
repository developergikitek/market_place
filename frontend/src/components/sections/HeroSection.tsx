"use client";

import React, { useState } from "react";
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Truck,
  FileCheck2,
  Building,
  Zap,
  HardHat,
} from "lucide-react";

interface HeroSectionProps {
  activeCity: string;
  onSearchChange: (query: string) => void;
  onSelectCategory: (categoryId: string) => void;
  onOpenRFQ: () => void;
}

export default function HeroSection({
  activeCity,
  onSearchChange,
  onSelectCategory,
  onOpenRFQ,
}: HeroSectionProps) {
  const [searchInput, setSearchInput] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchInput);
    const prodEl = document.getElementById("products");
    if (prodEl) {
      prodEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleQuickChip = (term: string, catId?: string) => {
    setSearchInput(term);
    onSearchChange(term);
    if (catId) onSelectCategory(catId);
    const prodEl = document.getElementById("products");
    if (prodEl) {
      prodEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "140px 28px 60px 28px",
        zIndex: 10,
        maxWidth: "1320px",
        margin: "0 auto",
      }}
    >
      {/* 1. OFFICIAL CERTIFICATION STAMP */}
      <div style={{ marginBottom: "20px" }}>
        <div className="stamp-seal">
          <HardHat size={14} />
          <span>INSTITUTIONAL HEAVY CIVIL PROCUREMENT EXCHANGE</span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
          <span style={{ color: "#ffffff" }}>
            HUB: <strong style={{ color: "var(--accent-amber)" }}>{activeCity}</strong>
          </span>
        </div>
      </div>

      {/* 2. MAIN BOLD HEADLINE */}
      <div style={{ maxWidth: "900px" }}>
        <h1
          style={{
            fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: "-1px",
            color: "#ffffff",
            marginBottom: "20px",
            fontFamily: "var(--font-heading)",
          }}
        >
          Build Beyond <br />
          <span
            style={{
              background: "linear-gradient(90deg, #f59e0b 0%, #fbbf24 40%, #ffffff 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Boundaries.
          </span>
        </h1>

        <p
          style={{
            fontSize: "clamp(16px, 1.8vw, 19px)",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            maxWidth: "720px",
            marginBottom: "36px",
          }}
        >
          India’s premier B2B heavy construction materials exchange. Procure high-ductility TMT steel, structural cement, AAC blocks, and aggregates direct from primary mills with 100% NABL Mill Test Certificates and weighbridge dispatch tracking.
        </p>
      </div>

      {/* 3. SEARCH BOX */}
      <div
        className="arch-card"
        style={{
          maxWidth: "840px",
          padding: "18px 24px",
          marginBottom: "36px",
          background: "rgba(13, 18, 31, 0.95)",
        }}
      >
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              flex: "1 1 300px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "rgba(255, 255, 255, 0.04)",
              padding: "12px 18px",
              borderRadius: "8px",
              border: "1px solid var(--border-card)",
            }}
          >
            <Search size={18} color="var(--accent-amber)" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={`Search TMT 12mm, UltraTech OPC 53, AAC Blocks in ${activeCity}...`}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#f8fafc",
                fontSize: "14px",
                width: "100%",
                fontFamily: "var(--font-sans)",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button type="submit" className="btn-primary">
              <span>FIND MILL LOTS</span>
              <ArrowRight size={15} />
            </button>

            <button
              type="button"
              onClick={onOpenRFQ}
              className="btn-secondary"
            >
              <Zap size={14} color="var(--accent-amber)" />
              <span>GET BULK QUOTE</span>
            </button>
          </div>
        </form>

        {/* QUICK SEARCH CHIPS */}
        <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            HOT DEMAND:
          </span>
          {[
            { label: "Tata Tiscon 550D", query: "Tata Tiscon", cat: "steel" },
            { label: "UltraTech OPC-53", query: "UltraTech", cat: "cement" },
            { label: "AAC Blocks 600x200", query: "AAC Blocks", cat: "bricks" },
            { label: "VSI Robo M-Sand", query: "M-Sand", cat: "sand" },
            { label: "20mm Blue Metal", query: "20mm", cat: "aggregates" },
          ].map((chip) => (
            <button
              key={chip.label}
              onClick={() => handleQuickChip(chip.query, chip.cat)}
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                color: "var(--text-secondary)",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "11px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-amber)";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. VERIFIED METRICS STATS CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          maxWidth: "1060px",
        }}
      >
        <div className="arch-card" style={{ padding: "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <Truck size={18} color="var(--accent-amber)" />
            <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 700 }}>
              SITE DISPATCH
            </span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#ffffff" }}>
            48,500+ MT
          </div>
          <div style={{ fontSize: "11px", color: "var(--accent-amber)", marginTop: "4px" }}>
            ▲ 100% Weighbridge Verified
          </div>
        </div>

        <div className="arch-card" style={{ padding: "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <ShieldCheck size={18} color="var(--accent-amber)" />
            <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 700 }}>
              MTC ACCREDITED
            </span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#ffffff" }}>
            100% NABL Lab
          </div>
          <div style={{ fontSize: "11px", color: "#10b981", marginTop: "4px" }}>
            ✓ Chemical & Tensile Tested
          </div>
        </div>

        <div className="arch-card" style={{ padding: "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <FileCheck2 size={18} color="var(--accent-amber)" />
            <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 700 }}>
              SLA DISPATCH
            </span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#ffffff" }}>
            99.8% On-Time
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Average Dispatch SLA 4.2h
          </div>
        </div>

        <div className="arch-card" style={{ padding: "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <Building size={18} color="var(--accent-amber)" />
            <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 700 }}>
              ESCROW PROTECTED
            </span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#ffffff" }}>
            ₹42+ Crore
          </div>
          <div style={{ fontSize: "11px", color: "var(--accent-amber)", marginTop: "4px" }}>
            Zero Payment Default Risk
          </div>
        </div>
      </div>
    </section>
  );
}
