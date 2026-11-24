// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const api = vi.hoisted(() => ({ fetchVarianceReport: vi.fn() }));
vi.mock("../api", () => api);

import { VariancePanel } from "../VariancePanel";

const report = {
  period: { from: "2026-06-01", to: "2026-11-24", months: 6 },
  summary: {
    incidents: 3,
    short: 2,
    over: 1,
    balanced: 0,
    netVariance: -20,
    absVariance: 60,
    shifts: 3,
    closings: 1,
  },
  byStaff: [],
  byMonth: [],
  items: [
    { kind: "SHIFT", id: "s1", label: "محمود", staffName: "محمود", date: "2026-11-23", expected: 650, actual: 640, difference: -10, state: "SHORT" },
    { kind: "CLOSING", id: "d1", label: "إغلاق يومي", staffName: "هبة", date: "2026-11-22", expected: 1000, actual: 970, difference: -30, state: "SHORT" },
    { kind: "SHIFT", id: "s2", label: "محمود", staffName: "محمود", date: "2026-11-21", expected: 500, actual: 520, difference: 20, state: "OVER" },
  ],
};

beforeEach(() => {
  api.fetchVarianceReport.mockReset();
  api.fetchVarianceReport.mockResolvedValue(report);
});

afterEach(() => cleanup());

describe("VariancePanel", () => {
  it("summarises short, over and net variance", async () => {
    render(<VariancePanel isEn={false} />);

    expect(await screen.findByText("فروق النقدية")).toBeInTheDocument();
    expect(screen.getByText("عجز")).toBeInTheDocument();
    expect(screen.getByText("زيادة")).toBeInTheDocument();
    expect(screen.getByText("-20")).toBeInTheDocument();
    expect(api.fetchVarianceReport).toHaveBeenCalledWith(6);
  });

  it("lists incidents with signed differences and refetches on window change", async () => {
    render(<VariancePanel isEn={false} />);
    await screen.findAllByText("محمود");

    expect(screen.getByText("-10")).toBeInTheDocument();
    expect(screen.getByText("-30")).toBeInTheDocument();
    expect(screen.getByText("+20")).toBeInTheDocument();

    fireEvent.click(screen.getByText("12"));
    await waitFor(() => expect(api.fetchVarianceReport).toHaveBeenCalledWith(12));
  });

  it("shows the balanced empty state when there are no incidents", async () => {
    api.fetchVarianceReport.mockResolvedValue({
      ...report,
      summary: { ...report.summary, incidents: 0, netVariance: 0 },
      items: [],
    });
    render(<VariancePanel isEn={false} />);

    expect(await screen.findByText(/كل الإغلاقات مطابقة/)).toBeInTheDocument();
  });
});
