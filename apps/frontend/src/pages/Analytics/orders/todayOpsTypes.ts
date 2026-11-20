export interface TeamMember {
  name: string;
  confirms: number;
  cancels: number;
  others: number;
  total: number;
}

export interface ActionItem {
  id: string;
  orderLabel: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  createdAt: string;
  orderDate: string;
  isOldOrder: boolean;
}

export interface PendingItem {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  status: string;
  sourceType: string;
  createdAt: string;
}

export interface StatusRow {
  status: string;
  count: number;
}

export interface HourlyRow {
  hour: number;
  count: number;
}

export interface TodayActions {
  confirms: number;
  cancels: number;
  total: number;
  team: TeamMember[];
  feed: ActionItem[];
}

export interface DaySnapshot {
  date: string;
  totalOrders: number;
  regular: number;
  guests: number;
  pendingList: PendingItem[];
  pendingListGuests: PendingItem[];
  statusBreakdown: StatusRow[];
  hourly: HourlyRow[];
}

export interface PageData {
  todayActions: TodayActions;
  daySnapshot: DaySnapshot;
}

export function statusBadge(status: string | null): string {
  const m: Record<string, string> = {
    CONFIRMED: "bg-emerald-500/10 text-success dark:text-success border border-success/20",
    PENDING: "bg-amber-500/10 text-warning dark:text-warning border border-warning/20",
    CANCELLED: "bg-rose-500/10 text-destructive dark:text-destructive border border-destructive/20",
    DELIVERED: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
    PROCESSING: "bg-indigo-500/10 text-primary border border-primary/20",
    SHIPPED: "bg-purple-500/10 text-primary dark:text-primary border border-primary/20",
    REFUNDED: "bg-orange-500/10 text-warning dark:text-warning border border-warning/20",
    DUPLICATE_ORDER: "bg-muted text-muted-foreground border border-border/70",
  };
  return m[status || ""] || "bg-muted text-muted-foreground border border-border/70";
}

export function statusLabel(status: string | null): string {
  const m: Record<string, string> = {
    CONFIRMED: "مؤكد",
    PENDING: "معلق",
    CANCELLED: "ملغي",
    DELIVERED: "تم التسليم",
    PROCESSING: "قيد المعالجة",
    SHIPPED: "تم الشحن",
    REFUNDED: "مسترجع",
    DUPLICATE_ORDER: "مكرر",
  };
  return m[status || ""] || status || "-";
}

export function fmtTime(d: string): string {
  if (!d) return "-";
  const date = new Date(d);
  return (
    date.toLocaleDateString("ar-EG", { month: "short", day: "numeric" }) +
    " " +
    date.getHours().toString().padStart(2, "0") +
    ":" +
    date.getMinutes().toString().padStart(2, "0")
  );
}

export function fmtHour(h: number): string {
  return h.toString().padStart(2, "0") + ":00";
}
