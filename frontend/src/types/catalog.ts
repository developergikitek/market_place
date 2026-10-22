export type StockStatusType = 'in_stock' | 'low_stock' | 'out_of_stock';
export type ListingStatusType = 'Active' | 'Inactive' | 'Draft' | 'Suppressed';

export interface CatalogProductListing {
  id: string;
  asin: string;
  title: string;
  brand: string;
  sku: string;
  category: string;
  categoryPath: string;
  price: number;
  salePrice?: number;
  stock: number;
  stockStatus: StockStatusType;
  status: ListingStatusType;
  lastUpdated: string;
  condition: string;
  fulfillmentChannel: 'MAKAANO_FULFILLED' | 'SELLER_FULFILLED' | 'FBA' | 'FBM';
  isBuyBoxWinner?: boolean;
  b2bTierPrice?: string;
  modelNumber?: string;
  upc?: string;
  isHazmat?: boolean;
  iconType: string;
}

export interface CatalogStats {
  totalProducts: number;
  activeProducts: number;
  outOfStock: number;
  lowStock: number;
  inactiveProducts: number;
}
