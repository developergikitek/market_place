import { CatalogProductListing, CatalogStats, StockStatusType } from "@/types/catalog";
import { InventoryItemListing, InventoryStats, InventoryStockStatus } from "@/types/inventory";
import { INITIAL_PRODUCTS, INITIAL_CATALOG_STATS } from "@/data/catalogData";
import { INITIAL_INVENTORY_ITEMS, INITIAL_INVENTORY_STATS } from "@/data/inventoryData";

const STORAGE_KEY_CATALOG = "buildmart_local_catalog_products";
const STORAGE_KEY_INVENTORY = "buildmart_local_inventory_items";

// Helper: safe localStorage access
function getStorageItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

function setStorageItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn("localStorage write error:", e);
  }
}

/**
 * Determine icon based on product title/category
 */
export function deriveProductIcon(title: string): string {
  const t = (title || "").toLowerCase();
  if (t.includes("cement")) return "cement";
  if (t.includes("steel") || t.includes("tmt")) return "steel";
  if (t.includes("hammer")) return "hammer";
  if (t.includes("paint") || t.includes("apex")) return "paint";
  if (t.includes("pipe") || t.includes("pvc")) return "pipe";
  if (t.includes("bulb") || t.includes("led")) return "bulb";
  if (t.includes("switch")) return "switch";
  if (t.includes("grinder")) return "grinder";
  if (t.includes("tank")) return "tank";
  return "drill";
}

/**
 * Calculate catalog statistics from products array
 */
export function computeCatalogStats(products: CatalogProductListing[]): CatalogStats {
  const total = products.length;
  const active = products.filter((p) => p.status === "Active").length;
  const outOfStock = products.filter((p) => p.stockStatus === "out_of_stock" || p.stock === 0).length;
  const lowStock = products.filter((p) => p.stockStatus === "low_stock" || (p.stock > 0 && p.stock <= 10)).length;
  const inactive = products.filter((p) => p.status === "Inactive").length;

  return {
    totalProducts: total,
    activeProducts: active,
    outOfStock,
    lowStock,
    inactiveProducts: inactive,
  };
}

/**
 * Calculate inventory statistics from inventory items array
 */
export function computeInventoryStats(items: InventoryItemListing[]): InventoryStats {
  let totalStock = 0;
  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;

  items.forEach((item) => {
    totalStock += item.availableStock || 0;
    if (item.status === "In Stock") inStock += 1;
    else if (item.status === "Low Stock") lowStock += 1;
    else if (item.status === "Out of Stock") outOfStock += 1;
  });

  return {
    totalSKUs: items.length,
    totalStock,
    inStock,
    lowStock,
    outOfStock,
  };
}

/**
 * Get all catalog products from Local DB (seeding with sample data if first load)
 */
export function getLocalCatalogProductsSync(): CatalogProductListing[] {
  const stored = getStorageItem(STORAGE_KEY_CATALOG);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse stored catalog products, falling back to sample data", e);
    }
  }

  // Seed with initial sample products
  const initial = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
  setStorageItem(STORAGE_KEY_CATALOG, JSON.stringify(initial));
  return initial;
}

/**
 * Get all inventory listings from Local DB (seeding with sample data if first load)
 */
export function getLocalInventoryItemsSync(): InventoryItemListing[] {
  const stored = getStorageItem(STORAGE_KEY_INVENTORY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse stored inventory items, falling back to sample data", e);
    }
  }

  // Seed with initial sample inventory
  const initial = JSON.parse(JSON.stringify(INITIAL_INVENTORY_ITEMS));
  setStorageItem(STORAGE_KEY_INVENTORY, JSON.stringify(initial));
  return initial;
}

/**
 * Save catalog products to Local DB
 */
export function saveLocalCatalogProducts(products: CatalogProductListing[]): void {
  setStorageItem(STORAGE_KEY_CATALOG, JSON.stringify(products));
}

