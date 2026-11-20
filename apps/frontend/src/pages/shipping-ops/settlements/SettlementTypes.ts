export interface SettlementMerchant {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface SettlementLine {
  id: string;
  shipmentId: string;
  shipmentBarcode?: string;
  barcode?: string;
  trackingNumber?: string;
  orderNumber?: string;
  recipientName?: string;
  destinationGovernorate?: string;
  destinationCity?: string;
  status: string;
  codAmount: number;
  collectedAmount: number;
  shippingFee: number;
  codFee: number;
  returnFee: number;
  extraFees?: number;
  net: number;
  createdAt: string;
  deliveredAt?: string;
  returnedAt?: string;
  shipment?: {
    id: string;
    barcode?: string;
    trackingNumber?: string;
    recipientName?: string;
    destinationGovernorate?: string;
    destinationCity?: string;
    status?: string;
    codAmount?: number;
    collectedAmount?: number;
    extraFees?: number;
    createdAt?: string;
  };
}

export interface SettlementItem {
  id: string;
  settlementNumber: string;
  merchantId: string;
  status: 'DRAFT' | 'ISSUED' | 'APPROVED' | 'PAID' | 'REJECTED';
  periodStart: string;
  periodEnd: string;
  totalShipments: number;
  deliveredCount: number;
  returnedCount: number;
  grossCOD: number;
  shippingFeesTotal: number;
  codFeesTotal: number;
  returnFeesTotal: number;
  extraFeesTotal?: number;
  netPayout: number;
  paymentMethod?: string;
  paymentReference?: string;
  treasuryTransactionId?: string;
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
  createdAt: string;
  merchant?: SettlementMerchant;
  lines?: SettlementLine[];
}

export interface PreviewSummary {
  totalShipments: number;
  deliveredCount: number;
  returnedCount: number;
  grossCOD: number;
  shippingFeesTotal: number;
  codFeesTotal: number;
  returnFeesTotal: number;
  extraFeesTotal?: number;
  netPayout: number;
  periodStart: string;
  periodEnd: string;
}

export interface PreviewData {
  merchant: SettlementMerchant;
  summary: PreviewSummary;
  lines: SettlementLine[];
}

export const SETTLEMENT_STATUS_MAP: Record<
  string,
  { labelAr: string; labelEn: string; badgeClass: string }
> = {
  DRAFT: {
    labelAr: 'مسودة',
    labelEn: 'Draft',
    badgeClass: 'bg-slate-100 text-foreground border-border dark:bg-muted dark:text-muted-foreground',
  },
  ISSUED: {
    labelAr: 'تم الإصدار',
    labelEn: 'Issued',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
  },
  APPROVED: {
    labelAr: 'معتمد',
    labelEn: 'Approved',
    badgeClass: 'bg-emerald-50 text-success border-success dark:bg-success/40 dark:text-success',
  },
  PAID: {
    labelAr: 'تم التوريد والصرف',
    labelEn: 'Paid',
    badgeClass: 'bg-teal-50 text-success border-success dark:bg-success/40 dark:text-success',
  },
  REJECTED: {
    labelAr: 'مرفوض',
    labelEn: 'Rejected',
    badgeClass: 'bg-rose-50 text-destructive border-destructive dark:bg-destructive/40 dark:text-destructive',
  },
};

export function formatEgp(val: number | string | undefined | null): string {
  const num = Number(val || 0);
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`;
}
