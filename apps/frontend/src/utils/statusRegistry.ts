export interface StatusDisplayInfo {
  code: string;
  label: string;
  labelKey: string;
  colorClass: string;
  source: 'turbo' | 'system';
}

export interface OrderStatusDisplay {
  primary: StatusDisplayInfo;
  secondary?: StatusDisplayInfo;
}

/** All known system order statuses with display info */
const SYSTEM_STATUS_DEFS: Record<string, { label: string; labelKey: string; colorClass: string }> = {
  NEW:                  { label: 'طلب جديد',             labelKey: 'orders.new',               colorClass: 'bg-info/10 text-info dark:bg-info/40 dark:text-info' },
  IN_PROGRESS:          { label: 'قيد التنفيذ',           labelKey: 'orders.inProgress',        colorClass: 'bg-warning/10 text-warning dark:bg-warning/40 dark:text-warning' },
  PENDING:              { label: 'قيد الانتظار',         labelKey: 'orders.pending',           colorClass: 'bg-warning/10 text-warning dark:bg-warning/40 dark:text-warning' },
  DRAFT:                { label: 'مسودة',                labelKey: 'orders.draft',             colorClass: 'bg-muted text-muted-foreground' },
  CONFIRMED:            { label: 'مؤكد',                 labelKey: 'orders.confirmed',         colorClass: 'bg-info/10 text-info dark:bg-info/40 dark:text-info' },
  SCHEDULED:            { label: 'طلب مجدول',            labelKey: 'orders.scheduled',         colorClass: 'bg-warning/10 text-warning dark:bg-warning/40 dark:text-warning' },
  ON_HOLD:              { label: 'معلق',                 labelKey: 'orders.onHold',            colorClass: 'bg-warning/10 text-warning dark:bg-warning/40 dark:text-warning' },
  PROCESSING:           { label: 'قيد التنفيذ',           labelKey: 'orders.processing',        colorClass: 'bg-primary/10 text-primary dark:bg-primary/40 dark:text-primary' },
  SHIPPED:              { label: 'تم الشحن',             labelKey: 'orders.shipped',           colorClass: 'bg-tertiary/10 text-tertiary dark:bg-tertiary/40 dark:text-tertiary' },
  DELIVERED:            { label: 'تم التسليم',           labelKey: 'orders.delivered',         colorClass: 'bg-success/10 text-success dark:bg-success/40 dark:text-success' },
  CANCELLED:            { label: 'ملغي',                 labelKey: 'orders.cancelled',         colorClass: 'bg-destructive/10 text-destructive dark:bg-destructive/40 dark:text-destructive' },
  DUPLICATE_ORDER:      { label: 'طلب مكرر',             labelKey: 'orders.duplicate',         colorClass: 'bg-warning/10 text-warning dark:bg-warning/40 dark:text-warning' },
  REFUNDED:             { label: 'مسترد',                labelKey: 'orders.refunded',          colorClass: 'bg-muted text-muted-foreground' },
  PARTIALLY_REFUNDED:   { label: 'مسترد جزئياً',         labelKey: 'orders.partiallyRefunded', colorClass: 'bg-muted text-muted-foreground' },
  RETURNED:             { label: 'مرتجع',                labelKey: 'orders.returned',          colorClass: 'bg-destructive/10 text-destructive dark:bg-destructive/40 dark:text-destructive' },
  PARTIALLY_RETURNED:   { label: 'مرتجع جزئي',           labelKey: 'orders.partiallyReturned', colorClass: 'bg-destructive/10 text-destructive dark:bg-destructive/40 dark:text-destructive' },
  PARTIALLY_DELIVERED:  { label: 'تسليم جزئي',           labelKey: 'orders.partiallyDelivered',colorClass: 'bg-warning/10 text-warning dark:bg-warning/40 dark:text-warning' },
  EXCHANGED:            { label: 'استبدال',              labelKey: 'orders.exchanged',         colorClass: 'bg-tertiary/10 text-tertiary dark:bg-tertiary/40 dark:text-tertiary' },
  TRASH:                { label: 'سلة المحذوفات',        labelKey: 'orders.trash',             colorClass: 'bg-muted text-muted-foreground' },
  TRASH_ORDER:          { label: 'سلة المحذوفات',        labelKey: 'orders.trash',             colorClass: 'bg-muted text-muted-foreground' },
  READY_TO_SHIP:        { label: 'جاهز للشحن',           labelKey: 'orders.readyToShip',       colorClass: 'bg-success/10 text-success dark:bg-success/40 dark:text-success' },
  OUT_FOR_DELIVERY:     { label: 'خرج للتسليم',          labelKey: 'orders.outForDelivery',    colorClass: 'bg-tertiary/10 text-tertiary dark:bg-tertiary/40 dark:text-tertiary' },
  LOST:                 { label: 'مفقود',                labelKey: 'orders.lost',              colorClass: 'bg-destructive/10 text-destructive dark:bg-destructive/40 dark:text-destructive' },
  INCOMPLETE:           { label: 'غير مكتمل',            labelKey: 'orders.incomplete',        colorClass: 'bg-warning/10 text-warning dark:bg-warning/40 dark:text-warning' },
  PENDING_PREPARATION:  { label: 'بانتظار التجهيز',      labelKey: 'orders.pendingPreparation',colorClass: 'bg-warning/10 text-warning dark:bg-warning/40 dark:text-warning' },
  PREPARING:            { label: 'قيد التجهيز',          labelKey: 'orders.preparing',         colorClass: 'bg-info/10 text-info dark:bg-info/40 dark:text-info' },
  READY:                { label: 'جاهز للشحن',           labelKey: 'orders.ready',              colorClass: 'bg-success/10 text-success dark:bg-success/40 dark:text-success' },
  QUALITY_CHECK:        { label: 'فحص الجودة',           labelKey: 'orders.qualityCheck',      colorClass: 'bg-secondary/10 text-secondary dark:bg-secondary/40 dark:text-secondary' },
  PACKAGED:             { label: 'تم التعبئة',           labelKey: 'orders.packaged',          colorClass: 'bg-secondary/10 text-secondary dark:bg-secondary/40 dark:text-secondary' },
  ON_HOLD_PREP:         { label: 'تجهيز معلق',           labelKey: 'orders.onHoldPrep',        colorClass: 'bg-warning/10 text-warning dark:bg-warning/40 dark:text-warning' },
  NOT_SHIPPED:          { label: 'لم يتم الشحن',         labelKey: 'orders.notShipped',        colorClass: 'bg-muted text-muted-foreground' },
  REFUNDED_PARTIALLY:   { label: 'مسترد جزئياً',          labelKey: 'orders.partiallyRefunded', colorClass: 'bg-muted text-muted-foreground' },
  COMPLETED:            { label: 'مدفوع',                labelKey: 'orders.completed',         colorClass: 'bg-success/10 text-success dark:bg-success/40 dark:text-success' },
  FAILED:               { label: 'فشل الدفع',             labelKey: 'orders.failed',            colorClass: 'bg-destructive/10 text-destructive dark:bg-destructive/40 dark:text-destructive' },
  STOCK_SHORTAGE:       { label: 'عجز مخزون',            labelKey: 'orders.stockShortage',     colorClass: 'bg-destructive/10 text-destructive dark:bg-destructive/40 dark:text-destructive' },
  SHORTAGE_FAILED:      { label: 'عجز نهائي',            labelKey: 'orders.shortageFailed',    colorClass: 'bg-tertiary/10 text-tertiary dark:bg-tertiary/40 dark:text-tertiary' },
  WOO_TAGHEZ:           { label: 'Woo Taghez',           labelKey: 'orders.wooTaghez',         colorClass: 'bg-muted text-muted-foreground' },
  PENDING_CANCELLATION: { label: 'بانتظار الإلغاء',      labelKey: 'orders.pendingCancellation',colorClass: 'bg-tertiary/10 text-tertiary dark:bg-tertiary/40 dark:text-tertiary' },
  BDONKODTERBO:         { label: 'بدون كود تيربو',       labelKey: 'orders.bdonkodterbo',      colorClass: 'bg-muted text-muted-foreground' },
};

