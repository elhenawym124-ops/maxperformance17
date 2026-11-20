import React from "react";
import { AffiliateUser, MoneyValue } from "./types";

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  return fallback;
};

export const toNumber = (value: MoneyValue) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatPrice = (amount: number, _currency = "EGP") => {
  return `${amount.toLocaleString("ar-EG")} ج.م`;
};

export const formatDate = (date?: string | null) => {
  if (!date) return "غير محدد";
  return new Date(date).toLocaleString("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export const getDisplayName = (user?: AffiliateUser | null) => {
  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  return fullName || user?.email || "مسوق بدون اسم";
};

export const statusLabels: Record<string, string> = {
  ACTIVE: "نشط",
  PENDING: "قيد المراجعة",
  SUSPENDED: "موقوف",
  CONFIRMED: "مؤكدة",
  PAID: "تم السداد",
  PROCESSED: "تم التحويل",
  CANCELLED: "ملغية",
  FAILED: "فشل",
  DELIVERED: "تم التسليم",
  PROCESSING: "قيد التجهيز",
  SHIPPED: "تم الشحن",
};

export const statusTone = (status?: string | null) => {
  switch (String(status || "").toUpperCase()) {
    case "ACTIVE":
    case "CONFIRMED":
    case "DELIVERED":
    case "PAID":
    case "PROCESSED":
      return "border-emerald-200 bg-success/10 text-success dark:border-success/20 dark:bg-success/10 dark:text-success";
    case "PENDING":
    case "PROCESSING":
    case "SHIPPED":
      return "border-amber-200 bg-warning/10 text-warning dark:border-warning/20 dark:bg-warning/10 dark:text-warning";
    case "SUSPENDED":
    case "CANCELLED":
    case "FAILED":
      return "border-red-200 bg-destructive/10 text-destructive dark:border-destructive/20 dark:bg-destructive/10 dark:text-destructive";
    default:
      return "border-slate-200 bg-muted text-foreground dark:border-border dark:bg-muted dark:text-muted-foreground";
  }
};

export const getDocumentStatusLabel = (status?: string | null) => {
  switch (status) {
    case "APPROVED":
      return "المستند معتمد";
    case "REJECTED":
      return "المستند مرفوض";
    case "PENDING_REVIEW":
      return "المستند قيد المراجعة";
    default:
      return "لا يوجد مستند";
  }
};

export const parsePaymentDetails = (value?: unknown) => {
  if (!value) return "غير محدد";
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${key}: ${String(item)}`)
      .join("، ");
  }
  const text = String(value).trim();
  if (!text) return "غير محدد";
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return Object.entries(parsed)
      .map(([key, item]) => `${key}: ${String(item)}`)
      .join("، ");
  } catch (_) {
    return text;
  }
};

export const MetricCard: React.FC<{
  icon: React.ElementType;
  label: string;
  sub?: string;
  value: React.ReactNode;
}> = ({ icon: Icon, label, sub, value }) => (
  <div className="rounded-xl border border-border bg-white p-4 shadow-sm dark:border-border dark:bg-muted">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground dark:text-muted-foreground">
          {label}
        </p>
        <div className="mt-2 text-xl font-bold text-foreground dark:text-white tabular-nums">
          {value}
        </div>
      </div>
      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted text-foreground dark:border-border dark:bg-muted dark:text-muted-foreground">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
    </div>
    {sub ? <p className="mt-3 text-xs text-muted-foreground">{sub}</p> : null}
  </div>
);