/**
 * Save inventory items to Local DB
 */
export function saveLocalInventoryItems(items: InventoryItemListing[]): void {
  setStorageItem(STORAGE_KEY_INVENTORY, JSON.stringify(items));
}

/**
 * Reset local DB to original sample data
 */
export function resetLocalDatabase(): {
  products: CatalogProductListing[];
  items: InventoryItemListing[];
  catalogStats: CatalogStats;
  inventoryStats: InventoryStats;
} {
  const products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
  const items = JSON.parse(JSON.stringify(INITIAL_INVENTORY_ITEMS));
  saveLocalCatalogProducts(products);
  saveLocalInventoryItems(items);
  return {
    products,
    items,
    catalogStats: computeCatalogStats(products),
    inventoryStats: computeInventoryStats(items),
  };
}

/**
 * Add a new product to Local Catalog and automatically create matching listing in Local Inventory
 */
export function addProductToLocalDb(payload: {
  title: string;
  brand: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  condition?: string;
  fulfillmentChannel?: "MAKAANO_FULFILLED" | "SELLER_FULFILLED" | "FBA" | "FBM";
  b2bTier?: string;
  modelNumber?: string;
}): {
  product: CatalogProductListing;
  inventoryItem: InventoryItemListing;
  catalogStats: CatalogStats;
  inventoryStats: InventoryStats;
} {
  const catalog = getLocalCatalogProductsSync();
  const inventory = getLocalInventoryItemsSync();

  const stockNum = payload.stock || 0;
  let stockStatus: StockStatusType = "in_stock";
  if (stockNum === 0) stockStatus = "out_of_stock";
  else if (stockNum <= 10) stockStatus = "low_stock";

  let inventoryStatus: InventoryStockStatus = "In Stock";
  if (stockNum === 0) inventoryStatus = "Out of Stock";
  else if (stockNum <= 15) inventoryStatus = "Low Stock";

  const icon = deriveProductIcon(payload.title);
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  const asin = `BM${randomSuffix}ITEM`;
  const productId = `prod-${Date.now()}`;
  const listingId = `inv-${payload.sku || randomSuffix}`;

  const newProduct: CatalogProductListing = {
    id: productId,
    asin: asin,
    title: payload.title,
    brand: payload.brand,
    sku: payload.sku,
    category: payload.category.includes(">") ? payload.category.split(">")[0].trim() : payload.category,
    categoryPath: payload.category,
    price: payload.price,
    stock: stockNum,
    stockStatus: stockStatus,
    status: "Active",
    lastUpdated: "Just now",
    condition: payload.condition || "NEW",
    fulfillmentChannel: payload.fulfillmentChannel || "MAKAANO_FULFILLED",
    isBuyBoxWinner: true,
    b2bTierPrice: payload.b2bTier,
    modelNumber: payload.modelNumber,
    iconType: icon,
  };

  const newInventoryItem: InventoryItemListing = {
    id: listingId,
    productId: productId,
    title: payload.title,
    brand: payload.brand,
    sku: payload.sku,
    category: payload.category,
    availableStock: stockNum,
    reservedStock: Math.floor(stockNum * 0.05),
    safetyStock: 15,
    status: inventoryStatus,
    warehouse: "Makaano FC-Pune (MH-01)",
    lastUpdated: "Just now",
    iconType: icon,
  };

  // Add to beginning of lists for immediate visibility
  const updatedCatalog = [newProduct, ...catalog];
  const updatedInventory = [newInventoryItem, ...inventory];

  saveLocalCatalogProducts(updatedCatalog);
  saveLocalInventoryItems(updatedInventory);

  return {
    product: newProduct,
    inventoryItem: newInventoryItem,
    catalogStats: computeCatalogStats(updatedCatalog),
    inventoryStats: computeInventoryStats(updatedInventory),
  };
}

/**
 * Update stock in Local Inventory and synchronize back to Local Catalog
 */
