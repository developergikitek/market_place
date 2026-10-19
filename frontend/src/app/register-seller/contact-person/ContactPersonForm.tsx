"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Contact2,
  Mail,
  Phone,
  Shield,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export interface ContactPersonData {
  fullName: string;
  email: string;
  mobileNumber: string;
}

interface ContactPersonFormProps {
  onSuccess?: (data: ContactPersonData) => void;
  defaultValues?: Partial<ContactPersonData>;
  showHeaderFooter?: boolean;
}

export default function ContactPersonForm({
  onSuccess,
  defaultValues,
  showHeaderFooter = true,
}: ContactPersonFormProps) {
  const [fullName, setFullName] = useState(
    defaultValues?.fullName || ""
  );
  const [email, setEmail] = useState(
    defaultValues?.email || ""
  );
  const [mobileNumber, setMobileNumber] = useState(
    defaultValues?.mobileNumber || ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobileNumber(raw);
    setErrorMsg("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg("Please enter contact person name");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg("Please enter a valid email address");
      return;
    }
    if (mobileNumber.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      onSuccess?.({
        fullName,
        email,
        mobileNumber,
      });
    }, 700);
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
      {/* Top Header Row: Amber Bar + Title on Left, 3D Badge Card on Right */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <div style={{ flex: 1, paddingRight: "8px" }}>
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
                color: "#0B1220",
                lineHeight: 1.15,
                letterSpacing: "-0.5px",
                marginBottom: "6px",
              }}
            >
              Contact Person Details
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
              Enter contact person details
            </p>
          </div>

          {/* 3D Contact Card Graphic */}
          <div
            style={{
              position: "relative",
              width: "140px",
              height: "98px",
              flexShrink: 0,
            }}
          >
            <Image
              src="/images/contact-person-badge.jpg"
              alt="3D Contact person badge illustration"
              fill
              sizes="140px"
              style={{
                objectFit: "contain",
                objectPosition: "center right",
              }}
              priority
            />
          </div>
        </div>

        {/* Form Fields Container */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Field 1: Contact Person Name */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(245, 158, 11, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#d97706",
                flexShrink: 0,
              }}
            >
              <Contact2 size={20} />
            </div>

            <div style={{ flex: 1, position: "relative" }}>
              <div style={{ position: "relative", width: "100%" }}>
                <span
                  style={{
                    position: "absolute",
                    top: "-9px",
                    left: "16px",
                    background: "#ffffff",
                    padding: "0 6px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#64748b",
                    letterSpacing: "0.2px",
                    zIndex: 1,
                  }}
                >
                  Contact person name
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setErrorMsg("");
                  }}
                  placeholder="Enter full name"
                  style={{
                    width: "100%",
                    height: "52px",
                    borderRadius: "9999px",
                    border: "1.5px solid #e2e8f0",
                    padding: "0 18px",
                    fontSize: "14.5px",
                    fontWeight: 600,
                    color: "#0B1220",
                    outline: "none",
                    background: "#ffffff",
                    transition: "all 0.15s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#C2410C";
                    e.target.style.boxShadow = "0 0 0 3px rgba(194, 65, 12, 0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>
          </div>

          {/* Field 2: Email ID */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(245, 158, 11, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#d97706",
                flexShrink: 0,
              }}
            >
              <Mail size={20} />
            </div>

            <div style={{ flex: 1, position: "relative" }}>
              <div style={{ position: "relative", width: "100%" }}>
                <span
                  style={{
                    position: "absolute",
                    top: "-9px",
                    left: "16px",
                    background: "#ffffff",
                    padding: "0 6px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#64748b",
                    letterSpacing: "0.2px",
                    zIndex: 1,
                  }}
                >
                  Email ID
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMsg("");
                  }}
                  placeholder="name@company.com"
                  style={{
                    width: "100%",
                    height: "52px",
                    borderRadius: "9999px",
                    border: "1.5px solid #e2e8f0",
                    padding: "0 18px",
                    fontSize: "14.5px",
                    fontWeight: 600,
                    color: "#0B1220",
                    outline: "none",
                    background: "#ffffff",
                    transition: "all 0.15s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#C2410C";
                    e.target.style.boxShadow = "0 0 0 3px rgba(194, 65, 12, 0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>
          </div>

          {/* Field 3: Mobile Number */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(245, 158, 11, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#d97706",
                flexShrink: 0,
              }}
            >
              <Phone size={20} />
            </div>

            <div style={{ flex: 1, position: "relative" }}>
              <div style={{ position: "relative", width: "100%" }}>
                <span
                  style={{
                    position: "absolute",
                    top: "-9px",
                    left: "16px",
                    background: "#ffffff",
                    padding: "0 6px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#64748b",
                    letterSpacing: "0.2px",
                    zIndex: 1,
                  }}
                >
                  Mobile number
                </span>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={handlePhoneChange}
                  maxLength={10}
                  placeholder="9876543210"
                  style={{
                    width: "100%",
                    height: "52px",
                    borderRadius: "9999px",
                    border: "1.5px solid #e2e8f0",
                    padding: "0 18px",
                    fontSize: "14.5px",
                    fontWeight: 600,
                    color: "#0B1220",
                    outline: "none",
                    background: "#ffffff",
                    fontFamily: "var(--font-mono), monospace",
                    letterSpacing: "0.5px",
                    transition: "all 0.15s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#C2410C";
                    e.target.style.boxShadow = "0 0 0 3px rgba(194, 65, 12, 0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                color: "#ef4444",
                fontSize: "12px",
                fontWeight: 600,
                paddingLeft: "4px",
              }}
            >
              <AlertCircle size={13} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Security Information Capsule Banner */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "#fffbeb",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              borderRadius: "9999px",
              padding: "12px 18px",
              marginTop: "4px",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "rgba(245, 158, 11, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#d97706",
                flexShrink: 0,
              }}
            >
              <Shield size={16} fill="#f59e0b" color="#d97706" />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#0B1220", lineHeight: 1.25 }}>
                We keep your information safe
              </div>
              <div style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 500, lineHeight: 1.3 }}>
                Your data is encrypted and secure with us.
              </div>
            </div>
          </div>

          {/* Save & Continue CTA Button (Unified Brand Theme) */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              height: "56px",
              background: "linear-gradient(135deg, #9A3412 0%, #C2410C 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "9999px",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 10px 25px -5px rgba(194, 65, 12, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "8px",
              transition: "all 0.2s ease",
            }}
          >
            {isLoading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Saving Details...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 size={18} />
                <span>Details Saved!</span>
              </>
            ) : (
              <>
                <span>Save & Continue</span>
                <ArrowRight size={18} />
              </>
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
        flex: 1,
        minHeight: "100%",
        background: "#ffffff",
      }}
    >
      {/* 1. Curved Brand Header (Navy Theme) */}
      <header
        style={{
          background: "#0B1220",
          borderBottomLeftRadius: "28px",
          borderBottomRightRadius: "28px",
          padding: "24px 20px 20px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.35)",
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
              <path d="M13 18H19V27H13V18Z" fill="#0B1220" />
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
              Makaan<span style={{ color: "#F59E0B" }}>o</span>
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
              Seller Central
            </span>
          </div>
        </div>
      </header>

      {formBody}

      {/* 3. Bottom 3D Construction Silos & Cranes */}
      <footer
        className="auth-bottom-banner"
        style={{
          position: "relative",
          width: "100%",
          height: "175px",
          marginTop: "auto",
          flexShrink: 0,
          overflow: "hidden",
          borderBottomLeftRadius: "28px",
          borderBottomRightRadius: "28px",
          pointerEvents: "none",
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
