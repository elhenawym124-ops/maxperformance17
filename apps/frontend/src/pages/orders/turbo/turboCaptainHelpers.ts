export interface OrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  shipping: number;
  status: string;
  turboShipmentId: string;
  turboTrackingNumber: string;
  turboShipmentStatus: string;
  turboDelayReason: string | null;
  turboReturnReason: string | null;
  turboExpectedBranch: string | null;
  governorate: string | null;
  city: string | null;
  createdAt: string;
}

export interface CaptainInfo {
  name: string;
  phone: string | null;
  branch: string | null;
  branchPhone: string | null;
}

export interface Stats {
  total: number;
  delivered: number;
  returned: number;
  active: number;
  delayed: number;
  remitted: number;
  totalRevenue: number;
  totalShipping: number;
  deliveryRate: number;
  delayReasons: Record<string, number>;
  returnReasons: Record<string, number>;
}

export const statusBadgeClass = (status: string) => {
  const s = (status || "").toLowerCase().trim();
  if (s === "delivered" || s === "remitted")
    return "bg-success/10 text-success dark:text-success border border-success/20";
  if (s.startsWith("returned"))
    return "bg-destructive/10 text-destructive dark:text-destructive border border-destructive/20";
  if (s === "delayed")
    return "bg-warning/10 text-warning dark:text-warning border border-warning/20";
  return "bg-primary/10 text-primary border border-primary/20";
};

export const statusArabic = (status: string) => {
  const s = (status || "").toLowerCase().trim();
  if (s === "delivered") return "تم التسليم";
  if (s === "remitted") return "تم التوريد";
  if (s.startsWith("returned")) return "مرتجع";
  if (s === "delayed") return "مؤجلة";
  if (s === "processing") return "قيد التنفيذ";
  if (s === "turbo_sent") return "قيد الانتظار";
  if (s === "turbo_saved") return "محفوظة";
  if (s === "out_for_delivery") return "مسلمة للمندوب";
  if (s === "created") return "منشأة";
  return s;
};
