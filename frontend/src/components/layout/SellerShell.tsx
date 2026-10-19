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
  BarChart3,
  TrendingUp,
  Headphones,
  Settings,
  LifeBuoy,
  Bell,
  Search,
  Check,
  HelpCircle,
} from "lucide-react";

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
        padding: "10px 12px",
        borderRadius: "8px",
        color: "#ffffff",
        background: "linear-gradient(135deg, #C2410C 0%, #9A3412 100%)",
        border: "1px solid rgba(245, 158, 11, 0.4)",
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
        {/* Left: Brand Logo + Toggle + Seller Greeting */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
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
                <path d="M16 3L28 12V16L16 7L4 16V12L16 3Z" fill="#F59E0B" />
                <path d="M8 15L16 9L24 15V27H8V15Z" fill="#F59E0B" fillOpacity="0.9" />
                <path d="M13 18H19V27H13V18Z" fill="#0B1220" />
                <rect x="6" y="27" width="20" height="2.5" rx="1" fill="#F59E0B" />
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px", lineHeight: 1 }}>
                Makaan<span style={{ color: "#F59E0B" }}>o</span>
              </span>
              <span style={{ fontSize: "7.5px", fontWeight: 600, color: "#CBD5E1", letterSpacing: "0.4px" }}>
                Seller Central
              </span>
            </div>
          </Link>

          {/* Divider */}
          <div style={{ width: "1px", height: "24px", background: "rgba(255, 255, 255, 0.15)" }} />

          {/* Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? "Collapse sidebar menu" : "Expand sidebar menu"}
            title={isSidebarOpen ? "Collapse sidebar menu" : "Expand sidebar menu"}
            style={{
              background: isSidebarOpen ? "rgba(255, 255, 255, 0.12)" : "rgba(245, 158, 11, 0.25)",
              border: isSidebarOpen ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid #f59e0b",
              borderRadius: "8px",
              cursor: "pointer",
              color: isSidebarOpen ? "#ffffff" : "#fbbf24",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              transition: "all 0.2s ease",
            }}
          >
            <Menu size={19} />
          </button>

          {/* Seller Greeting + Badges */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13.5px", color: "#E2E8F0", fontWeight: 500 }}>
              Welcome back,{" "}
              <strong style={{ color: "#ffffff", fontWeight: 700 }}>BuildWell Traders Pvt. Ltd.</strong>
            </span>

            {/* SELLER ID Badge */}
            <span
              style={{
                background: "rgba(245, 158, 11, 0.18)",
                color: "#fbbf24",
                border: "1px solid rgba(245, 158, 11, 0.45)",
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "6px",
                fontFamily: "var(--font-mono), monospace",
              }}
            >
              SELLER12345
            </span>

            {/* Verified Badge */}
            <span
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
            </span>
          </div>
        </div>

        {/* Right Header Controls: Search, Bell, Help, Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button
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

          {/* Notification Bell */}
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
          </button>

          {/* Profile Dropdown */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              paddingLeft: "6px",
              cursor: "pointer",
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
              A
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }}>
                Arjun Sharma
              </span>
              <span style={{ fontSize: "11px", color: "#CBD5E1", fontWeight: 500 }}>
                Admin
              </span>
            </div>
            <ChevronDown size={14} color="#CBD5E1" />
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
          {/* 1. Dashboard Link */}
          <Link
            href="/dashboard"
            title="Dashboard"
            style={{
              display: "flex",
              alignItems: "center",
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
            }}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>

          {/* 2. Orders */}
          <Link href="/orders" title="Orders" style={navLinkStyle(active === "Orders")}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Package size={18} color={active === "Orders" ? "#fbbf24" : undefined} />
              <span>Orders</span>
            </div>
          </Link>

          {/* 3. Bulk orders */}
          <Link
            href="/bulk-orders"
            title="Bulk orders"
            style={{
              display: "flex",
              alignItems: "center",
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
            }}
          >
            <Layers size={18} />
            <span>Bulk orders</span>
          </Link>

          {/* 4. Catalog Link */}
          <Link
            href="/catalog"
            title="Catalog"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 12px",
              borderRadius: "8px",
              color: "#CBD5E1",
              background: "transparent",
              textDecoration: "none",
              fontSize: "13.5px",
              fontWeight: 500,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <BookOpen size={18} />
              <span>Catalog</span>
            </div>
            <ChevronDown size={14} color="#F97316" />
          </Link>

          {/* 5. Inventory Link */}
          <Link
            href="/inventory"
            title="Inventory"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 12px",
              borderRadius: "8px",
              color: "#CBD5E1",
              background: "transparent",
              textDecoration: "none",
              fontSize: "13.5px",
              fontWeight: 500,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Boxes size={18} />
              <span>Inventory</span>
            </div>
            <ChevronDown size={14} color="#F97316" />
          </Link>

          {/* Other Navigation Links */}
          {[
            { label: "Pricing", icon: Tag, hasChevron: true },
            { label: "Payments", icon: CreditCard, hasChevron: true, href: "/payments" },
            { label: "Returns", icon: RotateCcw, href: "/returns", badge: returnsBadge },
            { label: "Payouts", icon: Wallet, hasChevron: true },
            { label: "Reports", icon: BarChart3, hasChevron: true },
            { label: "Growth", icon: TrendingUp },
            { label: "Support", icon: Headphones },
            { label: "Notifications", icon: Bell },
            { label: "Account Settings", icon: Settings },
            { label: "Help Center", icon: LifeBuoy },
          ].map((item, idx) => {
            const Icon = item.icon;
            if (item.href) {
              return (
                <Link
                  key={idx}
                  href={item.href}
                  title={item.label}
                  style={{ ...navLinkStyle(active === item.label), padding: "8px 12px", fontSize: "13px" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Icon size={17} color={active === item.label ? "#fbbf24" : undefined} />
                    <span>{item.label}</span>
                  </div>
                  {item.hasChevron && <ChevronDown size={14} color="#F97316" />}
                  {item.badge ? <span style={badgeStyle}>{item.badge}</span> : null}
                </Link>
              );
            }

            return (
              <button
                key={idx}
                type="button"
                title={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  color: "#CBD5E1",
                  background: "transparent",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Icon size={17} />
                  <span>{item.label}</span>
                </div>
                {item.hasChevron && <ChevronDown size={14} color="#F97316" />}
                {item.badge && (
                  <span
                    style={{
                      background: "rgba(194, 65, 12, 0.3)",
                      color: "#E2E8F0",
                      fontSize: "11px",
                      padding: "1px 6px",
                      borderRadius: "9999px",
                      fontWeight: 700,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
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
                <HelpCircle size={15} color="#fbbf24" />
                <span>Need Help?</span>
              </div>
              <span style={{ fontSize: "11px", color: "#CBD5E1" }}>
                Our support team is here
              </span>
              <a
                href="#support"
                style={{
                  color: "#fbbf24",
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
