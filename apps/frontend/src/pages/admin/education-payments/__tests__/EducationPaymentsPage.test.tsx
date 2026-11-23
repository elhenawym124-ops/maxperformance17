// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "ar" },
    t: (_key: string, fallback?: string) => fallback || _key,
  }),
}));

const mockApi = vi.hoisted(() => ({
  fetchSummary: vi.fn(),
  fetchPayments: vi.fn(),
  fetchDues: vi.fn(),
  recordPayment: vi.fn(),
  reversePayment: vi.fn(),
  sendPaymentReceipt: vi.fn(),
  fetchBranches: vi.fn(),
  fetchPackages: vi.fn(),
  fetchCurrentShift: vi.fn(),
  fetchCashierShifts: vi.fn(),
  openCashierShift: vi.fn(),
  closeCashierShift: vi.fn(),
  downloadPaymentsCsv: vi.fn(),
  downloadPaymentPdf: vi.fn(),
  fetchTopups: vi.fn(),
  releaseTopup: vi.fn(),
  rejectTopup: vi.fn(),
  fetchReceipt: vi.fn(),
}));

vi.mock("../api", () => mockApi);

import EducationPaymentsPage from "../EducationPaymentsPage";

const summary = {
  today: { amount: 500, count: 2 },
  month: { amount: 4200, count: 9 },
  range: { amount: 4200, count: 9 },
  byMethod: { CASH: { amount: 4000, count: 8 } },
  outstanding: { amount: 1500, count: 3 },
  overdueInstallments: { amount: 200, count: 1 },
  pendingTopups: 2,
};

const payment = {
  id: "pay-1",
  paymentNumber: "EDU-PAY-202611-0001",
  receiptNumber: "RCP-202611-0001",
  studentId: "stu-1",
  enrollmentId: "enr-1",
  studentName: "سارة محمد",
  amount: 250,
  method: "CASH",
  status: "COMPLETED",
  source: "ADMIN",
  paidAt: new Date().toISOString(),
  cashierName: "كاشير",
};

const dues = {
  enrollments: [
    {
      kind: "ENROLLMENT",
      enrollmentId: "enr-1",
      studentId: "stu-1",
      studentName: "سارة محمد",
      studentCode: "S-1",
      packageName: "باقة 10 ساعات",
      total: 500,
      paid: 100,
      remaining: 400,
      overdueCount: 1,
      overdueAmount: 200,
      nextDueDate: new Date().toISOString(),
    },
  ],
  groupRenewals: [
    {
      kind: "GROUP",
      groupMemberId: "gm-1",
      groupId: "grp-1",
      groupName: "مجموعة أ",
      studentId: "stu-1",
      studentName: "سارة محمد",
      feeAmount: 400,
      feeType: "MONTHLY",
      paid: 0,
      remaining: 400,
      paymentStatus: "PENDING",
    },
  ],
  totals: {
    enrollmentsRemaining: 400,
    enrollmentsCount: 1,
    groupRenewalsRemaining: 400,
    groupRenewalsCount: 1,
  },
};

const pendingTopup = {
  id: "tx-1",
  amount: 500,
  status: "PENDING_RELEASE",
  description: "طلب شحن",
  createdAt: new Date().toISOString(),
  wallet: { id: "w-1", customerId: "cust-1", customer: { id: "cust-1", firstName: "أحمد", lastName: "علي", phone: "0100" } },
};

beforeEach(() => {
  Object.values(mockApi).forEach((fn) => fn.mockReset());
  mockApi.fetchSummary.mockResolvedValue(summary);
  mockApi.fetchPayments.mockResolvedValue({
    items: [payment],
    pagination: { total: 1, page: 1, limit: 25, totalPages: 1 },
  });
  mockApi.fetchDues.mockResolvedValue(dues);
  mockApi.fetchTopups.mockResolvedValue([pendingTopup]);
  mockApi.fetchReceipt.mockResolvedValue({
    payment,
    company: { name: "مركز ماكس", phone: "0100" },
    student: { id: "stu-1", code: "S-1", firstName: "سارة", lastName: "محمد" },
    package: { name: "باقة 10 ساعات", hoursCount: 10 },
  });
  mockApi.recordPayment.mockResolvedValue({ ...payment, paymentNumber: "EDU-PAY-202611-0002" });
  mockApi.reversePayment.mockResolvedValue({ ...payment, status: "REVERSED" });
  mockApi.sendPaymentReceipt.mockResolvedValue({ sent: true, phone: "01001234567" });
  mockApi.downloadPaymentPdf.mockResolvedValue(undefined);
  mockApi.fetchBranches.mockResolvedValue([{ id: "branch-1", name: "فرع مدينة نصر" }]);
  mockApi.fetchPackages.mockResolvedValue([{ id: "pkg-1", name: "باقة 10 ساعات" }]);
  mockApi.fetchCurrentShift.mockResolvedValue({ shift: null, live: null });
  mockApi.fetchCashierShifts.mockResolvedValue({
    items: [],
    pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
  });
  mockApi.openCashierShift.mockResolvedValue({ id: "shift-1", status: "OPEN", openingBalance: 100 });
  mockApi.closeCashierShift.mockResolvedValue({ id: "shift-1", status: "CLOSED", difference: 0 });
  mockApi.releaseTopup.mockResolvedValue({});
  mockApi.rejectTopup.mockResolvedValue({});
  window.print = vi.fn();
});

