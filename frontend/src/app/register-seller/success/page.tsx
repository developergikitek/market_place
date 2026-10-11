"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AuthPageWrapper from "@/components/auth/AuthPageWrapper";
import { Check, ArrowRight } from "lucide-react";

export default function RegisterSuccessPage() {
  const router = useRouter();

  return (
    <AuthPageWrapper>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100%",
          background: "#ffffff",
        }}
      >
        {/* Curved Brand Header */}
        <header
          style={{
            background: "linear-gradient(135deg, #3b0764 0%, #581c87 50%, #4c1d95 100%)",
            borderBottomLeftRadius: "28px",
            borderBottomRightRadius: "28px",
            padding: "24px 20px 20px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            boxShadow: "0 8px 24px rgba(76, 29, 149, 0.35)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
                <path d="M16 3L28 12V16L16 7L4 16V12L16 3Z" fill="#F59E0B" />
                <path d="M8 15L16 9L24 15V27H8V15Z" fill="#F59E0B" fillOpacity="0.9" />
                <path d="M13 18H19V27H13V18Z" fill="#3b0764" />
                <rect x="6" y="27" width="20" height="2.5" rx="1" fill="#F59E0B" />
              </svg>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "23px",
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: "-0.4px",
                  lineHeight: 1.1,
                }}
              >
                Build<span style={{ color: "#F59E0B" }}>Mart</span>
              </span>
              <span
                style={{
                  fontSize: "8.5px",
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.85)",
                  letterSpacing: "0.4px",
                  marginTop: "2px",
                }}
              >
                Building Trust • Delivering Quality
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div
          style={{
            padding: "32px 24px 20px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flex: 1,
            animation: "fadeIn 0.3s ease-out",
          }}
        >
          {/* Animated Success Check Badge */}
          <div
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              background: "rgba(16, 185, 129, 0.12)",
              border: "2px solid #10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10b981",
              margin: "0 auto 16px auto",
              boxShadow: "0 10px 20px rgba(16, 185, 129, 0.2)",
            }}
          >
            <Check size={36} strokeWidth={2.5} />
          </div>

          <h2
            style={{
              fontSize: "23px",
              fontWeight: 800,
              color: "#1e1b4b",
              textAlign: "center",
              marginBottom: "6px",
            }}
          >
            Registration Submitted!
          </h2>
          <p
            style={{
              fontSize: "13.5px",
              color: "#64748b",
              textAlign: "center",
              marginBottom: "20px",
              lineHeight: 1.35,
            }}
          >
            Your seller registration details have been verified and submitted successfully.
          </p>

          {/* Registration Summary Card */}
          <div
            style={{
              width: "100%",
              background: "#f8fafc",
              border: "1.5px solid #e2e8f0",
              borderRadius: "16px",
              padding: "16px",
              marginBottom: "22px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Application ID</span>
              <span style={{ fontSize: "12px", fontFamily: "var(--font-mono), monospace", color: "#6d28d9", fontWeight: 700 }}>
                BM-SELLER-2026-98214
              </span>
            </div>
            <div style={{ height: "1px", background: "#e2e8f0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Company Name</span>
              <span style={{ fontSize: "13px", color: "#1e1b4b", fontWeight: 700 }}>
                BuildWell Traders Pvt. Ltd.
              </span>
            </div>
            <div style={{ height: "1px", background: "#e2e8f0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Status</span>
              <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                <Check size={14} strokeWidth={2.5} />
                <span>Under Fast-track Review</span>
              </span>
            </div>
          </div>

          {/* Launch CTA */}
          <button
            type="button"
            onClick={() => router.push("/login")}
            style={{
              width: "100%",
              height: "56px",
              background: "linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "9999px",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <span>Go to Seller Login</span>
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Footer */}
        <footer
          style={{
            position: "relative",
            width: "100%",
            height: "175px",
            marginTop: "auto",
            overflow: "hidden",
            borderBottomLeftRadius: "28px",
            borderBottomRightRadius: "28px",
          }}
        >
          <Image
            src="/images/auth-cranes-silos.jpg"
            alt="3D Construction site cranes and silos"
            fill
            sizes="(max-width: 768px) 100vw, 460px"
            style={{ objectFit: "cover", objectPosition: "bottom center", opacity: 0.95 }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "45px",
              background: "linear-gradient(to bottom, #ffffff 10%, rgba(255, 255, 255, 0) 100%)",
            }}
          />
        </footer>
      </div>
    </AuthPageWrapper>
  );
}