/** Canonical turbo statuses with display info */
const TURBO_STATUS_DEFS: Record<string, { label: string; labelKey: string; colorClass: string }> = {
  turbo_saved:           { label: 'محفوظة قبل الشحن',       labelKey: 'orders.turboSaved',          colorClass: 'bg-info/10 text-info border border-info/30 dark:bg-info/40 dark:text-info dark:border-info/40' },
  turbo_sent:            { label: 'قيد الانتظار (تربو)',     labelKey: 'orders.turboSent',           colorClass: 'bg-primary/10 text-primary border border-primary/30 dark:bg-primary/40 dark:text-primary dark:border-primary/40' },
  processing:            { label: 'قيد التنفيذ (بالفرع)',    labelKey: 'orders.turboProcessing',     colorClass: 'bg-tertiary/10 text-tertiary border border-tertiary/30 dark:bg-tertiary/40 dark:text-tertiary dark:border-tertiary/40' },
  out_for_delivery:      { label: 'مسلمة للمندوب',          labelKey: 'orders.turboOutForDelivery', colorClass: 'bg-warning/10 text-warning border border-warning/30 dark:bg-warning/40 dark:text-warning dark:border-warning/40' },
  returned_to_company:   { label: 'مرتجعات بالشركة',        labelKey: 'orders.turboReturnedToCompany', colorClass: 'bg-destructive/10 text-destructive border border-destructive/30 dark:bg-destructive/40 dark:text-destructive dark:border-destructive/40' },
  cancelled:             { label: 'ملغي من الشحن',          labelKey: 'orders.turboCancelled',      colorClass: 'bg-destructive/10 text-destructive border border-destructive/30 dark:bg-destructive/40 dark:text-destructive dark:border-destructive/40' },
  delivered:             { label: 'تم التسليم',             labelKey: 'orders.turboDelivered',      colorClass: 'bg-success/10 text-success border border-success/30 dark:bg-success/40 dark:text-success dark:border-success/40' },
  remitted:              { label: 'تم التوريد والتحصيل',    labelKey: 'orders.turboRemitted',       colorClass: 'bg-success/10 text-success border border-success/30 dark:bg-success/40 dark:text-success dark:border-success/40' },
  archived:              { label: 'شحنة محذوفة',            labelKey: 'orders.turboArchived',       colorClass: 'bg-muted text-muted-foreground' },
  returned_resent:       { label: 'معاد إرسالها',           labelKey: 'orders.turboReturnedResent', colorClass: 'bg-info/10 text-info border border-info/30 dark:bg-info/40 dark:text-info dark:border-info/40' },
  returned_missing:      { label: 'مرتجع مفقود',            labelKey: 'orders.turboReturnedMissing',colorClass: 'bg-warning/10 text-warning border border-warning/30 dark:bg-warning/40 dark:text-warning dark:border-warning/40' },
  returned_destroyed:    { label: 'مرتجع معدوم',            labelKey: 'orders.turboReturnedDestroyed',colorClass: 'bg-destructive/10 text-destructive border border-destructive/30 dark:bg-destructive/40 dark:text-destructive dark:border-destructive/40' },
  returned_received:     { label: 'مرتجعات وصلتني',          labelKey: 'orders.turboReturnedReceived', colorClass: 'bg-tertiary/10 text-tertiary border border-tertiary/30 dark:bg-tertiary/40 dark:text-tertiary dark:border-tertiary/40' },
  returned_to_customer:  { label: 'مرتجعة للعميل',            labelKey: 'orders.turboReturnedToCustomer', colorClass: 'bg-tertiary/10 text-tertiary border border-tertiary/30 dark:bg-tertiary/40 dark:text-tertiary dark:border-tertiary/40' },
  delayed:               { label: 'مؤجلة مع المندوب',       labelKey: 'orders.turboDelayed',        colorClass: 'bg-warning/10 text-warning border border-warning/30 dark:bg-warning/40 dark:text-warning dark:border-warning/40' },
  incomplete:            { label: 'غير مكتملة',            labelKey: 'orders.turboIncomplete',     colorClass: 'bg-muted text-muted-foreground' },
  turbo_syncing:         { label: 'شحنة مرتبطة — قيد المزامنة', labelKey: 'orders.turboSyncing', colorClass: 'bg-muted text-muted-foreground' },
};

