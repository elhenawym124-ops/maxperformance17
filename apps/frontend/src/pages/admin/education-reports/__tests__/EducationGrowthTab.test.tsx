// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockFetchInsights = vi.hoisted(() => vi.fn());
const mockFetchAbsenceAlerts = vi.hoisted(() => vi.fn());
const mockRunAbsenceAlerts = vi.hoisted(() => vi.fn());
vi.mock("../api", () => ({
  fetchInsights: mockFetchInsights,
  fetchAbsenceAlerts: mockFetchAbsenceAlerts,
  runAbsenceAlerts: mockRunAbsenceAlerts,
}));

import { EducationGrowthTab } from "../EducationGrowthTab";

const insights = {
  period: { from: "2026-06-01", to: "2026-11-23", months: 6, inactiveDays: 21 },
  summary: {
    revenue: 5400,
    payments: 18,
    average: 300,
    activeStudents: 12,
    repeatStudents: 3,
    repeatRate: 25,
    atRisk: 2,
    groupDue: 1,
  },
  revenueByBranch: [{ id: "b1", name: "فرع مدينة نصر", amount: 3000, count: 8 }],
  revenueByPackage: [{ id: "p1", name: "باقة 10 ساعات", amount: 2000, count: 4 }],
  revenueByGroup: [{ id: "g1", name: "مجموعة أ", amount: 1500, count: 6 }],
  revenueByTeacher: [{ id: "t1", name: "أحمد", amount: 2500, count: 9 }],
  atRisk: [
    {
      studentId: "stu-1",
      studentName: "سارة محمد",
      phone: "0100",
      remainingHours: 1,
      overdueAmount: 500,
      reasons: [{ code: "LOW_HOURS", label: "رصيد ساعات منخفض" }],
    },
  ],
  groupDue: [
    {
      studentId: "stu-2",
      studentName: "ليلى حسن",
      groupName: "مجموعة أ",
      remaining: 300,
      reasons: [{ code: "GROUP_DUE", label: "تجديد رسوم المجموعة مستحق" }],
    },
  ],
  cohorts: [{ month: "2026-10", students: 5, repeatStudents: 2, retentionRate: 40 }],
  teacherPerformance: [
    {
      teacherId: "t1",
      name: "أحمد",
      privateSessions: 6,
      groupSessions: 4,
      sessions: 10,
      cancelledSessions: 1,
      hoursTaught: 12.5,
      attendanceRate: 92.5,
      absentCount: 3,
      students: 8,
      revenue: 2500,
    },
  ],
};

beforeEach(() => {
  mockFetchInsights.mockReset();
  mockFetchInsights.mockResolvedValue(insights);
  mockFetchAbsenceAlerts.mockReset();
  mockFetchAbsenceAlerts.mockResolvedValue([]);
  mockRunAbsenceAlerts.mockReset();
  mockRunAbsenceAlerts.mockResolvedValue({ sent: 1, skipped: 0, failed: 0, detected: 1 });
});

afterEach(() => cleanup());

describe("EducationGrowthTab", () => {
  it("renders KPIs, revenue breakdowns, at-risk students and cohorts", async () => {
    render(<EducationGrowthTab isEn={false} />);
    await waitFor(() => expect(mockFetchInsights).toHaveBeenCalledWith(6));

    expect(await screen.findByText("النمو والاحتفاظ")).toBeInTheDocument();
    expect(screen.getByText("5,400 ج.م")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getByText("فرع مدينة نصر")).toBeInTheDocument();
    expect(screen.getByText("مجموعة أ")).toBeInTheDocument();
    expect(screen.getByText("سارة محمد")).toBeInTheDocument();
    expect(screen.getByText("رصيد ساعات منخفض")).toBeInTheDocument();
    expect(screen.getByText("ليلى حسن")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("أداء المدرّسين")).toBeInTheDocument();
    expect(screen.getByText("92.5%")).toBeInTheDocument();
    expect(screen.getByText("12.5")).toBeInTheDocument();
  });

  it("refetches with the selected window", async () => {
    render(<EducationGrowthTab isEn={false} />);
    await waitFor(() => expect(mockFetchInsights).toHaveBeenCalledWith(6));
    fireEvent.click(screen.getByText("12 شهور"));
    await waitFor(() => expect(mockFetchInsights).toHaveBeenCalledWith(12));
  });

  it("sends repeated-absence alerts and refreshes the list", async () => {
    mockFetchAbsenceAlerts.mockResolvedValue([
      {
        companyId: "comp-1",
        studentId: "stu-9",
        studentName: "خالد سامي",
        parentName: "سامي",
        parentPhone: "01099999999",
        groupName: "مجموعة ب",
        streak: 4,
        lastSessionAt: "2026-11-18",
      },
    ]);

    render(<EducationGrowthTab isEn={false} />);
    expect(await screen.findByText("خالد سامي")).toBeInTheDocument();
    expect(screen.getByText("4 غياب")).toBeInTheDocument();

    fireEvent.click(screen.getByText("إشعار أولياء الأمور"));
    await waitFor(() => expect(mockRunAbsenceAlerts).toHaveBeenCalledWith(3, 45));
    expect(await screen.findByText(/تم إرسال 1/)).toBeInTheDocument();
  });

  it("shows an error with retry", async () => {
    mockFetchInsights.mockResolvedValueOnce(null);
    render(<EducationGrowthTab isEn={false} />);
    expect(await screen.findByText("فشل جلب تقرير النمو")).toBeInTheDocument();
    mockFetchInsights.mockResolvedValueOnce(insights);
    fireEvent.click(screen.getByText("إعادة المحاولة"));
    await waitFor(() => expect(screen.getByText("النمو والاحتفاظ")).toBeInTheDocument());
  });
});
