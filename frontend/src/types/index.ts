export interface MaterialCategory {
  id: string;
  name: string;
  hindiName: string;
  tagline: string;
  specs: string;
  standardGrade: string;
  basePrice: string;
  unit: string;
  iconName: string;
  inStockCount: number;
}

export interface ProductItem {
  id: string;
  name: string;
  categoryId: string;
  grade: string;
  manufacturer: string;
  pricePerUnit: number;
  unit: string;
  minimumOrder: number;
  availableStock: number;
  sellerId: string;
  sellerName: string;
  sellerRating: number;
  deliveryEta: string;
  mtcCertified: boolean;
  featuredTag?: string;
  specs: { [key: string]: string };
}

export interface VerifiedSeller {
  id: string;
  name: string;
  logoBadge: string;
  tier: "Primary Mill" | "Authorized Channel" | "Certified Quarry" | "Direct Distributor";
  location: string;
  dispatchRadius: string;
  rating: number;
  completedOrders: number;
  totalTonnageDispatched: string;
  avgDispatchTime: string;
  acceptanceRate: number;
  certifications: string[];
}

export interface RFQQuoteRequest {
  materialType: string;
  quantity: number;
  unit: string;
  targetPricePerUnit: number;
  deliveryPincode: string;
  deliveryCity: string;
  unloadingAssistance: boolean;
  notes?: string;
}

export interface SellerBid {
  sellerId: string;
  sellerName: string;
  bidPricePerUnit: number;
  freightIncluded: boolean;
  deliveryHours: number;
  mtcIncluded: boolean;
  discountPercentage: number;
}
