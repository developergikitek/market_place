"use client";

import React, { useState } from "react";
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
  X,
  Info,
  ShoppingBag,
  IndianRupee,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Megaphone,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
} from "lucide-react";

// Sales Overview Chart Data for different time ranges
const SALES_TIMEFRAME_DATA: Record<
  string,
  {
    total: string;
    growth: string;
    isPositive: boolean;
    labels: string[];
    values: number[]; // in Lakhs (₹)
    displayValues: string[];
  }
> = {
  "Last 7 Days": {
    total: "₹12,75,430",
    growth: "+23.5% vs last 7 days",
    isPositive: true,
    labels: ["13 May", "14 May", "15 May", "16 May", "17 May", "18 May", "19 May"],
    values: [1.4, 2.2, 1.6, 2.4, 1.9, 2.3, 2.8],
    displayValues: ["₹1,42,000", "₹2,21,500", "₹1,58,900", "₹2,44,200", "₹1,89,600", "₹2,34,230", "₹2,85,000"],
  },
  "Last 14 Days": {
    total: "₹24,18,650",
    growth: "+19.2% vs prev 14 days",
    isPositive: true,
    labels: ["06 May", "08 May", "10 May", "12 May", "14 May", "16 May", "19 May"],
    values: [1.8, 2.1, 1.9, 2.5, 2.2, 2.4, 2.8],
    displayValues: ["₹1,80,000", "₹2,10,000", "₹1,90,000", "₹2,50,000", "₹2,21,500", "₹2,44,200", "₹2,85,000"],
  },
  "This Month": {
    total: "₹38,90,120",
    growth: "+28.4% vs last month",
    isPositive: true,
    labels: ["W1 May", "W2 May", "W3 May", "W4 May", "W5 May"],
    values: [1.2, 1.9, 2.4, 2.7, 2.9],
    displayValues: ["₹6,40,000", "₹8,90,000", "₹10,50,000", "₹11,20,000", "₹1,90,120"],
  },
};

// Recent Orders Dataset
const RECENT_ORDERS = [
  {
    orderId: "BM12567892",
    date: "19 May 2025 • 11:45 AM",
    amount: "₹4,850",
    status: "Delivered",
    statusColor: "#10b981", // Emerald green
    statusBg: "#ecfdf5",
  },
  {
    orderId: "BM12567891",
    date: "19 May 2025 • 10:30 AM",
    amount: "₹2,340",
    status: "Delivered",
    statusColor: "#10b981",
    statusBg: "#ecfdf5",
  },
  {
    orderId: "BM12567890",
    date: "19 May 2025 • 09:15 AM",
    amount: "₹1,270",
    status: "Processing",
    statusColor: "#f59e0b", // Amber
    statusBg: "#fffbeb",
  },
  {
    orderId: "BM12567889",
    date: "18 May 2025 • 08:40 PM",
    amount: "₹3,620",
    status: "Shipped",
    statusColor: "#3b82f6", // Blue
    statusBg: "#eff6ff",
  },
  {
    orderId: "BM12567888",
    date: "18 May 2025 • 07:20 PM",
    amount: "₹2,150",
    status: "Pending",
    statusColor: "#64748b", // Neutral slate
    statusBg: "#f1f5f9",
  },
];

// Announcements Dataset
const ANNOUNCEMENTS = [
  {
    id: 1,
    title: "New Feature Update",
    description: "Bulk edit inventory and pricing is now live!",
    date: "19 May 2025",
    icon: Megaphone,
    iconColor: "#2563eb",
    iconBg: "#eff6ff",
    borderColor: "#dbeafe",
  },
  {
    id: 2,
    title: "Mega Seller Fest",
    description: "Boost your sales with exciting campaigns & offers.",
    date: "18 May 2025",
    icon: Tag,
    iconColor: "#ea580c",
    iconBg: "#fff7ed",
    borderColor: "#fed7aa",
  },
  {
    id: 3,
    title: "Policy Update",
    description: "Return policy has been updated. Please review.",
    date: "17 May 2025",
    icon: ShieldCheck,
    iconColor: "#059669",
    iconBg: "#ecfdf5",
    borderColor: "#a7f3d0",
  },
];

