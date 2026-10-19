"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  FileText,
  CreditCard,
  Banknote,
  Building2,
  Shield,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  UploadCloud,
} from "lucide-react";

export interface DocumentItemState {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  uploaded: boolean;
  fileName?: string;
}

export interface DocumentUploadData {
  documents: Record<string, boolean>;
}

interface DocumentUploadFormProps {
  onSuccess?: (data: DocumentUploadData) => void;
  showHeaderFooter?: boolean;
}

export default function DocumentUploadForm({
  onSuccess,
  showHeaderFooter = true,
}: DocumentUploadFormProps) {
  const [documents, setDocuments] = useState<DocumentItemState[]>([
    {
      id: "gst",
      title: "GST Certificate",
      subtitle: "Upload GST Certificate",
      icon: FileText,
      uploaded: false,
    },
    {
      id: "pan",
      title: "PAN Card",
      subtitle: "Upload PAN Card",
      icon: CreditCard,
      uploaded: false,
    },
    {
      id: "cheque",
      title: "Cancelled Cheque",
      subtitle: "Upload Cancelled Cheque",
      icon: Banknote,
      uploaded: false,
    },
    {
      id: "registration",
      title: "Business Registration Proof",
      subtitle: "Upload Business Registration",
      icon: Building2,
      uploaded: false,
    },
  ]);

  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadClick = (docId: string) => {
    setActiveUploadId(docId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && activeUploadId) {
      const file = e.target.files[0];
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === activeUploadId
            ? { ...doc, uploaded: true, fileName: file.name }
            : doc
        )
      );
      setActiveUploadId(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      const docRecord: Record<string, boolean> = {};
      documents.forEach((d) => {
        docRecord[d.id] = d.uploaded;
      });
      onSuccess?.({ documents: docRecord });
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
      {/* Hidden File Input for simulated file browsing */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept=".pdf,.jpg,.jpeg,.png"
      />

      {/* Top Header Row: Amber Bar + Title on Left, 3D Cloud Upload Graphic on Right */}
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
            Document Upload
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
            Upload required documents
          </p>
        </div>

        {/* 3D Cloud Document Upload Graphic */}
        <div
          style={{
            position: "relative",
            width: "84px",
            height: "84px",
            borderRadius: "18px",
            overflow: "hidden",
            boxShadow: "0 8px 20px -4px rgba(37, 99, 235, 0.25)",
            border: "2px solid rgba(37, 99, 235, 0.25)",
            background: "#ffffff",
            flexShrink: 0,
          }}
        >
          <Image
            src="/images/document-upload-3d.jpg"
            alt="3D Document upload interface"
            fill
            sizes="84px"
            style={{ objectFit: "cover" }}
            priority
          />
        </div>
      </div>

      {/* Document Items List */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          flex: 1,
        }}
      >
        {documents.map((doc) => {
          const Icon = doc.icon;
          return (
            <div
              key={doc.id}
              style={{
                width: "100%",
                borderRadius: "9999px",
                border: "1.5px solid #cbd5e1",
                padding: "10px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#ffffff",
                transition: "all 0.15s ease",
              }}
            >
              {/* Left Side: Amber Icon Badge + Titles */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    background: "rgba(245, 158, 11, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#d97706",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} />
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#0B1220",
                      lineHeight: 1.2,
                    }}
                  >
                    {doc.title}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                      fontWeight: 500,
                      lineHeight: 1.3,
                    }}
                  >
                    {doc.subtitle}
                  </span>
                </div>
              </div>

              {/* Right Side: Status (Uploaded with Checkmark OR Upload Button) */}
              <div>
                {doc.uploaded ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      color: "#16a34a",
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    <span>Uploaded</span>
                    <CheckCircle2 size={16} strokeWidth={2.5} />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUploadClick(doc.id)}
                    style={{
                      border: "1.5px solid #2563eb",
                      background: "transparent",
                      color: "#2563eb",
                      borderRadius: "9999px",
                      padding: "6px 18px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(37, 99, 235, 0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span>Upload</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

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
            marginTop: "10px",
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
              <span>Verifying Documents...</span>
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle2 size={18} />
              <span>Documents Uploaded!</span>
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
