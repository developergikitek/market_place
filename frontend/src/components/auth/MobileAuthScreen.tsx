"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  ChevronDown,
  Check,
  ShieldCheck,
  FileCheck2,
  Smartphone,
  RefreshCw,
  ArrowRight,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import BusinessDetailsForm, {
  BusinessDetailsData,
} from "@/app/register-seller/details/BusinessDetailsForm";
import ContactPersonForm, {
  ContactPersonData,
} from "@/app/register-seller/contact-person/ContactPersonForm";
import BusinessAddressForm, {
  BusinessAddressData,
} from "@/app/register-seller/address/BusinessAddressForm";
import DocumentUploadForm, {
  DocumentUploadData,
} from "@/app/register-seller/documents/DocumentUploadForm";
import TermsConditionsForm from "@/app/register-seller/terms/TermsConditionsForm";
import SellerLoginForm from "@/app/login/SellerLoginForm";

interface CountryCode {
  name: string;
  code: string;
  flag: string;
  format: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { name: "India", code: "+91", flag: "🇮🇳", format: "XXXXX XXXXX" },
  { name: "United Arab Emirates", code: "+971", flag: "🇦🇪", format: "XX XXX XXXX" },
  { name: "United States", code: "+1", flag: "🇺🇸", format: "XXX XXX XXXX" },
  { name: "United Kingdom", code: "+44", flag: "🇬🇧", format: "XXXX XXXXXX" },
  { name: "Saudi Arabia", code: "+966", flag: "🇸🇦", format: "XX XXX XXXX" },
  { name: "Singapore", code: "+65", flag: "🇸🇬", format: "XXXX XXXX" },
  { name: "Germany", code: "+49", flag: "🇩🇪", format: "XXXX XXXXXXX" },
];

export interface MobileAuthScreenProps {
  initialStep?: "login" | "phone" | "otp" | "business" | "contact" | "address" | "documents" | "terms" | "success";
}

