const severityClasses: Record<string, string> = {
  success:
    "border-emerald-200 bg-success/10 text-success dark:border-success/70 dark:bg-success/40 dark:text-success",
  warning:
    "border-amber-200 bg-warning/10 text-warning dark:border-warning/70 dark:bg-warning/40 dark:text-warning",
  danger:
    "border-rose-200 bg-destructive/10 text-destructive dark:border-destructive/70 dark:bg-destructive/40 dark:text-destructive",
  info:
    "border-sky-200 bg-info/10 text-info dark:border-info/70 dark:bg-info/40 dark:text-info",
  neutral:
    "border-slate-200 bg-muted text-foreground dark:border-border dark:bg-muted dark:text-muted-foreground",
  blue:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/70 dark:bg-blue-950/40 dark:text-blue-300",
};

const statusMap: Record<string, Record<string, { label: string; severity: string }>> = {
  subscription: {
    ACTIVE: { label: "نشط", severity: "success" },
    TRIAL: { label: "تجريبي", severity: "info" },
    PAUSED: { label: "متوقف مؤقتًا", severity: "warning" },
    CANCELLED: { label: "ملغي", severity: "danger" },
    EXPIRED: { label: "منتهي", severity: "danger" },
  },
  invoice: {
    PAID: { label: "مدفوعة", severity: "success" },
    OVERDUE: { label: "متأخرة", severity: "danger" },
    SENT: { label: "مرسلة", severity: "warning" },
    DRAFT: { label: "مسودة", severity: "neutral" },
    CANCELLED: { label: "ملغية", severity: "neutral" },
  },
  payment: {
    COMPLETED: { label: "مكتمل", severity: "success" },
    FAILED: { label: "فاشل", severity: "danger" },
    PENDING: { label: "معلق", severity: "warning" },
  },
  receipt: {
    APPROVED: { label: "مقبول", severity: "success" },
    REJECTED: { label: "مرفوض", severity: "danger" },
    PENDING: { label: "قيد المراجعة", severity: "warning" },
  },
  app: {
    ACTIVE: { label: "مفعل", severity: "success" },
    TRIAL: { label: "تجريبي", severity: "info" },
    CANCELLED: { label: "ملغي", severity: "danger" },
    SUSPENDED: { label: "موقوف", severity: "warning" },
  },
  ticket: {
    OPEN: { label: "مفتوحة", severity: "warning" },
    IN_PROGRESS: { label: "قيد المعالجة", severity: "info" },
    WAITING_FOR_RESPONSE: { label: "بانتظار الرد", severity: "warning" },
    WAITING_FOR_CUSTOMER: { label: "بانتظار العميل", severity: "warning" },
    WAITING_FOR_ADMIN: { label: "بانتظار الإدارة", severity: "info" },
    PENDING: { label: "قيد الانتظار", severity: "warning" },
    REOPENED: { label: "أعيد فتحها", severity: "warning" },
    ESCALATED: { label: "مصعّدة", severity: "danger" },
    ON_HOLD: { label: "معلقة", severity: "neutral" },
    RESOLVED: { label: "تم الحل", severity: "success" },
    CLOSED: { label: "مغلقة", severity: "neutral" },
  },
  priority: {
    LOW: { label: "منخفضة", severity: "neutral" },
    MEDIUM: { label: "متوسطة", severity: "info" },
    NORMAL: { label: "عادية", severity: "info" },
    HIGH: { label: "عالية", severity: "warning" },
    URGENT: { label: "عاجلة", severity: "danger" },
    CRITICAL: { label: "حرجة", severity: "danger" },
  },
  user: {
    ACTIVE: { label: "نشط", severity: "success" },
    INACTIVE: { label: "غير نشط", severity: "neutral" },
    SUSPENDED: { label: "موقوف", severity: "danger" },
    NEVER_LOGGED_IN: { label: "لم يسجل دخول", severity: "warning" },
  },
  activity: {
    CRITICAL: { label: "حرج", severity: "danger" },
    HIGH: { label: "مرتفع", severity: "warning" },
    WARNING: { label: "تحذير", severity: "warning" },
    MEDIUM: { label: "متوسط", severity: "info" },
    INFO: { label: "معلومة", severity: "info" },
    LOW: { label: "منخفض", severity: "neutral" },
  },
  company: {
    ACTIVE: { label: "نشطة", severity: "success" },
    INACTIVE: { label: "متوقفة", severity: "danger" },
    TRIAL: { label: "تجريبية", severity: "info" },
    SUSPENDED: { label: "موقوفة", severity: "danger" },
  },
  channel: {
    CONNECTED: { label: "متصلة", severity: "success" },
    DISCONNECTED: { label: "غير متصلة", severity: "danger" },
    EXPIRED: { label: "منتهية", severity: "warning" },
    WHATSAPP: { label: "واتساب", severity: "success" },
    FACEBOOK: { label: "فيسبوك", severity: "info" },
    INSTAGRAM: { label: "انستغرام", severity: "warning" },
    TELEGRAM: { label: "تيليجرام", severity: "blue" },
  },
  pricingModel: {
    FREE: { label: "مجاني", severity: "neutral" },
    PAY_PER_USE: { label: "حسب الاستخدام", severity: "blue" },
    SUBSCRIPTION: { label: "اشتراك شهري", severity: "info" },
    HYBRID: { label: "هجين", severity: "warning" },
  },
  role: {
    OWNER: { label: "مالك الشركة", severity: "info" },
    SUPER_ADMIN: { label: "حساب نظام (مسؤول عام)", severity: "blue" },
    SYSTEM: { label: "حساب نظام", severity: "blue" },
    BOT: { label: "حساب آلي", severity: "blue" },
    API: { label: "حساب ربط برمجي", severity: "blue" },
    SERVICE: { label: "حساب خدمة", severity: "blue" },
    PROJECT_MANAGER: { label: "حساب نظام (مدير مشروع)", severity: "blue" },
    TEAM_LEAD: { label: "حساب نظام (قائد فريق)", severity: "blue" },
    DEVELOPER: { label: "حساب نظام (مطوّر)", severity: "blue" },
    TESTER: { label: "حساب نظام (مختبر)", severity: "blue" },
    COMPANY_ADMIN: { label: "مدير شركة", severity: "blue" },
    MANAGER: { label: "مدير", severity: "info" },
    AGENT: { label: "موظف", severity: "neutral" },
    AFFILIATE: { label: "مسوّق بالعمولة", severity: "warning" },
  },
};

export function getStatusMeta(category: string, status?: string): { label: string; className: string } {
  if (!status) {
    return { label: "غير محدد", className: severityClasses["neutral"] ?? "" };
  }
  const trimmed = String(status).trim();
  const normalizedKey = trimmed.toUpperCase().replace(/[\s-]+/g, "_");
  const entry = statusMap[category]?.[normalizedKey] || statusMap[category]?.[trimmed];
  if (entry) {
    return { label: entry.label, className: severityClasses[entry.severity] ?? "" };
  }

  return { label: "غير محدد", className: severityClasses["neutral"] ?? "" };
}