/** Map any raw turbo alias → canonical code */
const TURBO_ALIASES: Record<string, string> = {
  '1': 'turbo_sent', 'status_1': 'turbo_sent', 'booked': 'turbo_sent',
  'created': 'turbo_saved', 'turbo_saved': 'turbo_saved',
  '2': 'turbo_sent', 'sent': 'turbo_sent', 'turbo_sent': 'turbo_sent', 'status_2': 'turbo_sent', 'waiting': 'turbo_sent', 'pending': 'turbo_sent', 'قيد الانتظار': 'turbo_sent', 'انتظار': 'turbo_sent', 'بانتظار الاستلام': 'turbo_sent',
  '3': 'processing', 'processing': 'processing', 'underway': 'processing', 'accepted': 'processing', 'status_3': 'processing', 'preparing': 'processing', 'قيد التنفيذ': 'processing', 'تنفيذ': 'processing', 'قيد التنفيذ بالفرع': 'processing',
  '4': 'out_for_delivery', 'out_for_delivery': 'out_for_delivery', 'under delivery': 'out_for_delivery',
  'with captain': 'out_for_delivery', 'in transit': 'out_for_delivery', 'shipped': 'out_for_delivery', 'status_4': 'out_for_delivery',
  '5': 'returned_to_company', 'returned_to_company': 'returned_to_company', 'returned with company': 'returned_to_company', 'status_5': 'returned_to_company',
  '6': 'cancelled', 'cancelled': 'cancelled', 'status_6': 'cancelled',
  '7': 'delivered', 'delivered': 'delivered', 'status_7': 'delivered',
  '8': 'remitted', 'remitted': 'remitted', 'supplied': 'remitted', 'status_8': 'remitted',
  '9': 'archived', 'archived': 'archived', 'status_9': 'archived',
  '10': 'returned_resent', 'returned_resent': 'returned_resent', 'status_10': 'returned_resent',
  '11': 'returned_missing', 'returned_missing': 'returned_missing', 'lost': 'returned_missing', 'status_11': 'returned_missing',
  '12': 'returned_destroyed', 'returned_destroyed': 'returned_destroyed', 'status_12': 'returned_destroyed',
  '13': 'delayed', 'delayed': 'delayed', 'on hold': 'delayed', 'failed delivery': 'delayed', 'rescheduled': 'delayed', 'status_13': 'delayed',
  '14': 'returned_to_company', 'status_14': 'returned_to_company',
  '15': 'returned_resent', 'status_15': 'returned_resent',
  '16': 'returned_missing', 'status_16': 'returned_missing',
  '17': 'returned_destroyed', 'status_17': 'returned_destroyed',
  '18': 'incomplete', 'status_18': 'incomplete', 'incomplete': 'incomplete', 'غير مكتملة': 'incomplete',
  '19': 'remitted', 'status_19': 'remitted',
  'مؤجلة': 'delayed', 'مؤجله': 'delayed', 'مؤجل': 'delayed', 'تأجيل': 'delayed', 'مؤجلة مع المندوب': 'delayed', 'قيد الانتظار مع المندوب': 'delayed',
  'تم التسليم': 'delivered', 'مرتجع مع الشركة': 'returned_to_company', 'مرتجعات بالشركة': 'returned_to_company',
  '20': 'returned_received', 'returned_received': 'returned_received', 'status_20': 'returned_received', 'مرتجعات وصلتني': 'returned_received',
  'returned_to_customer': 'returned_to_customer', 'مرتجعة': 'returned_to_customer',
};

