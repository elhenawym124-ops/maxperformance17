// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockFetchFinanceReport = vi.hoisted(() => vi.fn());
vi.mock("../api", () => ({ fetchFinanceReport: mockFetchFinanceReport }));

import { EducationFinanceTab } from "../EducationFinanceTab";

const report = {
  period: { from: "2026-06-01", to: "2026-11-22", months: 6 },
  totals: { collected: 5400, payments: 18, average: 300 },
  monthly: [
    { month: "2026-10", amount: 2000, count: 7 },
    { month: "2026-11", amount: 3400, count: 11 },
  ],
  byMethod: {
    CASH: { amount: 4000, count: 14 },
    TRANSFER: { amount: 1400, count: 4 },
  },
  bySource: {
    ADMIN: { amount: 3000, count: 10 },
    GROUP: { amount: 2400, count: 8 },
  },
  outstanding: {
    amount: 1500,
    count: 3,
    top: [
      { enrollmentId: "enr-1", studentName: "سارة محمد", packageName: "باقة 10 ساعات", remaining: 400, overdueAmount: 200 },
    ],
  },
  overdueInstallments: { count: 2, amount: 400 },
  pendingTopups: 1,
};

beforeEach(() => {
  mockFetchFinanceReport.mockReset();
  mockFetchFinanceReport.mockResolvedValue(report);
});

afterEach(() => cleanup());

describe("EducationFinanceTab", () => {
  it("renders totals, monthly bars and breakdowns", async () => {
    render(<EducationFinanceTab isEn={false} />);
    await waitFor(() => expect(mockFetchFinanceReport).toHaveBeenCalledWith(6));

    expect(await screen.findByText("إجمالي المحصل")).toBeInTheDocument();
    expect(screen.getByText("5,400 ج.م")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("التحصيل الشهري")).toBeInTheDocument();
    expect(screen.getByText("حسب طريقة الدفع")).toBeInTheDocument();
    expect(screen.getByText("حسب المصدر")).toBeInTheDocument();
    expect(screen.getByText("أكبر المتبقي على الطلاب")).toBeInTheDocument();
    expect(screen.getByText("سارة محمد")).toBeInTheDocument();
    expect(screen.getAllByText("400 ج.م").length).toBeGreaterThan(0);
    expect(screen.getByText("نقدي")).toBeInTheDocument();
    expect(screen.getByText("رسوم مجموعات")).toBeInTheDocument();
  });

  it("refetches with the selected month window", async () => {
    render(<EducationFinanceTab isEn={false} />);
    await waitFor(() => expect(mockFetchFinanceReport).toHaveBeenCalledWith(6));
    fireEvent.click(screen.getByText("12 شهور"));
    await waitFor(() => expect(mockFetchFinanceReport).toHaveBeenCalledWith(12));
  });

  it("shows an error with retry when the report fails", async () => {
    mockFetchFinanceReport.mockResolvedValueOnce(null);
    render(<EducationFinanceTab isEn={false} />);
    expect(await screen.findByText("فشل جلب التقرير المالي")).toBeInTheDocument();
    mockFetchFinanceReport.mockResolvedValueOnce(report);
    fireEvent.click(screen.getByText("إعادة المحاولة"));
    await waitFor(() => expect(screen.getByText("التحصيل الشهري")).toBeInTheDocument());
  });
});
