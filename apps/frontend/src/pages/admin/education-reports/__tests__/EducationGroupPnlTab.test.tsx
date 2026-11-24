// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const api = vi.hoisted(() => ({ fetchGroupPnl: vi.fn() }));
vi.mock("../api", () => api);

import { EducationGroupPnlTab } from "../EducationGroupPnlTab";

const report = {
  period: { from: "2026-09-01", to: "2026-11-24", months: 3 },
  summary: {
    groups: 2,
    revenue: 5300,
    dues: 800,
    teacherCost: 2600,
    net: 2700,
    members: 11,
    capacity: 22,
    occupancy: 50,
    margin: 50.9,
    lossMaking: 1,
  },
  groups: [
    {
      groupId: "grp-2", name: "مجموعة ب", teacherName: "منى", feeAmount: 300, feeType: "MONTHLY",
      members: 3, capacity: 12, occupancy: 25, sessions: 4,
      revenue: 300, dues: 0, collectedTotal: 300, teacherCost: 400, net: -100, margin: -33.3,
    },
    {
      groupId: "grp-1", name: "مجموعة أ", teacherName: "أحمد", feeAmount: 400, feeType: "MONTHLY",
      members: 8, capacity: 10, occupancy: 80, sessions: 8,
      revenue: 4400, dues: 800, collectedTotal: 5200, teacherCost: 2200, net: 2200, margin: 50,
    },
  ],
};

beforeEach(() => {
  api.fetchGroupPnl.mockReset();
  api.fetchGroupPnl.mockResolvedValue(report);
});

afterEach(() => cleanup());

describe("EducationGroupPnlTab", () => {
  it("renders portfolio KPIs including occupancy", async () => {
    render(<EducationGroupPnlTab isEn={false} />);

    expect(await screen.findByText("ربحية المجموعات")).toBeInTheDocument();
    expect(screen.getByText("5,300")).toBeInTheDocument();
    expect(screen.getByText("2,600")).toBeInTheDocument();
    expect(screen.getByText("2,700")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("11/22")).toBeInTheDocument();
  });

  it("lists groups worst net first and flags the loss", async () => {
    render(<EducationGroupPnlTab isEn={false} />);
    await screen.findByText("حسب المجموعة");

    expect(screen.getByText("1 مجموعة تعمل بخسارة")).toBeInTheDocument();
    expect(screen.getByText("مجموعة ب")).toBeInTheDocument();
    expect(screen.getByText("-100")).toBeInTheDocument();
    expect(screen.getByText("مجموعة أ")).toBeInTheDocument();
    expect(screen.getByText(/\(80%\)/)).toBeInTheDocument();
  });

  it("refetches when the window changes", async () => {
    render(<EducationGroupPnlTab isEn={false} />);
    await waitFor(() => expect(api.fetchGroupPnl).toHaveBeenCalledWith(3));

    fireEvent.click(screen.getByText("6 شهر"));
    await waitFor(() => expect(api.fetchGroupPnl).toHaveBeenCalledWith(6));
  });
});
