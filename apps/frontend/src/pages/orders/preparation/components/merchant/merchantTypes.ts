export type MerchantOperationStatus =
  | "PREPARATION"
  | "IN_SHIPPING"
  | "DELIVERED"
  | "NOT_DELIVERED";

export interface MerchantOperationsTotals {
  assignedOrdersCount: number;
  assignedPieces: number;
  preparationOrdersCount: number;
  preparationPieces: number;
  inShippingOrdersCount: number;
  inShippingPieces: number;
  deliveredOrdersCount: number;
  deliveredPieces: number;
  notDeliveredOrdersCount: number;
  notDeliveredPieces: number;
  payablePieces: number;
  pendingPayablePieces: number;
  expectedReceivableAmount: number;
  inShippingAmount: number;
  deliveredPayableAmount: number;
  notDeliveredAmount: number;
  shippingCostAmount: number;
  confirmedCommissionAmount: number;
  pendingCommissionAmount: number;
  paidAmount: number;
}

export interface MerchantOperationRow {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerPhone?: string;
  fulfillmentSource: string;
  warehouseName?: string | null;
  shippingCompanyName?: string | null;
  trackingNumber?: string | null;
  merchantOrderStatus: string;
  shipmentStatus?: string;
  orderStatus?: string;
  operationStatus: MerchantOperationStatus;
  pieces: number;
  merchantAmount: number;
  commissionAmount: number;
  shippingCost: number;
  payablePieces: number;
  pendingPayablePieces: number;
  payableAmount: number;
  expectedAmount: number;
}

export interface MerchantOperationsResponse {
  success?: boolean;
  data?: {
    summary?: Partial<MerchantOperationsTotals>;
    rows?: MerchantOperationRow[];
  };
  message?: string;
}

export interface MerchantOperationsSummaryProps {
  formatPrice: (value: number | null | undefined) => string;
  formatDate: (value: string | Date | number) => string;
}

export const EMPTY_TOTALS: MerchantOperationsTotals = {
  assignedOrdersCount: 0,
  assignedPieces: 0,
  preparationOrdersCount: 0,
  preparationPieces: 0,
  inShippingOrdersCount: 0,
  inShippingPieces: 0,
  deliveredOrdersCount: 0,
  deliveredPieces: 0,
  notDeliveredOrdersCount: 0,
  notDeliveredPieces: 0,
  payablePieces: 0,
  pendingPayablePieces: 0,
  expectedReceivableAmount: 0,
  inShippingAmount: 0,
  deliveredPayableAmount: 0,
  notDeliveredAmount: 0,
  shippingCostAmount: 0,
  confirmedCommissionAmount: 0,
  pendingCommissionAmount: 0,
  paidAmount: 0,
};

export const STATUS_LABEL_KEYS: Record<MerchantOperationStatus, string> = {
  PREPARATION: "merchant.statuses.PREPARATION",
  IN_SHIPPING: "merchant.statuses.IN_SHIPPING",
  DELIVERED: "merchant.statuses.DELIVERED",
  NOT_DELIVERED: "merchant.statuses.NOT_DELIVERED",
};

export const STATUS_CLASSES: Record<MerchantOperationStatus, string> = {
  PREPARATION:
    "border-warning bg-warning/10 text-warning dark:border-warning/60 dark:bg-warning/70 dark:text-warning",
  IN_SHIPPING:
    "border-info bg-info/10 text-info dark:border-info/60 dark:bg-info/70 dark:text-info",
  DELIVERED:
    "border-success bg-success/10 text-success dark:border-success/60 dark:bg-success/70 dark:text-success",
  NOT_DELIVERED:
    "border-destructive bg-destructive/10 text-destructive dark:border-destructive/60 dark:bg-destructive/70 dark:text-destructive",
};

export const toNumber = (value: unknown): number => {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
};
