"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  FileCheck2,
  ArrowRight,
  RefreshCw,
  Search,
  X,
  AlertCircle,
} from "lucide-react";

export interface CountryCode {
  name: string;
  code: string;
  flag: string;
  format: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { name: "India", code: "+91", flag: "🇮🇳", format: "XXXXX XXXXX" },
  { name: "United States", code: "+1", flag: "🇺🇸", format: "XXX-XXX-XXXX" },
  { name: "United Kingdom", code: "+44", flag: "🇬🇧", format: "XXXX XXXXXX" },
  { name: "United Arab Emirates", code: "+971", flag: "🇦🇪", format: "XX XXX XXXX" },
  { name: "Saudi Arabia", code: "+966", flag: "🇸🇦", format: "XX XXX XXXX" },
  { name: "Singapore", code: "+65", flag: "🇸🇬", format: "XXXX XXXX" },
];

interface Step1Props {
  onSuccess?: (phone: string, countryCode: string) => void;
  defaultPhone?: string;
  defaultCountry?: CountryCode;
}

export default function Step1_MobileVerification({
  onSuccess,
  defaultPhone = "",
  defaultCountry = COUNTRY_CODES[0],
}: Step1Props) {
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(defaultCountry);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(raw);
    setErrorMsg("");
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");

    setTimeout(() => {
      setIsLoading(false);
      onSuccess?.(phoneNumber, selectedCountry.code);
    }, 600);
  };

  const filteredCountries = COUNTRY_CODES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.includes(countrySearch)
  );

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

      {/* 2. Form Body */}
      <div
        style={{
          padding: "26px 24px 20px 24px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        {/* Top Hero Row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "26px",
          }}
        >
          <div style={{ flex: 1, paddingRight: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "4px",
                background: "#F59E0B",
                borderRadius: "2px",
                marginBottom: "14px",
              }}
            />
            <h1
              style={{
                fontSize: "26px",
                fontWeight: 800,
                color: "#0B1220",
                lineHeight: 1.25,
                letterSpacing: "-0.4px",
                marginBottom: "6px",
              }}
            >
              Verify your mobile number
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "#64748b",
                fontWeight: 500,
                lineHeight: 1.4,
                margin: 0,
              }}
            >
              Enter your mobile number
            </p>
          </div>

          {/* 3D Phone Shield Illustration */}
          <div
            style={{
              position: "relative",
              width: "120px",
              height: "120px",
              borderRadius: "20px",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <Image
              src="/images/auth-phone-shield.jpg"
              alt="Makaano Shield Protection"
              fill
              sizes="120px"
              style={{ objectFit: "cover" }}
              priority
            />
          </div>
        </div>

        {/* Input Label */}
        <div style={{ marginBottom: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.4px" }}>
            PRIMARY ACCOUNT LOGIN
          </span>
        </div>

        {/* Phone Input Row */}
        <form onSubmit={handleSendOtp}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: errorMsg ? "8px" : "18px",
              position: "relative",
            }}
          >
            {/* Country Selector */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  height: "56px",
                  padding: "0 14px",
                  background: "#f8fafc",
                  border: isCountryDropdownOpen ? "2px solid #C2410C" : "1.5px solid #e2e8f0",
                  borderRadius: "9999px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#0B1220",
                }}
              >
                <span>{selectedCountry.flag}</span>
                <span>{selectedCountry.code}</span>
                <ChevronDown size={14} color="#64748b" />
              </button>

              {/* Dropdown Modal */}
              {isCountryDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "62px",
                    left: 0,
                    width: "250px",
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
                    zIndex: 50,
                    padding: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 10px",
                      background: "#f1f5f9",
                      borderRadius: "10px",
                      marginBottom: "6px",
                    }}
                  >
                    <Search size={13} color="#64748b" />
                    <input
                      type="text"
                      placeholder="Search country..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      style={{
                        border: "none",
                        background: "transparent",
                        outline: "none",
                        fontSize: "12px",
                        width: "100%",
                      }}
                    />
                    {countrySearch && (
                      <X
                        size={12}
                        color="#64748b"
                        style={{ cursor: "pointer" }}
                        onClick={() => setCountrySearch("")}
                      />
                    )}
                  </div>
                  <div style={{ maxHeight: "170px", overflowY: "auto" }}>
                    {filteredCountries.map((c) => (
                      <div
                        key={c.code}
                        onClick={() => {
                          setSelectedCountry(c);
                          setIsCountryDropdownOpen(false);
                          setCountrySearch("");
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "12.5px",
                          background: selectedCountry.code === c.code ? "#FFEDD5" : "transparent",
                          color: selectedCountry.code === c.code ? "#C2410C" : "#0B1220",
                          fontWeight: selectedCountry.code === c.code ? 700 : 500,
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>{c.flag}</span>
                          <span>{c.name}</span>
                        </span>
                        <span style={{ color: "#64748b", fontFamily: "monospace" }}>{c.code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Number Input */}
            <div style={{ flex: 1 }}>
              <input
                type="tel"
                placeholder="Enter mobile number"
                value={phoneNumber}
                onChange={handlePhoneChange}
                maxLength={10}
                style={{
                  width: "100%",
                  height: "56px",
                  borderRadius: "9999px",
                  border: errorMsg ? "2px solid #ef4444" : "1.5px solid #e2e8f0",
                  padding: "0 22px",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#0B1220",
                  outline: "none",
                  background: "#ffffff",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#C2410C";
                  e.target.style.boxShadow = "0 0 0 3px rgba(194, 65, 12, 0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errorMsg ? "#ef4444" : "#e2e8f0";
                  e.target.style.boxShadow = "none";
                }}
              />
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
                marginBottom: "14px",
                paddingLeft: "4px",
              }}
            >
              <AlertCircle size={13} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || phoneNumber.length < 10}
            style={{
              width: "100%",
              height: "56px",
              background:
                phoneNumber.length === 10
                  ? "linear-gradient(135deg, #9A3412 0%, #C2410C 100%)"
                  : "#E2E8F0",
              color: phoneNumber.length === 10 ? "#ffffff" : "#C2410C",
              border: "none",
              borderRadius: "9999px",
              fontSize: "16px",
              fontWeight: 700,
              cursor: phoneNumber.length === 10 ? "pointer" : "not-allowed",
              boxShadow:
                phoneNumber.length === 10
                  ? "0 10px 25px -5px rgba(194, 65, 12, 0.45)"
                  : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "18px",
            }}
          >
            {isLoading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Sending OTP...</span>
              </>
            ) : (
              <>
                <span>Send OTP</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Informative Lavender Notice Banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "#FFF7ED",
            border: "1px solid #E2E8F0",
            borderRadius: "9999px",
            padding: "12px 18px",
            boxShadow: "0 2px 8px rgba(194, 65, 12, 0.05)",
          }}
        >
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background: "rgba(194, 65, 12, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FileCheck2 size={17} color="#C2410C" />
          </div>

          <p
            style={{
              fontSize: "12.5px",
              color: "#172036",
              lineHeight: 1.4,
              margin: 0,
              fontWeight: 500,
            }}
          >
            We will send you a one-time password on this number for verification
          </p>
        </div>
      </div>

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
