// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const api = vi.hoisted(() => ({ fetchAttendanceReport: vi.fn() }));
vi.mock("../api", () => api);

import { EducationAttendanceTab } from "../EducationAttendanceTab";

const report = {
  period: { from: "2026-09-01", to: "2026-11-24", months: 3 },
  summary: {
    records: 60,
    present: 43,
    absent: 13,
    excused: 4,
    attendanceRate: 71.7,
    students: 10,
    groups: 2,
    atRiskStudents: 1,
  },
  byGroup: [
    {
      groupId: "grp-1", groupName: "مجموعة أ", name: "مجموعة أ",
      total: 40, present: 24, absent: 12, excused: 4, rate: 60, atRisk: true, students: 6,
    },
    {
      groupId: "grp-2", groupName: "مجموعة ب", name: "مجموعة ب",
      total: 20, present: 19, absent: 1, excused: 0, rate: 95, atRisk: false, students: 4,
    },
  ],
  byStudent: [],
  atRisk: [
    {
      studentId: "stu-1", studentName: "سارة محمد", firstName: "سارة",
      total: 10, present: 5, absent: 4, excused: 1, rate: 50, atRisk: true,
    },
  ],
};

beforeEach(() => {
  api.fetchAttendanceReport.mockReset();
  api.fetchAttendanceReport.mockResolvedValue(report);
});

afterEach(() => cleanup());

describe("EducationAttendanceTab", () => {
  it("renders the attendance KPIs", async () => {
    render(<EducationAttendanceTab isEn={false} />);

    expect(await screen.findByText("الحضور والالتزام")).toBeInTheDocument();
    expect(screen.getByText("71.7%")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText("13")).toBeInTheDocument();
    expect(api.fetchAttendanceReport).toHaveBeenCalledWith(3);
  });

  it("shows group rates with a low badge and the at-risk list", async () => {
    render(<EducationAttendanceTab isEn={false} />);
    await screen.findByText("حضور المجموعات");

    expect(screen.getByText("مجموعة أ")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText("منخفض")).toBeInTheDocument();
    expect(screen.getByText("95%")).toBeInTheDocument();
    expect(screen.getByText("سارة محمد")).toBeInTheDocument();
  });

  it("refetches when the month window changes", async () => {
    render(<EducationAttendanceTab isEn={false} />);
    await waitFor(() => expect(api.fetchAttendanceReport).toHaveBeenCalledWith(3));

    fireEvent.click(screen.getByText("6 شهر"));
    await waitFor(() => expect(api.fetchAttendanceReport).toHaveBeenCalledWith(6));
  });
});
