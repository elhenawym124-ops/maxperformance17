// ================================================
// Shared Types for Products List Page
// ================================================

import type { ProductWorkflow } from "../utils/workflow";

export interface ProductInventorySnapshot {
  fulfillmentMode?: string;
  stockLocation?: string;
  stockLocationLabel?: string;
  canEditStock?: boolean;
  warehouseName?: string | null;
  warehouseNames?: string[];
  merchantProductStock?: number;
  physicalQuantity?: number;
  physicalAvailable?: number;
  reservedQuantity?: number;
  availableForSale?: number;
}

export interface Product {
  id: string;
  slug?: string;
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  cost?: number;
  sku: string;
  category: string;
  categoryId?: string;
  images: string[];
  mainImage?: string;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  isHidden?: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  workflow: ProductWorkflow;
  productType: "simple" | "variable";
  variantsCount: number;
  availableStock?: number;
  fulfillableStock?: number;
  inventorySnapshot?: ProductInventorySnapshot | null;
  merchantContext?: {
    merchantId?: string;
    fulfillmentMode?: string | null;
    defaultWarehouseId?: string | null;
    stockLocation?: string;
    stockLocationLabel?: string;
    canEditStock?: boolean;
    inventorySnapshot?: ProductInventorySnapshot | null;
  } | null;
  metadata?: any;
  hasQuantityOffers?: boolean;
  quantityOffersCount?: number;
  quantityOffers?: any[];
  createdBy?: string | null;
  updatedBy?: string | null;
  lastModifiedBy?: {
    userName?: string;
    userId?: string;
    updatedAt?: string | Date;
    action?: string;
  } | null;
}

export type SortField = "name" | "price" | "stock" | "createdAt" | "updatedAt";
export type SortDirection = "asc" | "desc";
export type ViewMode = "table" | "grid";
export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

// ================================================
// Shared Utility Functions
// ================================================

export const getStockStatus = (product: Product): StockStatus => {
  if (product.stock <= 0) return "out-of-stock";
  if (product.stock <= (product.lowStockThreshold || 5)) return "low-stock";
  return "in-stock";
};

export const getStockStatusColor = (_status: StockStatus): string =>
  "bg-muted text-foreground";

export const getStockStatusDotColor = (status: StockStatus): string => {
  switch (status) {
    case "in-stock":
      return "bg-success";
    case "low-stock":
      return "bg-warning";
    case "out-of-stock":
      return "bg-destructive";
    default:
      return "bg-muted-foreground/50";
  }
};

export const getStockStatusText = (status: StockStatus, isEn = false): string => {
  switch (status) {
    case "in-stock":
      return isEn ? "In Stock" : "متوفر";
    case "low-stock":
      return isEn ? "Low Stock" : "مخزون منخفض";
    case "out-of-stock":
      return isEn ? "Out of Stock" : "نفد المخزون";
    default:
      return isEn ? "Unspecified" : "غير محدد";
  }
};

export const safeJsonParse = (jsonString: string | null, defaultValue: any = null) => {
  if (!jsonString || jsonString === "null") return defaultValue;
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn("Failed to parse JSON:", jsonString, error);
    if (typeof jsonString === "string" && Array.isArray(defaultValue)) {
      return jsonString.split(",").map((t) => t.trim()).filter((t) => t.length > 0);
    }
    return defaultValue;
  }
};
