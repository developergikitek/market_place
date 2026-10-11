"use client";

import React from "react";
import { HardHat, PhoneCall } from "lucide-react";

interface AuthPageWrapperProps {
  children: React.ReactNode;
}

export default function AuthPageWrapper({ children }: AuthPageWrapperProps) {
  return (
    <main className="auth-page-root">
      {/* Ambient Lighting Gradients (Active on Desktop only) */}
      <div className="auth-ambient-glow" />

      {/* Main Grid: Desktop 2-Columns / Mobile Native 1-Column Fullscreen */}
      <div className="auth-grid">
        {/* Left Column: Rich Desktop Content (Hidden on Mobile) */}
        <aside className="auth-sidebar">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(124, 58, 237, 0.08)",
              border: "1px solid rgba(124, 58, 237, 0.25)",
              padding: "6px 14px",
              borderRadius: "20px",
              width: "fit-content",
              color: "#7c3aed",
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "var(--font-mono), monospace",
            }}
          >
            <HardHat size={14} color="#7c3aed" />
            <span>BUILDMART SELLER & BUYER ECOSYSTEM</span>
          </div>

          <h1
            style={{
              fontSize: "44px",
              fontWeight: 800,
              color: "#1e1b4b",
              lineHeight: 1.16,
              letterSpacing: "-1px",
              fontFamily: "var(--font-heading), sans-serif",
            }}
          >
            India&apos;s Institutional <br />
            <span
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Construction Material
            </span> <br />
            Marketplace Platform
          </h1>

          <p
            style={{
              fontSize: "16px",
              color: "#4b5563",
              lineHeight: 1.65,
              maxWidth: "540px",
            }}
          >
            Direct primary mill allocation for TMT Steel (Fe-550D), Grade OPC-53
            Cement, Aggregates, and Sand. Zero brokerage, NABL Form 3.1
            verification, and real-time GPS fleet dispatch.
          </p>

          {/* Dedicated Institutional Support Helpline */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#6d28d9",
              fontSize: "12.5px",
              fontWeight: 600,
              fontFamily: "var(--font-mono), monospace",
              paddingTop: "6px",
            }}
          >
            <PhoneCall size={14} color="#7c3aed" />
            <span>INSTITUTIONAL DESK: 1800-419-5566 (TOLL-FREE)</span>
          </div>
        </aside>

        {/* Right Column (Desktop) / Fullscreen Native App (Mobile) */}
        <section className="auth-card-frame">
          {children}
        </section>
      </div>

      {/* Desktop Footer (Hidden on Mobile) */}
      <footer className="auth-desktop-footer">
        <div>BUILDMART TECHNOLOGIES PVT. LTD. // CIN: U72900MH2024PTC394182</div>
        <div>IS:1786 • IS:12269 • ISO 9001:2015 CERTIFIED B2B PLATFORM</div>
      </footer>
    </main>
  );
}
