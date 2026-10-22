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
  Eye,
  Printer,
  Truck,
  HelpCircle,
  FileText,
  User,
  Phone,
  MapPin,
  Calendar,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export type OrderStatus =
  | "All"
  | "Unshipped"
  | "Pending"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "Returned";

export interface OrderItemRecord {
  orderId: string;
  orderDate: string;
  customer: string;
  customerPhone?: string;
  customerAddress?: string;
  amount: string;
  amountNum: number;
  status: OrderStatus;
  productName: string;
  quantity: string;
  paymentMethod: string;
}

// Full realistic dataset of 25 orders to demonstrate pagination and filtering
const INITIAL_ORDERS_DATA: OrderItemRecord[] = [
  {
    orderId: "BM12567892",
    orderDate: "19 May 2025",
    customer: "Rahul Verma",
    customerPhone: "+91 98201 54321",
    customerAddress: "Plot 42, Knowledge Park III, Greater Noida, UP - 201306",
    amount: "₹4,850",
    amountNum: 4850,
    status: "Delivered",
    productName: "Bosch Professional GSB 550 Impact Drill Kit (13mm)",
    quantity: "2 Units",
    paymentMethod: "UPI / PhonePe",
  },
  {
    orderId: "BM12567891",
    orderDate: "19 May 2025",
    customer: "Amit Singh",
    customerPhone: "+91 97112 34567",
    customerAddress: "Flat 402, Royal Palms, Goregaon East, Mumbai, MH - 400065",
    amount: "₹2,340",
    amountNum: 2340,
    status: "Delivered",
    productName: "Havells Reo 6A Modular Switches & Sockets Box (Pack of 20)",
    quantity: "1 Pack",
    paymentMethod: "Credit Card (HDFC)",
  },
  {
    orderId: "BM12567890",
    orderDate: "19 May 2025",
    customer: "Neha Gupta",
    customerPhone: "+91 98103 45678",
    customerAddress: "Shop 12, Main Hardware Market, Sector 18, Chandigarh - 160018",
    amount: "₹1,270",
    amountNum: 1270,
    status: "Processing",
    productName: "Supreme CPVC Heavy Duty Pipe 25mm (10 Feet x 3)",
    quantity: "3 Pipes",
    paymentMethod: "Net Banking (SBI)",
  },
  {
    orderId: "BM12567809",
    orderDate: "19 May 2025",
    customer: "Pooja Sharma",
    customerPhone: "+91 99204 56789",
    customerAddress: "Building 9, Infotech Park, Hinjawadi Phase 1, Pune, MH - 411057",
    amount: "₹3,620",
    amountNum: 3620,
    status: "Shipped",
    productName: "Pidilite Dr. Fixit Waterproofing Chemical 5 Litres",
    quantity: "2 Cans",
    paymentMethod: "UPI / Google Pay",
  },
  {
    orderId: "BM12567808",
    orderDate: "18 May 2025",
    customer: "Rakesh Kumar",
    customerPhone: "+91 98451 23456",
    customerAddress: "Site B, DLF Phase 5, Golf Course Road, Gurugram, HR - 122009",
    amount: "₹2,150",
    amountNum: 2150,
    status: "Pending",
    productName: "Asian Paints Apex Weatherproof Exterior Emulsion (10L)",
    quantity: "1 Bucket",
    paymentMethod: "Cash on Delivery",
  },
  {
    orderId: "BM12567807",
    orderDate: "18 May 2025",
    customer: "Sandeep Yadav",
    customerPhone: "+91 97331 98765",
    customerAddress: "Khasra 284, Near Metro Pillar 114, Dwarka Mor, New Delhi - 110059",
    amount: "₹1,860",
    amountNum: 1860,
    status: "Cancelled",
    productName: "Taparia 1012 Steel Tool Kit Box (Full Mechanic Set)",
    quantity: "1 Kit",
    paymentMethod: "Refund Processed (UPI)",
  },
  {
    orderId: "BM12567806",
    orderDate: "17 May 2025",
    customer: "Vikram Patel",
    customerPhone: "+91 98250 87654",
    customerAddress: "GIDC Industrial Estate, Phase 2, Vatva, Ahmedabad, GJ - 382445",
    amount: "₹2,780",
    amountNum: 2780,
    status: "Delivered",
    productName: "Finolex 2.5 Sq mm FR Multistrand Copper Wire (90m Roll)",
    quantity: "2 Rolls",
    paymentMethod: "Business Net Banking",
  },
  {
    orderId: "BM12567805",
    orderDate: "17 May 2025",
    customer: "Manoj Tiwari",
    customerPhone: "+91 94152 76543",
    customerAddress: "Civil Lines, Near Circuit House, Prayagraj, UP - 211001",
    amount: "₹1,540",
    amountNum: 1540,
    status: "Returned",
    productName: "Jaquar Continental Brass Angle Valve with Flange (Chrome)",
    quantity: "4 Units",
    paymentMethod: "Store Credit Refund",
  },
  {
    orderId: "BM12567804",
    orderDate: "16 May 2025",
    customer: "Shivam Gupta",
    customerPhone: "+91 96192 65432",
    customerAddress: "45, Ring Road Industrial Area, Rajajinagar, Bengaluru, KA - 560010",
    amount: "₹950",
    amountNum: 950,
    status: "Shipped",
    productName: "Fevicol Marine Waterproof Wood Adhesive (2 Kg)",
    quantity: "2 Packs",
    paymentMethod: "UPI / Paytm",
  },
  {
    orderId: "BM12567803",
    orderDate: "16 May 2025",
    customer: "Rohit Sharma",
    customerPhone: "+91 98118 54321",
    customerAddress: "Vasant Kunj Enclave, Pocket 2, New Delhi - 110070",
    amount: "₹3,120",
    amountNum: 3120,
    status: "Delivered",
    productName: "Schneider Electric 32A Double Pole MCB C-Curve (Pack of 4)",
    quantity: "4 Units",
    paymentMethod: "Credit Card (ICICI)",
  },
  // Extra rows to support multi-page pagination demo
  {
    orderId: "BM12567802",
    orderDate: "15 May 2025",
    customer: "Kavita Reddy",
    customerPhone: "+91 99490 12345",
    customerAddress: "Plot 88, Jubilee Hills Road No. 36, Hyderabad, TS - 500033",
    amount: "₹5,400",
    amountNum: 5400,
    status: "Delivered",
    productName: "DeWalt 18V XR Li-Ion Brushless Cordless Drill Driver",
    quantity: "1 Unit",
    paymentMethod: "Debit Card",
  },
  {
    orderId: "BM12567801",
    orderDate: "15 May 2025",
    customer: "Gaurav Malhotra",
    customerPhone: "+91 98101 23456",
    customerAddress: "Block C, Sushant Lok Phase 1, Gurugram, HR - 122002",
    amount: "₹1,890",
    amountNum: 1890,
    status: "Unshipped",
    productName: "Astral Silencio Low Noise Drainage Pipes 110mm",
    quantity: "2 Pipes",
    paymentMethod: "Net Banking (Axis)",
  },
  {
    orderId: "BM12567800",
    orderDate: "14 May 2025",
    customer: "Deepak Choudhary",
    customerPhone: "+91 94140 98765",
    customerAddress: "MI Road, Near Panch Batti, Jaipur, RJ - 302001",
    amount: "₹2,650",
    amountNum: 2650,
    status: "Unshipped",
    productName: "Polycab 4 Sq mm Single Core Copper Wire (90m Yellow)",
    quantity: "1 Roll",
    paymentMethod: "UPI / PhonePe",
  },
  {
    orderId: "BM12567799",
    orderDate: "14 May 2025",
    customer: "Suresh Menon",
    customerPhone: "+91 98470 12345",
    customerAddress: "Panampilly Nagar, Main Avenue, Kochi, KL - 682036",
    amount: "₹4,200",
    amountNum: 4200,
    status: "Processing",
    productName: "Makita Angle Grinder 840W 100mm 4-Inch M0900B",
    quantity: "2 Units",
    paymentMethod: "Credit Card",
  },
  {
    orderId: "BM12567798",
    orderDate: "13 May 2025",
    customer: "Anil Jain",
    customerPhone: "+91 98290 87654",
    customerAddress: "Transport Nagar, Scheme 2, Indore, MP - 452014",
    amount: "₹3,850",
    amountNum: 3850,
    status: "Delivered",
    productName: "Kirloskar 1 HP Monoblock Water Pump (Chhotu Star)",
    quantity: "1 Pump",
    paymentMethod: "UPI",
  },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderItemRecord[]>(INITIAL_ORDERS_DATA);
  const [activeTab, setActiveTab] = useState<OrderStatus>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeMenuOrderId, setActiveMenuOrderId] = useState<string | null>(null);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<OrderItemRecord | null>(null);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const itemsPerPage = 10;
  const totalOrdersReported = 128; // Header statistic consistent with image

  // Available tabs matching the image
  const tabs: OrderStatus[] = [
    "All",
    "Unshipped",
    "Pending",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
    "Returned",
  ];

  // Filtered orders based on Tab and Search query
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab filter
      if (activeTab !== "All" && order.status !== activeTab) {
        return false;
      }
      // Search filter (Order ID, Customer, Status, Product)
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesId = order.orderId.toLowerCase().includes(query);
        const matchesCustomer = order.customer.toLowerCase().includes(query);
        const matchesProduct = order.productName.toLowerCase().includes(query);
        const matchesStatus = order.status.toLowerCase().includes(query);
        return matchesId || matchesCustomer || matchesProduct || matchesStatus;
      }
      return true;
    });
  }, [orders, activeTab, searchQuery]);

  // Pagination slice
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));

  // Export CSV handler
  const handleExportCSV = () => {
    const csvHeader = "Order ID,Order Date,Customer,Amount,Status,Product,Quantity\n";
    const csvRows = filteredOrders
      .map(
        (o) =>
          `"${o.orderId}","${o.orderDate}","${o.customer}","${o.amount}","${o.status}","${o.productName}","${o.quantity}"`
      )
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Makaano_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage("Orders CSV exported successfully!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper for Status Badge Styling exactly matching the screenshot
  const getStatusBadgeStyle = (status: OrderStatus) => {
    switch (status) {
      case "Delivered":
        return {
          background: "#ecfdf5",
          color: "#10b981",
          border: "1px solid rgba(16, 185, 129, 0.2)",
        };
      case "Processing":
        return {
          background: "#fffbeb",
          color: "#f59e0b",
          border: "1px solid rgba(245, 158, 11, 0.25)",
        };
      case "Shipped":
        return {
          background: "#eff6ff",
          color: "#3b82f6",
          border: "1px solid rgba(59, 130, 246, 0.2)",
        };
      case "Pending":
        return {
          background: "#f1f5f9",
          color: "#64748b",
          border: "1px solid #e2e8f0",
        };
      case "Cancelled":
        return {
          background: "#fef2f2",
          color: "#ef4444",
          border: "1px solid rgba(239, 68, 68, 0.2)",
        };
      case "Returned":
        return {
          background: "#f5f3ff",
          color: "#EA580C",
          border: "1px solid rgba(234, 88, 12, 0.2)",
        };
      case "Unshipped":
        return {
          background: "#fff7ed",
          color: "#ea580c",
          border: "1px solid rgba(234, 88, 12, 0.2)",
        };
      default:
        return {
          background: "#f8fafc",
          color: "#475569",
          border: "1px solid #e2e8f0",
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
        {/* Left: Brand Logo + Toggle + Seller Greeting */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <Link
            href="/portal/dashboard"
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
            href="/portal/dashboard"
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

          {/* 2. ACTIVE ORDERS TAB (Pill shaped with amber accent) */}
          <Link
            href="/portal/orders"
            title="Orders"
            style={{
              display: "flex",
              alignItems: "center",
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
            }}
          >
            <Package size={18} color="#fbbf24" />
            <span style={{ color: "#ffffff" }}>Orders</span>
          </Link>

          {/* 3. Bulk orders */}
          <Link
            href="/portal/bulk-orders"
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
            href="/portal/catalog"
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
            href="/portal/inventory"
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
            { label: "Payments", icon: CreditCard, hasChevron: true, href: "/portal/payments" },
            { label: "Returns", icon: RotateCcw, href: "/portal/returns" },
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

        {/* ======================================================= */}
        {/* MAIN ORDERS WORKSPACE                                   */}
        {/* ======================================================= */}
        <main
          style={{
            flex: 1,
            padding: "24px 32px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Success Toast */}
          {toastMessage && (
            <div
              style={{
                marginBottom: "16px",
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

          {/* MAIN WHITE ORDERS CARD CONTAINER (Matching Screenshot) */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid rgba(194, 65, 12, 0.12)",
              borderRadius: "16px",
              boxShadow: "0 2px 12px rgba(194, 65, 12, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)",
              padding: "28px 32px",
              display: "flex",
              flexDirection: "column",
              gap: "22px",
            }}
          >
            {/* 1. Header Title */}
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
                Orders
              </h1>
            </div>

            {/* 2. Status Tabs Bar with Amber Active Indicator */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "0px",
                overflowX: "auto",
              }}
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab);
                      setCurrentPage(1);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: "8px 4px 12px 4px",
                      fontSize: "14px",
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? "#1e293b" : "#64748b",
                      cursor: "pointer",
                      position: "relative",
                      whiteSpace: "nowrap",
                      transition: "color 0.15s ease",
                    }}
                  >
                    <span>{tab}</span>
                    {/* Amber underline indicator matching screenshot */}
                    {isActive && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: "-1px",
                          left: 0,
                          right: 0,
                          height: "2.5px",
                          background: "#f59e0b",
                          borderRadius: "2px",
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* 3. Search and Action Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
              }}
            >
              {/* Search Bar */}
              <div
                style={{
                  flex: 1,
                  maxWidth: "520px",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Search
                  size={18}
                  color="#94a3b8"
                  style={{ position: "absolute", left: "14px", pointerEvents: "none" }}
                />
                <input
                  type="text"
                  placeholder="Search by Order ID, Product, SKU, Customer..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    width: "100%",
                    height: "44px",
                    paddingLeft: "42px",
                    paddingRight: searchQuery ? "38px" : "16px",
                    borderRadius: "10px",
                    border: "1.5px solid #e2e8f0",
                    background: "#ffffff",
                    fontSize: "13.5px",
                    color: "#1e293b",
                    outline: "none",
                    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#C2410C";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(194, 65, 12, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    style={{
                      position: "absolute",
                      right: "12px",
                      background: "transparent",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Action Buttons: Filters & Export */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
                {/* Filters Dropdown Button */}
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                    style={{
                      height: "42px",
                      padding: "0 18px",
                      borderRadius: "10px",
                      background: "#ffffff",
                      border: "1.5px solid #e2e8f0",
                      color: "#334155",
                      fontSize: "13.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Filter size={16} color="#64748b" />
                    <span>Filters</span>
                    <ChevronDown size={14} color="#64748b" />
                  </button>

                  {/* Filter Menu */}
                  {isFilterDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "48px",
                        right: 0,
                        width: "220px",
                        background: "#ffffff",
                        borderRadius: "12px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                        border: "1px solid #e2e8f0",
                        padding: "12px",
                        zIndex: 30,
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", padding: "4px 8px" }}>
                        Filter by Date
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsFilterDropdownOpen(false);
                          setToastMessage("Filtered: Today's Orders");
                        }}
                        style={{ padding: "8px", borderRadius: "6px", border: "none", background: "#f8fafc", textAlign: "left", fontSize: "12.5px", color: "#1e293b", cursor: "pointer" }}
                      >
                        Today (19 May 2025)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsFilterDropdownOpen(false);
                          setToastMessage("Filtered: Last 7 Days");
                        }}
                        style={{ padding: "8px", borderRadius: "6px", border: "none", background: "transparent", textAlign: "left", fontSize: "12.5px", color: "#1e293b", cursor: "pointer" }}
                      >
                        Last 7 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsFilterDropdownOpen(false);
                          setToastMessage("Filtered: This Month");
                        }}
                        style={{ padding: "8px", borderRadius: "6px", border: "none", background: "transparent", textAlign: "left", fontSize: "12.5px", color: "#1e293b", cursor: "pointer" }}
                      >
                        This Month
                      </button>
                    </div>
                  )}
                </div>

                {/* Export Button */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  style={{
                    height: "42px",
                    padding: "0 18px",
                    borderRadius: "10px",
                    background: "#ffffff",
                    border: "1.5px solid #e2e8f0",
                    color: "#334155",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Download size={16} color="#64748b" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* 4. Orders Data Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <th style={{ padding: "12px 14px", fontSize: "12.5px", fontWeight: 600, color: "#64748b" }}>
                      Order ID
                    </th>
                    <th style={{ padding: "12px 14px", fontSize: "12.5px", fontWeight: 600, color: "#64748b" }}>
                      Order Date
                    </th>
                    <th style={{ padding: "12px 14px", fontSize: "12.5px", fontWeight: 600, color: "#64748b" }}>
                      Customer
                    </th>
                    <th style={{ padding: "12px 14px", fontSize: "12.5px", fontWeight: 600, color: "#64748b" }}>
                      Amount
                    </th>
                    <th style={{ padding: "12px 14px", fontSize: "12.5px", fontWeight: 600, color: "#64748b" }}>
                      Status
                    </th>
                    <th style={{ padding: "12px 14px", fontSize: "12.5px", fontWeight: 600, color: "#64748b", textAlign: "right" }}>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                        No orders found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedOrders.map((order) => {
                      const badgeStyle = getStatusBadgeStyle(order.status);
                      const isMenuOpen = activeMenuOrderId === order.orderId;

                      return (
                        <tr
                          key={order.orderId}
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
                          {/* Order ID */}
                          <td style={{ padding: "14px 14px", fontSize: "13.5px", fontWeight: 700, color: "#1e293b" }}>
                            <span
                              onClick={() => setSelectedOrderForModal(order)}
                              style={{ cursor: "pointer", color: "#1e293b", textDecoration: "none" }}
                            >
                              {order.orderId}
                            </span>
                          </td>

                          {/* Order Date */}
                          <td style={{ padding: "14px 14px", fontSize: "13px", color: "#475569" }}>
                            {order.orderDate}
                          </td>

                          {/* Customer */}
                          <td style={{ padding: "14px 14px", fontSize: "13.5px", fontWeight: 600, color: "#1e293b" }}>
                            {order.customer}
                          </td>

                          {/* Amount */}
                          <td style={{ padding: "14px 14px", fontSize: "13.5px", fontWeight: 700, color: "#1e293b" }}>
                            {order.amount}
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
                              {order.status}
                            </span>
                          </td>

                          {/* Actions Three Dots Menu */}
                          <td style={{ padding: "14px 14px", textAlign: "right", position: "relative" }}>
                            <button
                              type="button"
                              onClick={() => setActiveMenuOrderId(isMenuOpen ? null : order.orderId)}
                              style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                color: "#94a3b8",
                                padding: "4px",
                                borderRadius: "6px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <MoreHorizontal size={18} />
                            </button>

                            {/* Dropdown Menu */}
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
                                    setSelectedOrderForModal(order);
                                    setActiveMenuOrderId(null);
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
                                  <Eye size={15} color="#C2410C" />
                                  <span>View Order Details</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuOrderId(null);
                                    setToastMessage(`Invoice generated for ${order.orderId}`);
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
                                  <span>Print Tax Invoice</span>
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

            {/* 5. Pagination Footer (Matching Screenshot) */}
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
                Showing 1 to {Math.min(filteredOrders.length, itemsPerPage)} of {totalOrdersReported} orders
              </div>

              {/* Page Numbers */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {/* Prev Button */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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

                {/* Page Number Pills */}
                {[1, 2, 3, 4, 5].map((pageNum) => {
                  const isCurrent = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
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
                      {pageNum}
                    </button>
                  );
                })}

                <span style={{ color: "#94a3b8", fontSize: "13px", padding: "0 2px" }}>...</span>

                {/* Last Page Pill (35 in the screenshot) */}
                <button
                  type="button"
                  onClick={() => setCurrentPage(35)}
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
                  35
                </button>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(35, prev + 1))}
                  disabled={currentPage === 35}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    color: currentPage === 35 ? "#cbd5e1" : "#475569",
                    cursor: currentPage === 35 ? "not-allowed" : "pointer",
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
      {/* ORDER DETAILS MODAL                                       */}
      {/* ========================================================= */}
      {selectedOrderForModal && (
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
          onClick={() => setSelectedOrderForModal(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              maxWidth: "600px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              overflow: "hidden",
              animation: "fadeIn 0.2s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
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
                  Order #{selectedOrderForModal.orderId}
                </div>
                <div style={{ fontSize: "12px", color: "#CBD5E1", marginTop: "2px" }}>
                  Placed on {selectedOrderForModal.orderDate}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: "9999px",
                    fontSize: "12px",
                    fontWeight: 700,
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                  }}
                >
                  {selectedOrderForModal.status}
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedOrderForModal(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Product Info */}
              <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                  Items Ordered
                </div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginTop: "4px" }}>
                  {selectedOrderForModal.productName}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "13px", color: "#64748b" }}>
                  <span>Quantity: {selectedOrderForModal.quantity}</span>
                  <span style={{ fontWeight: 700, color: "#1e293b" }}>{selectedOrderForModal.amount}</span>
                </div>
              </div>

              {/* Customer & Shipping */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ padding: "12px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
                    <User size={14} color="#C2410C" />
                    <span>Customer Details</span>
                  </div>
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#1e293b", marginTop: "4px" }}>
                    {selectedOrderForModal.customer}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    {selectedOrderForModal.customerPhone}
                  </div>
                </div>

                <div style={{ padding: "12px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
                    <CreditCard size={14} color="#C2410C" />
                    <span>Payment Method</span>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", marginTop: "4px" }}>
                    {selectedOrderForModal.paymentMethod}
                  </div>
                  <div style={{ fontSize: "12px", color: "#10b981", fontWeight: 700, marginTop: "2px" }}>
                    Verified & Captured
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div style={{ padding: "12px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
                  <MapPin size={14} color="#C2410C" />
                  <span>Delivery Address</span>
                </div>
                <div style={{ fontSize: "13px", color: "#334155", marginTop: "4px", lineHeight: 1.4 }}>
                  {selectedOrderForModal.customerAddress}
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", marginTop: "6px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setToastMessage(`Invoice downloaded for ${selectedOrderForModal.orderId}`);
                    setSelectedOrderForModal(null);
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
                  <span>Download Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setToastMessage(`Status updated for order ${selectedOrderForModal.orderId}`);
                    setSelectedOrderForModal(null);
                  }}
                  style={{
                    height: "40px",
                    padding: "0 20px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #C2410C 0%, #9A3412 100%)",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(194, 65, 12, 0.35)",
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
