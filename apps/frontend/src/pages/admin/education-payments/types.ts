export type PaymentMethod = "CASH" | "TRANSFER" | "WALLET" | "CARD" | "INSTAPAY" | "OTHER";

export interface EducationPayment {
  id: string;
  paymentNumber: string;
  receiptNumber?: string | null;
  studentId?: string | null;
  enrollmentId?: string | null;
  groupId?: string | null;
  groupMemberId?: string | null;
  branchId?: string | null;
  packageId?: string | null;
  studentName?: string | null;
  amount: number;
  method: PaymentMethod | string;
  status: "COMPLETED" | "REVERSED" | string;
  source?: string | null;
  reference?: string | null;
  notes?: string | null;
  paidAt: string;
  cashierName?: string | null;
  reversedAmount?: number;
  reversedAt?: string | null;
  reversalReason?: string | null;
}

export interface PaymentsPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaymentsSummary {
  today: { amount: number; count: number };
  month: { amount: number; count: number };
  range: { amount: number; count: number };
  byMethod: Record<string, { amount: number; count: number }>;
  outstanding: { amount: number; count: number };
  overdueInstallments: { amount: number; count: number };
  pendingTopups: number;
}

export interface EnrollmentDue {
  kind: "ENROLLMENT";
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentCode?: string | null;
  phone?: string | null;
  packageId?: string | null;
  packageName?: string | null;
  subjectName?: string | null;
  total: number;
  paid: number;
  remaining: number;
  paymentMethod?: string | null;
  installmentCount?: number | null;
  overdueCount: number;
  overdueAmount: number;
  nextDueDate?: string | null;
}

export interface GroupRenewalDue {
  kind: "GROUP";
  groupMemberId: string;
  groupId: string;
  groupName: string;
  studentId: string;
  studentName: string;
  phone?: string | null;
  feeAmount: number;
  discountAmount?: number;
  feeType?: string | null;
  paid: number;
  remaining: number;
  paymentStatus: string;
  nextRenewalDate?: string | null;
}

export interface DuesResponse {
  enrollments: EnrollmentDue[];
  groupRenewals: GroupRenewalDue[];
  totals: {
    enrollmentsRemaining: number;
    enrollmentsCount: number;
    groupRenewalsRemaining: number;
    groupRenewalsCount: number;
  };
}

export interface WalletTopup {
  id: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
  releasedAt?: string | null;
  cancelledAt?: string | null;
  wallet?: {
    id: string;
    customerId: string;
    customer?: { id: string; firstName: string; lastName: string; phone?: string | null } | null;
  } | null;
}

export interface ReceiptPayload {
  payment: EducationPayment;
  company?: { name: string; phone?: string | null; email?: string | null; address?: string | null } | null;
  student?: { id: string; code?: string | null; firstName: string; lastName: string; phone?: string | null } | null;
  package?: { name: string; hoursCount: number } | null;
}

export interface CashierShiftRecord {
  id: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string | null;
  openingBalance: number;
  closingBalance?: number | null;
  cashCollected: number;
  cashReversed: number;
  expectedCash: number;
  difference?: number | null;
  status: "OPEN" | "CLOSED";
  notes?: string | null;
}

export interface CurrentShiftPayload {
  shift: CashierShiftRecord | null;
  live: { collected: number; reversed: number; net: number; expected: number } | null;
}

export interface DailyClosingReport {
  date: string;
  status: "OPEN" | "CLOSED" | "REOPENED";
  closing: {
    id: string;
    status: string;
    closedAt?: string | null;
    closedByName?: string | null;
    notes?: string | null;
    reopenedAt?: string | null;
    reopenReason?: string | null;
  } | null;
  payments: {
    count: number;
    gross: number;
    net: number;
    reversed: number;
    byMethod: Record<string, { amount: number; count: number }>;
    bySource: Record<string, { amount: number; count: number }>;
  };
  walletTopups: { count: number; total: number };
  treasury: { deposits: number; expenses: number; net: number };
  cashier: {
    shifts: Array<{
      id: string;
      cashierName: string;
      status: string;
      openedAt: string;
      closedAt?: string | null;
      openingBalance: number;
      collected: number;
      reversed: number;
      expected: number;
      actual: number | null;
      difference: number | null;
    }>;
    expected: number;
    actual: number;
    difference: number;
    openShifts: number;
  };
  walletPurchases: number;
  warnings: string[];
}

