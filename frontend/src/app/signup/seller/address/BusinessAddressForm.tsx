"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Building,
  Map,
  MapPin,
  Compass,
  Shield,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export interface BusinessAddressData {
  address: string;
  pinCode: string;
  state: string;
  city: string;
}

interface BusinessAddressFormProps {
  onSuccess?: (data: BusinessAddressData) => void;
  defaultValues?: Partial<BusinessAddressData>;
  showHeaderFooter?: boolean;
}

export default function BusinessAddressForm({
  onSuccess,
  defaultValues,
  showHeaderFooter = true,
}: BusinessAddressFormProps) {
  const [address, setAddress] = useState(
    defaultValues?.address || ""
  );
  const [pinCode, setPinCode] = useState(
    defaultValues?.pinCode || ""
  );
  const [state, setState] = useState(
    defaultValues?.state || ""
  );
  const [city, setCity] = useState(
    defaultValues?.city || ""
  );

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePinCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPinCode(raw);
    setErrorMsg("");

    // Helpful autofill for known pin code demo
    if (raw === "208027" || raw === "208001") {
      setCity("Kanpur");
      setState("Uttar Pradesh");
    } else if (raw === "110001") {
      setCity("New Delhi");
      setState("Delhi");
    } else if (raw === "400001") {
      setCity("Mumbai");
      setState("Maharashtra");
    } else if (raw === "560001") {
      setCity("Bengaluru");
      setState("Karnataka");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setErrorMsg("Please enter business address");
      return;
    }
    if (pinCode.length < 6) {
      setErrorMsg("Please enter a valid 6-digit PIN code");
      return;
    }
    if (!state.trim()) {
      setErrorMsg("Please enter state");
      return;
    }
    if (!city.trim()) {
      setErrorMsg("Please enter city");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      onSuccess?.({
        address,
        pinCode,
        state,
        city,
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
      {/* Top Header Row: Amber Bar + Title on Left, 3D Map Pin Illustration on Right */}
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
            Business Address
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
            Enter your business address
          </p>
        </div>

        {/* 3D Map Pin Graphic */}
        <div
          style={{
            position: "relative",
            width: "84px",
            height: "84px",
            borderRadius: "18px",
            overflow: "hidden",
            boxShadow: "0 8px 20px -4px rgba(245, 158, 11, 0.25)",
            border: "2px solid rgba(245, 158, 11, 0.3)",
            background: "#ffffff",
            flexShrink: 0,
          }}
        >
          <Image
            src="/images/business-address-map-3d.jpg"
            alt="3D Business address map with location pin"
            fill
            sizes="84px"
            style={{ objectFit: "cover" }}
            priority
          />
        </div>
      </div>

      {/* Form Fields */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          flex: 1,
        }}
      >
        {/* Field 1: Address */}
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
            <Building size={20} />
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
                Address
              </span>
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setErrorMsg("");
                }}
                placeholder="Enter street / plot / building address"
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

        {/* Field 2: PIN Code */}
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
            <Map size={20} />
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
                PIN Code
              </span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={pinCode}
                onChange={handlePinCodeChange}
                placeholder="6-digit PIN code"
                style={{
                  width: "100%",
                  height: "52px",
                  borderRadius: "9999px",
                  border: "1.5px solid #e2e8f0",
                  padding: "0 18px",
                  fontSize: "14.5px",
                  fontFamily: "var(--font-mono), monospace",
                  fontWeight: 700,
                  color: "#0B1220",
                  outline: "none",
                  background: "#ffffff",
                  letterSpacing: "1px",
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

        {/* Field 3: State */}
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
            <MapPin size={20} />
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
                State
              </span>
              <input
                type="text"
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setErrorMsg("");
                }}
                placeholder="Enter state"
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

        {/* Field 4: City */}
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
            <Compass size={20} />
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
                City
              </span>
              <input
                type="text"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setErrorMsg("");
                }}
                placeholder="Enter city"
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

        {/* Error Notification */}
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
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Security / Encryption Note (Soft Amber Banner) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "#FFFBEB",
            border: "1px solid #FEF3C7",
            borderRadius: "16px",
            padding: "14px 16px",
            marginTop: "4px",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "rgba(245, 158, 11, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#d97706",
              flexShrink: 0,
            }}
          >
            <Shield size={20} />
          </div>
          <div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#92400e",
                lineHeight: 1.2,
                marginBottom: "2px",
              }}
            >
              We keep your information safe
            </div>
            <div
              style={{
                fontSize: "11.5px",
                color: "#b45309",
                lineHeight: 1.3,
              }}
            >
              Your data is encrypted and secure with us.
            </div>
          </div>
        </div>

        {/* Save & Continue Button */}
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
            cursor: isLoading ? "not-allowed" : "pointer",
            boxShadow: "0 10px 25px -5px rgba(194, 65, 12, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.2s ease",
            marginTop: "auto",
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 14px 28px -5px rgba(194, 65, 12, 0.55)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(194, 65, 12, 0.45)";
          }}
        >
          {isLoading ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              <span>Saving Address...</span>
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle2 size={18} />
              <span>Address Saved!</span>
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
