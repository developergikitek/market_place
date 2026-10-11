"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  FileCheck2,
  Check,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

interface TermsConditionsFormProps {
  onSuccess?: () => void;
  showHeaderFooter?: boolean;
}

export default function TermsConditionsForm({
  onSuccess,
  showHeaderFooter = true,
}: TermsConditionsFormProps) {
  const [isAgreed, setIsAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAgreed) {
      setErrorMsg("Please accept the Terms & Conditions to proceed");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    setTimeout(() => {
      setIsLoading(false);
      onSuccess?.();
    }, 600);
  };

  const formBody = (
    <div
      style={{
        padding: "24px 24px 16px 24px",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        animation: "fadeIn 0.25s ease-out",
      }}
    >
      {/* Top Header Row: Amber Bar + Title */}
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            width: "40px",
            height: "4px",
            background: "#F59E0B",
            borderRadius: "2px",
            marginBottom: "12px",
          }}
        />
        <h1
          style={{
            fontSize: "27px",
            fontWeight: 800,
            color: "#1e1b4b",
            lineHeight: 1.15,
            letterSpacing: "-0.5px",
            marginBottom: "6px",
          }}
        >
          Terms &amp; Conditions
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#64748b",
            fontWeight: 500,
            lineHeight: 1.35,
            margin: 0,
          }}
        >
          Please review and accept the terms
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        {/* XYZ Seller Agreement Card */}
        <div
          style={{
            background: "#ffffff",
            border: "1.5px solid #e2e8f0",
            borderRadius: "24px",
            padding: "24px 20px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
          }}
        >
          <h2
            style={{
              fontSize: "16.5px",
              fontWeight: 800,
              color: "#1e1b4b",
              lineHeight: 1.3,
              marginBottom: "14px",
            }}
          >
            XYZ Seller Agreement
          </h2>

          <p
            style={{
              fontSize: "13.5px",
              color: "#475569",
              lineHeight: 1.55,
              marginBottom: "14px",
            }}
          >
            This XYZ Seller Agreement (&quot;Agreement&quot;) is made between XYZ
            Internet Private Limited (&quot;XYZ&quot;) and the Seller
            (&quot;You&quot;).
          </p>

          <p
            style={{
              fontSize: "13.5px",
              color: "#475569",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            By clicking on &quot;I Accept&quot;, You agree to be bound by the
            terms and conditions mentioned in this Agreement and the policies of
            XYZ.
          </p>
        </div>

        {/* Checkbox and Agreement Text */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            marginBottom: "24px",
            cursor: "pointer",
          }}
          onClick={() => {
            setIsAgreed(!isAgreed);
            setErrorMsg("");
          }}
        >
          {/* Custom Styled Checkbox Box */}
          <div
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "5px",
              border: isAgreed ? "2px solid #2563eb" : "1.5px solid #cbd5e1",
              background: isAgreed ? "#2563eb" : "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "2px",
              flexShrink: 0,
              transition: "all 0.15s ease",
            }}
          >
            {isAgreed && <Check size={14} color="#ffffff" strokeWidth={3} />}
          </div>

          <label
            style={{
              fontSize: "13px",
              color: "#334155",
              lineHeight: 1.45,
              fontWeight: 500,
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            I have read and agree to the{" "}
            <span
              style={{
                color: "#2563eb",
                fontWeight: 700,
                textDecoration: "underline",
              }}
              onClick={(e) => {
                e.stopPropagation();
                alert("BuildMart Terms & Conditions: All seller listings must adhere to NABL quality benchmarks.");
              }}
            >
              Terms &amp; Conditions
            </span>{" "}
            and{" "}
            <span
              style={{
                color: "#2563eb",
                fontWeight: 700,
                textDecoration: "underline",
              }}
              onClick={(e) => {
                e.stopPropagation();
                alert("BuildMart Privacy Policy: 256-bit encrypted data handling strictly according to Indian DPDP Act.");
              }}
            >
              Privacy Policy
            </span>
          </label>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#fef2f2",
              border: "1px solid #fee2e2",
              borderRadius: "12px",
              padding: "10px 14px",
              color: "#dc2626",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "16px",
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Continue Action Button */}
        <button
          type="submit"
          disabled={isLoading || !isAgreed}
          style={{
            width: "100%",
            height: "56px",
            background: isAgreed
              ? "linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)"
              : "#e9d5ff",
            color: isAgreed ? "#ffffff" : "#7c3aed",
            border: "none",
            borderRadius: "9999px",
            fontSize: "16px",
            fontWeight: 700,
            cursor: isAgreed && !isLoading ? "pointer" : "not-allowed",
            boxShadow: isAgreed ? "0 10px 25px -5px rgba(124, 58, 237, 0.45)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.2s ease",
            marginTop: "auto",
          }}
          onMouseEnter={(e) => {
            if (isAgreed && !isLoading) {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 14px 28px -5px rgba(124, 58, 237, 0.55)";
            }
          }}
          onMouseLeave={(e) => {
            if (isAgreed) {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(124, 58, 237, 0.45)";
            }
          }}
        >
          {isLoading ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              <span>Completing Registration...</span>
            </>
          ) : (
            <span>Continue</span>
          )}
        </button>
      </form>
    </div>
  );

  if (!showHeaderFooter) {
    return formBody;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        background: "#ffffff",
      }}
    >
      {/* 1. Curved Brand Header (Royal Purple Theme) */}
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

      {formBody}

      {/* 3. Bottom 3D Construction Silos & Cranes */}
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
          priority
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
  );
}
