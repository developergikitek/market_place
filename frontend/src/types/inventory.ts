export type InventoryStockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export type InventoryMovementReasonType =
  | 'RESTOCK'
  | 'CUSTOMER_ORDER_RESERVED'
  | 'CUSTOMER_ORDER_DISPATCHED'
  | 'CUSTOMER_RETURN_RESTOCKED'
  | 'CYCLE_COUNT_ADJUSTMENT'
  | 'DAMAGED_IN_WAREHOUSE'
  | 'STOCK_TRANSFER';

export interface InventoryItemListing {
  id: string;
  productId: string;
  title: string;
  brand: string;
  sku: string;
  category: string;
  availableStock: number;
  reservedStock: number;
  safetyStock: number;
  status: InventoryStockStatus;
  warehouse: string;
  lastUpdated: string;
  iconType: string;
}

export interface InventoryStats {
  totalSKUs: number;
  totalStock: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

export interface InventoryMovementLog {
  id: string;
  inventoryItemId: string;
  sku: string;
  productTitle: string;
  quantityChange: number;
  balanceAfter: number;
  reason: InventoryMovementReasonType;
  referenceNote?: string;
  warehouse: string;
  timestamp: string;
}
