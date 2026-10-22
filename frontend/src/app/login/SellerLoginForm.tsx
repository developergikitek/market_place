"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Building2,
  UserPlus,
  ShieldCheck,
} from "lucide-react";
import { loginWithBackend } from "@/services/authService";

export interface SellerLoginFormProps {
  initialMethod?: "email" | "phone";
  onLoginSuccess?: (emailOrPhone: string) => void;
  onGoToRegister?: () => void;
  onSwitchMethod?: (method: "email" | "phone") => void;
  showHeaderFooter?: boolean;
}

export default function SellerLoginForm({
  initialMethod = "email",
  onLoginSuccess,
  onGoToRegister,
  onSwitchMethod,
  showHeaderFooter = true,
}: SellerLoginFormProps) {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">(initialMethod);

  const handleSignUp = () => {
    if (onGoToRegister) {
      onGoToRegister();
    } else {
      router.push("/portal/dashboard");
    }
  };

  useEffect(() => {
    setLoginMethod(initialMethod);
  }, [initialMethod]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobileNumber(raw);
    setErrorMsg("");
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const identifier = email.trim();
    if (!identifier) {
      setErrorMsg("Please enter your registered email address or mobile number");
      return;
    }
    if (!password.trim()) {
      setErrorMsg("Please enter your account password");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      await loginWithBackend(identifier, password);
      setIsSuccess(true);
      if (onLoginSuccess) {
        onLoginSuccess(identifier);
      } else {
        router.push("/portal/dashboard");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials. Please verify your phone/email and password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileNumber.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!password.trim()) {
      setErrorMsg("Please enter your account password");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      await loginWithBackend(mobileNumber, password);
      setIsSuccess(true);
      if (onLoginSuccess) {
        onLoginSuccess(mobileNumber);
      } else {
        router.push("/portal/dashboard");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials. Please verify your phone/email and password.");
    } finally {
      setIsLoading(false);
    }
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
      {/* Top Header Row: Amber Bar + Title on Left, 3D Shield Graphic on Right */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "20px",
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
            {loginMethod === "email" ? "Seller Login" : "Mobile Login"}
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
            {loginMethod === "email"
              ? "Sign in with your registered email & password"
              : "Sign in with your registered mobile number & OTP"}
            {" • "}
            <span
              onClick={handleSignUp}
              style={{
                color: "#C2410C",
                fontWeight: 700,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Sign Up
            </span>
          </p>
        </div>

        {/* 3D Login Shield Graphic */}
        <div
          style={{
            position: "relative",
            width: "84px",
            height: "84px",
            borderRadius: "18px",
            overflow: "hidden",
            boxShadow: "0 8px 20px -4px rgba(194, 65, 12, 0.25)",
            border: "2px solid rgba(194, 65, 12, 0.25)",
            background: "#ffffff",
            flexShrink: 0,
          }}
        >
          <Image
            src="/images/seller-login-3d.jpg"
            alt="3D Seller Login Security Shield"
            fill
            sizes="84px"
            style={{ objectFit: "cover" }}
            priority
          />
        </div>
      </div>

      {/* MODE 1: LOGIN WITH EMAIL */}
      {loginMethod === "email" && (
        <form
          onSubmit={handleEmailSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            flex: 1,
          }}
        >
          {/* Field: Email */}
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
                  Email or Mobile Number
                </span>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMsg("");
                  }}
                  placeholder="Enter registered email or mobile number"
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

          {/* Field: Password */}
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
              <Lock size={20} />
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
                  Password
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg("");
                  }}
                  placeholder="Enter your password"
                  style={{
                    width: "100%",
                    height: "52px",
                    borderRadius: "9999px",
                    border: "1.5px solid #e2e8f0",
                    padding: "0 46px 0 18px",
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-6px" }}>
            <button
              type="button"
              onClick={() => alert("Password reset link will be sent to your registered email.")}
              style={{
                background: "none",
                border: "none",
                color: "#C2410C",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Forgot Password?
            </button>
          </div>

          {/* Error Banner */}
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

          {/* Sign In Button */}
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
              marginTop: "4px",
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
                <span>Signing In...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 size={18} />
                <span>Signed In Successfully!</span>
              </>
            ) : (
              <>
                <span>Sign In to Seller Portal</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {/* Bottom Switcher Option: Login with Mobile */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              margin: "18px 0 14px 0",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px" }}>
              OR SIGN IN WITH
            </span>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
          </div>

          <button
            type="button"
            onClick={() => {
              setErrorMsg("");
              if (onSwitchMethod) {
                onSwitchMethod("phone");
              } else {
                setLoginMethod("phone");
              }
            }}
            style={{
              width: "100%",
              height: "50px",
              background: "#ffffff",
              border: "1.5px solid #e2e8f0",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              color: "#0B1220",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#C2410C";
              e.currentTarget.style.background = "rgba(194, 65, 12, 0.04)";
              e.currentTarget.style.color = "#C2410C";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.color = "#0B1220";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "rgba(194, 65, 12, 0.1)",
                color: "#C2410C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Phone size={15} />
            </div>
            <span>Sign in using Mobile &amp; OTP</span>
          </button>
        </form>
      )}

      {/* MODE 2: LOGIN WITH PHONE */}
      {loginMethod === "phone" && (
        <form
          onSubmit={handlePhoneSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            flex: 1,
          }}
        >
          {/* Field: Mobile Number */}
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
              <div style={{ position: "relative", width: "100%", display: "flex" }}>
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
                  Mobile Number
                </span>

                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "9999px",
                    background: "#ffffff",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "0 14px",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#0B1220",
                      borderRight: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>

                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={mobileNumber}
                    onChange={handlePhoneChange}
                    placeholder="10-digit mobile number"
                    style={{
                      flex: 1,
                      height: "52px",
                      border: "none",
                      padding: "0 16px",
                      fontSize: "14.5px",
                      fontWeight: 600,
                      color: "#0B1220",
                      outline: "none",
                      background: "transparent",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Field: Password for Mobile Login */}
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
              <Lock size={20} />
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
                  Password
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg("");
                  }}
                  placeholder="Enter your account password"
                  style={{
                    width: "100%",
                    height: "52px",
                    borderRadius: "9999px",
                    border: "1.5px solid #e2e8f0",
                    padding: "0 48px 0 18px",
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Error Banner */}
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

          {/* Sign In Button */}
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
              marginTop: "4px",
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
                <span>Signing In...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 size={18} />
                <span>Logged In Successfully!</span>
              </>
            ) : (
              <>
                <span>Sign In to Seller Portal</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {/* Bottom Switcher Option: Login with Email */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              margin: "18px 0 14px 0",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px" }}>
              OR SIGN IN WITH
            </span>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
          </div>

          <button
            type="button"
            onClick={() => {
              setErrorMsg("");
              if (onSwitchMethod) {
                onSwitchMethod("email");
              } else {
                setLoginMethod("email");
              }
            }}
            style={{
              width: "100%",
              height: "50px",
              background: "#ffffff",
              border: "1.5px solid #e2e8f0",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              color: "#0B1220",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#C2410C";
              e.currentTarget.style.background = "rgba(194, 65, 12, 0.04)";
              e.currentTarget.style.color = "#C2410C";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.color = "#0B1220";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "rgba(194, 65, 12, 0.1)",
                color: "#C2410C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Mail size={15} />
            </div>
            <span>Sign in using Business Email</span>
          </button>
        </form>
      )}

      {/* Divider */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          margin: "18px 0 16px 0",
        }}
      >
        <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px" }}>
          NEW SELLER?
        </span>
        <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
      </div>

      {/* Register New Account CTA Button (Leads to Registration Funnel) */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(194, 65, 12, 0.06) 0%, rgba(148, 163, 184, 0.08) 100%)",
          border: "1.5px solid rgba(194, 65, 12, 0.25)",
          borderRadius: "18px",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        onClick={handleSignUp}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#C2410C";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(194, 65, 12, 0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(194, 65, 12, 0.25)";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #9A3412 0%, #C2410C 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <UserPlus size={18} />
          </div>

          <div>
            <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0B1220", lineHeight: 1.2 }}>
              Don&apos;t have an account? <span style={{ color: "#C2410C" }}>Sign Up</span>
            </div>
            <div style={{ fontSize: "12px", color: "#9A3412", fontWeight: 600, marginTop: "2px" }}>
              Sign Up / Register as Seller on Makaano
            </div>
          </div>
        </div>

        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "#ffffff",
            border: "1px solid rgba(194, 65, 12, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9A3412",
            flexShrink: 0,
          }}
        >
          <ArrowRight size={16} />
        </div>
      </div>
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