export interface DailyClosingHistoryRow {
  id: string;
  date: string;
  status: string;
  totalGross: number;
  totalNet: number;
  cashTotal: number;
  cardTotal: number;
  treasuryNet: number;
  cashierExpected: number;
  cashierActual: number;
  cashierDifference: number;
  closedAt?: string | null;
  closedByName?: string | null;
  reopenedAt?: string | null;
  reopenReason?: string | null;
  notes?: string | null;
}

export const PAYMENT_METHOD_LABELS: Record<string, { ar: string; en: string }> = {
  CASH: { ar: "نقدي", en: "Cash" },
  TRANSFER: { ar: "تحويل بنكي", en: "Bank transfer" },
  WALLET: { ar: "محفظة", en: "Wallet" },
  CARD: { ar: "بطاقة", en: "Card" },
  INSTAPAY: { ar: "إنستاپاي", en: "InstaPay" },
  OTHER: { ar: "أخرى", en: "Other" },
};

export const SOURCE_LABELS: Record<string, { ar: string; en: string }> = {
  ADMIN: { ar: "تحصيل إداري", en: "Admin collection" },
  GROUP: { ar: "رسوم مجموعة", en: "Group fee" },
  INSTALLMENT: { ar: "قسط", en: "Installment" },
  PARENT_WALLET: { ar: "محفظة ولي الأمر", en: "Parent wallet" },
  SYSTEM: { ar: "النظام", en: "System" },
};

export interface Coupon {
  id: string;
  code: string;
  type: "PERCENT" | "AMOUNT" | string;
  value: number;
  minAmount?: number | null;
  maxDiscount?: number | null;
  scope?: "ALL" | "PACKAGE" | "GROUP" | string;
  packageId?: string | null;
  groupId?: string | null;
  maxUses?: number | null;
  usedCount: number;
  perStudentLimit?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  isActive: boolean;
  notes?: string | null;
  createdAt?: string;
}

export interface DiscountReportItem {
  kind: "COUPON" | "WAIVER";
  id: string;
  code?: string | null;
  discount: number;
  studentId?: string | null;
  studentName?: string | null;
  groupName?: string | null;
  reason?: string | null;
  paymentId?: string | null;
  date?: string | null;
}

export interface DiscountReport {
  period: { from: string; to: string; months: number };
  summary: {
    couponDiscounts: number;
    couponUses: number;
    activeWaivers: number;
    waiversValue: number;
    totalImpact: number;
    manualWaivers: number;
  };
  byCode: Array<{ code: string; uses: number; amount: number }>;
  byMonth: Array<{ month: string; uses: number; amount: number }>;
  byStaff: Array<{ userId: string | null; count: number; amount: number }>;
  items: DiscountReportItem[];
}

export interface CollectionReport {
  period: { from: string; to: string; months: number };
  summary: {
    billed: number;
    collected: number;
    gap: number;
    rate: number | null;
    openDues: number;
    openPackageDues: number;
    openGroupDues: number;
    payments: number;
    enrollments: number;
  };
  byMonth: Array<{ month: string; billed: number; collected: number; rate: number | null }>;
  byBranch: Array<{ id: string; name: string; billed: number; collected: number; rate: number | null }>;
}

export interface MethodReport {
  period: { from: string; to: string; months: number };
  summary: { gross: number; refunded: number; net: number; payments: number; methods: number };
  byMethod: Array<{ method: string; label: string; amount: number; count: number; share: number }>;
  byBranch: Array<{ id: string; name: string; amount: number; count: number }>;
  byTreasury: Array<{ id: string; name: string; inflow: number; outflow: number; net: number; entries: number }>;
  treasuryNet: number;
}