// Top Selling Categories Dataset
const TOP_CATEGORIES = [
  { rank: 1, name: "Power Tools", amount: "₹4,25,000", percent: 33 },
  { rank: 2, name: "Electricals", amount: "₹3,10,000", percent: 24 },
  { rank: 3, name: "Hardware", amount: "₹2,05,000", percent: 16 },
  { rank: 4, name: "Plumbing", amount: "₹1,60,000", percent: 12 },
  { rank: 5, name: "Paints & Accessories", amount: "₹75,430", percent: 5 },
];

// Sales By Channel Dataset
const SALES_CHANNELS = [
  {
    name: "Makaano App",
    percentage: "65%",
    amount: "₹8,29,030",
    color: "#f59e0b", // Amber
  },
  {
    name: "Makaano Website",
    percentage: "25%",
    amount: "₹3,18,857",
    color: "#3b82f6", // Blue
  },
  {
    name: "API / Integrations",
    percentage: "10%",
    amount: "₹1,27,543",
    color: "#0B1220", // Makaano navy
  },
];

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showProfileBanner, setShowProfileBanner] = useState(true);
  const [salesTimeframe, setSalesTimeframe] = useState("Last 7 Days");
  const [activeChartHoverIdx, setActiveChartHoverIdx] = useState<number | null>(null);
  const [categoriesTimeframe, setCategoriesTimeframe] = useState("Last 7 Days");
  const [channelTimeframe, setChannelTimeframe] = useState("Last 7 Days");
  const [performanceTimeframe, setPerformanceTimeframe] = useState("This Week");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const currentSalesData = SALES_TIMEFRAME_DATA[salesTimeframe] || SALES_TIMEFRAME_DATA["Last 7 Days"];

  // Helper for SVG chart points
  const chartWidth = 520;
  const chartHeight = 150;
  const paddingX = 40;
  const paddingY = 20;

  // Convert values (0 to 3) into SVG coordinates
  const points = currentSalesData.values.map((val, idx) => {
    const x = paddingX + (idx / (currentSalesData.values.length - 1)) * (chartWidth - 2 * paddingX);
    // 0 is bottom (chartHeight - paddingY), 3 is top (paddingY)
    const y = chartHeight - paddingY - (val / 3) * (chartHeight - 2 * paddingY);
    return { x, y, val, label: currentSalesData.labels[idx], displayVal: currentSalesData.displayValues[idx] };
  });

  // SVG polyline string
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Closed path for SVG linear gradient area fill
  const areaPath = `M ${points[0].x},${chartHeight - paddingY} ` +
    points.map((p) => `L ${p.x},${p.y}`).join(" ") +
    ` L ${points[points.length - 1].x},${chartHeight - paddingY} Z`;

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
        {/* Left: Brand Logo + Toggle + Seller Badge + Verified Status */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "14px", position: "relative" }}>
          {/* Quick Search */}
          <div style={{ position: "relative" }}>
            {searchOpen ? (
              <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.15)", borderRadius: "8px", padding: "4px 8px" }}>
                <Search size={16} color="#CBD5E1" />
                <input
                  type="text"
                  placeholder="Search orders, SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "#ffffff",
                    fontSize: "13px",
                    marginLeft: "6px",
                    width: "160px",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  style={{ background: "transparent", border: "none", color: "#CBD5E1", cursor: "pointer" }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                title="Search dashboard"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#CBD5E1",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "6px",
                  borderRadius: "6px",
                  transition: "color 0.15s ease",
                }}
              >
                <Search size={19} />
              </button>
            )}
          </div>

          {/* Notifications Bell with count */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setNotificationOpen((prev) => !prev)}
              title="Notifications"
              style={{
                background: "transparent",
                border: "none",
                color: "#CBD5E1",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "6px",
                borderRadius: "6px",
                position: "relative",
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

            {/* Notification Popover Dropdown */}
            {notificationOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "42px",
                  right: "-20px",
                  width: "310px",
                  background: "#ffffff",
                  borderRadius: "12px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.06)",
                  border: "1px solid #e2e8f0",
                  padding: "14px",
                  zIndex: 100,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>Notifications (12)</span>
                  <button
                    type="button"
                    onClick={() => setNotificationOpen(false)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8" }}
                  >
                    <X size={16} />
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "240px", overflowY: "auto" }}>
                  <div style={{ padding: "8px", background: "#f8fafc", borderRadius: "8px", fontSize: "12.5px" }}>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>New order BM12567892 received!</div>
                    <div style={{ color: "#64748b", fontSize: "11px", marginTop: "2px" }}>₹4,850 • 11:45 AM</div>
                  </div>
                  <div style={{ padding: "8px", background: "#f8fafc", borderRadius: "8px", fontSize: "12.5px" }}>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>Mega Seller Fest is starting tomorrow</div>
                    <div style={{ color: "#64748b", fontSize: "11px", marginTop: "2px" }}>Check special promotions</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Help Icon */}
          <button
            type="button"
            title="Help & Documentation"
            style={{
              background: "transparent",
              border: "none",
              color: "#CBD5E1",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6px",
              borderRadius: "6px",
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
          {/* 1. ACTIVE DASHBOARD BUTTON */}
          <Link
            href="/dashboard"
            title="Dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              borderRadius: "8px",
              color: "#ffffff",
              background: "linear-gradient(135deg, #C2410C 0%, #9A3412 100%)",
              border: "1px solid rgba(245, 158, 11, 0.4)",
              fontSize: "13.5px",
              fontWeight: 700,
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              boxShadow: "0 4px 14px rgba(154, 52, 18, 0.4)",
              textDecoration: "none",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <LayoutDashboard size={18} color="#fbbf24" />
              <span>Dashboard</span>
            </div>
            <ChevronDown size={14} color="#fbbf24" style={{ transform: "rotate(180deg)" }} />
          </Link>

          {/* 2. Orders Link */}
          <Link
            href="/orders"
            title="Orders"
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
              transition: "background 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Package size={18} />
              <span>Orders</span>
            </div>
            <span
              style={{
                background: "rgba(194, 65, 12, 0.35)",
                color: "#E2E8F0",
                fontSize: "11px",
                padding: "2px 7px",
                borderRadius: "9999px",
                fontWeight: 700,
              }}
            >
              128
            </span>
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
            { label: "Pricing", icon: Tag, hasChevron: false },
            { label: "Payments", icon: CreditCard, hasChevron: true, href: "/payments" },
            { label: "Returns", icon: RotateCcw, badge: "8" },
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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    color: "#CBD5E1",
                    background: "transparent",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </div>
                  {item.hasChevron && <ChevronDown size={14} color="#F97316" />}
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
                Our seller support team is here
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

        {/* ======================================================= */}
        {/* MAIN DASHBOARD WORKSPACE (Consistent Light Theme)       */}
        {/* ======================================================= */}
        <main
          style={{
            flex: 1,
            padding: "24px 32px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* 1. TOP INFORMATION BANNER: Profile Completion */}
          {showProfileBanner && (
            <div
              style={{
                background: "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)",
                border: "1.5px solid #bfdbfe",
                borderRadius: "12px",
                padding: "12px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(59, 130, 246, 0.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "#dbeafe",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Info size={16} />
                </div>
                <span style={{ fontSize: "13.5px", color: "#1e293b", fontWeight: 500 }}>
                  Complete your profile to unlock all features and grow your business.
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <button
                  type="button"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#2563eb",
                    fontSize: "13.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline",
                  }}
                >
                  Complete Now
                </button>
                <button
                  type="button"
                  onClick={() => setShowProfileBanner(false)}
                  title="Dismiss alert"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={17} />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* 2. TOP 4 METRICS CARDS ROW                              */}
          {/* ======================================================= */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
            }}
          >
            {/* Card 1: TOTAL ORDERS */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(194, 65, 12, 0.12)",
                borderRadius: "14px",
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: "0 2px 8px rgba(194, 65, 12, 0.04)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, letterSpacing: "0.5px" }}>
                    TOTAL ORDERS
                  </span>
                  <div style={{ fontSize: "30px", fontWeight: 800, color: "#1e293b", marginTop: "4px", lineHeight: 1.1 }}>
                    1,248
                  </div>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: "#eff6ff",
                    color: "#3b82f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ShoppingBag size={20} />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}>
                <span style={{ color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center" }}>
                  <ArrowUpRight size={15} />
                  18.6%
                </span>
                <span style={{ color: "#64748b" }}>vs last 7 days</span>
              </div>
            </div>

            {/* Card 2: TOTAL SALES */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(16, 185, 129, 0.18)",
                borderRadius: "14px",
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.04)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, letterSpacing: "0.5px" }}>
                    TOTAL SALES
                  </span>
                  <div style={{ fontSize: "30px", fontWeight: 800, color: "#1e293b", marginTop: "4px", lineHeight: 1.1 }}>
                    ₹12,75,430
                  </div>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: "#ecfdf5",
                    color: "#10b981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <IndianRupee size={20} />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}>
                <span style={{ color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center" }}>
                  <ArrowUpRight size={15} />
                  23.5%
                </span>
                <span style={{ color: "#64748b" }}>vs last 7 days</span>
              </div>
            </div>

            {/* Card 3: ORDERS DELIVERED */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(245, 158, 11, 0.2)",
                borderRadius: "14px",
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: "0 2px 8px rgba(245, 158, 11, 0.04)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, letterSpacing: "0.5px" }}>
                    ORDERS DELIVERED
                  </span>
                  <div style={{ fontSize: "30px", fontWeight: 800, color: "#1e293b", marginTop: "4px", lineHeight: 1.1 }}>
                    1,102
                  </div>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: "#fffbeb",
                    color: "#f59e0b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Package size={20} />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}>
                <span style={{ color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center" }}>
                  <ArrowUpRight size={15} />
                  16.4%
                </span>
                <span style={{ color: "#64748b" }}>vs last 7 days</span>
              </div>
            </div>

            {/* Card 4: PENDING ORDERS */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(239, 68, 68, 0.18)",
                borderRadius: "14px",
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: "0 2px 8px rgba(239, 68, 68, 0.04)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, letterSpacing: "0.5px" }}>
                    PENDING ORDERS
                  </span>
                  <div style={{ fontSize: "30px", fontWeight: 800, color: "#1e293b", marginTop: "4px", lineHeight: 1.1 }}>
                    146
                  </div>
                </div>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: "#fef2f2",
                    color: "#ef4444",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Clock size={20} />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}>
                <span style={{ color: "#ef4444", fontWeight: 700, display: "flex", alignItems: "center" }}>
                  <ArrowDownRight size={15} />
                  7.8%
                </span>
                <span style={{ color: "#64748b" }}>vs last 7 days</span>
              </div>
            </div>
          </div>

          {/* ======================================================= */}
          {/* 3. MIDDLE ROW: Sales Overview | Recent Orders | Announcements */}
          {/* ======================================================= */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.25fr 1fr 1fr",
              gap: "16px",
            }}
          >
            {/* 3.1 SALES OVERVIEW CARD */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(194, 65, 12, 0.12)",
                borderRadius: "14px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                boxShadow: "0 2px 8px rgba(194, 65, 12, 0.04)",
              }}
            >
              {/* Card Header: Title & Dropdown */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                  Sales Overview
                </h2>
                <select
                  value={salesTimeframe}
                  onChange={(e) => setSalesTimeframe(e.target.value)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    color: "#475569",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 14 Days">Last 14 Days</option>
                  <option value="This Month">This Month</option>
                </select>
              </div>

              {/* Value and Growth Tag */}
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                <span style={{ fontSize: "24px", fontWeight: 800, color: "#1e293b" }}>
                  {currentSalesData.total}
                </span>
                <span
                  style={{
                    background: "#ecfdf5",
                    color: "#10b981",
                    fontSize: "12px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "6px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  <ArrowUpRight size={13} />
                  {currentSalesData.growth}
                </span>
              </div>

              {/* Interactive SVG Sales Line Chart */}
              <div style={{ position: "relative", width: "100%", height: "165px" }}>
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  style={{ width: "100%", height: "100%", overflow: "visible" }}
                >
                  <defs>
                    <linearGradient id="salesGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[0, 1, 2, 3].map((val) => {
                    const y = chartHeight - paddingY - (val / 3) * (chartHeight - 2 * paddingY);
                    return (
                      <g key={val}>
                        <text
                          x={paddingX - 10}
                          y={y + 4}
                          fill="#94a3b8"
                          fontSize="9.5"
                          fontWeight="500"
                          textAnchor="end"
                        >
                          {val === 0 ? "₹0" : `₹${val}L`}
                        </text>
                        <line
                          x1={paddingX}
                          y1={y}
                          x2={chartWidth - paddingX}
                          y2={y}
                          stroke="#f1f5f9"
                          strokeWidth="1"
                          strokeDasharray={val === 0 ? "none" : "3,3"}
                        />
                      </g>
                    );
                  })}

                  {/* Area fill under curve */}
                  <path d={areaPath} fill="url(#salesGlow)" />

                  {/* Amber Line connecting points */}
                  <polyline
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polylinePoints}
                  />

                  {/* Interactive Nodes / Dots */}
                  {points.map((pt, idx) => (
                    <g
                      key={idx}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => setActiveChartHoverIdx(idx)}
                      onMouseLeave={() => setActiveChartHoverIdx(null)}
                    >
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={activeChartHoverIdx === idx ? 6 : 4}
                        fill="#ffffff"
                        stroke="#f59e0b"
                        strokeWidth={activeChartHoverIdx === idx ? 3.5 : 2.5}
                        style={{ transition: "all 0.15s ease" }}
                      />
                      {/* X axis labels */}
                      <text
                        x={pt.x}
                        y={chartHeight - 4}
                        fill="#64748b"
                        fontSize="9.5"
                        fontWeight="600"
                        textAnchor="middle"
                      >
                        {pt.label}
                      </text>
                    </g>
                  ))}
                </svg>

                {/* Floating tooltip on hover */}
                {activeChartHoverIdx !== null && points[activeChartHoverIdx] && (
                  <div
                    style={{
                      position: "absolute",
                      left: `${(points[activeChartHoverIdx].x / chartWidth) * 100}%`,
                      top: `${(points[activeChartHoverIdx].y / chartHeight) * 100 - 32}%`,
                      transform: "translate(-50%, -100%)",
                      background: "#1e293b",
                      color: "#ffffff",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      pointerEvents: "none",
                      whiteSpace: "nowrap",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  >
                    <div>{points[activeChartHoverIdx].label}</div>
                    <div style={{ color: "#fbbf24" }}>{points[activeChartHoverIdx].displayVal}</div>
                  </div>
                )}
              </div>

              {/* Bottom Legend */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11.5px", color: "#64748b" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }} />
                <span>Sales (₹)</span>
              </div>
            </div>

            {/* 3.2 RECENT ORDERS CARD */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(194, 65, 12, 0.12)",
                borderRadius: "14px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                boxShadow: "0 2px 8px rgba(194, 65, 12, 0.04)",
              }}
            >
              {/* Card Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                  Recent Orders
                </h2>
                <Link
                  href="/orders"
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "#C2410C",
                    textDecoration: "none",
                  }}
                >
                  View All
                </Link>
              </div>

              {/* Orders List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {RECENT_ORDERS.map((ord, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      paddingBottom: idx === RECENT_ORDERS.length - 1 ? "0" : "10px",
                      borderBottom: idx === RECENT_ORDERS.length - 1 ? "none" : "1px solid #f1f5f9",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
                        {ord.orderId}
                      </span>
                      <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#1e293b" }}>
                        {ord.amount}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px" }}>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>
                        {ord.date}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: ord.statusColor,
                        }}
                      >
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3.3 ANNOUNCEMENTS CARD */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(194, 65, 12, 0.12)",
                borderRadius: "14px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                boxShadow: "0 2px 8px rgba(194, 65, 12, 0.04)",
              }}
            >
              {/* Card Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                  Announcements
                </h2>
                <a
                  href="#announcements"
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "#C2410C",
                    textDecoration: "none",
                  }}
                >
                  View All
                </a>
              </div>

              {/* Announcements List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {ANNOUNCEMENTS.map((ann) => {
                  const Icon = ann.icon;
                  return (
                    <div
                      key={ann.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        padding: "10px",
                        background: "#fafafa",
                        borderRadius: "10px",
                        border: `1px solid ${ann.borderColor}`,
                        transition: "background 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          background: ann.iconBg,
                          color: ann.iconColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
                          {ann.title}
                        </span>
                        <span style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", lineHeight: 1.3 }}>
                          {ann.description}
                        </span>
                        <span style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                          {ann.date}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ======================================================= */}
          {/* 4. BOTTOM ROW: Top Selling Categories | Sales by Channel | Performance */}
          {/* ======================================================= */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.25fr 1fr 1fr",
              gap: "16px",
            }}
          >
            {/* 4.1 TOP SELLING CATEGORIES */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(194, 65, 12, 0.12)",
                borderRadius: "14px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                boxShadow: "0 2px 8px rgba(194, 65, 12, 0.04)",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                  Top Selling Categories
                </h2>
                <select
                  value={categoriesTimeframe}
                  onChange={(e) => setCategoriesTimeframe(e.target.value)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    color: "#475569",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="This Month">This Month</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                </select>
              </div>

              {/* Categories Ranked List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {TOP_CATEGORIES.map((cat) => (
                  <div
                    key={cat.rank}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    {/* Rank Circle */}
                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        background: "#f1f5f9",
                        color: "#64748b",
                        fontSize: "11px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {cat.rank}
                    </div>

                    {/* Category Name */}
                    <div style={{ width: "130px", fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                      {cat.name}
                    </div>

                    {/* Progress Bar */}
                    <div
                      style={{
                        flex: 1,
                        height: "8px",
                        background: "#f1f5f9",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${cat.percent * 2.8}%`,
                          maxWidth: "100%",
                          height: "100%",
                          background: "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)",
                          borderRadius: "4px",
                        }}
                      />
                    </div>

                    {/* Amount & Percent */}
                    <div
                      style={{
                        fontSize: "12.5px",
                        fontWeight: 600,
                        color: "#334155",
                        textAlign: "right",
                        minWidth: "105px",
                      }}
                    >
                      {cat.amount} ({cat.percent}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4.2 SALES BY CHANNEL */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(194, 65, 12, 0.12)",
                borderRadius: "14px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                boxShadow: "0 2px 8px rgba(194, 65, 12, 0.04)",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                  Sales by Channel
                </h2>
                <select
                  value={channelTimeframe}
                  onChange={(e) => setChannelTimeframe(e.target.value)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    color: "#475569",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="This Month">This Month</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                </select>
              </div>

              {/* Donut Chart & Legend Row */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                {/* SVG Donut Chart */}
                <div style={{ width: "120px", height: "120px", flexShrink: 0, position: "relative" }}>
                  <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
                    {/* Background Ring */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#f1f5f9"
                      strokeWidth="14"
                    />
                    {/* App: 65% (circumference = 2 * PI * 38 = ~238.76) */}
                    {/* 65% of 238.76 = 155.19 */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#f59e0b"
                      strokeWidth="14"
                      strokeDasharray="155.19 238.76"
                      strokeDashoffset="0"
                    />
                    {/* Website: 25% = 59.69 */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#3b82f6"
                      strokeWidth="14"
                      strokeDasharray="59.69 238.76"
                      strokeDashoffset="-155.19"
                    />
                    {/* API/Integrations: 10% = 23.88 */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#0B1220"
                      strokeWidth="14"
                      strokeDasharray="23.88 238.76"
                      strokeDashoffset="-214.88"
                    />
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 700 }}>Total</span>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#1e293b" }}>100%</span>
                  </div>
                </div>

                {/* Legend & Stats */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                  {SALES_CHANNELS.map((chan, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: chan.color,
                          marginTop: "4px",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#1e293b" }}>
                          {chan.name}
                        </span>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                          {chan.percentage} ({chan.amount})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4.3 PERFORMANCE SCORE */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(194, 65, 12, 0.12)",
                borderRadius: "14px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                boxShadow: "0 2px 8px rgba(194, 65, 12, 0.04)",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                  Performance Score
                </h2>
                <select
                  value={performanceTimeframe}
                  onChange={(e) => setPerformanceTimeframe(e.target.value)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    color: "#475569",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                </select>
              </div>

              {/* Gauge and Checklist */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                {/* Circular Gauge Meter */}
                <div style={{ width: "105px", height: "105px", position: "relative", flexShrink: 0 }}>
                  <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#f1f5f9"
                      strokeWidth="10"
                    />
                    {/* 84% score: circumference = 2 * PI * 40 = ~251.32. 84% is 211.1 */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="10"
                      strokeDasharray="211.1 251.32"
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ fontSize: "24px", fontWeight: 800, color: "#1e293b", lineHeight: 1 }}>
                      84
                    </span>
                    <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#10b981", marginTop: "2px" }}>
                      Great
                    </span>
                  </div>
                </div>

                {/* Score Message & Checklist */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
                      You're doing great!
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                      Keep up the good work.
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                    {[
                      { label: "Order Fulfillment", score: "90/100" },
                      { label: "Customer Feedback", score: "80/100" },
                      { label: "Return Rate", score: "70/100" },
                      { label: "On-time Delivery", score: "95/100" },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontSize: "11px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <CheckCircle2 size={13} color="#10b981" />
                          <span style={{ color: "#334155", fontWeight: 500 }}>{item.label}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: "#1e293b" }}>{item.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