export function updateStockInLocalDb(
  listingId: string,
  quantityChange: number,
  actionType: "add" | "set",
  currentStock: number,
  reason?: string,
  warehouse?: string
): {
  newStock: number;
  newStatus: InventoryStockStatus;
  updatedItem: InventoryItemListing | null;
  inventoryStats: InventoryStats;
  catalogStats: CatalogStats;
  message: string;
} {
  const inventory = getLocalInventoryItemsSync();
  const catalog = getLocalCatalogProductsSync();

  const finalStock = Math.max(
    0,
    actionType === "add" ? currentStock + quantityChange : quantityChange
  );

  let newStatus: InventoryStockStatus = "In Stock";
  if (finalStock === 0) newStatus = "Out of Stock";
  else if (finalStock <= 15) newStatus = "Low Stock";

  let newCatalogStockStatus: StockStatusType = "in_stock";
  if (finalStock === 0) newCatalogStockStatus = "out_of_stock";
  else if (finalStock <= 10) newCatalogStockStatus = "low_stock";

  const targetItem = inventory.find(
    (item) => item.id === listingId || item.productId === listingId || item.sku === listingId
  );

  let updatedListing: InventoryItemListing | null = null;

  // 1. Update Inventory item
  const updatedInventory = inventory.map((item) => {
    if (item.id === listingId || item.productId === listingId || item.sku === listingId) {
      updatedListing = {
        ...item,
        availableStock: finalStock,
        status: newStatus,
        warehouse: warehouse || item.warehouse,
        lastUpdated: "Just now",
      };
      return updatedListing;
    }
    return item;
  });

  // 2. Synchronize corresponding Catalog product
  const targetSku = targetItem?.sku;
  const targetTitle = targetItem?.title;
  const targetProdId = targetItem?.productId;

  const updatedCatalog = catalog.map((prod) => {
    if (
      (targetProdId && prod.id === targetProdId) ||
      (targetSku && prod.sku === targetSku) ||
      (targetTitle && prod.title === targetTitle)
    ) {
      return {
        ...prod,
        stock: finalStock,
        stockStatus: newCatalogStockStatus,
        lastUpdated: "Just now",
      };
    }
    return prod;
  });

  saveLocalInventoryItems(updatedInventory);
  saveLocalCatalogProducts(updatedCatalog);

  return {
    newStock: finalStock,
    newStatus,
    updatedItem: updatedListing,
    inventoryStats: computeInventoryStats(updatedInventory),
    catalogStats: computeCatalogStats(updatedCatalog),
    message: `Stock updated to ${finalStock} units successfully in local database.`,
  };
}

/**
 * Update existing product attributes in Local DB
 */
export function updateProductInLocalDb(
  id: string,
  updates: Partial<CatalogProductListing>
): CatalogProductListing | null {
  const catalog = getLocalCatalogProductsSync();
  let updatedProduct: CatalogProductListing | null = null;
  const updatedCatalog = catalog.map((item) => {
    if (item.id === id || item.asin === id || item.sku === id) {
      updatedProduct = { ...item, ...updates, lastUpdated: "Just now" };
      return updatedProduct;
    }
    return item;
  });
  if (updatedProduct) {
    saveLocalCatalogProducts(updatedCatalog);
  }
  return updatedProduct;
}

/**
 * Update existing listing attributes in Local DB
 */
export function updateListingInLocalDb(
  id: string,
  updates: Partial<InventoryItemListing>
): InventoryItemListing | null {
  const inventory = getLocalInventoryItemsSync();
  let updatedListing: InventoryItemListing | null = null;
  const updatedInventory = inventory.map((item) => {
    if (item.id === id || item.productId === id || item.sku === id) {
      updatedListing = { ...item, ...updates, lastUpdated: "Just now" };
      return updatedListing;
    }
    return item;
  });
  if (updatedListing) {
    saveLocalInventoryItems(updatedInventory);
  }
  return updatedListing;
}
