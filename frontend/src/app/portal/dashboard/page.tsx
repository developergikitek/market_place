"use client";

import React, { useEffect, useState } from "react";
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
import Select from "@/components/ui/Select";
import { DashboardData, DashboardRange, fetchDashboard } from "@/services/dashboardService";
import { ApiError } from "@/services/addProductService";

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

const inrFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const formatINR = (value: string | number) => inrFormatter.format(Number(value) || 0);

/** Short axis label: ₹0, ₹850, ₹12K, ₹1.5L, ₹2Cr */
function formatINRShort(value: number) {
  if (value >= 1e7) return `₹${+(value / 1e7).toFixed(1)}Cr`;
  if (value >= 1e5) return `₹${+(value / 1e5).toFixed(1)}L`;
  if (value >= 1e3) return `₹${+(value / 1e3).toFixed(1)}K`;
  return `₹${Math.round(value)}`;
}

function formatOrderDate(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase();
  return `${date} • ${time}`;
}

/** Round the chart ceiling up to 1/2/2.5/5 x 10^n so grid labels stay clean. */
function niceCeil(value: number) {
  if (value <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((m) => m * pow >= value) ?? 10;
  return step * pow;
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  DELIVERED: "#10b981",
  SHIPPED: "#3b82f6",
  PARTIALLY_SHIPPED: "#3b82f6",
  PROCESSING: "#f59e0b",
  PAYMENT_CONFIRMED: "#f59e0b",
  PENDING_PAYMENT: "#64748b",
  CANCELLED: "#ef4444",
  REFUNDED: "#ef4444",
};

const CHANNEL_COLORS: Record<string, string> = {
  BAZAAR: "#f59e0b",
  QUICK_COMMERCE: "#3b82f6",
  BOTH: "#0B1220",
};

// 2 * PI * r for the sales-by-channel donut (r = 38)
const DONUT_CIRCUMFERENCE = 2 * Math.PI * 38;

const PERFORMANCE_GRADES: Record<string, { label: string; color: string; title: string; subtitle: string }> = {
  GREAT: { label: "Great", color: "#10b981", title: "You're doing great!", subtitle: "Keep up the good work." },
  GOOD: { label: "Good", color: "#f59e0b", title: "Good going!", subtitle: "A few areas can still improve." },
  NEEDS_IMPROVEMENT: { label: "Low", color: "#ef4444", title: "Needs attention", subtitle: "Review the areas below." },
  NO_DATA: { label: "—", color: "#94a3b8", title: "Not enough data yet", subtitle: "Scores appear once orders come in." },
};

function ChangeIndicator({ change, invert = false }: { change: number | null | undefined; invert?: boolean }) {
  if (change === null || change === undefined) {
    return <span style={{ color: "#94a3b8", fontWeight: 700 }}>—</span>;
  }
  const up = change >= 0;
  const good = invert ? !up : up;
  return (
    <span style={{ color: good ? "#10b981" : "#ef4444", fontWeight: 700, display: "flex", alignItems: "center" }}>
      {up ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
      {Math.abs(change)}%
    </span>
  );
}

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showProfileBanner, setShowProfileBanner] = useState(true);
  const [salesTimeframe, setSalesTimeframe] = useState<DashboardRange>("7d");
  const [activeChartHoverIdx, setActiveChartHoverIdx] = useState<number | null>(null);
  const [categoriesTimeframe, setCategoriesTimeframe] = useState<DashboardRange>("7d");
  const [channelTimeframe, setChannelTimeframe] = useState<DashboardRange>("7d");
  const [performanceTimeframe, setPerformanceTimeframe] = useState<DashboardRange>("week");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchDashboard({
      range: salesTimeframe,
      categories_range: categoriesTimeframe,
      channel_range: channelTimeframe,
      performance_range: performanceTimeframe,
    })
      .then((data) => {
        if (cancelled) return;
        setDashboard(data);
        setLoadError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.messages.join(" ") : "Couldn't load dashboard.");
      });
    return () => {
      cancelled = true;
    };
  }, [salesTimeframe, categoriesTimeframe, channelTimeframe, performanceTimeframe]);

  const seller = dashboard?.seller;
  const metrics = dashboard?.metrics;
  const salesOverview = dashboard?.sales_overview;
  const recentOrders = dashboard?.recent_orders ?? [];
  const topCategories = dashboard?.top_categories.items ?? [];
  const topCategoryAmount = Math.max(...topCategories.map((c) => Number(c.amount)), 0);
  const salesChannels = dashboard?.sales_by_channel.channels ?? [];
  const donutSegments = salesChannels.map((chan, idx) => ({
    channel: chan.channel,
    length: (chan.percent / 100) * DONUT_CIRCUMFERENCE,
    offset: salesChannels.slice(0, idx).reduce((sum, c) => sum + (c.percent / 100) * DONUT_CIRCUMFERENCE, 0),
  }));
  const performance = dashboard?.performance;
  const grade = PERFORMANCE_GRADES[performance?.grade ?? "NO_DATA"];
  const periodLabel = dashboard ? `vs previous ${dashboard.range.label.replace(/^(Last|This) /, "").toLowerCase()}` : "";

  const chartValues = (salesOverview?.points ?? []).map((p) => Number(p.value));
  const chartMax = niceCeil(Math.max(...chartValues, 0));
  const gridSteps = [0, 1, 2, 3];

  // Helper for SVG chart points
  const chartWidth = 520;
  const chartHeight = 150;
  const paddingX = 40;
  const paddingY = 20;

  // Convert values (0 to chartMax) into SVG coordinates
  const points = (salesOverview?.points ?? []).map((pt, idx, all) => {
    const val = Number(pt.value);
    const x = paddingX + (all.length > 1 ? idx / (all.length - 1) : 0.5) * (chartWidth - 2 * paddingX);
    // 0 is bottom (chartHeight - paddingY), chartMax is top (paddingY)
    const y = chartHeight - paddingY - (val / chartMax) * (chartHeight - 2 * paddingY);
    return { x, y, val, label: pt.label, displayVal: formatINR(val) };
  });
  // Thin out x-axis labels when there are many points (e.g. 14 days)
  const labelEvery = points.length > 8 ? 2 : 1;

  // SVG polyline string
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Closed path for SVG linear gradient area fill
  const areaPath = points.length
    ? `M ${points[0].x},${chartHeight - paddingY} ` +
      points.map((p) => `L ${p.x},${p.y}`).join(" ") +
      ` L ${points[points.length - 1].x},${chartHeight - paddingY} Z`
    : "";

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
              <strong style={{ color: "#ffffff", fontWeight: 700 }}>{seller?.display_name ?? "…"}</strong>
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
              {seller?.store_slug.toUpperCase() ?? "…"}
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
        <div style={{ display: "flex", alignItems: "center", gap: "14px", position: "relative" }}>
          {/*
          // Quick Search
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

          // Notifications Bell with count
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

            // Notification Popover Dropdown
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

          // Help Icon
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
          */}

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
          {/* Navigation Links */}
          {[
            { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { label: "Orders", href: "/orders", icon: Package, badge: "128" },
            { label: "Bulk orders", href: "/bulk-orders", icon: Layers },
            { label: "Catalog", href: "/catalog", icon: BookOpen },
            { label: "Inventory", href: "/inventory", icon: Boxes },
            { label: "Pricing", href: "/pricing", icon: Tag },
            { label: "Payments", href: "/payments", icon: CreditCard },
            { label: "Returns", href: "/returns", icon: RotateCcw, badge: "8" },
            { label: "Payouts", icon: Wallet },
          ].map((item, idx) => {
            const Icon = item.icon;
            const isActive = item.label === "Dashboard";

            const linkStyle: React.CSSProperties = isActive
              ? {
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
                }
              : {
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
                };

            if (item.href) {
              return (
                <Link
                  key={idx}
                  href={item.href}
                  title={item.label}
                  style={linkStyle}
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
                  ...linkStyle,
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
                Our seller support team is here
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
          {loadError && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                borderRadius: "12px",
                padding: "10px 16px",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              {loadError}
            </div>
          )}

          {/* 1. TOP INFORMATION BANNER: Profile Completion */}
          {showProfileBanner && seller && !seller.profile_completion.is_complete && (
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
                  Your profile is {seller.profile_completion.percent}% complete. Complete it to unlock all features and grow your business.
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
                    {metrics ? metrics.total_orders.value.toLocaleString("en-IN") : "—"}
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
                <ChangeIndicator change={metrics?.total_orders.change_pct} />
                <span style={{ color: "#64748b" }}>{periodLabel}</span>
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
                    {metrics ? formatINR(metrics.total_sales.value) : "—"}
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
                <ChangeIndicator change={metrics?.total_sales.change_pct} />
                <span style={{ color: "#64748b" }}>{periodLabel}</span>
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
                    {metrics ? metrics.orders_delivered.value.toLocaleString("en-IN") : "—"}
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
                <ChangeIndicator change={metrics?.orders_delivered.change_pct} />
                <span style={{ color: "#64748b" }}>{periodLabel}</span>
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
                    {metrics ? metrics.pending_orders.value.toLocaleString("en-IN") : "—"}
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
                <ChangeIndicator change={metrics?.pending_orders.change_pct} invert />
                <span style={{ color: "#64748b" }}>{periodLabel}</span>
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
                <Select
                  value={salesTimeframe}
                  onChange={(e) => setSalesTimeframe(e.target.value as DashboardRange)}
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
                  <option value="7d">Last 7 Days</option>
                  <option value="14d">Last 14 Days</option>
                  <option value="month">This Month</option>
                </Select>
              </div>

              {/* Value and Growth Tag */}
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                <span style={{ fontSize: "24px", fontWeight: 800, color: "#1e293b" }}>
                  {salesOverview ? formatINR(salesOverview.total) : "—"}
                </span>
                {salesOverview?.change_pct != null && (
                <span
                  style={{
                    background: salesOverview.change_pct >= 0 ? "#ecfdf5" : "#fef2f2",
                    color: salesOverview.change_pct >= 0 ? "#10b981" : "#ef4444",
                    fontSize: "12px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "6px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  {salesOverview.change_pct >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {salesOverview.change_pct >= 0 ? "+" : ""}
                  {salesOverview.change_pct}% {periodLabel}
                </span>
                )}
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
                  {gridSteps.map((val) => {
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
                          {formatINRShort((chartMax * val) / 3)}
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
                        {idx % labelEvery === 0 ? pt.label : ""}
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
                {dashboard && recentOrders.length === 0 && (
                  <span style={{ fontSize: "12.5px", color: "#64748b" }}>No orders yet.</span>
                )}
                {recentOrders.map((ord, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      paddingBottom: idx === recentOrders.length - 1 ? "0" : "10px",
                      borderBottom: idx === recentOrders.length - 1 ? "none" : "1px solid #f1f5f9",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
                        {ord.order_number}
                      </span>
                      <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#1e293b" }}>
                        {formatINR(ord.amount)}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px" }}>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>
                        {formatOrderDate(ord.placed_at)}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: ORDER_STATUS_COLORS[ord.status] ?? "#64748b",
                        }}
                      >
                        {ord.status_display}
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
                <Select
                  value={categoriesTimeframe}
                  onChange={(e) => setCategoriesTimeframe(e.target.value as DashboardRange)}
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
                  <option value="7d">Last 7 Days</option>
                  <option value="month">This Month</option>
                  <option value="30d">Last 30 Days</option>
                </Select>
              </div>

              {/* Categories Ranked List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {dashboard && topCategories.length === 0 && (
                  <span style={{ fontSize: "12.5px", color: "#64748b" }}>No sales in this period.</span>
                )}
                {topCategories.map((cat) => (
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
                          width: `${topCategoryAmount ? (Number(cat.amount) / topCategoryAmount) * 100 : 0}%`,
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
                      {formatINR(cat.amount)} ({cat.percent}%)
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
                <Select
                  value={channelTimeframe}
                  onChange={(e) => setChannelTimeframe(e.target.value as DashboardRange)}
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
                  <option value="7d">Last 7 Days</option>
                  <option value="month">This Month</option>
                  <option value="30d">Last 30 Days</option>
                </Select>
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
                    {donutSegments.map((seg) => (
                      <circle
                        key={seg.channel}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={CHANNEL_COLORS[seg.channel] ?? "#94a3b8"}
                        strokeWidth="14"
                        strokeDasharray={`${seg.length} ${DONUT_CIRCUMFERENCE}`}
                        strokeDashoffset={-seg.offset}
                      />
                    ))}
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
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#1e293b" }}>
                      {dashboard ? formatINRShort(Number(dashboard.sales_by_channel.total)) : "—"}
                    </span>
                  </div>
                </div>

                {/* Legend & Stats */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                  {salesChannels.map((chan) => (
                    <div key={chan.channel} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: CHANNEL_COLORS[chan.channel] ?? "#94a3b8",
                          marginTop: "4px",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#1e293b" }}>
                          {chan.label}
                        </span>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                          {chan.percent}% ({formatINR(chan.amount)})
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
                <Select
                  value={performanceTimeframe}
                  onChange={(e) => setPerformanceTimeframe(e.target.value as DashboardRange)}
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
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="30d">Last 30 Days</option>
                </Select>
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
                    {/* circumference = 2 * PI * 40 ≈ 251.32 */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke={grade.color}
                      strokeWidth="10"
                      strokeDasharray={`${((performance?.score ?? 0) / 100) * 251.32} 251.32`}
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
                      {performance?.score ?? "—"}
                    </span>
                    <span style={{ fontSize: "10.5px", fontWeight: 700, color: grade.color, marginTop: "2px" }}>
                      {grade.label}
                    </span>
                  </div>
                </div>

                {/* Score Message & Checklist */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
                      {grade.title}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                      {grade.subtitle}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                    {[
                      { label: "Order Fulfillment", score: performance?.breakdown.order_fulfillment },
                      { label: "Customer Feedback", score: performance?.breakdown.customer_feedback },
                      { label: "Return Rate", score: performance?.breakdown.return_rate },
                      { label: "On-time Delivery", score: performance?.breakdown.on_time_delivery },
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
                          <CheckCircle2
                            size={13}
                            color={item.score == null ? "#cbd5e1" : item.score >= 80 ? "#10b981" : item.score >= 60 ? "#f59e0b" : "#ef4444"}
                          />
                          <span style={{ color: "#334155", fontWeight: 500 }}>{item.label}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: "#1e293b" }}>
                          {item.score == null ? "—" : `${item.score}/100`}
                        </span>
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
