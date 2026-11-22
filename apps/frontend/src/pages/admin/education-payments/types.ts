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