export interface ShiftReconciliation {
  shift: {
    id: string;
    cashierName: string;
    status: string;
    openedAt: string;
    closedAt?: string | null;
    openingBalance: number;
    closingBalance?: number | null;
    difference?: number | null;
  };
  window: { from: string; to: string };
  openingBalance: number;
  expectedCash: number;
  byMethod: Array<{
    method: string;
    collected: number;
    reversed: number;
    net: number;
    expected: number;
    declared: number | null;
    difference: number | null;
  }>;
  totals: {
    collected: number;
    reversed: number;
    net: number;
    declared: number;
    difference: number;
  };
}

export interface VarianceReport {
  period: { from: string; to: string; months: number };
  summary: {
    incidents: number;
    short: number;
    over: number;
    balanced: number;
    netVariance: number;
    absVariance: number;
    shifts: number;
    closings: number;
  };
  byStaff: Array<{
    staffId: string | null;
    staffName: string;
    shifts: number;
    short: number;
    over: number;
    net: number;
    abs: number;
  }>;
  byMonth: Array<{ month: string; net: number; abs: number; short: number; over: number }>;
  items: Array<{
    kind: "SHIFT" | "CLOSING";
    id: string;
    label: string;
    staffName?: string | null;
    date: string;
    expected: number;
    actual: number;
    difference: number;
    state: "SHORT" | "OVER" | "BALANCED";
  }>;
}

export interface FinanceCockpit {
  period: { from: string; to: string; months: number };
  summary: {
    monthCollected: number;
    prevMonthCollected: number;
    monthGrowth: number | null;
    monthPayments: number;
    collected: number;
    billed: number;
    collectionRate: number | null;
    openDues: number;
    openDuesMembers: number;
    discountImpact: number;
    couponDiscounts: number;
    waiversValue: number;
    varianceNet: number;
    varianceAbs: number;
    shortCloses: number;
  };
  alerts: Array<{ severity: "HIGH" | "MEDIUM" | "LOW"; code: string; message: string }>;
  readiness: { collections: boolean; discounts: boolean; variances: boolean };
}

export interface EngagementReport {
  period: { from: string; to: string; months: number };
  summary: {
    messages: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    readRate: number | null;
    deliveryRate: number | null;
    guardians: number;
    activated: number;
    activationRate: number | null;
  };
  byEventType: Array<{ eventType: string; total: number; read: number; failed: number; readRate: number | null }>;
  byHour: Array<{ hour: number; total: number; read: number; readRate: number | null }>;
  bestHour: { hour: number; readRate: number | null; total: number } | null;
  ignored: { count: number; phones: Array<{ phone: string; total: number; read: number }> };
}

export interface AttendanceLinkReport {
  period: { from: string; to: string; months: number };
  summary: {
    students: number;
    lowAttendance: number;
    withDues: number;
    overlap: number;
    avgDuesLowAttendance: number;
    avgDuesOthers: number;
    riskAmount: number;
    rate: number | null;
  };
  buckets: Array<{ band: "LOW" | "MEDIUM" | "HIGH" | string; students: number; duesStudents: number; totalDues: number }>;
  risky: Array<{
    studentId: string;
    studentName: string | null;
    phone?: string | null;
    attendanceRate: number;
    absent: number;
    totalSessions: number;
    dues: number;
    overdue: number;
  }>;
}

export interface WinbackAction {
  id: string;
  companyId: string;
  studentId: string;
  studentName?: string | null;
  phone?: string | null;
  status: "OPEN" | "DONE" | "IGNORED" | string;
  priority: number;
  attendanceRate?: number | null;
  dues: number;
  overdue: number;
  reasons?: string[] | null;
  handledAt?: string | null;
  handledBy?: string | null;
  notes?: string | null;
  createdAt?: string;
}
