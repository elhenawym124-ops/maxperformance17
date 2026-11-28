/**
 * Hashtag Express status → MaxP legal order status map.
 *
 * Read-only map. It never creates order_status_configs rows and never adds a new
 * Arabic status: every target is an existing OrderStatus enum value, so provider
 * statuses stay provider-side and the merchant status list does not grow.
 */

const FINAL_SYSTEM_STATUSES = new Set([
  'DELIVERED',
  'PARTIALLY_DELIVERED',
  'RETURNED',
  'PARTIALLY_RETURNED',
  'CANCELLED',
  'LOST',
  'REFUNDED',
  'EXCHANGED',
]);

// Normalized provider status (lowercase, spaces/dashes/underscores removed) → mapsToSystem.
const HASHTAG_STATUS_MAP = Object.freeze({
  // pre-pickup
  new: 'PENDING',
  created: 'PENDING',
  registered: 'PENDING',
  pending: 'PENDING',
  waiting: 'PENDING',
  'قيدالانتظار': 'PENDING',
  'جديد': 'PENDING',
  'جديدة': 'PENDING',

  confirmed: 'CONFIRMED',
  approved: 'CONFIRMED',
  accepted: 'CONFIRMED',
  'تمالتأكيد': 'CONFIRMED',
  'مؤكد': 'CONFIRMED',

  // processing / handover
  preparing: 'PROCESSING',
  processing: 'PROCESSING',
  'underpreparation': 'PROCESSING',
  picked: 'PROCESSING',
  'pickedup': 'PROCESSING',
  received: 'PROCESSING',
  'receivedatwarehouse': 'PROCESSING',
  'atwarehouse': 'PROCESSING',
  'قيدالتجهيز': 'PROCESSING',
  'قيدالتنفيذ': 'PROCESSING',
  'تمالاستلام': 'PROCESSING',
  'فيالمستودع': 'PROCESSING',

  // in transit
  shipped: 'SHIPPED',
  dispatched: 'SHIPPED',
  intransit: 'SHIPPED',
  'in transit': 'SHIPPED',
  'ontheway': 'SHIPPED',
  transit: 'SHIPPED',
  'تمالشحن': 'SHIPPED',
  'قيدالنقل': 'SHIPPED',
  'فيالطريق': 'SHIPPED',
  'تمالخروجمنالمستودع': 'SHIPPED',

  // out for delivery
  outfordelivery: 'OUT_FOR_DELIVERY',
  'out for delivery': 'OUT_FOR_DELIVERY',
  withcourier: 'OUT_FOR_DELIVERY',
  withdelegate: 'OUT_FOR_DELIVERY',
  'withcaptain': 'OUT_FOR_DELIVERY',
  'ontheroad': 'OUT_FOR_DELIVERY',
  'قيدالتوصيل': 'OUT_FOR_DELIVERY',
  'معالمندوب': 'OUT_FOR_DELIVERY',
  'معالكابتن': 'OUT_FOR_DELIVERY',
  'خرجتللتوصيل': 'OUT_FOR_DELIVERY',

  // delivered
  delivered: 'DELIVERED',
  delivery: 'DELIVERED',
  completed: 'DELIVERED',
  'deliverysuccess': 'DELIVERED',
  'deliveredtocustomer': 'DELIVERED',
  'تمالتسليم': 'DELIVERED',
  'تمالتوصيل': 'DELIVERED',
  'مسلمة': 'DELIVERED',
  'مسلم': 'DELIVERED',
  'تمالتحصيل': 'DELIVERED',

  // partial delivery
  partiallydelivered: 'PARTIALLY_DELIVERED',
  partialdelivery: 'PARTIALLY_DELIVERED',
  'partialdelivered': 'PARTIALLY_DELIVERED',
  'تسليمجزئي': 'PARTIALLY_DELIVERED',

  // returns
  returned: 'RETURNED',
  returntosender: 'RETURNED',
  returnedtosender: 'RETURNED',
  'returnedtobusiness': 'RETURNED',
  'مرتجع': 'RETURNED',
  'تمالإرجاع': 'RETURNED',
  partiallyreturned: 'PARTIALLY_RETURNED',
  'مرتجعجزئي': 'PARTIALLY_RETURNED',

  // cancels / exceptions
  cancelled: 'CANCELLED',
  canceled: 'CANCELLED',
  cancel: 'CANCELLED',
  'ملغي': 'CANCELLED',
  'ملغى': 'CANCELLED',
  'تمالإلغاء': 'CANCELLED',
  lost: 'LOST',
  missing: 'LOST',
  'مفقود': 'LOST',
  exchanged: 'EXCHANGED',
  exchange: 'EXCHANGED',
  'استبدال': 'EXCHANGED',
  refunded: 'REFUNDED',
  'مسترد': 'REFUNDED',
  postponed: 'ON_HOLD',
  delayed: 'ON_HOLD',
  onhold: 'ON_HOLD',
  'مؤجل': 'ON_HOLD',
  'مؤجلة': 'ON_HOLD',
});

const normalizeProviderStatus = (rawStatus) => {
  if (rawStatus === null || rawStatus === undefined) return '';
  let value = String(rawStatus).trim().toLowerCase();
  if (!value) return '';
  // Drop Arabic diacritics/tatweel, then whitespace and separators.
  value = value
    .replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/[\s_\-./\\]+/g, '');
  return value;
};

/**
 * @returns {{ rawStatus: string, normalizedStatus: string, mapsToSystem: string|null, isKnown: boolean, isFinal: boolean }}
 */
const mapHashtagStatus = (rawStatus) => {
  const normalizedStatus = normalizeProviderStatus(rawStatus);
  const mapsToSystem = HASHTAG_STATUS_MAP[normalizedStatus] || null;
  return {
    rawStatus: rawStatus === null || rawStatus === undefined ? null : String(rawStatus),
    normalizedStatus,
    mapsToSystem,
    isKnown: Boolean(mapsToSystem),
    isFinal: Boolean(mapsToSystem && FINAL_SYSTEM_STATUSES.has(mapsToSystem)),
  };
};

module.exports = {
  HASHTAG_STATUS_MAP,
  FINAL_SYSTEM_STATUSES,
  normalizeProviderStatus,
  mapHashtagStatus,
};
