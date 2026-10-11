"use client";

import React, { useState } from "react";
import { CITIES } from "@/data/marketplaceData";
import {
  MapPin,
  TrendingUp,
  FileSpreadsheet,
  Building2,
  PhoneCall,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";

interface NavbarProps {
  activeCity: string;
  onCityChange: (city: string) => void;
  onOpenRFQ: () => void;
  rfqCount: number;
}

export default function Navbar({
  activeCity,
  onCityChange,
  onOpenRFQ,
  rfqCount,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  return (
    <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}>
      {/* 1. TOP SPOT RATE COMMODITY TICKER */}
      <div
        style={{
          background: "#080c14",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "5px 24px",
          fontSize: "11px",
          fontFamily: "var(--font-mono)",
          color: "var(--text-secondary)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", whiteSpace: "nowrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--accent-amber)", fontWeight: 700 }}>
            <span className="live-indicator" />
            DIRECT-FROM-MILL SPOT EX-WORKS RATES:
          </span>
          <span style={{ color: "#e2e8f0" }}>TMT Fe-550D (12mm): <strong style={{ color: "var(--accent-amber)" }}>₹58,400/MT</strong></span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
          <span style={{ color: "#e2e8f0" }}>UltraTech OPC-53: <strong style={{ color: "var(--accent-amber)" }}>₹388/Bag</strong></span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
          <span style={{ color: "#e2e8f0" }}>AAC Block (600x200x150): <strong style={{ color: "var(--accent-amber)" }}>₹58/Pc</strong></span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
          <span style={{ color: "#e2e8f0" }}>VSI Robo M-Sand: <strong style={{ color: "var(--accent-amber)" }}>₹1,450/Brass</strong></span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span style={{ color: "var(--text-muted)", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
            <ShieldCheck size={13} color="var(--accent-amber)" />
            NABL 100% TEST CERTIFIED
          </span>
          <a
            href="tel:+9118002084455"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontSize: "11px",
            }}
          >
            <PhoneCall size={12} color="var(--accent-amber)" />
            <span>Site Hotline: 1800-208-4455</span>
          </a>
        </div>
      </div>

      {/* 2. MAIN HEADER NAVIGATION */}
      <nav
        style={{
          background: "rgba(13, 18, 31, 0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          padding: "12px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* LOGO */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <a
            href="#"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                background: "linear-gradient(135deg, #f59e0b 0%, #1e293b 100%)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #f59e0b",
                boxShadow: "0 0 15px rgba(245, 158, 11, 0.3)",
              }}
            >
              <Building2 size={20} color="#080c14" />
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "20px",
                  fontWeight: 800,
                  letterSpacing: "0.5px",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                STRUKTUR <span style={{ color: "var(--accent-amber)" }}>//</span> X
              </div>
              <div
                style={{
                  fontSize: "9px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-muted)",
                  letterSpacing: "1px",
                  marginTop: "-2px",
                }}
              >
                HEAVY CIVIL PROCUREMENT EXCHANGE
              </div>
            </div>
          </a>

          {/* PROJECT REGIONAL HUB SELECTOR */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--border-card)",
                borderRadius: "6px",
                padding: "6px 14px",
                color: "#f8fafc",
                fontSize: "12px",
                fontFamily: "var(--font-mono)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <MapPin size={13} color="var(--accent-amber)" />
              <span>Project Hub: <strong style={{ color: "var(--accent-amber)" }}>{activeCity}</strong></span>
              <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>▼</span>
            </button>

            {cityDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "115%",
                  left: 0,
                  background: "#111827",
                  border: "1px solid var(--border-amber)",
                  borderRadius: "8px",
                  padding: "6px",
                  width: "190px",
                  boxShadow: "0 15px 35px rgba(0,0,0,0.8)",
                  zIndex: 60,
                }}
              >
                <div style={{ fontSize: "10px", color: "var(--text-muted)", padding: "4px 8px", fontFamily: "var(--font-mono)" }}>
                  SELECT REGIONAL TERMINAL
                </div>
                {CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      onCityChange(city);
                      setCityDropdownOpen(false);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      background: city === activeCity ? "rgba(245, 158, 11, 0.15)" : "transparent",
                      border: "none",
                      color: city === activeCity ? "var(--accent-amber)" : "#e2e8f0",
                      padding: "8px 10px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{city}</span>
                    {city === activeCity && <span style={{ color: "var(--accent-amber)" }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }} className="hidden md:flex">
          <a
            href="#categories"
            style={{
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 600,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-amber)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            Material Categories
          </a>
          <a
            href="#laboratory"
            style={{
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 600,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-amber)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            Quality Lab
          </a>
          <a
            href="#products"
            style={{
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 600,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-amber)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            Mill Catalog
          </a>
          <a
            href="#sellers"
            style={{
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 600,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-amber)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            Audited Mills
          </a>
          <a
            href="#procurement"
            style={{
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 600,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-amber)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          >
            Bulk RFQ
          </a>
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={onOpenRFQ}
            className="btn-primary"
            style={{
              padding: "9px 18px",
              fontSize: "12px",
            }}
          >
            <FileSpreadsheet size={15} />
            <span>BULK RFQ BIDDING</span>
            <span
              style={{
                background: "#080c14",
                color: "var(--accent-amber)",
                padding: "1px 7px",
                borderRadius: "10px",
                fontSize: "10px",
                fontWeight: 800,
              }}
            >
              {rfqCount > 0 ? rfqCount : "LIVE"}
            </span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: "transparent",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              padding: "6px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
            className="md:hidden"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div
          style={{
            background: "#0d121f",
            borderBottom: "1px solid var(--border-amber)",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
          className="md:hidden"
        >
          <a href="#categories" onClick={() => setMobileMenuOpen(false)} style={{ color: "#f8fafc", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>Material Categories</a>
          <a href="#laboratory" onClick={() => setMobileMenuOpen(false)} style={{ color: "#f8fafc", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>Quality Lab</a>
          <a href="#products" onClick={() => setMobileMenuOpen(false)} style={{ color: "#f8fafc", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>Mill Catalog</a>
          <a href="#sellers" onClick={() => setMobileMenuOpen(false)} style={{ color: "#f8fafc", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>Audited Mills</a>
          <a href="#procurement" onClick={() => setMobileMenuOpen(false)} style={{ color: "var(--accent-amber)", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>Bulk RFQ</a>
        </div>
      )}
    </header>
  );
}