export default function MobileAuthScreen({
  initialStep = "login",
}: MobileAuthScreenProps = {}) {
  // Step State: 'login' | 'phone' | 'otp' | 'business' | 'contact' | 'address' | 'documents' | 'terms' | 'success'
  const [step, setStep] = useState<"login" | "phone" | "otp" | "business" | "contact" | "address" | "documents" | "terms" | "success">(initialStep);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Registered seller form data state
  const [businessData, setBusinessData] = useState<BusinessDetailsData | null>(null);
  const [contactData, setContactData] = useState<ContactPersonData | null>(null);
  const [addressData, setAddressData] = useState<BusinessAddressData | null>(null);
  const [documentData, setDocumentData] = useState<DocumentUploadData | null>(null);

  // OTP State
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(25);
  const [canResend, setCanResend] = useState(false);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Format Phone Number as user types
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(raw);
    setErrorMsg("");
  };

  // Format display string (e.g., 98201 54321)
  const formatDisplayPhone = (digits: string) => {
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
  };

  // Submit phone -> Send OTP
  const handleSendOtp = () => {
    if (phoneNumber.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");

    setTimeout(() => {
      setIsLoading(false);
      setStep("otp");
      setTimer(25);
      setCanResend(false);
    }, 700);
  };

  // Handle OTP digit change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Pasted code
      const pasted = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      pasted.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(pasted.length, 5);
      otpInputsRef.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto advance focus
    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOtp = () => {
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) {
      setErrorMsg("Please enter complete 6-digit OTP");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");

    setTimeout(() => {
      setIsLoading(false);
      setStep("business");
    }, 600);
  };

  // Resend OTP
  const handleResendOtp = () => {
    setTimer(25);
    setCanResend(false);
    setOtp(["", "", "", "", "", ""]);
  };

  const filteredCountries = COUNTRY_CODES.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.includes(countrySearch)
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        flex: 1,
      }}
    >


      {/* ========================================================== */}
      {/* 2. THE SINGLE MAKAANO CURVED BRAND HEADER               */}
      {/* ========================================================== */}
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
        {/* Makaano Official Brand Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Logo Geometric House Cube */}
          <div
            style={{
              width: "34px",
              height: "34px",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
              <path d="M16 3L28 12V16L16 7L4 16V12L16 3Z" fill="#F59E0B" />
              <path
                d="M8 15L16 9L24 15V27H8V15Z"
                fill="#F59E0B"
                fillOpacity="0.9"
              />
              <path d="M13 18H19V27H13V18Z" fill="#0B1220" />
              <rect x="6" y="27" width="20" height="2.5" rx="1" fill="#F59E0B" />
            </svg>
          </div>

          {/* Logo Text */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "23px",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.4px",
                lineHeight: 1.1,
                fontFamily: "var(--font-heading), sans-serif",
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
                fontFamily: "var(--font-sans), sans-serif",
              }}
            >
              Seller Central
            </span>
          </div>
        </div>
      </header>

      {/* ========================================================== */}
      {/* 2. STEP 0: SELLER LOGIN (EMAIL / PHONE & REGISTER CTA)      */}
      {/* ========================================================== */}
      {step === "login" && (
        <SellerLoginForm
          showHeaderFooter={false}
          onGoToRegister={() => {
            setStep("phone");
            setErrorMsg("");
          }}
          onLoginSuccess={(val) => {
            alert(`Welcome back to Makaano Seller Portal!\nLogged in as: ${val}`);
          }}
        />
      )}

      {/* ========================================================== */}
      {/* 3. STEP 1: MOBILE NUMBER ENTRY SCREEN                       */}
      {/* ========================================================== */}
      {step === "phone" && (
        <div
          style={{
            padding: "26px 24px 20px 24px",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            position: "relative",
          }}
        >
          {/* Top Amber Bar & Headline Split */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "20px",
            }}
          >
            {/* Left: Amber Accent & Typography */}
            <div style={{ maxWidth: "230px" }}>
              {/* Orange/Amber Horizontal Pill Line (Matching Screenshot) */}
              <div
                style={{
                  width: "48px",
                  height: "5px",
                  background: "#F59E0B",
                  borderRadius: "4px",
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
                  marginBottom: "8px",
                  fontFamily: "var(--font-sans), sans-serif",
                }}
              >
                Verify your mobile number
              </h1>
              <p
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  fontWeight: 500,
                  lineHeight: 1.4,
                }}
              >
                Enter your mobile number
              </p>
            </div>

            {/* Right: 3D Smartphone & Gold Building Blocks Illustration */}
            <div
              style={{
                position: "relative",
                width: "140px",
                height: "140px",
                marginTop: "-10px",
                flexShrink: 0,
              }}
            >
              <Image
                src="/images/auth-phone-shield.jpg"
                alt="Secure mobile verification shield"
                width={140}
                height={140}
                style={{
                  objectFit: "contain",
                  borderRadius: "16px",
                  filter: "drop-shadow(0 10px 18px rgba(15, 23, 42, 0.12))",
                }}
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

          {/* Input Controls Row: Country Code Selector + Mobile Input */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: errorMsg ? "8px" : "18px",
              position: "relative",
            }}
          >
            {/* Country Code Pill Button */}
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "0 16px",
                  height: "56px",
                  background: "#ffffff",
                  border: isCountryDropdownOpen ? "2px solid #C2410C" : "1.5px solid #e2e8f0",
                  borderRadius: "9999px",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#0B1220",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
                  minWidth: "100px",
                }}
              >
                <span style={{ fontSize: "16px" }}>{selectedCountry.flag}</span>
                <span>{selectedCountry.code}</span>
                <ChevronDown size={15} color="#6b7280" />
              </button>

              {/* Country Picker Dropdown Modal */}
              {isCountryDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "62px",
                    left: 0,
                    zIndex: 50,
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    boxShadow: "0 15px 35px -5px rgba(0, 0, 0, 0.15)",
                    width: "260px",
                    padding: "8px",
                    animation: "fadeIn 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "#f8fafc",
                      padding: "6px 10px",
                      borderRadius: "8px",
                      marginBottom: "6px",
                    }}
                  >
                    <Search size={13} color="#94a3b8" />
                    <input
                      type="text"
                      placeholder="Search country..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      style={{
                        border: "none",
                        background: "transparent",
                        fontSize: "12px",
                        outline: "none",
                        width: "100%",
                      }}
                      autoFocus
                    />
                  </div>

                  <div style={{ maxHeight: "180px", overflowY: "auto" }}>
                    {filteredCountries.map((c) => (
                      <button
                        key={c.code + c.name}
                        onClick={() => {
                          setSelectedCountry(c);
                          setIsCountryDropdownOpen(false);
                          setCountrySearch("");
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          padding: "8px 10px",
                          border: "none",
                          background: selectedCountry.code === c.code ? "rgba(194, 65, 12, 0.08)" : "transparent",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "13px",
                          color: "#0B1220",
                          textAlign: "left",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>{c.flag}</span>
                          <span>{c.name}</span>
                        </span>
                        <span style={{ fontWeight: 700, color: "#6b7280", fontSize: "12px" }}>
                          {c.code}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Number Pill Input */}
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="tel"
                placeholder="Enter mobile number"
                value={formatDisplayPhone(phoneNumber)}
                onChange={handlePhoneChange}
                maxLength={11} // with space
                style={{
                  width: "100%",
                  height: "56px",
                  padding: "0 20px",
                  background: "#ffffff",
                  border: errorMsg ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0",
                  borderRadius: "9999px",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#0B1220",
                  outline: "none",
                  transition: "all 0.15s ease",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
                  fontFamily: "var(--font-sans), sans-serif",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#C2410C")}
                onBlur={(e) => (e.target.style.borderColor = errorMsg ? "#ef4444" : "#e2e8f0")}
              />

              {/* Clear button if typed */}
              {phoneNumber.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPhoneNumber("")}
                  style={{
                    position: "absolute",
                    right: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#64748b",
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Validation Error Message */}
          {errorMsg && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                color: "#ef4444",
                fontSize: "12px",
                fontWeight: 600,
                marginBottom: "12px",
                paddingLeft: "6px",
              }}
            >
              <AlertCircle size={13} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Primary CTA: "Send OTP" Button (Brand) */}
          <button
            type="button"
            onClick={handleSendOtp}
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
              transition: "all 0.2s ease",
              marginBottom: "18px",
            }}
          >
            {isLoading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Generating OTP...</span>
              </>
            ) : (
              <span>Send OTP</span>
            )}
          </button>

          {/* Notice Card Banner (Soft Lavender Theme) */}
          <div
            style={{
              background: "#FFF7ED",
              border: "1px solid #E2E8F0",
              borderRadius: "9999px",
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            {/* Brand Icon Circle */}
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "1px solid #CBD5E1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                background: "#FFEDD5",
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

          {/* Already have an account? Sign In Link */}
          <div style={{ textAlign: "center", marginTop: "4px", marginBottom: "8px" }}>
            <button
              type="button"
              onClick={() => {
                setStep("login");
                setErrorMsg("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#C2410C",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Already have an account? Sign In
            </button>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 4. STEP 2: ENTER OTP PIN SCREEN                            */}
      {/* ========================================================== */}
      {step === "otp" && (
        <div
          style={{
            padding: "24px 24px 16px 24px",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            position: "relative",
            animation: "fadeIn 0.25s ease-out",
          }}
        >
          {/* Top Row: Amber Bar + Heading on Left, 3D Image on Right */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: "14px",
            }}
          >
            <div style={{ flex: 1, paddingRight: "8px" }}>
              {/* Amber Accent Bar */}
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
                  fontFamily: "var(--font-sans), sans-serif",
                }}
              >
                Enter OTP
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
                Enter the 6-digit OTP sent
              </p>
            </div>

            {/* 3D Graphic on the Right */}
            <div
              style={{
                position: "relative",
                width: "140px",
                height: "98px",
                flexShrink: 0,
              }}
            >
              <Image
                src="/images/auth-otp-dialog.jpg"
                alt="3D OTP verification illustration"
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

          {/* Phone Number Display */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "18px",
            }}
          >
            <span
              style={{
                fontSize: "19px",
                fontWeight: 800,
                color: "#0B1220",
                letterSpacing: "0.2px",
              }}
            >
              {selectedCountry.code} {phoneNumber ? formatDisplayPhone(phoneNumber) : "98765 43210"}
            </span>
            <button
              type="button"
              onClick={() => setStep("phone")}
              style={{
                background: "none",
                border: "none",
                color: "#C2410C",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Edit
            </button>
          </div>

          {/* 6 Circular Modern OTP Inputs */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "8px",
              marginBottom: errorMsg ? "8px" : "14px",
            }}
          >
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  otpInputsRef.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                placeholder={String(idx + 1)}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  border: digit ? "2px solid #C2410C" : "1.5px solid #e2e8f0",
                  background: "#ffffff",
                  fontSize: "20px",
                  fontWeight: 700,
                  textAlign: "center",
                  color: "#0B1220",
                  outline: "none",
                  transition: "all 0.15s ease",
                  boxShadow: digit
                    ? "0 4px 12px rgba(194, 65, 12, 0.22)"
                    : "0 2px 8px rgba(0, 0, 0, 0.06)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#C2410C";
                  e.target.style.boxShadow = "0 0 0 3px rgba(194, 65, 12, 0.2)";
                }}
                onBlur={(e) => {
                  if (!digit) {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.06)";
                  }
                }}
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {/* Resend OTP in 00:25 Countdown Text */}
          <div
            style={{
              textAlign: "center",
              fontSize: "13.5px",
              color: "#64748b",
              fontWeight: 500,
              marginBottom: "18px",
            }}
          >
            <span>Resend OTP in </span>
            <span
              style={{
                color: "#C2410C",
                fontWeight: 800,
                fontFamily: "var(--font-mono), monospace",
              }}
            >
              00:{timer < 10 ? `0${timer}` : timer}
            </span>
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
                marginBottom: "12px",
                paddingLeft: "4px",
              }}
            >
              <AlertCircle size={13} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Verify OTP Button (Unified Brand Theme) */}
          <button
            type="button"
            onClick={handleVerifyOtp}
            disabled={isLoading || otp.join("").length < 6}
            style={{
              width: "100%",
              height: "56px",
              background:
                otp.join("").length === 6
                  ? "linear-gradient(135deg, #9A3412 0%, #C2410C 100%)"
                  : "#E2E8F0",
              color: otp.join("").length === 6 ? "#ffffff" : "#C2410C",
              border: "none",
              borderRadius: "9999px",
              fontSize: "16px",
              fontWeight: 700,
              cursor: otp.join("").length === 6 ? "pointer" : "not-allowed",
              boxShadow:
                otp.join("").length === 6
                  ? "0 10px 25px -5px rgba(194, 65, 12, 0.45)"
                  : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s ease",
              marginBottom: "18px",
            }}
          >
            {isLoading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Verify OTP</span>
            )}
          </button>

          {/* Didn't receive OTP? Resend OTP Pill Container (Unified Lavender Theme) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              background: "#FFF7ED",
              border: "1px solid #E2E8F0",
              borderRadius: "9999px",
              padding: "12px 20px",
              boxShadow: "0 2px 8px rgba(194, 65, 12, 0.05)",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "rgba(194, 65, 12, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#C2410C",
                fontWeight: 800,
                fontSize: "12px",
                flexShrink: 0,
              }}
            >
              ?
            </div>
            <span style={{ fontSize: "13px", color: "#172036", fontWeight: 600 }}>
              Didn’t receive OTP?
            </span>
            <button
              type="button"
              onClick={handleResendOtp}
              style={{
                background: "transparent",
                border: "none",
                color: "#C2410C",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              Resend OTP
            </button>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 5. STEP 3: BUSINESS DETAILS FORM                            */}
      {/* ========================================================== */}
      {step === "business" && (
        <BusinessDetailsForm
          showHeaderFooter={false}
          defaultValues={businessData || undefined}
          onSuccess={(data) => {
            setBusinessData(data);
            setStep("contact");
          }}
        />
      )}

      {/* ========================================================== */}
      {/* 6. STEP 4: CONTACT PERSON DETAILS FORM                      */}
      {/* ========================================================== */}
      {step === "contact" && (
        <ContactPersonForm
          showHeaderFooter={false}
          defaultValues={contactData || undefined}
          onSuccess={(data) => {
            setContactData(data);
            setStep("address");
          }}
        />
      )}

      {/* ========================================================== */}
      {/* 7. STEP 5: BUSINESS ADDRESS FORM                            */}
      {/* ========================================================== */}
      {step === "address" && (
        <BusinessAddressForm
          showHeaderFooter={false}
          defaultValues={addressData || undefined}
          onSuccess={(data: BusinessAddressData) => {
            setAddressData(data);
            setStep("documents");
          }}
        />
      )}

      {/* ========================================================== */}
      {/* 8. STEP 6: DOCUMENT UPLOAD FORM                             */}
      {/* ========================================================== */}
      {step === "documents" && (
        <DocumentUploadForm
          showHeaderFooter={false}
          onSuccess={(data: DocumentUploadData) => {
            setDocumentData(data);
            setStep("terms");
          }}
        />
      )}

      {/* ========================================================== */}
      {/* 9. STEP 7: TERMS & CONDITIONS FORM                          */}
      {/* ========================================================== */}
      {step === "terms" && (
        <TermsConditionsForm
          showHeaderFooter={false}
          onSuccess={() => {
            setStep("success");
          }}
        />
      )}

      {/* ========================================================== */}
      {/* 10. STEP 8: REGISTRATION COMPLETED                          */}
      {/* ========================================================== */}
      {step === "success" && (
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
              color: "#0B1220",
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
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Mobile Number</span>
              <span style={{ fontSize: "13px", fontFamily: "var(--font-mono), monospace", color: "#0B1220", fontWeight: 700 }}>
                {selectedCountry.code} {phoneNumber || "—"}
              </span>
            </div>
            <div style={{ height: "1px", background: "#e2e8f0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Company Name</span>
              <span style={{ fontSize: "13px", color: "#0B1220", fontWeight: 700 }}>
                {businessData?.companyName || "—"}
              </span>
            </div>
            <div style={{ height: "1px", background: "#e2e8f0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>GSTIN</span>
              <span style={{ fontSize: "12px", fontFamily: "var(--font-mono), monospace", color: "#9A3412", fontWeight: 700 }}>
                {businessData?.gstin || "—"}
              </span>
            </div>
            <div style={{ height: "1px", background: "#e2e8f0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Contact Person</span>
              <span style={{ fontSize: "13px", color: "#0B1220", fontWeight: 700 }}>
                {contactData?.fullName || "—"}
              </span>
            </div>
            <div style={{ height: "1px", background: "#e2e8f0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, flexShrink: 0 }}>Business Address</span>
              <span style={{ fontSize: "12.5px", color: "#0B1220", fontWeight: 700, textAlign: "right", maxWidth: "60%" }}>
                {addressData ? `${addressData.address}, ${addressData.city}, ${addressData.state} - ${addressData.pinCode}` : "—"}
              </span>
            </div>
            <div style={{ height: "1px", background: "#e2e8f0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>KYC Documents</span>
              <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                <Check size={14} strokeWidth={2.5} />
                <span>
                  {documentData?.documents
                    ? `${Object.values(documentData.documents).filter(Boolean).length}/4 Uploaded`
                    : "Submitted"}
                </span>
              </span>
            </div>
          </div>

          {/* Launch CTA */}
          <button
            type="button"
            onClick={() => {
              setStep("login");
              setPhoneNumber("");
              setOtp(["", "", "", "", "", ""]);
            }}
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
            }}
          >
            <span>Go to Seller Login</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* ========================================================== */}
      {/* 6. BOTTOM ARCHITECTURAL 3D SILHOUETTE (CRANES & SILOS)     */}
      {/* ========================================================== */}
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
          alt="3D Construction site cranes and cement silos"
          fill
          sizes="(max-width: 768px) 100vw, 460px"
          style={{
            objectFit: "cover",
            objectPosition: "bottom center",
            opacity: 0.95,
          }}
          priority
        />
        {/* Soft top gradient blend to fade smoothly into white */}
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
