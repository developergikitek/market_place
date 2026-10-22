"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import {
  Menu,
  ChevronDown,
  LayoutDashboard,
  Package,
  Layers,
  BookOpen,
  Boxes,
  Tag,
  RotateCcw,
  CreditCard,
  Wallet,
  // Bell,
  // Search,
  // Check,
  HelpCircle,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const badgeStyle = {
  background: "rgba(194, 65, 12, 0.3)",
  color: "#E2E8F0",
  fontSize: "11px",
  padding: "1px 6px",
  borderRadius: "9999px",
  fontWeight: 700,
} as const;

function navLinkStyle(isActive: boolean) {
  return isActive
    ? ({
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "9px 12px",
        borderRadius: "8px",
        color: "#ffffff",
        background: "linear-gradient(135deg, #C2410C 0%, #9A3412 100%)",
        border: "1px solid rgba(249, 115, 22, 0.5)",
        fontSize: "13.5px",
        fontWeight: 700,
        width: "100%",
        boxSizing: "border-box",
        boxShadow: "0 4px 14px rgba(154, 52, 18, 0.4)",
        textDecoration: "none",
      } as const)
    : ({
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "9px 12px",
        borderRadius: "8px",
        color: "#CBD5E1",
        background: "transparent",
        textDecoration: "none",
        fontSize: "13.5px",
        fontWeight: 500,
        width: "100%",
        boxSizing: "border-box",
      } as const);
}

interface SellerShellProps {
  /** Sidebar entry to highlight, e.g. "Returns". */
  active: string;
  /** Live count shown next to Returns in the sidebar. */
  returnsBadge?: number | string;
  children: ReactNode;
}

