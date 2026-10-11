"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { RefreshCw, AlertCircle } from "lucide-react";

interface Step2Props {
  phone?: string;
  countryCode?: string;
  onSuccess?: () => void;
  onEditPhone?: () => void;
}

export default function Step2_OtpVerification({
  phone = "98765 43210",
  countryCode = "+91",
  onSuccess,
  onEditPhone,
}: Step2Props) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(25);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // 25s Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setErrorMsg("");

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setErrorMsg("Please enter complete 6-digit OTP");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");

    setTimeout(() => {
      setIsLoading(false);
      onSuccess?.();
    }, 700);
  };

  const handleResendOtp = () => {
    setTimer(25);
    setCanResend(false);
    setOtp(["", "", "", "", "", ""]);
    setErrorMsg("");
    otpInputsRef.current[0]?.focus();
  };

  const formattedPhone = phone.includes(" ")
    ? phone
    : `${phone.slice(0, 5)} ${phone.slice(5, 10)}`;

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

      {/* 2. OTP Form Body */}
      <div
        style={{
          padding: "24px 24px 16px 24px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        {/* Top Row: Amber Line + Heading on Left, 3D Image on Right */}
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
                color: "#1e1b4b",
                lineHeight: 1.15,
                letterSpacing: "-0.5px",
                marginBottom: "6px",
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

          {/* 3D Graphic */}
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
              color: "#1e1b4b",
              letterSpacing: "0.2px",
            }}
          >
            {countryCode} {formattedPhone}
          </span>
          <button
            type="button"
            onClick={onEditPhone}
            style={{
              background: "none",
              border: "none",
              color: "#7c3aed",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Edit
          </button>
        </div>

        {/* 6 Circular OTP Inputs */}
        <form onSubmit={handleVerifyOtp}>
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
                  border: digit ? "2px solid #7c3aed" : "1.5px solid #e2e8f0",
                  background: "#ffffff",
                  fontSize: "20px",
                  fontWeight: 700,
                  textAlign: "center",
                  color: "#1e1b4b",
                  outline: "none",
                  transition: "all 0.15s ease",
                  boxShadow: digit
                    ? "0 4px 12px rgba(124, 58, 237, 0.22)"
                    : "0 2px 8px rgba(0, 0, 0, 0.06)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#7c3aed";
                  e.target.style.boxShadow = "0 0 0 3px rgba(124, 58, 237, 0.2)";
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
                color: "#7c3aed",
                fontWeight: 800,
                fontFamily: "monospace",
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

          {/* Verify OTP Button (Unified Royal Purple Theme) */}
          <button
            type="submit"
            disabled={isLoading || otp.join("").length < 6}
            style={{
              width: "100%",
              height: "56px",
              background:
                otp.join("").length === 6
                  ? "linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)"
                  : "#e9d5ff",
              color: otp.join("").length === 6 ? "#ffffff" : "#7c3aed",
              border: "none",
              borderRadius: "9999px",
              fontSize: "16px",
              fontWeight: 700,
              cursor: otp.join("").length === 6 ? "pointer" : "not-allowed",
              boxShadow:
                otp.join("").length === 6
                  ? "0 10px 25px -5px rgba(124, 58, 237, 0.45)"
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
        </form>

        {/* Didn't receive OTP? Resend OTP Pill Container (Unified Lavender Theme) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            background: "#FAF5FF",
            border: "1px solid #E9D5FF",
            borderRadius: "9999px",
            padding: "12px 20px",
            boxShadow: "0 2px 8px rgba(124, 58, 237, 0.05)",
          }}
        >
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: "rgba(124, 58, 237, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#7C3AED",
              fontWeight: 800,
              fontSize: "12px",
              flexShrink: 0,
            }}
          >
            ?
          </div>
          <span style={{ fontSize: "13px", color: "#4C1D95", fontWeight: 600 }}>
            Didn’t receive OTP?
          </span>
          <button
            type="button"
            onClick={handleResendOtp}
            style={{
              background: "transparent",
              border: "none",
              color: "#7C3AED",
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