export interface OrderLike {
  status?: string | null;
  effectiveStatus?: string | null;
  turboShipmentStatus?: string | null;
  turboTrackingNumber?: string | null;
  turboShipmentId?: string | null;
}

const CUSTOM_STATUS_DEFS: Record<string, { label: string; labelKey: string; colorClass: string }> = {};

export function registerCustomStatuses(configs: Array<{ code?: string; name?: string; color?: string }>) {
  if (!Array.isArray(configs)) return;
  configs.forEach((cfg) => {
    if (!cfg || !cfg.code) return;
    const key = cfg.code.toUpperCase().trim().replace(/\s+/g, '_');
    CUSTOM_STATUS_DEFS[key] = {
      label: cfg.name || key.replace(/_/g, ' '),
      labelKey: '',
      colorClass: 'bg-muted text-muted-foreground',
    };
  });
}

function getSystemDef(code: string): { label: string; labelKey: string; colorClass: string } {
  let key = (code || 'PENDING').toUpperCase().trim();
  // Normalize: spaces → underscores, lowercase → uppercase (e.g. "Stock Shortage" → "STOCK_SHORTAGE")
  key = key.replace(/\s+/g, '_');
  return SYSTEM_STATUS_DEFS[key] || CUSTOM_STATUS_DEFS[key] || {
    label: key.replace(/_/g, ' '),
    labelKey: '',
    colorClass: 'bg-muted text-muted-foreground',
  };
}

