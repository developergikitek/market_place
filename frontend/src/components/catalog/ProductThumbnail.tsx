import React from "react";

interface ProductThumbnailProps {
  type: string;
  name: string;
}

export default function ProductThumbnail({ type, name }: ProductThumbnailProps) {
  const renderGraphic = () => {
    switch (type) {
      case "drill":
        return (
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            {/* Bosch Drill Body in Teal/Navy & Red */}
            <rect x="4" y="16" width="10" height="4" rx="1" fill="#71717a" />
            <path d="M14 12H28C31 12 34 15 34 18V21C34 23 32 25 30 25H22L19 33C18.5 34.5 17 35.5 15.5 35.5H13C11.5 35.5 10.5 34 11 32.5L14 24V12Z" fill="#0369a1" />
            <path d="M26 12H30C32.5 12 34 13.5 34 16V20C34 22 32.5 24 30 24H26V12Z" fill="#0284c7" />
            <circle cx="20" cy="18" r="3" fill="#dc2626" />
            <path d="M17 25L15 30" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case "hammer":
        return (
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            {/* Stanley Yellow Hammer */}
            <path d="M12 28L28 12" stroke="#eab308" strokeWidth="5" strokeLinecap="round" />
            <path d="M10 30L16 24" stroke="#18181b" strokeWidth="6" strokeLinecap="round" />
            <path d="M24 16L32 8L35 11L27 19Z" fill="#71717a" />
            <path d="M22 10L27 5L30 8L25 13Z" fill="#3f3f46" />
          </svg>
        );
      case "cement":
        return (
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            {/* UltraTech Yellow Bag */}
            <rect x="10" y="8" width="20" height="25" rx="3" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
            <rect x="13" y="13" width="14" height="6" fill="#dc2626" rx="1" />
            <line x1="14" y1="23" x2="26" y2="23" stroke="#854d0e" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="14" y1="27" x2="22" y2="27" stroke="#854d0e" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
      case "paint":
        return (
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            {/* Asian Paints Apex Bucket */}
            <path d="M11 14H29L27 32C27 33 26 34 25 34H15C14 34 13 33 13 32L11 14Z" fill="#111A2E" />
            <ellipse cx="20" cy="14" rx="9" ry="2.5" fill="#F97316" />
            <path d="M9 13C9 7 31 7 31 13" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />
            <rect x="14" y="20" width="12" height="6" rx="1" fill="#facc15" />
          </svg>
        );
      case "pipe":
        return (
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            {/* Finolex PVC Pipe */}
            <rect x="6" y="16" width="28" height="8" rx="4" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" transform="rotate(-25 20 20)" />
            <ellipse cx="10" cy="24" rx="3" ry="4" fill="#64748b" transform="rotate(-25 10 24)" />
            <line x1="15" y1="14" x2="28" y2="8" stroke="#3b82f6" strokeWidth="1.5" />
          </svg>
        );
      case "bulb":
        return (
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            {/* Philips LED Bulb */}
            <path d="M20 7C14.5 7 11 11 11 16C11 19.5 13.5 22 15 24V28H25V24C26.5 22 29 19.5 29 16C29 11 25.5 7 20 7Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
            <rect x="16" y="28" width="8" height="4" fill="#94a3b8" rx="1" />
            <rect x="18" y="32" width="4" height="2" fill="#64748b" rx="1" />
          </svg>
        );
      case "switch":
        return (
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            {/* Schneider Switch Board */}
            <rect x="7" y="11" width="26" height="18" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
            <rect x="11" y="15" width="5" height="10" rx="1" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
            <rect x="18" y="15" width="5" height="10" rx="1" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
            <rect x="25" y="15" width="4" height="10" rx="1" fill="#f59e0b" />
          </svg>
        );
      case "grinder":
        return (
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            {/* Makita Teal Angle Grinder */}
            <rect x="8" y="17" width="20" height="6" rx="2" fill="#0d9488" />
            <circle cx="28" cy="20" r="8" fill="#475569" stroke="#334155" strokeWidth="1.5" />
            <circle cx="28" cy="20" r="3" fill="#94a3b8" />
            <rect x="6" y="18" width="4" height="4" rx="1" fill="#1e293b" />
          </svg>
        );
      case "steel":
        return (
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            {/* Tata Tiscon 550D TMT Rebar */}
            <rect x="18" y="5" width="4" height="30" rx="1.5" fill="#475569" />
            <path d="M14 10L22 7M14 16L22 13M14 22L22 19M14 28L22 25M14 34L22 31" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            <rect x="13" y="15" width="14" height="4" rx="1" fill="#f59e0b" fillOpacity="0.9" />
          </svg>
        );
      default:
        return (
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            <rect x="8" y="8" width="24" height="24" rx="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
            <path d="M14 20H26M20 14V26" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
    }
  };

  return (
    <div
      style={{
        width: "42px",
        height: "42px",
        borderRadius: "8px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
      }}
      title={name}
    >
      {renderGraphic()}
    </div>
  );
}
