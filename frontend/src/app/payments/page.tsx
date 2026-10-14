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
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  FileText,
  User,
  ShieldCheck,
  ExternalLink,
  Smartphone,
  Building,
} from "lucide-react";

export type PaymentStatus = "Successful" | "Pending" | "Failed";
export type PaymentMethodType = "UPI" | "Credit Card" | "Debit Card" | "Net Banking" | "Wallet" | "All";

export interface PaymentRecord {
  transactionId: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  amount: string;
  amountNum: number;
  paymentMethod: string;
  paymentSubtext: string;
  paymentType: "UPI" | "Card" | "NetBanking" | "Wallet";
  status: PaymentStatus;
  date: string;
  time: string;
}

// Dataset mirroring screenshot
const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    transactionId: "TXN12567890",
    orderId: "BM12567890",
    customerName: "Ramesh Gupta",
    customerEmail: "ramesh.gupta@email.com",
    amount: "₹2,099",
    amountNum: 2099,
    paymentMethod: "UPI",
    paymentSubtext: "paytm@upi",
    paymentType: "UPI",
    status: "Successful",
    date: "19 May 2025",
    time: "11:45 AM",
  },
  {
    transactionId: "TXN12567889",
    orderId: "BM12567889",
    customerName: "Sanjay Mehta",
    customerEmail: "sanjay.mehta@email.com",
    amount: "₹1,160",
    amountNum: 1160,
    paymentMethod: "Credit Card",
    paymentSubtext: "Visa •••• 4242",
    paymentType: "Card",
    status: "Successful",
    date: "19 May 2025",
    time: "10:30 AM",
  },
  {
    transactionId: "TXN12567888",
    orderId: "BM12567888",
    customerName: "Ankit Sharma",
    customerEmail: "ankit.sharma@email.com",
    amount: "₹5,599",
    amountNum: 5599,
    paymentMethod: "UPI",
    paymentSubtext: "phonepe@upi",
    paymentType: "UPI",
    status: "Pending",
    date: "19 May 2025",
    time: "09:20 AM",
  },
  {
    transactionId: "TXN12567887",
    orderId: "BM12567887",
    customerName: "Neha Verma",
    customerEmail: "neha.verma@email.com",
    amount: "₹1,600",
    amountNum: 1600,
    paymentMethod: "HDFC Bank",
    paymentSubtext: "Net Banking",
    paymentType: "NetBanking",
    status: "Successful",
    date: "18 May 2025",
    time: "08:15 PM",
  },
  {
    transactionId: "TXN12567886",
    orderId: "BM12567886",
    customerName: "Vikram Singh",
    customerEmail: "vikram.singh@email.com",
    amount: "₹1,100",
    amountNum: 1100,
    paymentMethod: "Mastercard",
    paymentSubtext: "Debit Card •••• 5678",
    paymentType: "Card",
    status: "Failed",
    date: "18 May 2025",
    time: "07:10 PM",
  },
  {
    transactionId: "TXN12567885",
    orderId: "BM12567885",
    customerName: "Pooja Agarwal",
    customerEmail: "pooja.agarwal@email.com",
    amount: "₹630",
    amountNum: 630,
    paymentMethod: "Amazon Pay",
    paymentSubtext: "UPI",
    paymentType: "UPI",
    status: "Successful",
    date: "18 May 2025",
    time: "06:05 PM",
  },
  {
    transactionId: "TXN12567884",
    orderId: "BM12567884",
    customerName: "Deepak Yadav",
    customerEmail: "deepak.yadav@email.com",
    amount: "₹850",
    amountNum: 850,
    paymentMethod: "SBI Bank",
    paymentSubtext: "Net Banking",
    paymentType: "NetBanking",
    status: "Successful",
    date: "17 May 2025",
    time: "05:15 PM",
  },
  {
    transactionId: "TXN12567883",
    orderId: "BM12567883",
    customerName: "Kavita Joshi",
    customerEmail: "kavita.joshi@email.com",
    amount: "₹2,750",
    amountNum: 2750,
    paymentMethod: "ICICI Bank",
    paymentSubtext: "Credit Card •••• 1234",
    paymentType: "Card",
    status: "Pending",
    date: "17 May 2025",
    time: "04:20 PM",
  },
  {
    transactionId: "TXN12567882",
    orderId: "BM12567882",
    customerName: "Manoj Kumar",
    customerEmail: "manoj.kumar@email.com",
    amount: "₹3,200",
    amountNum: 3200,
    paymentMethod: "Paytm Wallet",
    paymentSubtext: "Wallet",
    paymentType: "Wallet",
    status: "Successful",
    date: "17 May 2025",
    time: "03:30 PM",
  },
  {
    transactionId: "TXN12567881",
    orderId: "BM12567881",
    customerName: "Sunil Patel",
    customerEmail: "sunil.patel@email.com",
    amount: "₹1,450",
    amountNum: 1450,
    paymentMethod: "Axis Bank",
    paymentSubtext: "Net Banking",
    paymentType: "NetBanking",
    status: "Failed",
    date: "17 May 2025",
    time: "02:45 PM",
  },
  // Extra items for pagination
  {
    transactionId: "TXN12567880",
    orderId: "BM12567880",
    customerName: "Rajeev Sharma",
    customerEmail: "rajeev.sharma@email.com",
    amount: "₹4,120",
    amountNum: 4120,
    paymentMethod: "UPI",
    paymentSubtext: "gpay@upi",
    paymentType: "UPI",
    status: "Successful",
    date: "16 May 2025",
    time: "01:15 PM",
  },
  {
    transactionId: "TXN12567879",
    orderId: "BM12567879",
    customerName: "Swati Deshmukh",
    customerEmail: "swati.deshmukh@email.com",
    amount: "₹2,890",
    amountNum: 2890,
    paymentMethod: "Kotak Mahindra",
    paymentSubtext: "Net Banking",
    paymentType: "NetBanking",
    status: "Successful",
    date: "16 May 2025",
    time: "11:00 AM",
  },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>(INITIAL_PAYMENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("All Payment Methods");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [dateRange, setDateRange] = useState("19 May 2025 - 25 May 2025");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPaymentsSubmenuOpen, setIsPaymentsSubmenuOpen] = useState(true);
  const [activePaymentSubTab, setActivePaymentSubTab] = useState<"all" | "methods" | "refunds">("all");
  const [activeMenuTxnId, setActiveMenuTxnId] = useState<string | null>(null);
  const [selectedTxnForModal, setSelectedTxnForModal] = useState<PaymentRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const itemsPerPage = 10;
  const totalPaymentsReported = "1,248";

  // Filter logic
  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      // Status filter
      if (selectedStatus !== "All Status" && item.status !== selectedStatus) {
        return false;
      }
      // Method filter
      if (selectedMethod !== "All Payment Methods") {
        if (selectedMethod === "UPI" && item.paymentType !== "UPI") return false;
        if (selectedMethod === "Cards" && item.paymentType !== "Card") return false;
        if (selectedMethod === "Net Banking" && item.paymentType !== "NetBanking") return false;
        if (selectedMethod === "Wallet" && item.paymentType !== "Wallet") return false;
      }
      // Sub-tab filter (Refunds tab shows failed/refunded)
      if (activePaymentSubTab === "refunds" && item.status !== "Failed") {
        return false;
      }
      // Search filter
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchTxn = item.transactionId.toLowerCase().includes(q);
        const matchOrder = item.orderId.toLowerCase().includes(q);
        const matchCustomer = item.customerName.toLowerCase().includes(q);
        const matchEmail = item.customerEmail.toLowerCase().includes(q);
        return matchTxn || matchOrder || matchCustomer || matchEmail;
      }
      return true;
    });
  }, [payments, selectedStatus, selectedMethod, activePaymentSubTab, searchQuery]);

  // Paginated records
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPayments.slice(start, start + itemsPerPage);
  }, [filteredPayments, currentPage]);

  const handleExportCSV = () => {
    const csvHeader = "Transaction ID,Order ID,Customer,Email,Amount,Payment Method,Details,Status,Date,Time\n";
    const csvRows = filteredPayments
      .map(
        (p) =>
          `"${p.transactionId}","${p.orderId}","${p.customerName}","${p.customerEmail}","${p.amount}","${p.paymentMethod}","${p.paymentSubtext}","${p.status}","${p.date}","${p.time}"`
      )
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `BuildMart_Payments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage("Payments exported successfully as CSV!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Status Badge Styling matching screenshot
  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case "Successful":
        return {
          background: "#ecfdf5",
          color: "#10b981",
          border: "1px solid rgba(16, 185, 129, 0.2)",
        };
      case "Pending":
        return {
          background: "#fffbeb",
          color: "#f59e0b",
          border: "1px solid rgba(245, 158, 11, 0.25)",
        };
      case "Failed":
        return {
          background: "#fef2f2",
          color: "#ef4444",
          border: "1px solid rgba(239, 68, 68, 0.2)",
        };
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#f8f7fc",
        fontFamily: "var(--font-sans), sans-serif",
      }}
    >
      {/* ========================================================= */}
      {/* TOP HEADER NAVIGATION BAR (BuildMart Royal Purple Theme)  */}
      {/* ========================================================= */}
      <header
        style={{
          height: "64px",
          background: "linear-gradient(135deg, #3b0764 0%, #581c87 50%, #4c1d95 100%)",
          borderBottom: "1px solid rgba(168, 85, 247, 0.25)",
          boxShadow: "0 4px 16px rgba(59, 7, 100, 0.3)",
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
                <path d="M13 18H19V27H13V18Z" fill="#3b0764" />
                <rect x="6" y="27" width="20" height="2.5" rx="1" fill="#F59E0B" />
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px", lineHeight: 1 }}>
                Build<span style={{ color: "#F59E0B" }}>Mart</span>
              </span>
              <span style={{ fontSize: "7.5px", fontWeight: 600, color: "#d8b4fe", letterSpacing: "0.4px" }}>
                Building Trust • Delivering Quality
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
            <span style={{ fontSize: "13.5px", color: "#e9d5ff", fontWeight: 500 }}>
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
              color: "#d8b4fe",
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
                color: "#d8b4fe",
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
                  border: "2px solid #4c1d95",
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
              color: "#d8b4fe",
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
                background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(124, 58, 237, 0.4)",
              }}
            >
              A
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }}>
                Arjun Sharma
              </span>
              <span style={{ fontSize: "11px", color: "#d8b4fe", fontWeight: 500 }}>
                Admin
              </span>
            </div>
            <ChevronDown size={14} color="#d8b4fe" />
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN CONTAINER: SIDEBAR + CONTENT                         */}
      {/* ========================================================= */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ======================================================= */}
        {/* LEFT BUILDMART PURPLE UNIFIED SIDEBAR                   */}
        {/* ======================================================= */}
        <aside
          style={{
            width: isSidebarOpen ? "250px" : "0px",
            minWidth: isSidebarOpen ? "250px" : "0px",
            maxWidth: isSidebarOpen ? "250px" : "0px",
            background: "linear-gradient(180deg, #3b0764 0%, #4c1d95 100%)",
            color: "#d8b4fe",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            borderRight: isSidebarOpen ? "1px solid rgba(168, 85, 247, 0.25)" : "none",
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
              color: "#d8b4fe",
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
              color: "#d8b4fe",
              background: "transparent",
              textDecoration: "none",
              fontSize: "13.5px",
              fontWeight: 500,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Package size={18} />
              <span>Orders</span>
            </div>
            <span
              style={{
                background: "rgba(124, 58, 237, 0.35)",
                color: "#e9d5ff",
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
              color: "#d8b4fe",
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
              color: "#d8b4fe",
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
            <ChevronDown size={14} color="#a855f7" />
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
              color: "#d8b4fe",
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
            <ChevronDown size={14} color="#a855f7" />
          </Link>

          {/* 6. Pricing */}
          <button
            type="button"
            title="Pricing"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              borderRadius: "8px",
              color: "#d8b4fe",
              background: "transparent",
              border: "none",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Tag size={17} />
              <span>Pricing</span>
            </div>
            <ChevronDown size={14} color="#a855f7" />
          </button>

          {/* 7. ACTIVE PAYMENTS ACCORDION (Matching Screenshot) */}
          <div
            style={{
              background: "rgba(0, 0, 0, 0.2)",
              borderRadius: "12px",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              padding: "6px",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            {/* Payments Main Item */}
            <button
              type="button"
              onClick={() => setIsPaymentsSubmenuOpen((prev) => !prev)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                borderRadius: "8px",
                color: "#fbbf24",
                background: "transparent",
                border: "none",
                fontSize: "13.5px",
                fontWeight: 700,
                cursor: "pointer",
                width: "100%",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CreditCard size={17} color="#fbbf24" />
                <span>Payments</span>
              </div>
              <ChevronDown
                size={14}
                color="#fbbf24"
                style={{
                  transform: isPaymentsSubmenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
            </button>

            {/* Submenu Links */}
            {isPaymentsSubmenuOpen && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1px", paddingLeft: "26px" }}>
                <button
                  type="button"
                  onClick={() => setActivePaymentSubTab("all")}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "none",
                    background: activePaymentSubTab === "all" ? "rgba(245, 158, 11, 0.15)" : "transparent",
                    color: activePaymentSubTab === "all" ? "#fbbf24" : "#e9d5ff",
                    fontSize: "12.5px",
                    fontWeight: activePaymentSubTab === "all" ? 700 : 500,
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  All Payments
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActivePaymentSubTab("methods");
                    setToastMessage("Payment Methods: UPI, NetBanking, Cards enabled");
                  }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "none",
                    background: activePaymentSubTab === "methods" ? "rgba(245, 158, 11, 0.15)" : "transparent",
                    color: activePaymentSubTab === "methods" ? "#fbbf24" : "#e9d5ff",
                    fontSize: "12.5px",
                    fontWeight: activePaymentSubTab === "methods" ? 700 : 500,
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  Payment Methods
                </button>
                <button
                  type="button"
                  onClick={() => setActivePaymentSubTab("refunds")}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "none",
                    background: activePaymentSubTab === "refunds" ? "rgba(245, 158, 11, 0.15)" : "transparent",
                    color: activePaymentSubTab === "refunds" ? "#fbbf24" : "#e9d5ff",
                    fontSize: "12.5px",
                    fontWeight: activePaymentSubTab === "refunds" ? 700 : 500,
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  Refunds
                </button>
              </div>
            )}
          </div>

          {/* Returns & Payouts */}
          <button
            type="button"
            title="Returns"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              borderRadius: "8px",
              color: "#d8b4fe",
              background: "transparent",
              border: "none",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <RotateCcw size={17} />
              <span>Returns</span>
            </div>
            <span
              style={{
                background: "rgba(124, 58, 237, 0.3)",
                color: "#e9d5ff",
                fontSize: "11px",
                padding: "1px 6px",
                borderRadius: "9999px",
                fontWeight: 700,
              }}
            >
              8
            </span>
          </button>

          <button
            type="button"
            title="Payouts"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              borderRadius: "8px",
              color: "#d8b4fe",
              background: "transparent",
              border: "none",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Wallet size={17} />
              <span>Payouts</span>
            </div>
            <ChevronDown size={14} color="#a855f7" />
          </button>

          <button
            type="button"
            title="Reports"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              borderRadius: "8px",
              color: "#d8b4fe",
              background: "transparent",
              border: "none",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <BarChart3 size={17} />
              <span>Reports</span>
            </div>
            <ChevronDown size={14} color="#a855f7" />
          </button>

          {/* Growth, Support, Notifications */}
          {[
            { label: "Growth", icon: TrendingUp },
            { label: "Support", icon: Headphones },
            { label: "Notifications", icon: Bell },
            { label: "Account Settings", icon: Settings },
            { label: "Help Center", icon: LifeBuoy },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                title={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  color: "#d8b4fe",
                  background: "transparent",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Need Help Card */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: "16px",
              borderTop: "1px solid rgba(168, 85, 247, 0.2)",
            }}
          >
            <div
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(168, 85, 247, 0.25)",
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
              <span style={{ fontSize: "11px", color: "#d8b4fe" }}>
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
            <div style={{ fontSize: "11px", color: "#c084fc", marginTop: "12px", paddingLeft: "4px" }}>
              © 2025 BuildMart<br />All rights reserved.
            </div>
          </div>
        </aside>

        {/* ======================================================= */}
        {/* MAIN PAYMENTS WORKSPACE                                 */}
        {/* ======================================================= */}
        <main
          style={{
            flex: 1,
            padding: "24px 32px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "22px",
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

          {/* 1. Header Title & Primary Action */}
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
                Payments
              </h1>
              <p style={{ fontSize: "14px", color: "#64748b", marginTop: "4px", margin: 0 }}>
                Track and manage all incoming payments.
              </p>
            </div>

            {/* Export Payments Button (Matching Screenshot) */}
            <button
              type="button"
              onClick={handleExportCSV}
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
                transition: "all 0.15s ease",
              }}
            >
              Export Payments
            </button>
          </div>

          {/* 2. 4 Metric KPI Cards Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
            }}
          >
            {/* Card 1: Total Payments */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(124, 58, 237, 0.12)",
                borderRadius: "16px",
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: "0 2px 8px rgba(124, 58, 237, 0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Total Payments</span>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#1e293b", marginTop: "4px", lineHeight: 1.1 }}>
                    ₹24,58,320
                  </div>
                </div>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    background: "#eff6ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                <span style={{ color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center" }}>
                  <ArrowUpRight size={14} />
                  18.6%
                </span>
                <span style={{ color: "#64748b" }}>vs last 7 days</span>
              </div>
            </div>

            {/* Card 2: Successful */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(16, 185, 129, 0.18)",
                borderRadius: "16px",
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Successful</span>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#1e293b", marginTop: "4px", lineHeight: 1.1 }}>
                    ₹22,81,430
                  </div>
                </div>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    background: "#ecfdf5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                <span style={{ color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center" }}>
                  <ArrowUpRight size={14} />
                  18.2%
                </span>
                <span style={{ color: "#64748b" }}>vs last 7 days</span>
              </div>
            </div>

            {/* Card 3: Pending */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(245, 158, 11, 0.2)",
                borderRadius: "16px",
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: "0 2px 8px rgba(245, 158, 11, 0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Pending</span>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#1e293b", marginTop: "4px", lineHeight: 1.1 }}>
                    ₹1,25,680
                  </div>
                </div>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    background: "#fffbeb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                <span style={{ color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center" }}>
                  <ArrowUpRight size={14} />
                  8.1%
                </span>
                <span style={{ color: "#64748b" }}>vs last 7 days</span>
              </div>
            </div>

            {/* Card 4: Failed */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(239, 68, 68, 0.18)",
                borderRadius: "16px",
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: "0 2px 8px rgba(239, 68, 68, 0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Failed</span>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#1e293b", marginTop: "4px", lineHeight: 1.1 }}>
                    ₹51,210
                  </div>
                </div>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    background: "#fef2f2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                <span style={{ color: "#ef4444", fontWeight: 700, display: "flex", alignItems: "center" }}>
                  <ArrowDownRight size={14} />
                  12.4%
                </span>
                <span style={{ color: "#64748b" }}>vs last 7 days</span>
              </div>
            </div>
          </div>

          {/* 3. Search & Filter Controls Pill Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {/* Search Input */}
            <div
              style={{
                flex: 1,
                minWidth: "260px",
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Search
                size={16}
                color="#94a3b8"
                style={{ position: "absolute", left: "16px", pointerEvents: "none" }}
              />
              <input
                type="text"
                placeholder="Search by Transaction ID, Order ID, Customer..."
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

            {/* Method Dropdown */}
            <div style={{ position: "relative" }}>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                style={{
                  height: "40px",
                  padding: "0 18px",
                  borderRadius: "9999px",
                  border: "1.5px solid #e2e8f0",
                  background: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#334155",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="All Payment Methods">All Payment Methods</option>
                <option value="UPI">UPI</option>
                <option value="Cards">Credit / Debit Card</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Wallet">Wallet</option>
              </select>
            </div>

            {/* Status Dropdown */}
            <div style={{ position: "relative" }}>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  height: "40px",
                  padding: "0 18px",
                  borderRadius: "9999px",
                  border: "1.5px solid #e2e8f0",
                  background: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#334155",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="All Status">All Status</option>
                <option value="Successful">Successful</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            {/* Date Range Preset */}
            <div
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
              onClick={() => setToastMessage("Date Range: 19 May 2025 - 25 May 2025")}
            >
              <span>{dateRange}</span>
            </div>

            {/* Filters Button */}
            <button
              type="button"
              onClick={() => setToastMessage("Advanced filter drawer opened")}
              style={{
                height: "40px",
                padding: "0 20px",
                borderRadius: "9999px",
                border: "1.5px solid #e2e8f0",
                background: "#ffffff",
                fontSize: "13px",
                fontWeight: 600,
                color: "#334155",
                cursor: "pointer",
              }}
            >
              Filters
            </button>
          </div>

          {/* 4. Main White Card Container with Payments Table */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid rgba(124, 58, 237, 0.12)",
              borderRadius: "16px",
              boxShadow: "0 2px 12px rgba(124, 58, 237, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <th style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>
                      Transaction ID
                    </th>
                    <th style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>
                      Order ID
                    </th>
                    <th style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>
                      Customer
                    </th>
                    <th style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>
                      Amount
                    </th>
                    <th style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>
                      Payment Method
                    </th>
                    <th style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>
                      Status
                    </th>
                    <th style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>
                      Date & Time
                    </th>
                    <th style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 600, color: "#64748b", textAlign: "right" }}>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    paginatedPayments.map((item) => {
                      const badgeStyle = getStatusBadge(item.status);
                      const isMenuOpen = activeMenuTxnId === item.transactionId;

                      return (
                        <tr
                          key={item.transactionId}
                          style={{
                            borderBottom: "1px solid #f8fafc",
                            transition: "background 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#faf8ff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          {/* Transaction ID */}
                          <td style={{ padding: "14px 14px", fontSize: "13.5px", fontWeight: 700, color: "#2563eb" }}>
                            <span
                              onClick={() => setSelectedTxnForModal(item)}
                              style={{ cursor: "pointer", textDecoration: "none" }}
                            >
                              {item.transactionId}
                            </span>
                          </td>

                          {/* Order ID */}
                          <td style={{ padding: "14px 14px", fontSize: "13.5px", fontWeight: 600 }}>
                            <Link
                              href="/orders"
                              style={{ color: "#2563eb", textDecoration: "none" }}
                            >
                              {item.orderId}
                            </Link>
                          </td>

                          {/* Customer Name & Email */}
                          <td style={{ padding: "14px 14px" }}>
                            <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#1e293b" }}>
                              {item.customerName}
                            </div>
                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                              {item.customerEmail}
                            </div>
                          </td>

                          {/* Amount */}
                          <td style={{ padding: "14px 14px", fontSize: "13.5px", fontWeight: 700, color: "#1e293b" }}>
                            {item.amount}
                          </td>

                          {/* Payment Method with Square outline box */}
                          <td style={{ padding: "14px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "6px",
                                  border: "1px solid #e2e8f0",
                                  background: "#f8fafc",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {item.paymentType === "UPI" && <Smartphone size={14} color="#7c3aed" />}
                                {item.paymentType === "Card" && <CreditCard size={14} color="#2563eb" />}
                                {item.paymentType === "NetBanking" && <Building size={14} color="#059669" />}
                                {item.paymentType === "Wallet" && <Wallet size={14} color="#f59e0b" />}
                              </div>
                              <div>
                                <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                                  {item.paymentMethod}
                                </div>
                                <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                                  {item.paymentSubtext}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td style={{ padding: "14px 14px" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 12px",
                                borderRadius: "9999px",
                                fontSize: "12px",
                                fontWeight: 700,
                                background: badgeStyle.background,
                                color: badgeStyle.color,
                                border: badgeStyle.border,
                              }}
                            >
                              {item.status}
                            </span>
                          </td>

                          {/* Date & Time */}
                          <td style={{ padding: "14px 14px" }}>
                            <div style={{ fontSize: "12.5px", color: "#1e293b", fontWeight: 600 }}>
                              {item.date}
                            </div>
                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                              {item.time}
                            </div>
                          </td>

                          {/* Actions Three Dots */}
                          <td style={{ padding: "14px 14px", textAlign: "right", position: "relative" }}>
                            <button
                              type="button"
                              onClick={() => setActiveMenuTxnId(isMenuOpen ? null : item.transactionId)}
                              style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                color: "#94a3b8",
                                padding: "4px",
                                borderRadius: "6px",
                              }}
                            >
                              <MoreHorizontal size={18} />
                            </button>

                            {/* Dropdown menu */}
                            {isMenuOpen && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "36px",
                                  right: "14px",
                                  width: "180px",
                                  background: "#ffffff",
                                  borderRadius: "10px",
                                  boxShadow: "0 10px 25px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                                  border: "1px solid #e2e8f0",
                                  padding: "6px",
                                  zIndex: 40,
                                  textAlign: "left",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTxnForModal(item);
                                    setActiveMenuTxnId(null);
                                  }}
                                  style={{
                                    width: "100%",
                                    padding: "8px 10px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    background: "transparent",
                                    border: "none",
                                    color: "#1e293b",
                                    fontSize: "12.5px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    borderRadius: "6px",
                                  }}
                                >
                                  <FileText size={15} color="#7c3aed" />
                                  <span>View Receipt</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuTxnId(null);
                                    setToastMessage(`Tax receipt downloaded for ${item.transactionId}`);
                                  }}
                                  style={{
                                    width: "100%",
                                    padding: "8px 10px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    background: "transparent",
                                    border: "none",
                                    color: "#1e293b",
                                    fontSize: "12.5px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    borderRadius: "6px",
                                  }}
                                >
                                  <Printer size={15} color="#64748b" />
                                  <span>Print Tax Receipt</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* 5. Pagination Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: "12px",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                Showing 1 to {Math.min(filteredPayments.length, itemsPerPage)} of {totalPaymentsReported} payments
              </div>

              {/* Page navigation */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    color: currentPage === 1 ? "#cbd5e1" : "#475569",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ChevronLeft size={16} />
                </button>

                {[1, 2, 3, 4, 5].map((num) => {
                  const isCurrent = currentPage === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCurrentPage(num)}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: isCurrent ? "#ffffff" : "transparent",
                        border: isCurrent ? "1.5px solid #3b82f6" : "none",
                        color: isCurrent ? "#3b82f6" : "#64748b",
                        fontSize: "13px",
                        fontWeight: isCurrent ? 700 : 500,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {num}
                    </button>
                  );
                })}

                <span style={{ color: "#94a3b8", fontSize: "13px", padding: "0 2px" }}>...</span>

                <button
                  type="button"
                  onClick={() => setCurrentPage(125)}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "transparent",
                    border: "none",
                    color: "#64748b",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  125
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(125, p + 1))}
                  disabled={currentPage === 125}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    color: currentPage === 125 ? "#cbd5e1" : "#475569",
                    cursor: currentPage === 125 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ========================================================= */}
      {/* TRANSACTION DETAILS MODAL                                 */}
      {/* ========================================================= */}
      {selectedTxnForModal && (
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
          onClick={() => setSelectedTxnForModal(null)}
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
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #3b0764 0%, #4c1d95 100%)",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "#ffffff",
              }}
            >
              <div>
                <div style={{ fontSize: "18px", fontWeight: 800 }}>
                  Transaction #{selectedTxnForModal.transactionId}
                </div>
                <div style={{ fontSize: "12px", color: "#d8b4fe", marginTop: "2px" }}>
                  Order Ref: {selectedTxnForModal.orderId} • {selectedTxnForModal.date} {selectedTxnForModal.time}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTxnForModal(null)}
                style={{ background: "transparent", border: "none", color: "#ffffff", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Amount Box */}
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                    Total Settlement
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#1e293b", marginTop: "2px" }}>
                    {selectedTxnForModal.amount}
                  </div>
                </div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    fontSize: "12px",
                    fontWeight: 700,
                    background: getStatusBadge(selectedTxnForModal.status).background,
                    color: getStatusBadge(selectedTxnForModal.status).color,
                    border: getStatusBadge(selectedTxnForModal.status).border,
                  }}
                >
                  {selectedTxnForModal.status}
                </span>
              </div>

              {/* Details grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div style={{ padding: "12px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "11.5px", fontWeight: 600, color: "#64748b" }}>Customer</div>
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#1e293b", marginTop: "2px" }}>
                    {selectedTxnForModal.customerName}
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>{selectedTxnForModal.customerEmail}</div>
                </div>

                <div style={{ padding: "12px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "11.5px", fontWeight: 600, color: "#64748b" }}>Payment Gateway</div>
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#1e293b", marginTop: "2px" }}>
                    {selectedTxnForModal.paymentMethod}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>{selectedTxnForModal.paymentSubtext}</div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setToastMessage(`Receipt downloaded for ${selectedTxnForModal.transactionId}`);
                    setSelectedTxnForModal(null);
                  }}
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
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Printer size={16} />
                  <span>Download Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTxnForModal(null)}
                  style={{
                    height: "40px",
                    padding: "0 20px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
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
    </div>
  );
}
