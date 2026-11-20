import { ServiceMediaFile } from "../../../components/services/MediaUploadZone";

export type { ServiceMediaFile };

export const STATUS_MAP: Record<string, { label: string; color: string; badge: string }> = {
  NEW: {
    label: "جديد",
    color: "bg-blue-50 text-primary border-primary dark:bg-primary/40 dark:text-primary dark:border-primary",
    badge: "bg-blue-500",
  },
  IN_PROGRESS: {
    label: "قيد التنفيذ",
    color: "bg-amber-50 text-warning border-warning dark:bg-warning/40 dark:text-warning dark:border-warning",
    badge: "bg-amber-500",
  },
  COMPLETED: {
    label: "مكتمل",
    color: "bg-emerald-50 text-success border-success dark:bg-success/40 dark:text-success dark:border-success",
    badge: "bg-emerald-500",
  },
  CANCELLED: {
    label: "ملغي",
    color: "bg-rose-50 text-destructive border-destructive dark:bg-destructive/40 dark:text-destructive dark:border-destructive",
    badge: "bg-rose-500",
  },
};

export const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string; badge: string }> = {
  UNPAID: {
    label: "غير مدفوع",
    color: "bg-rose-50 text-destructive border-destructive dark:bg-destructive/40 dark:text-destructive dark:border-destructive",
    badge: "bg-rose-500",
  },
  PARTIALLY_PAID: {
    label: "مدفوع جزئياً (عربون)",
    color: "bg-amber-50 text-warning border-warning dark:bg-warning/40 dark:text-warning dark:border-warning",
    badge: "bg-amber-500",
  },
  PAID: {
    label: "مدفوع بالكامل",
    color: "bg-emerald-50 text-success border-success dark:bg-success/40 dark:text-success dark:border-success",
    badge: "bg-emerald-500",
  },
  REFUNDED: {
    label: "مسترد",
    color: "bg-gray-100 text-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border",
    badge: "bg-gray-400",
  },
};

export const PAYMENT_METHOD_NAMES: Record<string, string> = {
  CASH: "نقداً (كاش)",
  VODAFONE_CASH: "فودافون كاش / محافظ",
  INSTAPAY: "إنستاباي (InstaPay)",
  BANK_TRANSFER: "تحويل بنكي",
  CARD: "بطاقة دفع إلكتروني",
  OTHER: "أخرى",
};

export interface PaymentFormState {
  totalAmount: number;
  newPaymentAmount: string;
  paymentMethod: string;
  newPaymentNote: string;
}

export const formatFileSize = (bytes?: number) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});
