"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
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
  Plus,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Ban,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  RefreshCw,
  Warehouse,
  History,
  TrendingDown,
  Globe,
} from "lucide-react";
import ProductThumbnail from "@/components/catalog/ProductThumbnail";
import {
  InventoryItemListing,
  InventoryStats,
  InventoryStockStatus,
  InventoryMovementReasonType,
} from "@/types/inventory";
import { getInventoryListings, postUpdateInventoryStock, updateInventoryListing } from "@/services/inventoryService";


export default function InventoryPage() {
  // Inventory items & dynamic stats state (Initialized empty with loading true to prevent mock data flash)
  const [inventoryItems, setInventoryItems] = useState<InventoryItemListing[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalSKUs: 0,
    totalStock: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
  });

  // Search, filter & pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Layout & Navigation State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeRowMenu, setActiveRowMenu] = useState<string | null>(null);

  // Add Stock Modal State
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [selectedItemForStock, setSelectedItemForStock] = useState<string>("");
  const [stockActionType, setStockActionType] = useState<"add" | "set">("add");
  const [stockQuantityInput, setStockQuantityInput] = useState<string>("50");
  const [stockWarehouseInput, setStockWarehouseInput] = useState<string>(
    "BuildMart FC-Pune (MH-01)"
  );
  const [stockReasonInput, setStockReasonInput] = useState<InventoryMovementReasonType>("RESTOCK");
  const [stockReferenceNote, setStockReferenceNote] = useState<string>("");
  const [isSubmittingStock, setIsSubmittingStock] = useState(false);

  // API integration states (start loading to smoothly await real API)
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [isApiConnected, setIsApiConnected] = useState(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Fetch inventory listings from Backend API
  const loadInventoryData = async (search?: string, status?: string) => {
    setIsLoadingApi(true);
    try {
      const res = await getInventoryListings(search, status);
      if (res.items) {
        setInventoryItems(res.items);
        setStats(res.stats);
        setIsApiConnected(res.isFromApi);
        if (res.items.length > 0 && res.items[0]) {
          setSelectedItemForStock(res.items[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching inventory listings:", err);
    } finally {
      setIsLoadingApi(false);
    }
  };

  // Run on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingApi(true);

    getInventoryListings()
      .then((res) => {
        if (!isMounted) return;
        if (res.items) {
          setInventoryItems(res.items);
          setStats(res.stats);
          setIsApiConnected(res.isFromApi);
          if (res.items.length > 0 && res.items[0]) {
            setSelectedItemForStock(res.items[0].id);
          }
        }
      })
      .catch((err) => {
        console.error("Error fetching inventory listings:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingApi(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter inventory items based on search query, category, and status
  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        item.title.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === "All Categories" ||
        item.category.toLowerCase().includes(selectedCategory.toLowerCase());

      const matchesStatus =
        selectedStatus === "All Status" || item.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [inventoryItems, searchQuery, selectedCategory, selectedStatus]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;

  // Toggle selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItemIds(paginatedItems.map((p) => p.id));
    } else {
      setSelectedItemIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Quick Restock action (+10 units) via POST API
  const handleQuickRestock = async (id: string, qty: number = 10) => {
    const target = inventoryItems.find((i) => i.id === id);
    const currentStock = target ? target.availableStock : 0;

    try {
      const res = await postUpdateInventoryStock(
        id,
        qty,
        "add",
        currentStock,
        "RESTOCK",
        target?.warehouse
      );

      setInventoryItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              availableStock: res.newStock,
              status: res.newStatus,
              lastUpdated: "Just now",
            };
          }
          return item;
        })
      );

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalStock: prev.totalStock + qty,
        inStock: res.newStatus === "In Stock" && currentStock === 0 ? prev.inStock + 1 : prev.inStock,
        outOfStock: currentStock === 0 ? Math.max(0, prev.outOfStock - 1) : prev.outOfStock,
      }));

      setNotificationToast(
        res.isFromApi
          ? `✓ Live API: Restocked +${qty} units for SKU ${target?.sku || id}! (Database Total: ${res.newStock} units)`
          : `✓ Restocked +${qty} units for SKU ${target?.sku || id}! (Total: ${res.newStock} units)`
      );
      setTimeout(() => setNotificationToast(null), 4000);
    } catch (err) {
      console.error("Failed to restock:", err);
    }

    setActiveRowMenu(null);
  };

  // Mark as Out of Stock via PUT API
  const handleMarkOutOfStock = async (id: string) => {
    const target = inventoryItems.find((i) => i.id === id);
    const currentStock = target ? target.availableStock : 0;

    setInventoryItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            availableStock: 0,
            status: "Out of Stock",
            lastUpdated: "Just now",
          };
        }
        return item;
      })
    );

    setStats((prev) => ({
      ...prev,
      totalStock: Math.max(0, prev.totalStock - currentStock),
      outOfStock: prev.outOfStock + 1,
    }));
    setActiveRowMenu(null);

    try {
      const res = await updateInventoryListing(id, {
        status: "Out of Stock",
        availableStock: 0,
      });

      setNotificationToast(
        res.isFromApi
          ? `✓ Live PUT API: SKU ${target?.sku || id} updated to Out of Stock in database!`
          : `✓ SKU ${target?.sku || id} marked as Out of Stock.`
      );
      setTimeout(() => setNotificationToast(null), 4000);
    } catch (err) {
      console.error("Failed to mark out of stock via PUT:", err);
    }
  };

  // Toggle Listing Active / Inactive Status via Live PUT API
  const handleToggleListingStatus = async (id: string) => {
    const target = inventoryItems.find((i) => i.id === id);
    if (!target) return;
    const nextStatus: InventoryStockStatus = target.status === "In Stock" ? "Out of Stock" : "In Stock";
    const nextStock = nextStatus === "Out of Stock" ? 0 : (target.availableStock > 0 ? target.availableStock : 50);

    setInventoryItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: nextStatus, availableStock: nextStock, lastUpdated: "Just now" } : item))
    );
    setActiveRowMenu(null);

    try {
      const res = await updateInventoryListing(id, {
        status: nextStatus,
        availableStock: nextStock,
      });

      setNotificationToast(
        res.isFromApi
          ? `✓ Live PUT API: Listing ${target.sku} updated to ${nextStatus} in database!`
          : `✓ Listing ${target.sku} status updated to ${nextStatus}!`
      );
      setTimeout(() => setNotificationToast(null), 4000);
    } catch (err) {
      console.error("Failed to toggle listing status via PUT:", err);
    }
  };

  // Open modal pre-configured for a specific item
  const handleOpenAdjustModalForItem = (id: string) => {
    setSelectedItemForStock(id);
    const target = inventoryItems.find((i) => i.id === id);
    if (target) {
      setStockQuantityInput("25");
      setStockWarehouseInput(target.warehouse);
    }
    setIsAddStockModalOpen(true);
    setActiveRowMenu(null);
  };

  // Add / Adjust Stock Submit Handler (Calls POST API)
  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(stockQuantityInput, 10);
    if (isNaN(qty) || qty < 0) return;

    setIsSubmittingStock(true);
    try {
      const currentItem = inventoryItems.find((i) => i.id === selectedItemForStock);
      const currentStock = currentItem ? currentItem.availableStock : 0;

      const res = await postUpdateInventoryStock(
        selectedItemForStock,
        qty,
        stockActionType,
        currentStock,
        stockReasonInput,
        stockWarehouseInput
      );

      setInventoryItems((prev) =>
        prev.map((item) => {
          if (item.id === selectedItemForStock) {
            return {
              ...item,
              availableStock: res.newStock,
              warehouse: stockWarehouseInput,
              status: res.newStatus,
              lastUpdated: "Just now",
            };
          }
          return item;
        })
      );

      // Dynamically adjust total stats
      const diff = res.newStock - currentStock;
      setStats((prev) => ({
        ...prev,
        totalStock: Math.max(0, prev.totalStock + diff),
        inStock: res.newStatus === "In Stock" && currentStock === 0 ? prev.inStock + 1 : prev.inStock,
        outOfStock:
          res.newStatus === "Out of Stock"
            ? prev.outOfStock + 1
            : currentStock === 0
            ? Math.max(0, prev.outOfStock - 1)
            : prev.outOfStock,
      }));

      setNotificationToast(
        res.isFromApi
          ? `✓ Live API: ${res.message || `Stock updated to ${res.newStock} units in DRF database.`}`
          : `✓ Stock successfully updated to ${res.newStock} units for ${currentItem?.title || 'product'}!`
      );
      setTimeout(() => setNotificationToast(null), 4500);

      setIsAddStockModalOpen(false);
      setStockReferenceNote("");
    } catch (err) {
      console.error("Failed to update stock:", err);
    } finally {
      setIsSubmittingStock(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
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
        {/* Left: Brand Logo + Seller Badge + Verified Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
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
          </div>

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

        {/* Right Header Controls: Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

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
            overflow: "hidden",
            opacity: isSidebarOpen ? 1 : 0,
          }}
        >
          {/* Menu Items */}
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

          {/* Bulk orders */}
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

          {/* Catalog Link (Non-active on this page) */}
          <Link
            href="/catalog"
            title="Catalog"
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
            <BookOpen size={18} />
            <span>Catalog</span>
          </Link>

          {/* ACTIVE INVENTORY TAB (User Explicit: Direct item, NO submodule dropdowns!) */}
          <button
            type="button"
            title="Inventory"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 12px",
              borderRadius: "8px",
              color: "#ffffff",
              background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
              border: "none",
              fontSize: "13.5px",
              fontWeight: 700,
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              boxShadow: "0 4px 14px rgba(109, 40, 217, 0.4)",
            }}
          >
            <Boxes size={18} color="#ffffff" />
            <span>Inventory</span>
          </button>

          {/* Other Navigation Links */}
          {[
            { label: "Pricing", icon: Tag, hasChevron: true },
            { label: "Returns", icon: RotateCcw, badge: "8" },
            { label: "Payments", icon: CreditCard, hasChevron: true },
            { label: "Payouts", icon: Wallet, hasChevron: true },
            { label: "Reports", icon: BarChart3, hasChevron: true },
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
                  <Icon size={17} />
                  <span>{item.label}</span>
                </div>
                {item.hasChevron && <ChevronDown size={14} color="#a855f7" />}
                {item.badge && (
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
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div style={{ fontSize: "11px", color: "#c084fc", marginTop: "auto", paddingLeft: "4px" }}>
            © 2025 BuildMart<br />All rights reserved.
          </div>
        </aside>

        {/* ======================================================= */}
        {/* MAIN INVENTORY WORKSPACE                                */}
        {/* ======================================================= */}
        <main
          style={{
            flex: 1,
            padding: "28px 36px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Top Title & Primary Buttons Row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h1
                  style={{
                    fontSize: "30px",
                    fontWeight: 800,
                    color: "#3b0764",
                    letterSpacing: "-0.5px",
                    margin: 0,
                    lineHeight: 1.2,
                    fontFamily: "var(--font-heading), sans-serif",
                  }}
                >
                  Inventory
                </h1>
              </div>
              <p style={{ fontSize: "14px", color: "#64748b", marginTop: "4px", margin: 0 }}>
                Track and manage your stock across all products.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* + Add Stock Button (User specified: opens stock adjustment/addition) */}
              <button
                type="button"
                onClick={() => setIsAddStockModalOpen(true)}
                style={{
                  height: "40px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "0 20px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(124, 58, 237, 0.35)",
                  transition: "all 0.15s ease",
                }}
              >
                <Plus size={16} />
                <span>Add Stock</span>
              </button>

              {/* Refresh Live Inventory Data Button */}
              <button
                type="button"
                onClick={async () => {
                  await loadInventoryData(searchQuery, selectedStatus);
                  setNotificationToast("Inventory data refreshed from live server.");
                  setTimeout(() => setNotificationToast(null), 3000);
                }}
                title="Refresh inventory from live database"
                style={{
                  height: "40px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "0 16px",
                  borderRadius: "8px",
                  background: "#ffffff",
                  border: "1.5px solid rgba(124, 58, 237, 0.25)",
                  color: "#6d28d9",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: "0 1px 4px rgba(124, 58, 237, 0.08)",
                }}
              >
                <RefreshCw size={14} color="#7c3aed" className={isLoadingApi ? "animate-spin" : ""} />
                <span>Refresh Data</span>
              </button>

              {/* Export Button */}
              <button
                type="button"
                onClick={() => alert(`Exporting ${filteredItems.length} inventory stock records as CSV.`)}
                style={{
                  height: "40px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "0 18px",
                  borderRadius: "8px",
                  background: "#ffffff",
                  border: "1.5px solid rgba(124, 58, 237, 0.25)",
                  color: "#4c1d95",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: "0 1px 3px rgba(124, 58, 237, 0.05)",
                }}
              >
                <Download size={15} color="#7c3aed" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Success Notification Banner */}
          {notificationToast && (
            <div
              style={{
                background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
                border: "1.5px solid rgba(16, 185, 129, 0.35)",
                borderRadius: "10px",
                padding: "12px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "#065f46",
                fontSize: "13.5px",
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.08)",
                animation: "fadeIn 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Check size={18} color="#10b981" />
                <span>{notificationToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotificationToast(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#065f46" }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* ======================================================= */}
          {/* 5 KPI METRIC CARDS GRID (Matches user screenshot)       */}
          {/* ======================================================= */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "18px",
            }}
          >
            {/* Card 1: Total SKUs */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(124, 58, 237, 0.15)",
                borderRadius: "14px",
                padding: "18px 20px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(124, 58, 237, 0.04)",
              }}
            >
              <div>
                <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Total SKUs</span>
                <div style={{ fontSize: "32px", fontWeight: 800, color: "#4c1d95", marginTop: "6px", lineHeight: 1 }}>
                  {isLoadingApi ? <span style={{ opacity: 0.35 }}>—</span> : stats.totalSKUs}
                </div>
              </div>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "rgba(124, 58, 237, 0.1)",
                  color: "#7c3aed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BookOpen size={20} />
              </div>
            </div>

            {/* Card 2: Total Stock */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(16, 185, 129, 0.15)",
                borderRadius: "14px",
                padding: "18px 20px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.04)",
              }}
            >
              <div>
                <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Total Stock</span>
                <div style={{ fontSize: "32px", fontWeight: 800, color: "#1e1b4b", marginTop: "6px", lineHeight: 1 }}>
                  {isLoadingApi ? <span style={{ opacity: 0.35 }}>—</span> : stats.totalStock.toLocaleString()}
                </div>
              </div>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.1)",
                  color: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Package size={20} />
              </div>
            </div>

            {/* Card 3: In Stock */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(16, 185, 129, 0.15)",
                borderRadius: "14px",
                padding: "18px 20px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.04)",
              }}
            >
              <div>
                <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>In Stock</span>
                <div style={{ fontSize: "32px", fontWeight: 800, color: "#10b981", marginTop: "6px", lineHeight: 1 }}>
                  {isLoadingApi ? <span style={{ opacity: 0.35 }}>—</span> : stats.inStock.toLocaleString()}
                </div>
              </div>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.1)",
                  color: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCircle2 size={20} />
              </div>
            </div>

            {/* Card 4: Low Stock */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(245, 158, 11, 0.2)",
                borderRadius: "14px",
                padding: "18px 20px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(245, 158, 11, 0.04)",
              }}
            >
              <div>
                <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Low Stock</span>
                <div style={{ fontSize: "32px", fontWeight: 800, color: "#f59e0b", marginTop: "6px", lineHeight: 1 }}>
                  {isLoadingApi ? <span style={{ opacity: 0.35 }}>—</span> : stats.lowStock}
                </div>
              </div>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "rgba(245, 158, 11, 0.12)",
                  color: "#f59e0b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertTriangle size={20} />
              </div>
            </div>

            {/* Card 5: Out of Stock */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(239, 68, 68, 0.15)",
                borderRadius: "14px",
                padding: "18px 20px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(239, 68, 68, 0.04)",
              }}
            >
              <div>
                <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Out of Stock</span>
                <div style={{ fontSize: "32px", fontWeight: 800, color: "#ef4444", marginTop: "6px", lineHeight: 1 }}>
                  {isLoadingApi ? <span style={{ opacity: 0.35 }}>—</span> : stats.outOfStock}
                </div>
              </div>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ban size={20} />
              </div>
            </div>
          </div>

          {/* ======================================================= */}
          {/* SEARCH & FILTERS BAR                                    */}
          {/* ======================================================= */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              marginTop: "4px",
            }}
          >
            {/* Search Input Box */}
            <div
              style={{
                flex: 1,
                position: "relative",
                display: "flex",
                alignItems: "center",
                background: "#ffffff",
                border: "1.5px solid rgba(124, 58, 237, 0.22)",
                borderRadius: "8px",
                padding: "0 14px",
                height: "40px",
                boxShadow: "0 1px 3px rgba(124, 58, 237, 0.04)",
              }}
            >
              <Search size={16} color="#7c3aed" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by Product, SKU, Brand..."
                style={{
                  flex: 1,
                  height: "100%",
                  border: "none",
                  outline: "none",
                  paddingLeft: "10px",
                  fontSize: "13px",
                  color: "#1e1b4b",
                  background: "transparent",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8" }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Dropdown 1: Categories */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                height: "40px",
                background: "#ffffff",
                border: "1.5px solid rgba(124, 58, 237, 0.22)",
                borderRadius: "8px",
                padding: "0 14px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#4c1d95",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="All Categories">All Categories</option>
              <option value="Power Tools">Power Tools</option>
              <option value="Hand Tools">Hand Tools</option>
              <option value="Building Materials">Building Materials</option>
              <option value="Cement">Cement</option>
              <option value="Steel">Steel</option>
              <option value="Paints & Accessories">Paints & Accessories</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Electricals">Electricals</option>
            </select>

            {/* Dropdown 2: Status */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                height: "40px",
                background: "#ffffff",
                border: "1.5px solid rgba(124, 58, 237, 0.22)",
                borderRadius: "8px",
                padding: "0 14px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#4c1d95",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="All Status">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>

            {/* Filters Button */}
            <button
              type="button"
              style={{
                height: "40px",
                background: "#ffffff",
                border: "1.5px solid rgba(124, 58, 237, 0.25)",
                borderRadius: "8px",
                padding: "0 16px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#4c1d95",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(124, 58, 237, 0.05)",
              }}
            >
              <Filter size={15} color="#7c3aed" />
              <span>Filters</span>
              <ChevronDown size={14} color="#7c3aed" />
            </button>
          </div>

          {/* ======================================================= */}
          {/* INVENTORY TABLE                                         */}
          {/* ======================================================= */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #ede9fe", background: "#fbfaff" }}>
                  <th style={{ padding: "14px 18px", width: "40px" }}>
                    <input
                      type="checkbox"
                      checked={selectedItemIds.length === paginatedItems.length && paginatedItems.length > 0}
                      onChange={handleSelectAll}
                      style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "#7c3aed" }}
                    />
                  </th>
                  <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "capitalize" }}>
                    Product
                  </th>
                  <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
                    SKU
                  </th>
                  <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
                    Available Stock
                  </th>
                  <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
                    Reserved
                  </th>
                  <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
                    Status
                  </th>
                  <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
                    Last Updated
                  </th>
                  <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: 700, color: "#64748b", textAlign: "center" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoadingApi ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={`inv-skeleton-${idx}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "16px 18px" }}>
                        <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: "#f1f5f9" }} />
                      </td>
                      <td style={{ padding: "16px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <div style={{ width: "42px", height: "42px", borderRadius: "8px", background: "#f1f5f9", flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ width: "60%", height: "14px", borderRadius: "4px", background: "#f1f5f9", marginBottom: "6px" }} />
                            <div style={{ width: "30%", height: "11px", borderRadius: "4px", background: "#f8fafc" }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px 18px" }}><div style={{ width: "80px", height: "13px", borderRadius: "4px", background: "#f1f5f9" }} /></td>
                      <td style={{ padding: "16px 18px" }}><div style={{ width: "90px", height: "13px", borderRadius: "4px", background: "#f1f5f9" }} /></td>
                      <td style={{ padding: "16px 18px" }}><div style={{ width: "55px", height: "14px", borderRadius: "4px", background: "#f1f5f9" }} /></td>
                      <td style={{ padding: "16px 18px" }}><div style={{ width: "70px", height: "20px", borderRadius: "9999px", background: "#f1f5f9" }} /></td>
                      <td style={{ padding: "16px 18px" }}><div style={{ width: "80px", height: "13px", borderRadius: "4px", background: "#f1f5f9" }} /></td>
                      <td style={{ padding: "16px 18px" }}><div style={{ width: "24px", height: "24px", borderRadius: "4px", background: "#f1f5f9" }} /></td>
                    </tr>
                  ))
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "48px 24px", textAlign: "center", color: "#64748b" }}>
                      No inventory items found matching your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => {
                    const isSelected = selectedItemIds.includes(item.id);
                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          background: isSelected ? "rgba(124, 58, 237, 0.05)" : "#ffffff",
                          transition: "background-color 0.15s ease",
                        }}
                      >
                        {/* Checkbox */}
                        <td style={{ padding: "14px 18px" }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(item.id)}
                            style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "#7c3aed" }}
                          />
                        </td>

                        {/* Product Title, Brand & Thumbnail */}
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                            <ProductThumbnail type={item.iconType} name={item.title} />
                            <div>
                              <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#1e1b4b", lineHeight: 1.3 }}>
                                {item.title}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
                                <span style={{ fontSize: "12px", color: "#64748b" }}>
                                  {item.brand}
                                </span>
                                <span style={{ fontSize: "11px", color: "#94a3b8" }}>•</span>
                                <span style={{ fontSize: "11px", color: "#64748b" }}>
                                  {item.warehouse}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td style={{ padding: "14px 18px" }}>
                          <span
                            style={{
                              fontFamily: "var(--font-mono), monospace",
                              fontSize: "12.5px",
                              color: "#334155",
                              fontWeight: 600,
                              background: "#f1f5f9",
                              padding: "3px 8px",
                              borderRadius: "6px",
                            }}
                          >
                            {item.sku}
                          </span>
                        </td>

                        {/* Available Stock */}
                        <td style={{ padding: "14px 18px" }}>
                          <span
                            style={{
                              fontSize: "14.5px",
                              fontWeight: 800,
                              color:
                                item.availableStock === 0
                                  ? "#dc2626"
                                  : item.availableStock <= item.safetyStock
                                  ? "#d97706"
                                  : "#059669",
                            }}
                          >
                            {item.availableStock.toLocaleString()}
                          </span>
                        </td>

                        {/* Reserved Stock */}
                        <td style={{ padding: "14px 18px" }}>
                          <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#64748b" }}>
                            {item.reservedStock}
                          </span>
                        </td>

                        {/* Stock Status Badge */}
                        <td style={{ padding: "14px 18px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              fontSize: "12px",
                              fontWeight: 700,
                              padding: "3px 10px",
                              borderRadius: "9999px",
                              background:
                                item.status === "In Stock"
                                  ? "#ecfdf5"
                                  : item.status === "Low Stock"
                                  ? "#fffbeb"
                                  : "#fef2f2",
                              color:
                                item.status === "In Stock"
                                  ? "#059669"
                                  : item.status === "Low Stock"
                                  ? "#d97706"
                                  : "#dc2626",
                              border:
                                item.status === "In Stock"
                                  ? "1px solid rgba(16, 185, 129, 0.3)"
                                  : item.status === "Low Stock"
                                  ? "1px solid rgba(245, 158, 11, 0.3)"
                                  : "1px solid rgba(239, 68, 68, 0.3)",
                            }}
                          >
                            {item.status}
                          </span>
                        </td>

                        {/* Last Updated */}
                        <td style={{ padding: "14px 18px", fontSize: "12.5px", color: "#64748b", whiteSpace: "nowrap" }}>
                          {item.lastUpdated}
                        </td>

                        {/* Actions (Menu Popover) */}
                        <td style={{ padding: "14px 18px", textAlign: "center", position: "relative" }}>
                          <button
                            type="button"
                            title="Actions"
                            onClick={() =>
                              setActiveRowMenu((prev) => (prev === item.id ? null : item.id))
                            }
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#64748b",
                              cursor: "pointer",
                              padding: "6px",
                              borderRadius: "6px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {/* Row Actions Popover Menu */}
                          {activeRowMenu === item.id && (
                            <div
                              style={{
                                position: "absolute",
                                right: "20px",
                                top: "45px",
                                background: "#ffffff",
                                border: "1px solid rgba(124, 58, 237, 0.2)",
                                borderRadius: "10px",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                                width: "210px",
                                zIndex: 30,
                                overflow: "hidden",
                                display: "flex",
                                flexDirection: "column",
                                padding: "4px 0",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => handleQuickRestock(item.id, 10)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  padding: "9px 14px",
                                  fontSize: "12.5px",
                                  color: "#059669",
                                  fontWeight: 600,
                                  background: "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                  textAlign: "left",
                                }}
                              >
                                <Plus size={14} color="#059669" />
                                <span>Quick Restock (+10)</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenAdjustModalForItem(item.id)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  padding: "9px 14px",
                                  fontSize: "12.5px",
                                  color: "#4c1d95",
                                  fontWeight: 600,
                                  background: "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                  textAlign: "left",
                                }}
                              >
                                <Warehouse size={14} color="#7c3aed" />
                                <span>Adjust Stock Levels</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleListingStatus(item.id)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  padding: "9px 14px",
                                  fontSize: "12.5px",
                                  color: "#7c3aed",
                                  fontWeight: 600,
                                  background: "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                  textAlign: "left",
                                }}
                              >
                                <RefreshCw size={14} color="#7c3aed" />
                                <span>{item.status === "In Stock" ? "Pause Listing (PUT)" : "Activate Listing (PUT)"}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleMarkOutOfStock(item.id)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  padding: "9px 14px",
                                  fontSize: "12.5px",
                                  color: "#dc2626",
                                  fontWeight: 600,
                                  background: "transparent",
                                  border: "none",
                                  cursor: "pointer",
                                  textAlign: "left",
                                }}
                              >
                                <Ban size={14} color="#dc2626" />
                                <span>Mark Out of Stock (PUT)</span>
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

            {/* Pagination Row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderTop: "1px solid #f1f5f9",
                background: "#fafafa",
              }}
            >
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                Showing{" "}
                <strong style={{ color: "#1e1b4b" }}>
                  {filteredItems.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                </strong>{" "}
                to{" "}
                <strong style={{ color: "#1e1b4b" }}>
                  {Math.min(currentPage * itemsPerPage, filteredItems.length)}
                </strong>{" "}
                of <strong style={{ color: "#1e1b4b" }}>{stats.totalSKUs}</strong> products
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {/* Prev Button */}
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    border: "1.5px solid rgba(124, 58, 237, 0.22)",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: currentPage === 1 ? "#cbd5e1" : "#4c1d95",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    boxShadow: "0 1px 2px rgba(124, 58, 237, 0.05)",
                  }}
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Dynamic Page Numbers based on totalPages */}
                {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                  .filter((page) => {
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    return Math.abs(page - currentPage) <= 1;
                  })
                  .reduce<(number | string)[]>((acc, page, idx, arr) => {
                    if (idx > 0 && typeof arr[idx - 1] === "number" && (page as number) - (arr[idx - 1] as number) > 1) {
                      acc.push("...");
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item, idx) => {
                    if (typeof item === "string") {
                      return (
                        <span key={`inv-ellipsis-${idx}`} style={{ padding: "0 4px", color: "#94a3b8" }}>
                          ...
                        </span>
                      );
                    }
                    const num = item as number;
                    const isActive = currentPage === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setCurrentPage(num)}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          border: "none",
                          background: isActive
                            ? "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)"
                            : "transparent",
                          color: isActive ? "#ffffff" : "#64748b",
                          fontWeight: isActive ? 700 : 500,
                          fontSize: "13px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: isActive ? "0 2px 8px rgba(124, 58, 237, 0.35)" : "none",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {num}
                      </button>
                    );
                  })}

                {/* Next Button */}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    border: "1.5px solid rgba(124, 58, 237, 0.22)",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: currentPage === totalPages ? "#cbd5e1" : "#4c1d95",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    boxShadow: "0 1px 2px rgba(124, 58, 237, 0.05)",
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
      {/* ADD / ADJUST STOCK MODAL (BuildMart Royal Purple Theme)   */}
      {/* ========================================================= */}
      {isAddStockModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(30, 27, 75, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "560px",
              boxShadow: "0 20px 40px rgba(59, 7, 100, 0.25)",
              border: "1px solid rgba(124, 58, 237, 0.2)",
              overflow: "hidden",
              animation: "fadeIn 0.2s ease",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                borderBottom: "1px solid #f1f5f9",
                background: "linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)",
              }}
            >
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#3b0764", margin: 0 }}>
                  Add / Adjust Inventory Stock
                </h2>
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0, marginTop: "2px" }}>
                  Record incoming restock or adjust physical warehouse quantities.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStockModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveStock} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Product Select */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1e1b4b", marginBottom: "6px" }}>
                  Select Product / SKU *
                </label>
                <select
                  value={selectedItemForStock}
                  onChange={(e) => setSelectedItemForStock(e.target.value)}
                  style={{
                    width: "100%",
                    height: "42px",
                    borderRadius: "8px",
                    border: "1.5px solid rgba(124, 58, 237, 0.25)",
                    padding: "0 12px",
                    fontSize: "13.5px",
                    color: "#1e1b4b",
                    outline: "none",
                    background: "#ffffff",
                  }}
                >
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} ({item.sku}) - Current: {item.availableStock}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Type Toggle */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setStockActionType("add")}
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: stockActionType === "add" ? "2px solid #7c3aed" : "1.5px solid #e2e8f0",
                    background: stockActionType === "add" ? "#f5f3ff" : "#ffffff",
                    color: stockActionType === "add" ? "#6d28d9" : "#64748b",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Plus size={16} />
                  <span>Add Stock (Restock)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStockActionType("set")}
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: stockActionType === "set" ? "2px solid #7c3aed" : "1.5px solid #e2e8f0",
                    background: stockActionType === "set" ? "#f5f3ff" : "#ffffff",
                    color: stockActionType === "set" ? "#6d28d9" : "#64748b",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Warehouse size={16} />
                  <span>Set Exact Quantity</span>
                </button>
              </div>

              {/* Quantity & Warehouse in 2 columns */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1e1b4b", marginBottom: "6px" }}>
                    Quantity Units *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockQuantityInput}
                    onChange={(e) => setStockQuantityInput(e.target.value)}
                    placeholder="e.g. 50"
                    required
                    style={{
                      width: "100%",
                      height: "42px",
                      borderRadius: "8px",
                      border: "1.5px solid rgba(124, 58, 237, 0.25)",
                      padding: "0 12px",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#1e1b4b",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1e1b4b", marginBottom: "6px" }}>
                    Fulfillment Warehouse
                  </label>
                  <select
                    value={stockWarehouseInput}
                    onChange={(e) => setStockWarehouseInput(e.target.value)}
                    style={{
                      width: "100%",
                      height: "42px",
                      borderRadius: "8px",
                      border: "1.5px solid rgba(124, 58, 237, 0.25)",
                      padding: "0 12px",
                      fontSize: "13.5px",
                      color: "#1e1b4b",
                      outline: "none",
                      background: "#ffffff",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="BuildMart FC-Pune (MH-01)">BuildMart FC-Pune (MH-01)</option>
                    <option value="BuildMart FC-Bhiwandi (MH-02)">BuildMart FC-Bhiwandi (MH-02)</option>
                    <option value="Merchant Hub Delhi-North">Merchant Hub Delhi-North</option>
                  </select>
                </div>
              </div>

              {/* Movement Reason (Django Enum: InventoryMovementReason) */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1e1b4b", marginBottom: "6px" }}>
                  Movement Reason *
                </label>
                <select
                  value={stockReasonInput}
                  onChange={(e) => setStockReasonInput(e.target.value as InventoryMovementReasonType)}
                  style={{
                    width: "100%",
                    height: "42px",
                    borderRadius: "8px",
                    border: "1.5px solid rgba(124, 58, 237, 0.25)",
                    padding: "0 12px",
                    fontSize: "13.5px",
                    color: "#1e1b4b",
                    outline: "none",
                    background: "#ffffff",
                  }}
                >
                  <option value="RESTOCK">Supplier Restock Inbound</option>
                  <option value="CUSTOMER_RETURN_RESTOCKED">Customer Return Restocked</option>
                  <option value="CYCLE_COUNT_ADJUSTMENT">Physical Cycle Count Audit</option>
                  <option value="DAMAGED_IN_WAREHOUSE">Damaged / Shrinkage Adjustment</option>
                  <option value="STOCK_TRANSFER">Inter-Warehouse Stock Transfer</option>
                </select>
              </div>

              {/* Reference Note */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1e1b4b", marginBottom: "6px" }}>
                  Reference Note / PO Number
                </label>
                <input
                  type="text"
                  value={stockReferenceNote}
                  onChange={(e) => setStockReferenceNote(e.target.value)}
                  placeholder="e.g. PO-8921 Restock Pallet #3"
                  style={{
                    width: "100%",
                    height: "42px",
                    borderRadius: "8px",
                    border: "1.5px solid rgba(124, 58, 237, 0.25)",
                    padding: "0 12px",
                    fontSize: "13.5px",
                    color: "#1e1b4b",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Modal Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddStockModalOpen(false)}
                  style={{
                    height: "40px",
                    padding: "0 20px",
                    borderRadius: "8px",
                    border: "1.5px solid rgba(124, 58, 237, 0.25)",
                    background: "#ffffff",
                    color: "#4c1d95",
                    fontWeight: 600,
                    fontSize: "13.5px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStock}
                  style={{
                    height: "40px",
                    padding: "0 22px",
                    borderRadius: "8px",
                    border: "none",
                    background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "13.5px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 14px rgba(124, 58, 237, 0.35)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {isSubmittingStock ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                  <span>Save & Update Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
