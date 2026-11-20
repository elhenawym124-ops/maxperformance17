export interface Stats {
  total: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  deliveryRate: string;
  readRate: string;
  byCategory: Record<string, number>;
  byEvent: Record<string, number>;
}

export interface NotificationLog {
  id: string;
  recipientPhone: string;
  recipientName: string;
  category: string;
  eventType: string;
  content: string;
  status: string;
  sentAt: string;
  createdAt: string;
  failureReason: string | null;
  template?: { name: string };
  order?: { orderNumber: string };
  customer?: { firstName: string; lastName: string };
}

export interface WhatsAppAnalyticsProps {
  companyId?: string;
  companyName?: string;
  superAdminMode?: boolean;
}

export const STATUS_BADGE_CLASSES: Record<string, string> = {
  PENDING:
    "border-amber-300/70 bg-warning/10 text-warning dark:border-warning/40 dark:text-warning",
  QUEUED:
    "border-sky-300/70 bg-info/10 text-info dark:border-info/40 dark:text-info",
  SENDING:
    "border-sky-300/70 bg-info/10 text-info dark:border-info/40 dark:text-info",
  SENT:
    "border-emerald-300/70 bg-success/10 text-success dark:border-success/40 dark:text-success",
  DELIVERED:
    "border-emerald-300/70 bg-success/10 text-success dark:border-success/40 dark:text-success",
  READ: "border-blue-300/70 bg-blue-500/10 text-blue-800 dark:border-blue-500/40 dark:text-blue-200",
  FAILED:
    "border-rose-300/70 bg-destructive/10 text-destructive dark:border-destructive/40 dark:text-destructive",
  CANCELLED:
    "border-slate-300/70 bg-muted text-foreground dark:border-border dark:text-muted-foreground",
};