function getTurboCanonical(raw: string): string | undefined {
  const key = raw.toLowerCase().trim();
  return TURBO_ALIASES[key];
}

function getTurboDef(canonical: string): { label: string; labelKey: string; colorClass: string } | undefined {
  return TURBO_STATUS_DEFS[canonical];
}

/**
 * Returns primary system status + secondary turbo status (if exists).
 * This is the main function for all pages to use.
 */
export function getOrderStatusDisplay(order: OrderLike): OrderStatusDisplay {
  const effectiveStatus = order.effectiveStatus || order.status || 'PENDING';
  const systemDef = getSystemDef(effectiveStatus);
  const primary: StatusDisplayInfo = {
    code: effectiveStatus.toUpperCase().trim(),
    label: systemDef.label,
    labelKey: systemDef.labelKey,
    colorClass: systemDef.colorClass,
    source: 'system',
  };

  let secondary: StatusDisplayInfo | undefined;
  const rawTurbo = order.turboShipmentStatus;
  if (rawTurbo) {
    const canonical = getTurboCanonical(rawTurbo);
    if (canonical) {
      const turboDef = getTurboDef(canonical);
      if (turboDef) {
        secondary = {
          code: canonical,
          label: `🚚 ${turboDef.label}`,
          labelKey: turboDef.labelKey,
          colorClass: turboDef.colorClass,
          source: 'turbo',
        };
      }
    }
  }

  if (!secondary && (order.turboTrackingNumber || order.turboShipmentId)) {
    const neutralDef = getTurboDef('turbo_syncing') || {
      label: 'شحنة مرتبطة — قيد المزامنة',
      labelKey: 'orders.turboSyncing',
      colorClass: 'bg-muted text-muted-foreground',
    };
    secondary = {
      code: 'turbo_syncing',
      label: `🚚 ${neutralDef.label}`,
      labelKey: neutralDef.labelKey,
      colorClass: neutralDef.colorClass,
      source: 'turbo',
    };
  }

  return { primary, secondary };
}

/**
 * Returns the system status display for an order (backward compatible).
 * Now shows SYSTEM status (not turbo) as primary.
 */
export const getUnifiedOrderStatus = (order: OrderLike): StatusDisplayInfo => {
  return getOrderStatusDisplay(order).primary;
};

/**
 * Returns display info for any system status code.
 */
export function getStatusDisplay(statusCode: string): StatusDisplayInfo {
  const def = getSystemDef(statusCode);
  return {
    code: statusCode.toUpperCase().trim(),
    label: def.label,
    labelKey: def.labelKey,
    colorClass: def.colorClass,
    source: 'system',
  };
}

/**
 * Returns display info for any turbo status string.
 */
export function getTurboStatusDisplay(statusCode: string): StatusDisplayInfo {
  const canonical = getTurboCanonical(statusCode) || statusCode;
  const def = getTurboDef(canonical) || {
    label: statusCode,
    labelKey: '',
    colorClass: 'bg-muted text-muted-foreground',
  };
  return {
    code: canonical,
    label: def.label,
    labelKey: def.labelKey,
    colorClass: def.colorClass,
    source: 'turbo',
  };
}

/**
 * All system status codes with their display info (for dropdowns, filters).
 */
export function getSystemStatusOptions(): { code: string; label: string }[] {
  return Object.entries(SYSTEM_STATUS_DEFS).map(([code, def]) => ({
    code,
    label: def.label,
  }));
}

/**
 * All turbo canonical codes with their display info (for dropdowns, filters).
 */
export function getTurboStatusOptions(): { code: string; label: string }[] {
  return Object.entries(TURBO_STATUS_DEFS).map(([code, def]) => ({
    code,
    label: def.label,
  }));
}

/**
 * Get the canonical turbo code for a raw status.
 */
export function normalizeTurboStatus(raw: string): string {
  return getTurboCanonical(raw) || raw.toLowerCase().trim();
}

export {
  SYSTEM_STATUS_DEFS,
  TURBO_STATUS_DEFS,
  TURBO_ALIASES,
};
