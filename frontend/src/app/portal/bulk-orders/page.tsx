"use client";

import React, { useState, useMemo } from "react";
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
  Filter,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  IndianRupee,
  ShieldCheck,
  ExternalLink,
  Building2,
  Truck,
  Send,
  Eye,
  Info,
} from "lucide-react";
import Select from "@/components/ui/Select";

export type BulkOrderStatus = "New" | "Quoted" | "UnderReview" | "Ordered" | "Rejected";

export interface BulkOrderRecord {
  orderId: string;
  companyName: string;
  email: string;
  phone: string;
  productsCount: number;
  brands: string[];
  totalQuantity: number;
  quantityUnit: string;
  requirementTitle: string;
  location: string;
  status: BulkOrderStatus;
  requestedDate: string;
  requestedTime: string;
  category: string;
  quotedAmount?: string;
}

const INITIAL_BULK_ORDERS: BulkOrderRecord[] = [
  {
    orderId: "BO-2025-0001",
    companyName: "ABC Constructions",
    email: "abc.construction@email.com",
    phone: "+91 98765 43210",
    productsCount: 5,
    brands: ["Havells", "Asian Paints", "Bosch"],
    totalQuantity: 350,
    quantityUnit: "Units",
    requirementTitle: "For Residential Project",
    location: "Location: Mumbai",
    status: "New",
    requestedDate: "19 May 2025",
    requestedTime: "11:45 AM",
    category: "Electricals & Tools",
  },
  {
    orderId: "BO-2025-0002",
    companyName: "XYZ Builders Pvt. Ltd.",
    email: "xyz.builders@email.com",
    phone: "+91 87654 32109",
    productsCount: 3,
    brands: ["ACC", "Finolex", "Supreme"],
    totalQuantity: 120,
    quantityUnit: "Units",
    requirementTitle: "Commercial Building",
    location: "Location: Delhi",
    status: "New",
    requestedDate: "19 May 2025",
    requestedTime: "10:30 AM",
    category: "Pipes & Cement",
  },
  {
    orderId: "BO-2025-0003",
    companyName: "Sunrise Infra",
    email: "sunrise.infra@email.com",
    phone: "+91 76543 21098",
    productsCount: 4,
    brands: ["Tata Steel", "Bosch", "Pidilite"],
    totalQuantity: 200,
    quantityUnit: "Units",
    requirementTitle: "Infrastructure Work",
    location: "Location: Bangalore",
    status: "Quoted",
    requestedDate: "18 May 2025",
    requestedTime: "03:15 PM",
    category: "Steel & Rebar",
    quotedAmount: "₹8,45,000",
  },
  {
    orderId: "BO-2025-0004",
    companyName: "NorthStar Developers",
    email: "northstar.dev@email.com",
    phone: "+91 65432 10987",
    productsCount: 2,
    brands: ["Kamdhenu", "Asian Paints"],
    totalQuantity: 80,
    quantityUnit: "Units",
    requirementTitle: "Renovation Project",
    location: "Location: Pune",
    status: "Quoted",
    requestedDate: "18 May 2025",
    requestedTime: "12:20 PM",
    category: "Paints & Chemicals",
    quotedAmount: "₹3,20,000",
  },
  {
    orderId: "BO-2025-0005",
    companyName: "GreenBuild Solutions",
    email: "greenbuild@email.com",
    phone: "+91 54321 09876",
    productsCount: 6,
    brands: ["ACC", "Finolex", "Bosch"],
    totalQuantity: 500,
    quantityUnit: "Units",
    requirementTitle: "Large Scale Project",
    location: "Location: Hyderabad",
    status: "UnderReview",
    requestedDate: "17 May 2025",
    requestedTime: "05:30 PM",
    category: "Full Material Pack",
    quotedAmount: "₹24,50,000",
  },
  {
    orderId: "BO-2025-0006",
    companyName: "Prime Contractors",
    email: "prime.contractors@email.com",
    phone: "+91 43210 98765",
    productsCount: 3,
    brands: ["Tata Steel", "Supreme", "Finolex"],
    totalQuantity: 150,
    quantityUnit: "Units",
    requirementTitle: "Factory Construction",
    location: "Location: Chennai",
    status: "Ordered",
    requestedDate: "16 May 2025",
    requestedTime: "04:50 PM",
    category: "Structural Steel",
    quotedAmount: "₹14,90,000",
  },
  {
    orderId: "BO-2025-0007",
    companyName: "BuildRight Enterprises",
    email: "buildright@email.com",
    phone: "+91 32109 87654",
    productsCount: 4,
    brands: ["Asian Paints", "Pidilite", "Bosch"],
    totalQuantity: 275,
    quantityUnit: "Units",
    requirementTitle: "Mixed Use Project",
    location: "Location: Kolkata",
    status: "Rejected",
    requestedDate: "15 May 2025",
    requestedTime: "02:10 PM",
    category: "Waterproofing",
    quotedAmount: "₹5,60,000",
  },
];

