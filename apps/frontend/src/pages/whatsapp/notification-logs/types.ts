export interface LogEntry {
  id: string;
  status: string;
  messageType: string;
  sessionId?: string | null;
  recipientPhone: string;
  recipientName?: string | null;
  eventType: string;
  category: string;
  content?: string | null;
  failureReason?: string | null;
  errorCode?: string | null;
  whatsappMessageId?: string | null;
  createdAt: string;
  templateName?: string | null;
  metaTemplateName?: string | null;
  templateChannel?: string | null;
  orderNumber?: string | null;
  orderTotal?: string | null;
  sessionName?: string | null;
  sessionPhone?: string | null;
  sessionProvider?: string | null;
}

export const STATUS_STYLES: Record<string, string> = {
  SENT: 'border-emerald-200 bg-success/10 text-success dark:border-success/40 dark:bg-success/20 dark:text-success',
  DELIVERED:
    'border-emerald-200 bg-success/10 text-success dark:border-success/40 dark:bg-success/20 dark:text-success',
  READ: 'border-sky-200 bg-info/10 text-info dark:border-info/40 dark:bg-info/20 dark:text-info',
  FAILED:
    'border-red-200 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20 dark:text-destructive',
  PENDING:
    'border-amber-200 bg-warning/10 text-warning dark:border-warning/40 dark:bg-warning/20 dark:text-warning',
  CANCELLED:
    'border-slate-200 bg-muted text-foreground dark:border-border dark:bg-muted dark:text-muted-foreground',
};

export const MESSAGE_TYPE_STYLES: Record<string, string> = {
  TEMPLATE:
    'border-indigo-200 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20 dark:text-primary',
  BUTTONS:
    'border-violet-200 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20 dark:text-primary',
  TEXT: 'border-slate-200 bg-muted text-foreground dark:border-border dark:bg-muted dark:text-muted-foreground',
  LIST: 'border-amber-200 bg-warning/10 text-warning dark:border-warning/40 dark:bg-warning/20 dark:text-warning',
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  QUEUED: 'في الطابور',
  SENDING: 'جاري الإرسال',
  SENT: 'تم الإرسال',
  DELIVERED: 'تم التسليم',
  READ: 'تمت القراءة',
  FAILED: 'فشل',
  CANCELLED: 'ملغي',
};

export const MESSAGE_TYPE_LABELS: Record<string, string> = {
  TEMPLATE: 'قالب ميتا',
  BUTTONS: 'أزرار',
  TEXT: 'نص حر',
  LIST: 'قائمة',
};

export const EVENT_LABELS: Record<string, string> = {
  ORDER_CREATED: 'طلب جديد',
  ORDER_CONFIRMED: 'تأكيد الطلب',
  ORDER_PROCESSING: 'قيد التنفيذ',
  ORDER_SHIPPED: 'تم الشحن',
  ORDER_DELIVERED: 'تم التسليم',
  ORDER_CANCELLED: 'إلغاء الطلب',
  ORDER_RETURNED: 'تم الإرجاع',
  PAYMENT_REMINDER: 'تذكير بالدفع',
  ABANDONED_CART: 'سلة متروكة',
  WELCOME_MESSAGE: 'رسالة ترحيب',
};

export const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
