import { api, getAuthHeaders, fetchJson } from "../education-management/api";
import type {
  AttendanceLinkReport,
  CollectionReport,
  Coupon,
  DiscountReport,
  DuesResponse,
  EducationPayment,
  EngagementReport,
  FinanceCockpit,
  MethodReport,
  PaymentsPagination,
  PaymentsSummary,
  ReceiptPayload,
  VarianceReport,
  WalletTopup,
  WinbackAction,
  WinbackPerformance,
} from "./types";

const query = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  });
  const suffix = search.toString();
  return suffix ? `?${suffix}` : "";
};

const post = async (url: string, body?: unknown) => {
  const res = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body || {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || json.message || "فشل العملية");
  }
  return json.data;
};

export interface PaymentsQuery {
  from?: string;
  to?: string;
  method?: string;
  status?: string;
  q?: string;
  studentId?: string;
  branchId?: string;
  packageId?: string;
  page?: number;
  limit?: number;
}

export const fetchSummary = (from?: string, to?: string): Promise<PaymentsSummary> =>
  fetchJson(api(`finance/payments/summary${query({ from, to })}`));

export const fetchPayments = async (
  filters: PaymentsQuery
): Promise<{ items: EducationPayment[]; pagination: PaymentsPagination }> => {
  const res = await fetch(api(`finance/payments${query(filters as any)}`), {
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "فشل جلب المدفوعات");
  return {
    items: json.data || [],
    pagination: json.pagination || { total: 0, page: 1, limit: 25, totalPages: 1 },
  };
};

export const fetchDues = (): Promise<DuesResponse> => fetchJson(api("finance/dues"));

export const recordPayment = (
  payload: {
    enrollmentId?: string;
    groupMemberId?: string;
    amount: number;
    method: string;
    paidAt?: string;
    reference?: string;
    notes?: string;
  }
): Promise<EducationPayment> => post(api("finance/payments"), payload);

export const reversePayment = (id: string, amount?: number, reason?: string): Promise<EducationPayment> =>
  post(api(`finance/payments/${id}/reverse`), { amount, reason });

export const sendPaymentReceipt = (id: string): Promise<{ sent: boolean; phone?: string; reason?: string }> =>
  post(api(`finance/payments/${id}/send-receipt`));

export const fetchBranches = (): Promise<Array<{ id: string; name: string }>> => fetchJson(api("branches"));

export const fetchPackages = (): Promise<Array<{ id: string; name: string }>> => fetchJson(api("packages"));

export const fetchCurrentShift = (): Promise<import("./types").CurrentShiftPayload> =>
  fetchJson(api("finance/shifts/current"));

export const openCashierShift = (openingBalance: number) =>
  post(api("finance/shifts/open"), { openingBalance });

export const closeCashierShift = (id: string, closingBalance: number, notes?: string) =>
  post(api(`finance/shifts/${id}/close`), { closingBalance, notes });

export const fetchCashierShifts = async (params: { page?: number; limit?: number; status?: string } = {}) => {
  const res = await fetch(api(`finance/shifts${query(params as any)}`), { headers: getAuthHeaders() });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "فشل جلب الشيفتات");
  return {
    items: (json.data || []) as import("./types").CashierShiftRecord[],
    pagination: json.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 },
  };
};

export const fetchCockpit = (months = 6): Promise<FinanceCockpit> =>
  fetchJson(api(`finance/cockpit${query({ months })}`));

export const fetchEngagement = (months = 3): Promise<EngagementReport> =>
  fetchJson(api(`finance/engagement${query({ months })}`));

export const fetchAttendanceLink = (months = 3): Promise<AttendanceLinkReport> =>
  fetchJson(api(`finance/attendance-link${query({ months })}`));

export const fetchWinback = (status = "OPEN"): Promise<WinbackAction[]> =>
  fetchJson(api(`finance/winback${query({ status })}`));

export const syncWinback = (months = 3): Promise<{ detected: number; created: number; skipped: number }> =>
  sendJson(api("finance/winback/sync"), "POST", { months });

export const completeWinback = (id: string, status: "DONE" | "IGNORED" | "OPEN" = "DONE", notes?: string) =>
  sendJson(api(`finance/winback/${id}/complete`), "POST", { status, notes });

export const fetchWinbackPerformance = (months = 3): Promise<WinbackPerformance> =>
  fetchJson(api(`finance/winback/performance${query({ months })}`));

export const fetchStatementDue = (months = 12): Promise<Array<{
  studentId: string;
  studentName: string;
  parentName: string;
  parentPhone?: string | null;
  balance: number;
  enrollments: number;
  packages: string[];
}>> => fetchJson(api(`finance/statement-due${query({ months })}`));

