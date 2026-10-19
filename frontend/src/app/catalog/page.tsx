"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  ChevronUp,
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
  UploadCloud,
  Download,
  Filter,
  ShoppingBag,
  Ban,
  AlertTriangle,
  EyeOff,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  ExternalLink,
  Edit,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Globe,
} from "lucide-react";
import ProductThumbnail from "@/components/catalog/ProductThumbnail";
import { INITIAL_PRODUCTS, INITIAL_CATALOG_STATS } from "@/data/catalogData";
import { CatalogProductListing, CatalogStats, StockStatusType, ListingStatusType } from "@/types/catalog";
import { getCatalogProducts, createCatalogProduct, updateCatalogProduct } from "@/services/catalogService";
import Select from "@/components/ui/Select";

export default function CatalogPage() {
  // Products and Stats State (Initialized empty with loading true to prevent mock data flash)
  const [products, setProducts] = useState<CatalogProductListing[]>([]);
  const [stats, setStats] = useState<CatalogStats>({
    totalProducts: 0,
    activeProducts: 0,
    outOfStock: 0,
    lowStock: 0,
    inactiveProducts: 0,
  });

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedFulfillment, setSelectedFulfillment] = useState("All Channels");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals & Popovers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeRowActionMenu, setActiveRowActionMenu] = useState<string | null>(null);

  // New Product Form State (matching Django catalog & listing schema)
  const [newTitle, setNewTitle] = useState("");
  const [newBrand, setNewBrand] = useState("UltraTech");
  const [newSku, setNewSku] = useState("");
  const [newAsin, setNewAsin] = useState("");
  const [newCategory, setNewCategory] = useState("Building Materials > Cement");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newCondition, setNewCondition] = useState("NEW");
  const [newFulfillment, setNewFulfillment] = useState<"FBA" | "FBM">("FBA");
  const [newB2bTier, setNewB2bTier] = useState("");
  const [newModelNumber, setNewModelNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Product Modal State (PUT API)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editStatus, setEditStatus] = useState<ListingStatusType>("Active");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // API integration states (start loading to smoothly await real API)
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [isApiConnected, setIsApiConnected] = useState(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Fetch catalog products from API on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingApi(true);

    getCatalogProducts()
      .then((res) => {
        if (!isMounted) return;
        if (res.products && res.products.length > 0) {
          setProducts(res.products);
          setIsApiConnected(res.isFromApi);

          // Dynamically compute stats from fetched data
          const total = res.products.length;
          const active = res.products.filter((p) => p.status === "Active").length;
          const outOfStock = res.products.filter((p) => p.stockStatus === "out_of_stock").length;
          const lowStock = res.products.filter((p) => p.stockStatus === "low_stock").length;
          const inactive = res.products.filter((p) => p.status === "Inactive").length;

          setStats({
            totalProducts: total,
            activeProducts: active,
            outOfStock,
            lowStock,
            inactiveProducts: inactive,
          });
        }
      })
      .catch((err) => {
        console.error("Error fetching catalog products:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingApi(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter products based on search, category, status, and fulfillment channel
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        item.title.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.asin.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.categoryPath.toLowerCase().includes(q) ||
        (item.modelNumber && item.modelNumber.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === "All Categories" ||
        item.categoryPath.toLowerCase().includes(selectedCategory.toLowerCase());

      const matchesStatus =
        selectedStatus === "All Status" ||
        (selectedStatus === "Active" && item.status === "Active") ||
        (selectedStatus === "Inactive" && item.status === "Inactive") ||
        (selectedStatus === "Out of Stock" && item.stockStatus === "out_of_stock") ||
        (selectedStatus === "Low Stock" && item.stockStatus === "low_stock");

      const matchesFulfillment =
        selectedFulfillment === "All Channels" ||
        item.fulfillmentChannel === selectedFulfillment;

      return matchesSearch && matchesCategory && matchesStatus && matchesFulfillment;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus, selectedFulfillment]);

  // Paginated Products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  // Toggle selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProductIds(paginatedProducts.map((p) => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Add product handler (Calls POST API via createCatalogProduct)
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSku.trim() || !newPrice.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await createCatalogProduct({
        title: newTitle.trim(),
        brand: newBrand,
        sku: newSku.trim().toUpperCase(),
        category: newCategory,
        price: parseFloat(newPrice) || 0,
        stock: parseInt(newStock) || 0,
        condition: newCondition,
        fulfillmentChannel: newFulfillment,
        b2bTier: newB2bTier.trim() || undefined,
        modelNumber: newModelNumber.trim() || undefined,
      });

      const created = res.product;
      setProducts((prev) => [created, ...prev]);
      setStats((prev) => ({
        ...prev,
        totalProducts: prev.totalProducts + 1,
        activeProducts: prev.activeProducts + 1,
      }));

      // Show notification toast
      setNotificationToast(
        `Product "${created.title}" successfully added (ASIN: ${created.asin})!`
      );
      setTimeout(() => setNotificationToast(null), 4500);

      // Reset form
      setNewTitle("");
      setNewSku("");
      setNewAsin("");
      setNewPrice("");
      setNewStock("");
      setNewB2bTier("");
      setNewModelNumber("");
      setIsAddModalOpen(false);
    } catch (err) {
      console.error("Failed to add product:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Row Action Handlers (Live PUT API calls)
  const handleToggleProductStatus = async (id: string) => {
    const target = products.find((item) => item.id === id);
    if (!target) return;
    const nextStatus: ListingStatusType = target.status === "Active" ? "Inactive" : "Active";

    // Immediate UI update
    setProducts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: nextStatus, lastUpdated: "Just now" } : item))
    );
    setActiveRowActionMenu(null);

    // Live PUT request to Django Backend API
    try {
      const res = await updateCatalogProduct(id, { status: nextStatus });
      setNotificationToast(
        res.isFromApi
          ? `✓ Live PUT API: Status of "${target.title}" changed to ${nextStatus} in database!`
          : `✓ Status of "${target.title}" changed to ${nextStatus}!`
      );
      setTimeout(() => setNotificationToast(null), 4000);
    } catch (err) {
      console.error("Failed to toggle product status via PUT:", err);
    }
  };

  const handleOpenEditModal = (item: CatalogProductListing) => {
    setEditingProductId(item.id);
    setEditTitle(item.title);
    setEditPrice(item.price.toString());
    setEditStock(item.stock.toString());
    setEditStatus(item.status);
    setIsEditModalOpen(true);
    setActiveRowActionMenu(null);
  };

  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductId) return;
    setIsSubmittingEdit(true);

    const updatedPrice = parseFloat(editPrice) || 0;
    const updatedStock = parseInt(editStock) || 0;

    try {
      const res = await updateCatalogProduct(editingProductId, {
        title: editTitle.trim(),
        price: updatedPrice,
        stock: updatedStock,
        status: editStatus,
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProductId
            ? {
                ...p,
                title: editTitle.trim(),
                price: updatedPrice,
                stock: updatedStock,
                status: editStatus,
                stockStatus: updatedStock === 0 ? "out_of_stock" : updatedStock <= 10 ? "low_stock" : "in_stock",
                lastUpdated: "Just now",
              }
            : p
        )
      );

      setNotificationToast(
        res.isFromApi
          ? `✓ Live PUT API: Product "${editTitle}" successfully updated in database!`
          : `✓ Product "${editTitle}" updated successfully!`
      );
      setTimeout(() => setNotificationToast(null), 4000);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Failed to update product via PUT:", err);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
    setActiveRowActionMenu(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#F8FAFC", fontFamily: "var(--font-sans), sans-serif" }}>
      {/* ========================================================= */}
      {/* TOP HEADER NAVIGATION BAR (Unified Makaano Navy)      */}
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
          </div>

          {/* Divider */}
          <div style={{ width: "1px", height: "24px", background: "rgba(255, 255, 255, 0.15)" }} />

          {/* Fully Functional Hamburger Toggle Button */}
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
            transition: "width 0.25s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.25s cubic-bezier(0.16, 1, 0.3, 1), max-width 0.25s cubic-bezier(0.16, 1, 0.3, 1), padding 0.25s ease, opacity 0.2s ease",
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

          {/* ACTIVE CATALOG MENU ITEM (Brand Signature Active) */}
          <button
            type="button"
            title="Catalog"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 12px",
              borderRadius: "8px",
              color: "#ffffff",
              background: "linear-gradient(135deg, #C2410C 0%, #9A3412 100%)",
              border: "none",
              fontSize: "13.5px",
              fontWeight: 700,
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              boxShadow: "0 4px 14px rgba(154, 52, 18, 0.4)",
            }}
          >
            <BookOpen size={18} color="#ffffff" />
            <span>Catalog</span>
          </button>

          {/* Other Navigation Links */}
          {[
            { label: "Inventory", icon: Boxes, href: "/inventory" },
            { label: "Pricing", icon: Tag, hasChevron: true },
            { label: "Returns", icon: RotateCcw, href: "/returns" },
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
            const content = (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Icon size={17} />
                  <span>{item.label}</span>
                </div>
                {item.hasChevron && <ChevronDown size={14} color="#F97316" />}
              </>
            );

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
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  {content}
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
                {content}
              </button>
            );
          })}

          <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "auto", paddingLeft: "4px" }}>
            © 2025 Makaano<br />All rights reserved.
          </div>
        </aside>

        {/* ======================================================= */}
        {/* MAIN CATALOG WORKSPACE                                 */}
        {/* ======================================================= */}
        <main style={{ flex: 1, padding: "28px 36px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Top Title & Primary Buttons Row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h1
                  style={{
                    fontSize: "30px",
                    fontWeight: 800,
                    color: "#0B1220",
                    letterSpacing: "-0.5px",
                    margin: 0,
                    lineHeight: 1.2,
                    fontFamily: "var(--font-heading), sans-serif",
                  }}
                >
                  Catalog
                </h1>
              </div>
              <p style={{ fontSize: "14px", color: "#64748b", marginTop: "4px", margin: 0 }}>
                Manage your product catalog and listings.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Bulk Upload Button */}
              <button
                type="button"
                onClick={() => alert(`Bulk Upload: Upload CSV/Excel product catalog template.`)}
                style={{
                  height: "40px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "0 18px",
                  borderRadius: "8px",
                  background: "#ffffff",
                  border: "1.5px solid rgba(194, 65, 12, 0.25)",
                  color: "#172036",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                }}
              >
                <UploadCloud size={16} color="#C2410C" />
                <span>Bulk Upload</span>
              </button>

              {/* Add Product Button (Makaano Signature CTA) */}
              <Link
                href="/catalog/add-product"
                style={{
                  height: "40px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "0 20px",
                  borderRadius: "8px",
                  background: "#C2410C",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
              >
                <Plus size={16} />
                <span>Add Product</span>
              </Link>
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
          {/* 5 KPI METRIC CARDS GRID                                 */}
          {/* ======================================================= */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "18px",
            }}
          >
            {/* Card 1: Total Products */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(194, 65, 12, 0.15)",
                borderRadius: "14px",
                padding: "18px 20px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(194, 65, 12, 0.04)",
              }}
            >
              <div>
                <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Total Products</span>
                <div style={{ fontSize: "32px", fontWeight: 800, color: "#172036", marginTop: "6px", lineHeight: 1 }}>
                  {isLoadingApi ? <span style={{ opacity: 0.35 }}>—</span> : stats.totalProducts}
                </div>
              </div>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "rgba(194, 65, 12, 0.1)",
                  color: "#C2410C",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShoppingBag size={20} />
              </div>
            </div>

            {/* Card 2: Active Products */}
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
                <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Active Products</span>
                <div style={{ fontSize: "32px", fontWeight: 800, color: "#1e293b", marginTop: "6px", lineHeight: 1 }}>
                  {isLoadingApi ? <span style={{ opacity: 0.35 }}>—</span> : stats.activeProducts}
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

            {/* Card 3: Out of Stock */}
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

            {/* Card 5: Inactive Products */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: "14px",
                padding: "18px 20px",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <div>
                <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Inactive Products</span>
                <div style={{ fontSize: "32px", fontWeight: 800, color: "#64748b", marginTop: "6px", lineHeight: 1 }}>
                  {isLoadingApi ? <span style={{ opacity: 0.35 }}>—</span> : stats.inactiveProducts}
                </div>
              </div>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "rgba(148, 163, 184, 0.15)",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <EyeOff size={20} />
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
                border: "1.5px solid rgba(194, 65, 12, 0.22)",
                borderRadius: "8px",
                padding: "0 14px",
                height: "40px",
                boxShadow: "0 1px 3px rgba(194, 65, 12, 0.04)",
              }}
            >
              <Search size={16} color="#C2410C" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by Product, SKU, ASIN, Brand..."
                style={{
                  flex: 1,
                  height: "100%",
                  border: "none",
                  outline: "none",
                  paddingLeft: "10px",
                  fontSize: "13px",
                  color: "#0B1220",
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
            <Select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                height: "40px",
                background: "#ffffff",
                border: "1.5px solid rgba(194, 65, 12, 0.22)",
                borderRadius: "8px",
                padding: "0 14px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#172036",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="All Categories">All Categories</option>
              <option value="Building Materials">Building Materials</option>
              <option value="Cement">Cement</option>
              <option value="Steel">Steel</option>
              <option value="Power Tools">Power Tools</option>
              <option value="Hand Tools">Hand Tools</option>
              <option value="Paints & Accessories">Paints & Accessories</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Electricals">Electricals</option>
            </Select>

            {/* Dropdown 2: Status */}
            <Select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                height: "40px",
                background: "#ffffff",
                border: "1.5px solid rgba(194, 65, 12, 0.22)",
                borderRadius: "8px",
                padding: "0 14px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#172036",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </Select>

            {/* Dropdown 3: Fulfillment Channel (Matches Django backend FulfillmentChannel enum) */}
            <Select
              value={selectedFulfillment}
              onChange={(e) => {
                setSelectedFulfillment(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                height: "40px",
                background: "#ffffff",
                border: "1.5px solid rgba(194, 65, 12, 0.22)",
                borderRadius: "8px",
                padding: "0 14px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#172036",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="All Channels">All Channels</option>
              <option value="FBA">FBA (Makaano Express)</option>
              <option value="FBM">FBM (Merchant Delivery)</option>
            </Select>

            {/* Filters Button */}
            <button
              type="button"
              style={{
                height: "40px",
                background: "#ffffff",
                border: "1.5px solid rgba(194, 65, 12, 0.25)",
                borderRadius: "8px",
                padding: "0 16px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#172036",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(194, 65, 12, 0.05)",
              }}
            >
              <Filter size={15} color="#C2410C" />
              <span>Filters</span>
              <ChevronDown size={14} color="#C2410C" />
            </button>

            {/* Export Button */}
            <button
              type="button"
              onClick={() => alert(`Exported ${filteredProducts.length} catalog items as CSV.`)}
              style={{
                height: "40px",
                background: "#ffffff",
                border: "1.5px solid rgba(194, 65, 12, 0.25)",
                borderRadius: "8px",
                padding: "0 16px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#172036",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(194, 65, 12, 0.05)",
              }}
            >
              <Download size={15} color="#C2410C" />
              <span>Export</span>
            </button>
          </div>

          {/* ======================================================= */}
          {/* CATALOG PRODUCTS TABLE                                  */}
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
                <tr style={{ borderBottom: "1px solid #FFEDD5", background: "#fbfaff" }}>
                  <th style={{ padding: "14px 18px", width: "40px" }}>
                    <input
                      type="checkbox"
                      checked={selectedProductIds.length === paginatedProducts.length && paginatedProducts.length > 0}
                      onChange={handleSelectAll}
                      style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "#C2410C" }}
                    />
                  </th>
                  <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "capitalize" }}>
                    Product
                  </th>
                  <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
                    SKU
                  </th>
                  <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
                    Category
                  </th>
                  <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
                    Price
                  </th>
                  <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
                    Stock
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
                    <tr key={`skeleton-${idx}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
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
                      <td style={{ padding: "16px 18px" }}><div style={{ width: "70px", height: "13px", borderRadius: "4px", background: "#f1f5f9" }} /></td>
                      <td style={{ padding: "16px 18px" }}><div style={{ width: "80px", height: "13px", borderRadius: "4px", background: "#f1f5f9" }} /></td>
                      <td style={{ padding: "16px 18px" }}><div style={{ width: "55px", height: "14px", borderRadius: "4px", background: "#f1f5f9" }} /></td>
                      <td style={{ padding: "16px 18px" }}><div style={{ width: "50px", height: "13px", borderRadius: "4px", background: "#f1f5f9" }} /></td>
                      <td style={{ padding: "16px 18px" }}><div style={{ width: "70px", height: "20px", borderRadius: "9999px", background: "#f1f5f9" }} /></td>
                      <td style={{ padding: "16px 18px" }}><div style={{ width: "65px", height: "13px", borderRadius: "4px", background: "#f1f5f9" }} /></td>
                      <td style={{ padding: "16px 18px" }}><div style={{ width: "24px", height: "24px", borderRadius: "4px", background: "#f1f5f9" }} /></td>
                    </tr>
                  ))
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: "48px 24px", textAlign: "center", color: "#64748b" }}>
                      No catalog products matched your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((item) => {
                    const isSelected = selectedProductIds.includes(item.id);
                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          background: isSelected ? "rgba(194, 65, 12, 0.05)" : "#ffffff",
                          transition: "background-color 0.15s ease",
                        }}
                      >
                        {/* Checkbox */}
                        <td style={{ padding: "14px 18px" }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(item.id)}
                            style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "#C2410C" }}
                          />
                        </td>

                        {/* Product Title, Brand & Thumbnail */}
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                            <ProductThumbnail type={item.iconType} name={item.title} />
                            <div>
                              <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#1e293b", lineHeight: 1.3 }}>
                                {item.title}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
                                <span style={{ fontSize: "12px", color: "#64748b" }}>
                                  {item.brand}
                                </span>
                                {item.isBuyBoxWinner && (
                                  <span
                                    style={{
                                      background: "rgba(245, 158, 11, 0.12)",
                                      color: "#b45309",
                                      border: "1px solid rgba(245, 158, 11, 0.3)",
                                      fontSize: "10px",
                                      fontWeight: 700,
                                      padding: "1px 6px",
                                      borderRadius: "4px",
                                    }}
                                  >
                                    🏆 Buy Box
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* SKU & ASIN */}
                        <td style={{ padding: "14px 18px" }}>
                          <div>
                            <span style={{ fontSize: "12.5px", fontFamily: "var(--font-mono), monospace", fontWeight: 700, color: "#334155" }}>
                              {item.sku}
                            </span>
                            <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "var(--font-mono), monospace", marginTop: "2px" }}>
                              ASIN: {item.asin}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td style={{ padding: "14px 18px" }}>
                          <span style={{ fontSize: "13px", color: "#475569", fontWeight: 500 }}>
                            {item.categoryPath}
                          </span>
                        </td>

                        {/* Price & B2B Tier */}
                        <td style={{ padding: "14px 18px" }}>
                          <div>
                            <span style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                              ₹{item.price.toLocaleString("en-IN")}
                            </span>
                            {item.b2bTierPrice && (
                              <div
                                style={{
                                  fontSize: "10px",
                                  color: "#475569",
                                  background: "#f1f5f9",
                                  border: "1px solid #e2e8f0",
                                  padding: "1px 5px",
                                  borderRadius: "4px",
                                  marginTop: "3px",
                                  fontWeight: 600,
                                  width: "fit-content",
                                }}
                                title={`B2B Wholesale Tiers: ${item.b2bTierPrice}`}
                              >
                                B2B: {item.b2bTierPrice.split(",")[0]}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Stock */}
                        <td style={{ padding: "14px 18px" }}>
                          <div>
                            <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#1e293b" }}>
                              {item.stock}
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                marginTop: "1px",
                                color:
                                  item.stockStatus === "in_stock"
                                    ? "#16a34a"
                                    : item.stockStatus === "low_stock"
                                    ? "#d97706"
                                    : "#dc2626",
                              }}
                            >
                              {item.stockStatus === "in_stock"
                                ? "In Stock"
                                : item.stockStatus === "low_stock"
                                ? "Low Stock"
                                : "Out of Stock"}
                            </div>
                          </div>
                        </td>

                        {/* Status & Fulfillment Channel Badge */}
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: "9999px",
                                fontSize: "11.5px",
                                fontWeight: 700,
                                background: item.status === "Active" ? "#ecfdf5" : "#f1f5f9",
                                color: item.status === "Active" ? "#15803d" : "#64748b",
                                border: item.status === "Active" ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                                width: "fit-content",
                              }}
                            >
                              {item.status}
                            </span>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "1px 6px",
                                borderRadius: "4px",
                                fontSize: "10px",
                                fontWeight: 700,
                                background: item.fulfillmentChannel === "FBA" ? "rgba(245, 158, 11, 0.12)" : "#f8fafc",
                                color: item.fulfillmentChannel === "FBA" ? "#b45309" : "#64748b",
                                border: item.fulfillmentChannel === "FBA" ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid #e2e8f0",
                                width: "fit-content",
                              }}
                            >
                              {item.fulfillmentChannel === "FBA" ? "⚡ Makaano (FBA)" : "📦 Merchant (FBM)"}
                            </span>
                          </div>
                        </td>

                        {/* Last Updated */}
                        <td style={{ padding: "14px 18px" }}>
                          <span style={{ fontSize: "12.5px", color: "#64748b", whiteSpace: "nowrap" }}>
                            {item.lastUpdated}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "14px 18px", textAlign: "center", position: "relative" }}>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveRowActionMenu(activeRowActionMenu === item.id ? null : item.id)
                            }
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              color: "#64748b",
                              padding: "4px 8px",
                              borderRadius: "6px",
                            }}
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {/* Row Actions Menu */}
                          {activeRowActionMenu === item.id && (
                            <div
                              style={{
                                position: "absolute",
                                right: "20px",
                                top: "45px",
                                background: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "10px",
                                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                                width: "160px",
                                zIndex: 30,
                                padding: "6px 0",
                                textAlign: "left",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                style={{
                                  width: "100%",
                                  padding: "8px 14px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  background: "transparent",
                                  border: "none",
                                  fontSize: "12.5px",
                                  fontWeight: 600,
                                  color: "#C2410C",
                                  cursor: "pointer",
                                }}
                              >
                                <Edit size={14} />
                                <span>Edit Details (PUT)</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleProductStatus(item.id)}
                                style={{
                                  width: "100%",
                                  padding: "8px 14px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  background: "transparent",
                                  border: "none",
                                  fontSize: "12.5px",
                                  fontWeight: 600,
                                  color: "#1e293b",
                                  cursor: "pointer",
                                }}
                              >
                                <RefreshCw size={14} />
                                <span>{item.status === "Active" ? "Set Inactive (PUT)" : "Set Active (PUT)"}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(item.id)}
                                style={{
                                  width: "100%",
                                  padding: "8px 14px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  background: "transparent",
                                  border: "none",
                                  fontSize: "12.5px",
                                  fontWeight: 600,
                                  color: "#dc2626",
                                  cursor: "pointer",
                                }}
                              >
                                <Trash2 size={14} />
                                <span>Delete Item</span>
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

            {/* Pagination Controls Footer */}
            <div
              style={{
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "1px solid #e2e8f0",
                background: "#ffffff",
              }}
            >
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                Showing{" "}
                <strong style={{ color: "#0B1220" }}>
                  {filteredProducts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                </strong>{" "}
                to{" "}
                <strong style={{ color: "#0B1220" }}>
                  {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
                </strong>{" "}
                of <strong style={{ color: "#0B1220" }}>{stats.totalProducts}</strong> products
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
                    border: "1.5px solid rgba(194, 65, 12, 0.22)",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: currentPage === 1 ? "#cbd5e1" : "#172036",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    boxShadow: "0 1px 2px rgba(194, 65, 12, 0.05)",
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
                        <span key={`ellipsis-${idx}`} style={{ padding: "0 4px", color: "#94a3b8" }}>
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
                            ? "linear-gradient(135deg, #C2410C 0%, #9A3412 100%)"
                            : "transparent",
                          color: isActive ? "#ffffff" : "#64748b",
                          fontWeight: isActive ? 700 : 500,
                          fontSize: "13px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: isActive ? "0 2px 8px rgba(194, 65, 12, 0.35)" : "none",
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
                    border: "1.5px solid rgba(194, 65, 12, 0.22)",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: currentPage === totalPages ? "#cbd5e1" : "#172036",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    boxShadow: "0 1px 2px rgba(194, 65, 12, 0.05)",
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
      {/* ADD PRODUCT MODAL (MATCHING DJANGO CATALOG & LISTING SCHEMA) */}
      {/* ========================================================= */}
      {isAddModalOpen && (
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
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "540px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                background: "#0B1220",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "#ffffff",
              }}
            >
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff", margin: 0, fontFamily: "var(--font-heading), sans-serif" }}>
                  Add Product to Catalog
                </h3>
                <p style={{ fontSize: "12.5px", color: "#E2E8F0", margin: 0, marginTop: "2px" }}>
                  Creates Master Product ASIN and Merchant Listing
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "none",
                  cursor: "pointer",
                  color: "#ffffff",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Product Title */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., UltraTech Super Cement (50 kg Bag) - Premium PPC Grade"
                  style={{
                    width: "100%",
                    height: "42px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "0 14px",
                    fontSize: "13.5px",
                    outline: "none",
                  }}
                />
              </div>

              {/* Brand and Category */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Brand Name *
                  </label>
                  <Select
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    style={{
                      width: "100%",
                      height: "42px",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "0 12px",
                      fontSize: "13.5px",
                      outline: "none",
                    }}
                  >
                    <option value="UltraTech">UltraTech</option>
                    <option value="Tata Steel">Tata Steel</option>
                    <option value="Asian Paints">Asian Paints</option>
                    <option value="Bosch">Bosch</option>
                    <option value="Stanley">Stanley</option>
                    <option value="Finolex">Finolex</option>
                    <option value="Philips">Philips</option>
                    <option value="Schneider">Schneider</option>
                    <option value="Makita">Makita</option>
                    <option value="Supreme">Supreme</option>
                  </Select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Category Taxonomy *
                  </label>
                  <Select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    style={{
                      width: "100%",
                      height: "42px",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "0 12px",
                      fontSize: "13.5px",
                      outline: "none",
                    }}
                  >
                    <option value="Building Materials > Cement">Building Materials &gt; Cement</option>
                    <option value="Building Materials > Steel">Building Materials &gt; Steel</option>
                    <option value="Power Tools > Drills">Power Tools &gt; Drills</option>
                    <option value="Hand Tools > Hammers">Hand Tools &gt; Hammers</option>
                    <option value="Paints & Accessories > Interior">Paints &amp; Accessories &gt; Interior</option>
                    <option value="Plumbing > Pipes">Plumbing &gt; Pipes</option>
                    <option value="Electricals > Lighting">Electricals &gt; Lighting</option>
                    <option value="Electricals > Switches">Electricals &gt; Switches</option>
                  </Select>
                </div>
              </div>

              {/* SKU and ASIN */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Merchant SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    placeholder="e.g., GIK-ULTRA-PPC-50"
                    style={{
                      width: "100%",
                      height: "42px",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "0 14px",
                      fontSize: "13.5px",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Master ASIN (Optional)
                  </label>
                  <input
                    type="text"
                    value={newAsin}
                    onChange={(e) => setNewAsin(e.target.value)}
                    placeholder="Auto-generated if blank (e.g. BM01CEMENT01)"
                    style={{
                      width: "100%",
                      height: "42px",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "0 14px",
                      fontSize: "13.5px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Fulfillment Channel & Condition */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Fulfillment Channel *
                  </label>
                  <Select
                    value={newFulfillment}
                    onChange={(e) => setNewFulfillment(e.target.value as "FBA" | "FBM")}
                    style={{
                      width: "100%",
                      height: "42px",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "0 12px",
                      fontSize: "13.5px",
                      outline: "none",
                    }}
                  >
                    <option value="FBA">FBA (Fulfillment by Makaano)</option>
                    <option value="FBM">FBM (Fulfillment by Merchant)</option>
                  </Select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Item Condition *
                  </label>
                  <Select
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    style={{
                      width: "100%",
                      height: "42px",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "0 12px",
                      fontSize: "13.5px",
                      outline: "none",
                    }}
                  >
                    <option value="NEW">New (Factory Sealed)</option>
                    <option value="REFURBISHED_EXCELLENT">Refurbished - Excellent</option>
                    <option value="USED_LIKE_NEW">Used - Like New</option>
                  </Select>
                </div>
              </div>

              {/* Price, Stock & Wholesale B2B Tier */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Standard Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="385"
                    style={{
                      width: "100%",
                      height: "42px",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "0 14px",
                      fontSize: "13.5px",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Initial Stock Qty *
                  </label>
                  <input
                    type="number"
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    placeholder="500"
                    style={{
                      width: "100%",
                      height: "42px",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "0 14px",
                      fontSize: "13.5px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* B2B Tier Pricing & Model Number */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    B2B Wholesale Tier (Optional)
                  </label>
                  <input
                    type="text"
                    value={newB2bTier}
                    onChange={(e) => setNewB2bTier(e.target.value)}
                    placeholder="e.g., 50+ @ ₹375"
                    style={{
                      width: "100%",
                      height: "42px",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "0 14px",
                      fontSize: "13.5px",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Manufacturer Model / Part No.
                  </label>
                  <input
                    type="text"
                    value={newModelNumber}
                    onChange={(e) => setNewModelNumber(e.target.value)}
                    placeholder="e.g., PPC-50KG-BAG"
                    style={{
                      width: "100%",
                      height: "42px",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "0 14px",
                      fontSize: "13.5px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    height: "40px",
                    padding: "0 20px",
                    borderRadius: "8px",
                    border: "1.5px solid rgba(194, 65, 12, 0.25)",
                    background: "#ffffff",
                    color: "#172036",
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
                  disabled={isSubmitting}
                  style={{
                    height: "40px",
                    padding: "0 22px",
                    borderRadius: "8px",
                    border: "none",
                    background: "linear-gradient(135deg, #C2410C 0%, #9A3412 100%)",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "13.5px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 14px rgba(194, 65, 12, 0.35)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                  <span>Save Product</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================= */}
      {/* EDIT PRODUCT MODAL (PUT /api/catalog/products/<id>/)      */}
      {/* ========================================================= */}
      {isEditModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
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
              maxWidth: "520px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #C2410C 0%, #9A3412 100%)",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff", margin: 0 }}>
                  Edit Product (Live PUT API)
                </h3>
                <p style={{ fontSize: "12.5px", color: "#E2E8F0", margin: "2px 0 0 0" }}>
                  Update details in Django Catalog &amp; Listing DB
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "none",
                  cursor: "pointer",
                  color: "#ffffff",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{
                    width: "100%",
                    height: "42px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "0 14px",
                    fontSize: "13.5px",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Standard Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    style={{
                      width: "100%",
                      height: "42px",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "0 14px",
                      fontSize: "13.5px",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Available Stock *
                  </label>
                  <input
                    type="number"
                    required
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    style={{
                      width: "100%",
                      height: "42px",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "0 14px",
                      fontSize: "13.5px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                  Listing Status
                </label>
                <Select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ListingStatusType)}
                  style={{
                    width: "100%",
                    height: "42px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "0 12px",
                    fontSize: "13.5px",
                    outline: "none",
                  }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </Select>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    height: "40px",
                    padding: "0 18px",
                    borderRadius: "8px",
                    border: "1.5px solid #e2e8f0",
                    background: "#ffffff",
                    color: "#64748b",
                    fontWeight: 600,
                    fontSize: "13.5px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  style={{
                    height: "40px",
                    padding: "0 22px",
                    borderRadius: "8px",
                    border: "none",
                    background: "linear-gradient(135deg, #C2410C 0%, #9A3412 100%)",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "13.5px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 14px rgba(194, 65, 12, 0.35)",
                  }}
                >
                  {isSubmittingEdit ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>Save Changes (PUT)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
