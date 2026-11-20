import { Clock, FileCheck, FileText, CalendarCheck, ShieldAlert } from "lucide-react";
import { ActionKind, CounterKey } from "./types";

export const MANAGER_ROLES = ["SUPER_ADMIN", "COMPANY_ADMIN", "OWNER", "MANAGER"];

export const canManageRadiology = (): boolean => {
  try {
    return MANAGER_ROLES.includes((JSON.parse(localStorage.getItem("user") || "{}") as { role?: string }).role || "");
  } catch {
    return false;
  }
};

export const ACTION_META: Record<ActionKind, { labelKey: string; messageKey: string; toastKey: string; cls: string }> = {
  review: {
    labelKey: "radiology.reports.review",
    messageKey: "radiology.reports.reviewConfirm",
    toastKey: "radiology.reports.reviewedToast",
    cls: "border-yellow-300 text-warning bg-warning/10 hover:bg-warning dark:border-warning dark:text-warning dark:bg-warning/30 dark:hover:bg-warning/50",
  },
  sign: {
    labelKey: "radiology.reports.sign",
    messageKey: "radiology.reports.signConfirm",
    toastKey: "radiology.reports.signedToast",
    cls: "border-green-300 text-success bg-success/10 hover:bg-success dark:border-success dark:text-success dark:bg-success/30 dark:hover:bg-success/50",
  },
  deliver: {
    labelKey: "radiology.reports.deliver",
    messageKey: "radiology.reports.deliverConfirm",
    toastKey: "radiology.reports.deliveredToast",
    cls: "border-teal-300 text-success bg-success/10 hover:bg-success dark:border-success dark:text-success dark:bg-success/30 dark:hover:bg-success/50",
  },
};

export const nextActionFor = (status: string): ActionKind | null => {
  switch (status) {
    case "DRAFT":
      return "review";
    case "REVIEWED":
      return "sign";
    case "SIGNED":
      return "deliver";
    default:
      return null;
  }
};

export const CLINICAL_PHRASES = [
  "الحالة ذات جودة فنية مناسبة.",
  "لا يوجد دليل على كسور حادة.",
  "المناطق الظليلة ضمن الحدود الطبيعية.",
];

export const IMPRESSION_PHRASES = [
  "تقرير ضمن الحدود الطبيعية.",
  "ينصح بمتابعة سريرية.",
  "ينصح بفحص إشعاعي إضافي للتوضيح.",
];

export const KPI_CARDS: Array<{ key: CounterKey; labelKey: string; icon: typeof FileText; iconCls: string }> = [
  { key: "total", labelKey: "radiology.reports.total", icon: FileText, iconCls: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" },
  { key: "awaitingReview", labelKey: "radiology.reports.awaitingReview", icon: Clock, iconCls: "bg-amber-100 text-warning dark:bg-warning/40 dark:text-warning" },
  { key: "awaitingSign", labelKey: "radiology.reports.awaitingSign", icon: FileCheck, iconCls: "bg-green-100 text-success dark:bg-success/40 dark:text-success" },
  { key: "deliveredToday", labelKey: "radiology.reports.deliveredToday", icon: CalendarCheck, iconCls: "bg-teal-100 text-success dark:bg-success/40 dark:text-success" },
  { key: "critical", labelKey: "radiology.reports.critical", icon: ShieldAlert, iconCls: "bg-red-100 text-destructive dark:bg-destructive/40 dark:text-destructive" },
];

export const ROLES = [
  { key: "typed", labelKey: "radiology.reports.typedBy", field: "typedBy" },
  { key: "reviewed", labelKey: "radiology.reports.reviewedBy", field: "reviewedBy" },
  { key: "signed", labelKey: "radiology.reports.signedBy", field: "signedBy" },
] as const;

export const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("ar-EG") : "—");