export default function BulkOrdersPage() {
  const [orders, setOrders] = useState<BulkOrderRecord[]>(INITIAL_BULK_ORDERS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isBulkSubmenuOpen, setIsBulkSubmenuOpen] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"all" | "quotesSent">("all");

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [filterBrand, setFilterBrand] = useState("All Brands");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [filterMinQty, setFilterMinQty] = useState("");
  const [filterMaxQty, setFilterMaxQty] = useState("");
  const [filterDateRange, setFilterDateRange] = useState("");

  // Modals & Interactivity
  const [selectedOrderForView, setSelectedOrderForView] = useState<BulkOrderRecord | null>(null);
  const [selectedOrderForQuote, setSelectedOrderForQuote] = useState<BulkOrderRecord | null>(null);
  const [quoteInputPrice, setQuoteInputPrice] = useState("");
  const [quoteInputDays, setQuoteInputDays] = useState("3");
  const [quoteInputNotes, setQuoteInputNotes] = useState("");
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter application
  const filteredOrders = useMemo(() => {
    return orders.filter((item) => {
      // Subtab filter: Quotes Sent tab shows Quoted and Ordered
      if (activeSubTab === "quotesSent" && item.status !== "Quoted" && item.status !== "Ordered") {
        return false;
      }
      // Status filter
      if (filterStatus !== "All Status" && item.status !== filterStatus) {
        return false;
      }
      // Brand filter
      if (filterBrand !== "All Brands" && !item.brands.some((b) => b.toLowerCase().includes(filterBrand.toLowerCase()))) {
        return false;
      }
      // Category filter
      if (filterCategory !== "All Categories" && !item.category.toLowerCase().includes(filterCategory.toLowerCase())) {
        return false;
      }
      // Quantity range
      if (filterMinQty && item.totalQuantity < Number(filterMinQty)) {
        return false;
      }
      if (filterMaxQty && item.totalQuantity > Number(filterMaxQty)) {
        return false;
      }
      // Search Query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const mId = item.orderId.toLowerCase().includes(q);
        const mCompany = item.companyName.toLowerCase().includes(q);
        const mReq = item.requirementTitle.toLowerCase().includes(q);
        const mLoc = item.location.toLowerCase().includes(q);
        const mBrand = item.brands.some((b) => b.toLowerCase().includes(q));
        return mId || mCompany || mReq || mLoc || mBrand;
      }
      return true;
    });
  }, [orders, activeSubTab, filterStatus, filterBrand, filterCategory, filterMinQty, filterMaxQty, searchQuery]);

  const handleClearFilters = () => {
    setFilterStatus("All Status");
    setFilterBrand("All Brands");
    setFilterCategory("All Categories");
    setFilterMinQty("");
    setFilterMaxQty("");
    setFilterDateRange("");
    setSearchQuery("");
    setToastMessage("All filters cleared");
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleExportCSV = () => {
    const csvHeader = "Order ID,Customer,Email,Phone,Products,Total Quantity,Requirement,Location,Status,Requested On\n";
    const csvRows = filteredOrders
      .map(
        (o) =>
          `"${o.orderId}","${o.companyName}","${o.email}","${o.phone}","${o.productsCount} Products","${o.totalQuantity} ${o.quantityUnit}","${o.requirementTitle}","${o.location}","${o.status}","${o.requestedDate} ${o.requestedTime}"`
      )
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Makaano_Bulk_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage("Bulk orders exported successfully as CSV!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForQuote) return;
    if (!quoteInputPrice.trim()) {
      alert("Please enter a valid quote amount.");
      return;
    }

    setOrders((prev) =>
      prev.map((ord) =>
        ord.orderId === selectedOrderForQuote.orderId
          ? { ...ord, status: "Quoted", quotedAmount: `₹${quoteInputPrice}` }
          : ord
      )
    );

    setToastMessage(`Quote of ₹${quoteInputPrice} submitted for ${selectedOrderForQuote.orderId}!`);
    setSelectedOrderForQuote(null);
    setQuoteInputPrice("");
    setQuoteInputNotes("");
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper for status badge styling
  const getStatusBadge = (status: BulkOrderStatus) => {
    switch (status) {
      case "New":
        return {
          background: "#fffbeb",
          color: "#d97706",
          border: "1px solid rgba(245, 158, 11, 0.3)",
        };
      case "Quoted":
        return {
          background: "#eff6ff",
          color: "#2563eb",
          border: "1px solid rgba(59, 130, 246, 0.25)",
        };
      case "UnderReview":
        return {
          background: "#fff7ed",
          color: "#ea580c",
          border: "1px solid rgba(234, 88, 12, 0.25)",
        };
      case "Ordered":
        return {
          background: "#ecfdf5",
          color: "#10b981",
          border: "1px solid rgba(16, 185, 129, 0.25)",
        };
      case "Rejected":
        return {
          background: "#fef2f2",
          color: "#ef4444",
          border: "1px solid rgba(239, 68, 68, 0.25)",
        };
    }
  };

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
        {/* Left: Brand Logo + Toggle + Greeting */}
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

          <div style={{ width: "1px", height: "24px", background: "rgba(255, 255, 255, 0.15)" }} />

          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? "Collapse sidebar menu" : "Expand sidebar menu"}
            title={isSidebarOpen ? "Collapse sidebar menu" : "Expand sidebar menu"}
            style={{
              background: isSidebarOpen ? "rgba(255, 255, 255, 0.12)" : "rgba(249, 115, 22, 0.25)",
              border: isSidebarOpen ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid #F97316",
              borderRadius: "8px",
              cursor: "pointer",
              color: isSidebarOpen ? "#ffffff" : "#F97316",
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

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13.5px", color: "#E2E8F0", fontWeight: 500 }}>
              Welcome back,{" "}
              <strong style={{ color: "#ffffff", fontWeight: 700 }}>BuildWell Traders Pvt. Ltd.</strong>
            </span>
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
              SELLER12345
            </span>
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

        {/* Right Header Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button
            type="button"
            title="Search"
            style={{ background: "transparent", border: "none", color: "#CBD5E1", cursor: "pointer", padding: "6px" }}
          >
            <Search size={19} />
          </button>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              title="Notifications"
              style={{ background: "transparent", border: "none", color: "#CBD5E1", cursor: "pointer", padding: "6px" }}
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
            style={{ background: "transparent", border: "none", color: "#CBD5E1", cursor: "pointer", padding: "6px" }}
          >
            <HelpCircle size={19} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingLeft: "6px", cursor: "pointer" }}>
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
              <span style={{ fontSize: "11px", color: "#CBD5E1", fontWeight: 500 }}>Admin</span>
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
            { label: "Reports", icon: BarChart3 },
            { label: "Growth", icon: TrendingUp },
            { label: "Support", icon: Headphones },
            { label: "Notifications", icon: Bell },
            { label: "Account Settings", icon: Settings },
            { label: "Help Center", icon: LifeBuoy },
          ].map((item, idx) => {
            const Icon = item.icon;
            const isActive = item.label === "Bulk orders";

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
              © 2025 Makaano.<br />All rights reserved.
            </div>
          </div>
        </aside>

        {/* ======================================================= */}
        {/* MAIN WORKSPACE                                          */}
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
          {/* Toast Notification */}
          {toastMessage && (
            <div
              style={{
                padding: "12px 18px",
                borderRadius: "10px",
                background: "#ecfdf5",
                border: "1px solid #10b981",
                color: "#065f46",
                fontSize: "13.5px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle2 size={18} color="#10b981" />
                <span>{toastMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#065f46" }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* 1. Header Title & Top Actions */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <h1
                style={{
                  fontSize: "30px",
                  fontWeight: 800,
                  color: "#1e293b",
                  letterSpacing: "-0.5px",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Bulk Orders
              </h1>
              <p style={{ fontSize: "14px", color: "#64748b", marginTop: "4px", margin: 0 }}>
                View bulk purchase requests and submit your best quotes.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                type="button"
                onClick={handleExportCSV}
                style={{
                  height: "40px",
                  padding: "0 20px",
                  borderRadius: "9999px",
                  background: "#ffffff",
                  border: "1.5px solid #e2e8f0",
                  color: "#334155",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Export
              </button>

              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                style={{
                  height: "40px",
                  padding: "0 22px",
                  borderRadius: "9999px",
                  background: "#0f172a",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.2)",
                }}
              >
                Bulk Order Guide
              </button>
            </div>
          </div>

          {/* 2. 5 KPI Metric Cards (Matching Screenshot) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "16px",
            }}
          >
            {/* 1: Total Requests */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(194, 65, 12, 0.12)",
                borderRadius: "16px",
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                boxShadow: "0 2px 8px rgba(194, 65, 12, 0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Total Requests</span>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#1e293b", marginTop: "4px" }}>
                    42
                  </div>
                </div>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "#eff6ff",
                    color: "#3b82f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Package size={18} />
                </div>
              </div>
              <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>All time</span>
            </div>

            {/* 2: New Requests */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(245, 158, 11, 0.2)",
                borderRadius: "16px",
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                boxShadow: "0 2px 8px rgba(245, 158, 11, 0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>New Requests</span>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#1e293b", marginTop: "4px" }}>
                    12
                  </div>
                </div>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "#fffbeb",
                    color: "#f59e0b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Boxes size={18} />
                </div>
              </div>
              <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>Requires your quote</span>
            </div>

            {/* 3: Quotes Sent */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(16, 185, 129, 0.18)",
                borderRadius: "16px",
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Quotes Sent</span>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#1e293b", marginTop: "4px" }}>
                    18
                  </div>
                </div>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "#ecfdf5",
                    color: "#10b981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Check size={18} strokeWidth={2.5} />
                </div>
              </div>
              <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>In last 7 days</span>
            </div>

            {/* 4: Orders Won */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(194, 65, 12, 0.12)",
                borderRadius: "16px",
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                boxShadow: "0 2px 8px rgba(194, 65, 12, 0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Orders Won</span>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#1e293b", marginTop: "4px" }}>
                    7
                  </div>
                </div>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "#eff6ff",
                    color: "#3b82f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Building2 size={18} />
                </div>
              </div>
              <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>In last 7 days</span>
            </div>

            {/* 5: Conversion Rate */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(194, 65, 12, 0.12)",
                borderRadius: "16px",
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                boxShadow: "0 2px 8px rgba(194, 65, 12, 0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Conversion Rate</span>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#1e293b", marginTop: "4px" }}>
                    22.58%
                  </div>
                </div>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "#f5f3ff",
                    color: "#EA580C",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TrendingUp size={18} />
                </div>
              </div>
              <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>In last 7 days</span>
            </div>
          </div>

          {/* 3. Top Filter Pills Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {/* Sub-tab Toggle */}
            <div
              style={{
                display: "inline-flex",
                background: "#f1f5f9",
                padding: "3px",
                borderRadius: "9999px",
                border: "1px solid #e2e8f0",
              }}
            >
              <button
                type="button"
                onClick={() => setActiveSubTab("all")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "9999px",
                  border: "none",
                  background: activeSubTab === "all" ? "linear-gradient(135deg, #C2410C 0%, #9A3412 100%)" : "transparent",
                  color: activeSubTab === "all" ? "#ffffff" : "#475569",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: activeSubTab === "all" ? "0 2px 6px rgba(194, 65, 12, 0.3)" : "none",
                }}
              >
                All Requests
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab("quotesSent")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "9999px",
                  border: "none",
                  background: activeSubTab === "quotesSent" ? "linear-gradient(135deg, #C2410C 0%, #9A3412 100%)" : "transparent",
                  color: activeSubTab === "quotesSent" ? "#ffffff" : "#475569",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: activeSubTab === "quotesSent" ? "0 2px 6px rgba(194, 65, 12, 0.3)" : "none",
                }}
              >
                Quotes Sent
              </button>
            </div>

            <div style={{ flex: 1, minWidth: "280px", position: "relative", display: "flex", alignItems: "center" }}>
              <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "16px" }} />
              <input
                type="text"
                placeholder="Search by Order ID, Customer, Product, Brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  height: "40px",
                  paddingLeft: "42px",
                  paddingRight: "16px",
                  borderRadius: "9999px",
                  border: "1.5px solid #e2e8f0",
                  background: "#ffffff",
                  fontSize: "13px",
                  color: "#1e293b",
                  outline: "none",
                }}
              />
            </div>

            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                height: "40px",
                padding: "0 18px",
                borderRadius: "9999px",
                border: "1.5px solid #e2e8f0",
                background: "#ffffff",
                fontSize: "13px",
                fontWeight: 600,
                color: "#334155",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="All Status">All Status</option>
              <option value="New">New</option>
              <option value="Quoted">Quoted</option>
              <option value="UnderReview">Under Review</option>
              <option value="Ordered">Ordered</option>
              <option value="Rejected">Rejected</option>
            </Select>

            <Select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              style={{
                height: "40px",
                padding: "0 18px",
                borderRadius: "9999px",
                border: "1.5px solid #e2e8f0",
                background: "#ffffff",
                fontSize: "13px",
                fontWeight: 600,
                color: "#334155",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="All Brands">All Brands</option>
              <option value="Bosch">Bosch</option>
              <option value="Havells">Havells</option>
              <option value="ACC">ACC</option>
              <option value="Finolex">Finolex</option>
              <option value="Supreme">Supreme</option>
              <option value="Tata Steel">Tata Steel</option>
              <option value="Asian Paints">Asian Paints</option>
            </Select>

            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{
                height: "40px",
                padding: "0 18px",
                borderRadius: "9999px",
                border: "1.5px solid #e2e8f0",
                background: "#ffffff",
                fontSize: "13px",
                fontWeight: 600,
                color: "#334155",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="All Categories">All Categories</option>
              <option value="Electricals">Electricals</option>
              <option value="Pipes">Pipes & Plumbing</option>
              <option value="Steel">Steel & Rebar</option>
              <option value="Paints">Paints & Waterproofing</option>
            </Select>

            <button
              type="button"
              onClick={handleClearFilters}
              style={{
                height: "40px",
                padding: "0 18px",
                borderRadius: "9999px",
                border: "1.5px solid #e2e8f0",
                background: "#ffffff",
                fontSize: "13px",
                fontWeight: 600,
                color: "#334155",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
              }}
            >
              <Filter size={15} />
              <span>Filters</span>
            </button>
          </div>

          {/* 4. Main Two Column Grid: Left Table + Right Filter Panel */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "20px", alignItems: "start" }}>
            {/* Left: Table Container */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(194, 65, 12, 0.12)",
                borderRadius: "16px",
                boxShadow: "0 2px 12px rgba(194, 65, 12, 0.04)",
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <th style={{ padding: "10px 12px", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Order ID</th>
                      <th style={{ padding: "10px 12px", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Customer Details</th>
                      <th style={{ padding: "10px 12px", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Products & Brands</th>
                      <th style={{ padding: "10px 12px", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Total Quantity</th>
                      <th style={{ padding: "10px 12px", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Requirement</th>
                      <th style={{ padding: "10px 12px", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Status</th>
                      <th style={{ padding: "10px 12px", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Requested On</th>
                      <th style={{ padding: "10px 12px", fontSize: "12px", fontWeight: 600, color: "#64748b", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                          No bulk orders match your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => {
                        const statusStyle = getStatusBadge(ord.status);
                        return (
                          <tr
                            key={ord.orderId}
                            style={{ borderBottom: "1px solid #f8fafc", transition: "background 0.15s ease" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#faf8ff";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            {/* Order ID */}
                            <td style={{ padding: "14px 12px", fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
                              {ord.orderId}
                            </td>

                            {/* Customer Details */}
                            <td style={{ padding: "14px 12px" }}>
                              <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#1e293b" }}>
                                {ord.companyName}
                              </div>
                              <div style={{ fontSize: "11px", color: "#2563eb", marginTop: "1px" }}>
                                {ord.email}
                              </div>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>
                                {ord.phone}
                              </div>
                            </td>

                            {/* Products & Brands with Pills */}
                            <td style={{ padding: "14px 12px" }}>
                              <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                                {ord.productsCount} Products
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
                                {ord.brands.slice(0, 2).map((b, idx) => (
                                  <span
                                    key={idx}
                                    style={{
                                      fontSize: "10px",
                                      fontWeight: 700,
                                      padding: "1px 6px",
                                      background: "#f1f5f9",
                                      border: "1px solid #e2e8f0",
                                      borderRadius: "4px",
                                      color: "#475569",
                                    }}
                                  >
                                    {b}
                                  </span>
                                ))}
                                {ord.brands.length > 2 && (
                                  <span
                                    style={{
                                      fontSize: "10px",
                                      fontWeight: 700,
                                      padding: "1px 5px",
                                      background: "#f8fafc",
                                      border: "1px solid #cbd5e1",
                                      borderRadius: "4px",
                                      color: "#64748b",
                                    }}
                                  >
                                    +{ord.brands.length - 2}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Quantity */}
                            <td style={{ padding: "14px 12px", fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
                              {ord.totalQuantity} {ord.quantityUnit}
                            </td>

                            {/* Requirement */}
                            <td style={{ padding: "14px 12px" }}>
                              <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                                {ord.requirementTitle}
                              </div>
                              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                                {ord.location}
                              </div>
                            </td>

                            {/* Status */}
                            <td style={{ padding: "14px 12px" }}>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "3px 10px",
                                  borderRadius: "9999px",
                                  fontSize: "11.5px",
                                  fontWeight: 700,
                                  background: statusStyle.background,
                                  color: statusStyle.color,
                                  border: statusStyle.border,
                                }}
                              >
                                {ord.status === "UnderReview" ? "Under Review" : ord.status}
                              </span>
                            </td>

                            {/* Requested On */}
                            <td style={{ padding: "14px 12px" }}>
                              <div style={{ fontSize: "12px", color: "#1e293b", fontWeight: 600 }}>
                                {ord.requestedDate}
                              </div>
                              <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                                {ord.requestedTime}
                              </div>
                            </td>

                            {/* Actions Stack (View + Submit/Update Quote) */}
                            <td style={{ padding: "14px 12px", textAlign: "right" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForView(ord)}
                                  style={{
                                    height: "28px",
                                    padding: "0 14px",
                                    borderRadius: "9999px",
                                    background: "#ffffff",
                                    border: "1px solid #e2e8f0",
                                    color: "#334155",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    width: "95px",
                                  }}
                                >
                                  View
                                </button>

                                {ord.status === "New" && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderForQuote(ord)}
                                    style={{
                                      height: "28px",
                                      padding: "0 10px",
                                      borderRadius: "9999px",
                                      background: "#0f172a",
                                      color: "#ffffff",
                                      border: "none",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      width: "95px",
                                    }}
                                  >
                                    Submit Quote
                                  </button>
                                )}

                                {ord.status === "Quoted" && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderForQuote(ord)}
                                    style={{
                                      height: "28px",
                                      padding: "0 10px",
                                      borderRadius: "9999px",
                                      background: "#0f172a",
                                      color: "#ffffff",
                                      border: "none",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      width: "95px",
                                    }}
                                  >
                                    Update Quote
                                  </button>
                                )}

                                {ord.status === "UnderReview" && (
                                  <button
                                    type="button"
                                    disabled
                                    style={{
                                      height: "28px",
                                      padding: "0 10px",
                                      borderRadius: "9999px",
                                      background: "#cbd5e1",
                                      color: "#ffffff",
                                      border: "none",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      cursor: "not-allowed",
                                      width: "95px",
                                    }}
                                  >
                                    Submitted
                                  </button>
                                )}

                                {ord.status === "Ordered" && (
                                  <button
                                    type="button"
                                    disabled
                                    style={{
                                      height: "28px",
                                      padding: "0 10px",
                                      borderRadius: "9999px",
                                      background: "#10b981",
                                      color: "#ffffff",
                                      border: "none",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      cursor: "not-allowed",
                                      width: "95px",
                                    }}
                                  >
                                    Won
                                  </button>
                                )}

                                {ord.status === "Rejected" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      alert(`Rejection Reason for ${ord.orderId}:\nCustomer selected an alternate quote due to lower lead time.`);
                                    }}
                                    style={{
                                      height: "28px",
                                      padding: "0 10px",
                                      borderRadius: "9999px",
                                      background: "#e2e8f0",
                                      color: "#475569",
                                      border: "none",
                                      fontSize: "11px",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      width: "95px",
                                    }}
                                  >
                                    View Reason
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: "13px", color: "#64748b" }}>
                  Showing 1 to {filteredOrders.length} of 42 bulk orders
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button
                    type="button"
                    style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#fff", border: "1px solid #e2e8f0", color: "#cbd5e1", cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCurrentPage(n)}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: currentPage === n ? "#ffffff" : "transparent",
                        border: currentPage === n ? "1.5px solid #3b82f6" : "none",
                        color: currentPage === n ? "#3b82f6" : "#64748b",
                        fontSize: "13px",
                        fontWeight: currentPage === n ? 700 : 500,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                  <span style={{ color: "#94a3b8" }}>...</span>
                  <button
                    type="button"
                    style={{ width: "32px", height: "32px", borderRadius: "50%", background: "transparent", border: "none", color: "#64748b", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    7
                  </button>
                  <button
                    type="button"
                    style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#fff", border: "1px solid #e2e8f0", color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Filters Sidebar Box (Matching Screenshot) */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(194, 65, 12, 0.12)",
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "0 2px 10px rgba(194, 65, 12, 0.04)",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Filters</span>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#2563eb",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Clear All
                </button>
              </div>

              {/* Status */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "6px" }}>
                  Status
                </label>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    width: "100%",
                    height: "38px",
                    padding: "0 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    fontSize: "13px",
                    color: "#1e293b",
                    outline: "none",
                  }}
                >
                  <option value="All Status">Select Status</option>
                  <option value="New">New</option>
                  <option value="Quoted">Quoted</option>
                  <option value="UnderReview">Under Review</option>
                  <option value="Ordered">Ordered</option>
                  <option value="Rejected">Rejected</option>
                </Select>
              </div>

              {/* Brand */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "6px" }}>
                  Brand
                </label>
                <Select
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                  style={{
                    width: "100%",
                    height: "38px",
                    padding: "0 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    fontSize: "13px",
                    color: "#1e293b",
                    outline: "none",
                  }}
                >
                  <option value="All Brands">Select Brand</option>
                  <option value="Bosch">Bosch</option>
                  <option value="Havells">Havells</option>
                  <option value="Finolex">Finolex</option>
                  <option value="ACC">ACC</option>
                  <option value="Tata Steel">Tata Steel</option>
                  <option value="Asian Paints">Asian Paints</option>
                </Select>
              </div>

              {/* Category */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "6px" }}>
                  Category
                </label>
                <Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{
                    width: "100%",
                    height: "38px",
                    padding: "0 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    fontSize: "13px",
                    color: "#1e293b",
                    outline: "none",
                  }}
                >
                  <option value="All Categories">Select Category</option>
                  <option value="Electricals">Electricals</option>
                  <option value="Pipes">Pipes & Plumbing</option>
                  <option value="Steel">Steel & Rebar</option>
                  <option value="Paints">Paints & Waterproofing</option>
                </Select>
              </div>

              {/* Min Quantity */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "6px" }}>
                  Min Quantity
                </label>
                <input
                  type="number"
                  placeholder="Enter min quantity"
                  value={filterMinQty}
                  onChange={(e) => setFilterMinQty(e.target.value)}
                  style={{
                    width: "100%",
                    height: "38px",
                    padding: "0 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    fontSize: "13px",
                    color: "#1e293b",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Max Quantity */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "6px" }}>
                  Max Quantity
                </label>
                <input
                  type="number"
                  placeholder="Enter max quantity"
                  value={filterMaxQty}
                  onChange={(e) => setFilterMaxQty(e.target.value)}
                  style={{
                    width: "100%",
                    height: "38px",
                    padding: "0 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    fontSize: "13px",
                    color: "#1e293b",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Requested Date */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "6px" }}>
                  Requested Date
                </label>
                <input
                  type="text"
                  placeholder="Select date range 📅"
                  value={filterDateRange}
                  onChange={(e) => setFilterDateRange(e.target.value)}
                  style={{
                    width: "100%",
                    height: "38px",
                    padding: "0 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    fontSize: "13px",
                    color: "#1e293b",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Apply Filters Button */}
              <button
                type="button"
                onClick={() => {
                  setToastMessage("Filters applied successfully!");
                  setTimeout(() => setToastMessage(null), 2500);
                }}
                style={{
                  height: "42px",
                  borderRadius: "8px",
                  background: "#0f172a",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  marginTop: "4px",
                }}
              >
                Apply Filters
              </button>

              {/* Bottom Need Help Box */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "12px",
                  marginTop: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: 700, color: "#d97706" }}>
                  <AlertCircle size={15} />
                  <span>Need Help?</span>
                </div>
                <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "3px" }}>
                  Learn how to submit the best quotes
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuideModal(true)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#2563eb",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: 0,
                    marginTop: "6px",
                  }}
                >
                  View Guide →
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ========================================================= */}
      {/* 1. SUBMIT QUOTE MODAL                                     */}
      {/* ========================================================= */}
      {selectedOrderForQuote && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
          onClick={() => setSelectedOrderForQuote(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "540px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #0B1220 0%, #172036 100%)",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "#ffffff",
              }}
            >
              <div>
                <div style={{ fontSize: "18px", fontWeight: 800 }}>Submit Official Quote</div>
                <div style={{ fontSize: "12px", color: "#CBD5E1", marginTop: "2px" }}>
                  RFQ Ref: {selectedOrderForQuote.orderId} • {selectedOrderForQuote.companyName}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForQuote(null)}
                style={{ background: "transparent", border: "none", color: "#ffffff", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleQuoteSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Requirement:</div>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#1e293b", marginTop: "2px" }}>
                  {selectedOrderForQuote.requirementTitle} — {selectedOrderForQuote.totalQuantity} {selectedOrderForQuote.quantityUnit}
                </div>
                <div style={{ fontSize: "11.5px", color: "#475569", marginTop: "2px" }}>
                  {selectedOrderForQuote.location}
                </div>
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", display: "block", marginBottom: "6px" }}>
                  Total Bid Amount (₹ including GST)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 845000"
                  value={quoteInputPrice}
                  onChange={(e) => setQuoteInputPrice(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    height: "42px",
                    padding: "0 14px",
                    borderRadius: "8px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "14px",
                    color: "#1e293b",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", display: "block", marginBottom: "6px" }}>
                  Delivery Lead Time (Days)
                </label>
                <input
                  type="number"
                  value={quoteInputDays}
                  onChange={(e) => setQuoteInputDays(e.target.value)}
                  style={{
                    width: "100%",
                    height: "42px",
                    padding: "0 14px",
                    borderRadius: "8px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "14px",
                    color: "#1e293b",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", display: "block", marginBottom: "6px" }}>
                  Terms & Delivery Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Ex-warehouse delivery included. Unloading assistance at project site."
                  value={quoteInputNotes}
                  onChange={(e) => setQuoteInputNotes(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "13px",
                    color: "#1e293b",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForQuote(null)}
                  style={{
                    height: "40px",
                    padding: "0 18px",
                    borderRadius: "8px",
                    background: "#ffffff",
                    border: "1.5px solid #e2e8f0",
                    color: "#334155",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    height: "40px",
                    padding: "0 22px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #C2410C 0%, #9A3412 100%)",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(194, 65, 12, 0.35)",
                  }}
                >
                  Submit Official Bid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. VIEW BULK ORDER DETAILS MODAL                          */}
      {/* ========================================================= */}
      {selectedOrderForView && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
          onClick={() => setSelectedOrderForView(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "580px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #0B1220 0%, #172036 100%)",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "#ffffff",
              }}
            >
              <div>
                <div style={{ fontSize: "18px", fontWeight: 800 }}>
                  Bulk RFQ #{selectedOrderForView.orderId}
                </div>
                <div style={{ fontSize: "12px", color: "#CBD5E1", marginTop: "2px" }}>
                  {selectedOrderForView.companyName} • {selectedOrderForView.requestedDate}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForView(null)}
                style={{ background: "transparent", border: "none", color: "#ffffff", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8" }}>Customer</div>
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#1e293b", marginTop: "2px" }}>{selectedOrderForView.companyName}</div>
                  <div style={{ fontSize: "11.5px", color: "#2563eb" }}>{selectedOrderForView.email}</div>
                  <div style={{ fontSize: "11.5px", color: "#64748b" }}>{selectedOrderForView.phone}</div>
                </div>

                <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8" }}>Project & Scale</div>
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#1e293b", marginTop: "2px" }}>{selectedOrderForView.requirementTitle}</div>
                  <div style={{ fontSize: "12px", color: "#1e293b", marginTop: "2px" }}>Volume: {selectedOrderForView.totalQuantity} {selectedOrderForView.quantityUnit}</div>
                  <div style={{ fontSize: "11.5px", color: "#64748b" }}>{selectedOrderForView.location}</div>
                </div>
              </div>

              <div style={{ padding: "14px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}>Brands Requested:</div>
                <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                  {selectedOrderForView.brands.map((b, i) => (
                    <span key={i} style={{ padding: "4px 10px", background: "#f1f5f9", borderRadius: "6px", fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              {selectedOrderForView.quotedAmount && (
                <div style={{ padding: "14px", background: "#eff6ff", borderRadius: "10px", border: "1px solid #bfdbfe", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#1e40af", fontWeight: 700 }}>Active Quoted Bid</div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: "#1e3a8a" }}>{selectedOrderForView.quotedAmount}</div>
                  </div>
                  <span style={{ fontSize: "12px", padding: "4px 10px", background: "#dbeafe", color: "#1e40af", borderRadius: "9999px", fontWeight: 700 }}>
                    Status: {selectedOrderForView.status}
                  </span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForView(null)}
                  style={{
                    height: "40px",
                    padding: "0 22px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #C2410C 0%, #9A3412 100%)",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. BULK ORDER GUIDE MODAL                                 */}
      {/* ========================================================= */}
      {showGuideModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
          onClick={() => setShowGuideModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "560px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "#ffffff",
              }}
            >
              <div>
                <div style={{ fontSize: "18px", fontWeight: 800 }}>Makaano Bulk Order Guide</div>
                <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                  Best practices for institutional RFQ bidding
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                style={{ background: "transparent", border: "none", color: "#ffffff", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px", color: "#475569", lineHeight: 1.5 }}>
              <div>
                <strong style={{ color: "#1e293b" }}>1. Competitive Pricing:</strong> Quotes submitted on Makaano are reviewed directly by verified contractors and builders. Ensure transparent GST and freight inclusions.
              </div>
              <div>
                <strong style={{ color: "#1e293b" }}>2. Delivery Timelines:</strong> Bids with faster lead times (e.g. 1-3 days) have a 68% higher win rate.
              </div>
              <div>
                <strong style={{ color: "#1e293b" }}>3. Escrow Protected:</strong> Once an institutional buyer accepts your quote, payment is held safely in Makaano Escrow until dispatch and delivery confirmation.
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  style={{
                    height: "38px",
                    padding: "0 20px",
                    borderRadius: "8px",
                    background: "#0f172a",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