export const notifyStatementDue = (payload: { studentId?: string; months?: number } = {}): Promise<{
  detected?: number;
  sent: number;
  skipped: number;
  failed: number;
}> => sendJson(api("finance/statement-due/notify"), "POST", payload);

export const downloadStatement = async (
  studentId: string,
  format: "pdf" | "excel" = "pdf",
  months = 12
): Promise<void> => {
  const res = await fetch(api(`finance/students/${studentId}/statement/export${query({ format, months })}`), {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    let message = "فشل تصدير كشف الحساب";
    try {
      const body = await res.json();
      message = body.error || body.message || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `statement-${studentId}.${format === "excel" ? "xlsx" : "pdf"}`;
  link.click();
  URL.revokeObjectURL(url);
};

export const fetchVarianceReport = (months = 6): Promise<VarianceReport> =>
  fetchJson(api(`finance/variances${query({ months })}`));

export const fetchShiftReconciliation = (id: string): Promise<import("./types").ShiftReconciliation> =>
  fetchJson(api(`finance/shifts/${id}/reconciliation`));

export const fetchDailyClosing = (date: string): Promise<import("./types").DailyClosingReport> =>
  fetchJson(api(`finance/daily-closing${query({ date })}`));

export const closeDailyClosing = (date: string, notes?: string) =>
  post(api("finance/daily-closing/close"), { date, notes });

export const reopenDailyClosing = (id: string, reason?: string) =>
  post(api(`finance/daily-closing/${id}/reopen`), { reason });

export const fetchDailyClosingHistory = (limit = 14): Promise<import("./types").DailyClosingHistoryRow[]> =>
  fetchJson(api(`finance/daily-closing/history${query({ limit })}`));

export const fetchTopups = (status = "PENDING_RELEASE"): Promise<WalletTopup[]> =>
  fetchJson(api(`finance/topups${query({ status })}`));

export const releaseTopup = (id: string): Promise<unknown> =>
  post(api(`finance/topups/${id}/release`));

export const rejectTopup = (id: string, reason?: string): Promise<unknown> =>
  post(api(`finance/topups/${id}/reject`), { reason });

export const fetchReceipt = (id: string): Promise<ReceiptPayload> =>
  fetchJson(api(`finance/payments/${id}/receipt`));

const sendJson = async (url: string, method: "PUT" | "POST" | "DELETE", body?: unknown) => {
  const res = await fetch(url, {
    method,
    headers: getAuthHeaders(),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.error || json.message || "فشل العملية");
  }
  return json.data;
};

export const fetchCoupons = (active?: "0" | "1"): Promise<Coupon[]> =>
  fetchJson(api(`finance/coupons${query({ active })}`));

export const createCoupon = (payload: Partial<Coupon> & { code: string; value: number }): Promise<Coupon> =>
  sendJson(api("finance/coupons"), "POST", payload);

export const updateCoupon = (id: string, payload: Partial<Coupon>): Promise<Coupon> =>
  sendJson(api(`finance/coupons/${id}`), "PUT", payload);

export const toggleCoupon = (id: string, isActive: boolean): Promise<Coupon> =>
  sendJson(api(`finance/coupons/${id}/toggle`), "PUT", { isActive });

export const deleteCoupon = (id: string): Promise<unknown> =>
  sendJson(api(`finance/coupons/${id}`), "DELETE");

export const setMemberDiscount = (groupMemberId: string, amount: number, reason?: string): Promise<unknown> =>
  sendJson(api(`finance/group-members/${groupMemberId}/discount`), "POST", { amount, reason });

export const fetchDiscountReport = (months = 6): Promise<DiscountReport> =>
  fetchJson(api(`finance/discounts${query({ months })}`));

export const fetchCollectionReport = (months = 6): Promise<CollectionReport> =>
  fetchJson(api(`finance/collections${query({ months })}`));

export const fetchMethodReport = (months = 6): Promise<MethodReport> =>
  fetchJson(api(`finance/methods${query({ months })}`));

export const validateCoupon = (payload: {
  code: string;
  amount: number;
  studentId?: string;
  packageId?: string;
  groupId?: string;
}): Promise<{ code: string; type: string; discountAmount: number; finalAmount: number }> =>
  sendJson(api("finance/coupons/validate"), "POST", payload);

export const downloadPaymentsCsv = async (filters: PaymentsQuery): Promise<void> => {
  const { page, limit, ...rest } = filters;
  const res = await fetch(api(`finance/payments/export${query(rest as any)}`), {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("فشل تصدير المدفوعات");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `education-payments-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const downloadPaymentPdf = async (id: string, paymentNumber?: string): Promise<void> => {
  const res = await fetch(api(`finance/payments/${id}/pdf`), { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("فشل تحميل ملف الإيصال");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${paymentNumber || id}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