afterEach(() => {
  cleanup();
});

describe("EducationPaymentsPage", () => {
  it("renders the KPI cards from the summary endpoint", async () => {
    render(<EducationPaymentsPage />);
    await waitFor(() => expect(mockApi.fetchSummary).toHaveBeenCalled());
    expect(await screen.findByText("محصّل اليوم")).toBeInTheDocument();
    expect(screen.getByText("500 ج.م")).toBeInTheDocument();
    expect(screen.getByText("4,200 ج.م")).toBeInTheDocument();
    expect(screen.getByText("1,500 ج.م")).toBeInTheDocument();
    expect(screen.getByText("200 ج.م")).toBeInTheDocument();
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
  });

  it("renders the ledger and opens a printable receipt", async () => {
    render(<EducationPaymentsPage />);
    await waitFor(() => expect(screen.getAllByText("سارة محمد").length).toBeGreaterThan(0));
    expect(screen.getAllByText("EDU-PAY-202611-0001").length).toBeGreaterThan(0);
    expect(screen.getByText("250")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("إيصال"));
    await waitFor(() => expect(mockApi.fetchReceipt).toHaveBeenCalledWith("pay-1"));
    expect(await screen.findByText("مركز ماكس")).toBeInTheDocument();
    expect(screen.getByText("RCP-202611-0001")).toBeInTheDocument();
    fireEvent.click(screen.getByText("طباعة"));
    expect(window.print).toHaveBeenCalled();
  });

  it("shows an error state when the ledger fails and retries", async () => {
    mockApi.fetchPayments.mockRejectedValueOnce(new Error("شبكة غير متاحة"));
    render(<EducationPaymentsPage />);
    expect(await screen.findByText("شبكة غير متاحة")).toBeInTheDocument();
    mockApi.fetchPayments.mockResolvedValueOnce({
      items: [payment],
      pagination: { total: 1, page: 1, limit: 25, totalPages: 1 },
    });
    fireEvent.click(screen.getByText("إعادة المحاولة"));
    await waitFor(() => expect(screen.getAllByText("سارة محمد").length).toBeGreaterThan(0));
  });

  it("shows dues and collects a package payment through the modal", async () => {
    render(<EducationPaymentsPage />);
    await waitFor(() => expect(mockApi.fetchDues).toHaveBeenCalledTimes(0));
    fireEvent.click(screen.getByText("المستحقات"));
    await waitFor(() => expect(mockApi.fetchDues).toHaveBeenCalled());
    expect(await screen.findByText("مستحقات الباقات")).toBeInTheDocument();
    expect((await screen.findAllByText(/باقة 10/)).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByText("تحصيل")[0]);
    expect(await screen.findByRole("dialog", { name: "تسجيل دفعة" })).toBeInTheDocument();
    const amountInput = screen.getByLabelText("المبلغ (ج.م)") as HTMLInputElement;
    expect(amountInput.value).toBe("400");
    fireEvent.click(screen.getByText("تأكيد التحصيل"));

    await waitFor(() =>
      expect(mockApi.recordPayment).toHaveBeenCalledWith(
        expect.objectContaining({ enrollmentId: "enr-1", amount: 400, method: "CASH" })
      )
    );
  });

  it("blocks an overpayment in the record modal", async () => {
    render(<EducationPaymentsPage />);
    fireEvent.click(screen.getByText("المستحقات"));
    await waitFor(() => expect(mockApi.fetchDues).toHaveBeenCalled());
    fireEvent.click((await screen.findAllByText("تحصيل"))[0]);
    const amountInput = await screen.findByLabelText("المبلغ (ج.م)");
    fireEvent.change(amountInput, { target: { value: "900" } });
    fireEvent.click(screen.getByText("تأكيد التحصيل"));
    expect(await screen.findByText(/المبلغ أكبر من المتبقي/)).toBeInTheDocument();
    expect(mockApi.recordPayment).not.toHaveBeenCalled();
  });

  it("exports the ledger as CSV with the active filters", async () => {
    render(<EducationPaymentsPage />);
    await waitFor(() => expect(screen.getAllByText("سارة محمد").length).toBeGreaterThan(0));
    fireEvent.click(screen.getByText("تصدير CSV"));
    await waitFor(() =>
      expect(mockApi.downloadPaymentsCsv).toHaveBeenCalledWith(
        expect.objectContaining({ from: expect.any(String), to: expect.any(String), page: 1 })
      )
    );
  });

  it("downloads the archived PDF for a payment", async () => {
    render(<EducationPaymentsPage />);
    await waitFor(() => expect(screen.getAllByText("سارة محمد").length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByLabelText("تحميل PDF")[0]);
    await waitFor(() =>
      expect(mockApi.downloadPaymentPdf).toHaveBeenCalledWith("pay-1", "EDU-PAY-202611-0001")
    );
  });

  it("sends the receipt to the parent via WhatsApp", async () => {
    render(<EducationPaymentsPage />);
    await waitFor(() => expect(screen.getAllByText("سارة محمد").length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByLabelText("إرسال الإيصال واتساب")[0]);
    await waitFor(() => expect(mockApi.sendPaymentReceipt).toHaveBeenCalledWith("pay-1"));
  });

  it("filters the ledger by branch and package", async () => {
    render(<EducationPaymentsPage />);
    await waitFor(() => expect(mockApi.fetchBranches).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText("الفرع"), { target: { value: "branch-1" } });
    await waitFor(() =>
      expect(mockApi.fetchPayments).toHaveBeenCalledWith(expect.objectContaining({ branchId: "branch-1" }))
    );
    fireEvent.change(screen.getByLabelText("الباقة"), { target: { value: "pkg-1" } });
    await waitFor(() =>
      expect(mockApi.fetchPayments).toHaveBeenCalledWith(expect.objectContaining({ branchId: "branch-1", packageId: "pkg-1" }))
    );
  });

  it("opens a cashier shift with the opening balance", async () => {
    render(<EducationPaymentsPage />);
    fireEvent.click(screen.getByRole("button", { name: "شيفت الكاشير" }));
    expect(await screen.findByText("لا يوجد شيفت كاشير مفتوح")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("رصيد الافتتاح (ج.م)"), { target: { value: "100" } });
    fireEvent.click(screen.getByText("فتح الشيفت"));
    await waitFor(() => expect(mockApi.openCashierShift).toHaveBeenCalledWith(100));
  });

  it("closes an open shift with the counted cash and shows the difference", async () => {
    mockApi.fetchCurrentShift.mockResolvedValue({
      shift: {
        id: "shift-1",
        cashierName: "منى",
        openedAt: new Date().toISOString(),
        openingBalance: 100,
        cashCollected: 400,
        cashReversed: 0,
        expectedCash: 500,
        status: "OPEN",
      },
      live: { collected: 400, reversed: 0, net: 400, expected: 500 },
    });

    render(<EducationPaymentsPage />);
    fireEvent.click(screen.getByRole("button", { name: "شيفت الكاشير" }));
    expect(await screen.findByText("شيفت مفتوح")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("النقد الفعلي في الدرج (ج.م)"), { target: { value: "480" } });
    expect(await screen.findByText(/الفرق:/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("إغلاق الشيفت"));
    await waitFor(() => expect(mockApi.closeCashierShift).toHaveBeenCalledWith("shift-1", 480, undefined));
  });

  it("reverses a payment after confirmation", async () => {
    render(<EducationPaymentsPage />);
    await waitFor(() => expect(screen.getAllByText("سارة محمد").length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByLabelText("إلغاء الدفعة")[0]);
    expect(await screen.findByText(/المبلغ هيرجع لرصيد الطالب/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("مبلغ الإلغاء (ج.م)"), { target: { value: "100" } });
    fireEvent.change(screen.getByPlaceholderText("سبب الإلغاء (اختياري)"), { target: { value: "خطأ إدخال" } });
    fireEvent.click(screen.getByText("تأكيد الإلغاء"));
    await waitFor(() => expect(mockApi.reversePayment).toHaveBeenCalledWith("pay-1", 100, "خطأ إدخال"));
  });

  it("reviews and approves a pending wallet top-up", async () => {
    render(<EducationPaymentsPage />);
    fireEvent.click(screen.getByText("طلبات شحن المحفظة"));
    await waitFor(() => expect(mockApi.fetchTopups).toHaveBeenCalledWith("PENDING_RELEASE"));
    expect(await screen.findByText("أحمد علي")).toBeInTheDocument();

    fireEvent.click(screen.getByText("اعتماد"));
    expect(await screen.findByText("اعتماد شحن المحفظة")).toBeInTheDocument();
    fireEvent.click(screen.getByText("تأكيد"));
    await waitFor(() => expect(mockApi.releaseTopup).toHaveBeenCalledWith("tx-1"));
  });

  it("rejects a pending wallet top-up with a reason", async () => {
    render(<EducationPaymentsPage />);
    fireEvent.click(screen.getByText("طلبات شحن المحفظة"));
    await waitFor(() => expect(screen.getByText("أحمد علي")).toBeInTheDocument());
    fireEvent.click(screen.getByText("رفض"));
    fireEvent.change(screen.getByPlaceholderText("سبب الرفض (اختياري)"), { target: { value: "إيصال مزور" } });
    fireEvent.click(screen.getByText("تأكيد"));
    await waitFor(() => expect(mockApi.rejectTopup).toHaveBeenCalledWith("tx-1", "إيصال مزور"));
  });
});
