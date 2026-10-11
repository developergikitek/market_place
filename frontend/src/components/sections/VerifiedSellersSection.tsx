"use client";

import React, { useState } from "react";
import { VERIFIED_SELLERS } from "@/data/marketplaceData";
import {
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  Truck,
  ExternalLink,
} from "lucide-react";

interface VerifiedSellersSectionProps {
  onOpenRFQ: () => void;
}

export default function VerifiedSellersSection({ onOpenRFQ }: VerifiedSellersSectionProps) {
  const [activeSellerNotice, setActiveSellerNotice] = useState<string | null>(null);

  const handleContactSeller = (sellerName: string) => {
    setActiveSellerNotice(sellerName);
    setTimeout(() => setActiveSellerNotice(null), 3000);
  };

  return (
    <section
      id="sellers"
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
            AUDITED MILL & QUARRY NETWORK
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
          Accredited Heavy Producers & Mills
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px", maxWidth: "680px", marginTop: "6px" }}>
          All suppliers undergo on-site audit for digital weighbridge integration, NABL calibration, and real-time electronic gate-pass tracking.
        </p>
      </div>

      {/* SELLER CARDS GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
          gap: "24px",
        }}
      >
        {VERIFIED_SELLERS.map((seller) => (
          <div
            key={seller.id}
            className="arch-card"
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              {/* TOP HEADER */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid var(--border-card)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 800,
                      fontFamily: "var(--font-mono)",
                      color: "var(--accent-amber)",
                    }}
                  >
                    {seller.logoBadge}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }}>
                      {seller.name}
                    </h3>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--accent-amber)", fontSize: "11px", fontWeight: 600, marginTop: "2px" }}>
                      <ShieldCheck size={12} />
                      <span>{seller.tier}</span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "rgba(245, 158, 11, 0.1)",
                    border: "1px solid rgba(245, 158, 11, 0.25)",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    color: "var(--accent-amber)",
                    fontSize: "12px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <Star size={12} fill="#f59e0b" />
                  <span>{seller.rating}</span>
                </div>
              </div>

              {/* LOCATION & RADIUS */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px", fontSize: "12px", color: "var(--text-secondary)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <MapPin size={13} color="var(--accent-amber)" />
                  <span>{seller.location}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Truck size={13} color="var(--accent-amber)" />
                  <span>Dispatch Radius: <strong style={{ color: "#e2e8f0" }}>{seller.dispatchRadius}</strong></span>
                </div>
              </div>

              {/* TELEMETRY METRICS */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  background: "rgba(255, 255, 255, 0.03)",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-card)",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                    TOTAL TONNAGE
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#ffffff" }}>
                    {seller.totalTonnageDispatched}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                    AVG DISPATCH SLA
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent-amber)" }}>
                    {seller.avgDispatchTime}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                    ACCEPTANCE RATE
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#10b981" }}>
                    {seller.acceptanceRate}%
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                    ORDERS SERVED
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#ffffff" }}>
                    {seller.completedOrders.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* CERTIFICATIONS */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "18px" }}>
                {seller.certifications.map((cert) => (
                  <span
                    key={cert}
                    style={{
                      fontSize: "10px",
                      fontFamily: "var(--font-mono)",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid var(--border-card)",
                      color: "var(--text-secondary)",
                      padding: "2px 6px",
                      borderRadius: "3px",
                    }}
                  >
                    ✓ {cert}
                  </span>
                ))}
              </div>
            </div>

            {/* ACTION */}
            <div>
              {activeSellerNotice === seller.name && (
                <div style={{ fontSize: "11px", color: "var(--accent-amber)", textAlign: "center", marginBottom: "8px", fontFamily: "var(--font-mono)" }}>
                  Connecting with {seller.name} dispatch terminal...
                </div>
              )}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => handleContactSeller(seller.name)}
                  className="btn-secondary"
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    fontSize: "11px",
                  }}
                >
                  <Clock size={12} />
                  <span>DISPATCH DESK</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenRFQ}
                  className="btn-primary"
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    fontSize: "11px",
                  }}
                >
                  <ExternalLink size={12} />
                  <span>DIRECT RFQ</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