/** Seller Central frame: navy top bar + sidebar, with the page in a scrollable main area. */
export default function SellerShell({ active, returnsBadge, children }: SellerShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const sellerName =
    user?.seller_info?.display_name ||
    user?.seller_info?.legal_business_name ||
    (user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : user?.username || "Gikitek Certified Store");

  const sellerCode =
    user?.seller_info?.store_slug?.toUpperCase() ||
    (user?.id ? `SELLER-${user.id.slice(0, 6).toUpperCase()}` : "SELLER-GIKITEK");

  const userName =
    user?.first_name
      ? `${user.first_name} ${user.last_name || ""}`.trim()
      : user?.username || user?.phone || (user?.email ? user.email.split("@")[0] : "Seller Account");

  const userInitial = (userName || "S").charAt(0).toUpperCase();
  const userRole = user?.role
    ? (user.role === "ADMIN" ? "Administrator" : user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase())
    : "Merchant";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#F8FAFC",
        fontFamily: "var(--font-sans), sans-serif",
      }}
    >
      {/* ========================================================= */}
      {/* TOP HEADER NAVIGATION BAR (Makaano Navy Theme)  */}
      {/* ========================================================= */}
      <header
        style={{
          height: "64px",
          background: "#0B1220",
          borderBottom: "1px solid rgba(148, 163, 184, 0.25)",
          boxShadow: "0 4px 16px rgba(11, 18, 32, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        {/* Left: Toggle + Brand Logo + Seller Greeting */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? "Collapse sidebar menu" : "Expand sidebar menu"}
            title={isSidebarOpen ? "Collapse sidebar menu" : "Expand sidebar menu"}
            style={{
              background: "transparent",
              border: "none",
              borderRadius: "50%",
              cursor: "pointer",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              marginLeft: "-8px",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Menu size={22} />
          </button>

          <Link
            href="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
            }}
          >
            {/* Logo Building Icon */}
            <div
              style={{
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
                <path d="M16 3L28 12V16L16 7L4 16V12L16 3Z" fill="#F97316" />
                <path d="M8 15L16 9L24 15V27H8V15Z" fill="#F97316" fillOpacity="0.9" />
                <path d="M13 18H19V27H13V18Z" fill="#0B1220" />
                <rect x="6" y="27" width="20" height="2.5" rx="1" fill="#F97316" />
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px", lineHeight: 1 }}>
                Makaan<span style={{ color: "#F97316" }}>o</span>
              </span>
              <span style={{ fontSize: "7.5px", fontWeight: 600, color: "#CBD5E1", letterSpacing: "0.4px" }}>
                Seller Central
              </span>
            </div>
          </Link>

          {/* Divider */}
          <div style={{ width: "1px", height: "24px", background: "rgba(255, 255, 255, 0.15)" }} />

          {/* Seller Greeting + Badges */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13.5px", color: "#E2E8F0", fontWeight: 500 }}>
              Welcome back,{" "}
              <strong style={{ color: "#ffffff", fontWeight: 700 }}>{sellerName}</strong>
            </span>

            {/* SELLER ID Badge */}
            <span
              style={{
                background: "rgba(249, 115, 22, 0.18)",
                color: "#F97316",
                border: "1px solid rgba(249, 115, 22, 0.45)",
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "6px",
                fontFamily: "var(--font-mono), monospace",
              }}
            >
              {sellerCode}
            </span>

            {/* Verified Badge */}
            {/* <span
              style={{
                background: "rgba(16, 185, 129, 0.18)",
                color: "#34d399",
                border: "1px solid rgba(16, 185, 129, 0.45)",
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "9999px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Check size={12} strokeWidth={3} />
              <span>Verified</span>
            </span> */}
          </div>
        </div>

        {/* Right Header Controls: Search, Bell, Help, Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* <button
            type="button"
            title="Search"
            style={{
              background: "transparent",
              border: "none",
              color: "#CBD5E1",
              cursor: "pointer",
              padding: "6px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Search size={19} />
          </button>

          <div style={{ position: "relative" }}>
            <button
              type="button"
              title="Notifications"
              style={{
                background: "transparent",
                border: "none",
                color: "#CBD5E1",
                cursor: "pointer",
                padding: "6px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Bell size={19} />
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  right: "2px",
                  background: "#ef4444",
                  color: "#ffffff",
                  fontSize: "9.5px",
                  fontWeight: 800,
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #172036",
                }}
              >
                12
              </span>
            </button>
          </div>

          <button
            type="button"
            title="Help"
            style={{
              background: "transparent",
              border: "none",
              color: "#CBD5E1",
              cursor: "pointer",
              padding: "6px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <HelpCircle size={19} />
          </button> */}

          {/* Profile Dropdown Container */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                paddingLeft: "6px",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #C2410C 0%, #9A3412 100%)",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(194, 65, 12, 0.4)",
                }}
              >
                {userInitial}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }}>
                  {userName}
                </span>
                <span style={{ fontSize: "11px", color: "#CBD5E1", fontWeight: 500 }}>
                  {userRole}
                </span>
              </div>
              <ChevronDown size={14} color="#CBD5E1" />
            </button>

            {/* Profile Menu Popover */}
            {isProfileMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 10px)",
                  right: 0,
                  width: "240px",
                  background: "#111A2E",
                  border: "1px solid rgba(148, 163, 184, 0.25)",
                  borderRadius: "10px",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
                  padding: "12px",
                  zIndex: 100,
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ paddingBottom: "8px", borderBottom: "1px solid rgba(148, 163, 184, 0.15)" }}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>
                    {userName}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#94A3B8" }}>
                    {user?.phone || user?.email || "Seller Account"}
                  </p>
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: "6px",
                      background: "rgba(249, 115, 22, 0.2)",
                      color: "#F97316",
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {sellerName}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    logout();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    background: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#fca5a5",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.22)";
                    e.currentTarget.style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)";
                    e.currentTarget.style.color = "#fca5a5";
                  }}
                >
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN CONTAINER: SIDEBAR + CONTENT                         */}
      {/* ========================================================= */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ======================================================= */}
        {/* LEFT MAKAANO NAVY UNIFIED SIDEBAR                     */}
        {/* ======================================================= */}
        <aside
          style={{
            width: isSidebarOpen ? "250px" : "0px",
            minWidth: isSidebarOpen ? "250px" : "0px",
            maxWidth: isSidebarOpen ? "250px" : "0px",
            background: "#111A2E",
            color: "#CBD5E1",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            borderRight: isSidebarOpen ? "1px solid rgba(148, 163, 184, 0.25)" : "none",
            padding: isSidebarOpen ? "16px 12px" : "0px",
            gap: "4px",
            transition:
              "width 0.25s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.25s cubic-bezier(0.16, 1, 0.3, 1), max-width 0.25s cubic-bezier(0.16, 1, 0.3, 1), padding 0.25s ease, opacity 0.2s ease",
            overflowY: isSidebarOpen ? "auto" : "hidden",
            overflowX: "hidden",
            opacity: isSidebarOpen ? 1 : 0,
          }}
        >
          {/* Navigation Links */}
          {[
            { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { label: "Orders", href: "/orders", icon: Package, badge: "128" },
            { label: "Bulk orders", href: "/bulk-orders", icon: Layers },
            { label: "Catalog", href: "/catalog", icon: BookOpen },
            { label: "Inventory", href: "/inventory", icon: Boxes },
            { label: "Pricing", href: "/pricing", icon: Tag },
            { label: "Payments", href: "/payments", icon: CreditCard },
            { label: "Returns", href: "/returns", icon: RotateCcw, badge: returnsBadge || "8" },
            { label: "Payouts", icon: Wallet },
          ].map((item, idx) => {
            const Icon = item.icon;
            const isActive = active?.toLowerCase().trim() === item.label.toLowerCase().trim();

            if (item.href) {
              return (
                <Link
                  key={idx}
                  href={item.href}
                  title={item.label}
                  style={navLinkStyle(isActive)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Icon size={18} color={isActive ? "#ffffff" : undefined} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span
                      style={{
                        background: isActive ? "rgba(255, 255, 255, 0.25)" : "rgba(194, 65, 12, 0.35)",
                        color: isActive ? "#ffffff" : "#FDBA74",
                        border: isActive ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid rgba(249, 115, 22, 0.4)",
                        fontSize: "11px",
                        padding: "1px 6px",
                        borderRadius: "9999px",
                        fontWeight: 700,
                      }}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            }

            return (
              <button
                key={idx}
                type="button"
                title={item.label}
                style={{
                  ...navLinkStyle(isActive),
                  border: isActive ? "1px solid rgba(249, 115, 22, 0.5)" : "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Icon size={18} color={isActive ? "#ffffff" : undefined} />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span
                    style={{
                      background: isActive ? "rgba(255, 255, 255, 0.25)" : "rgba(194, 65, 12, 0.35)",
                      color: isActive ? "#ffffff" : "#FDBA74",
                      border: isActive ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid rgba(249, 115, 22, 0.4)",
                      fontSize: "11px",
                      padding: "1px 6px",
                      borderRadius: "9999px",
                      fontWeight: 700,
                    }}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}

          {/* Need Help Card in Sidebar */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: "16px",
              borderTop: "1px solid rgba(148, 163, 184, 0.2)",
            }}
          >
            <div
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(148, 163, 184, 0.25)",
                borderRadius: "10px",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ffffff", fontSize: "12.5px", fontWeight: 700 }}>
                <HelpCircle size={15} color="#F97316" />
                <span>Need Help?</span>
              </div>
              <span style={{ fontSize: "11px", color: "#CBD5E1" }}>
                Our support team is here
              </span>
              <a
                href="#support"
                style={{
                  color: "#F97316",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  textDecoration: "none",
                  marginTop: "4px",
                  display: "inline-block",
                }}
              >
                Contact Support →
              </a>
            </div>
            <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "12px", paddingLeft: "4px" }}>
              © 2025 Makaano<br />All rights reserved.
            </div>
          </div>
        </aside>


        <main
          style={{
            flex: 1,
            padding: "24px 32px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
