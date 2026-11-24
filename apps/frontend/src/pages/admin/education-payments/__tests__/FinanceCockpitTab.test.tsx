// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const api = vi.hoisted(() => ({ fetchCockpit: vi.fn() }));
vi.mock("../api", () => api);

import { FinanceCockpitTab } from "../FinanceCockpitTab";

const cockpit = {
  period: { from: "2026-06-01", to: "2026-11-24", months: 6 },
  summary: {
    monthCollected: 5000,
    prevMonthCollected: 4000,
    monthGrowth: 25,
    monthPayments: 12,
    collected: 9000,
    billed: 12000,
    collectionRate: 75,
    openDues: 3000,
    openDuesMembers: 4,
    discountImpact: 550,
    couponDiscounts: 350,
    waiversValue: 200,
    varianceNet: -30,
    varianceAbs: 60,
    shortCloses: 2,
  },
  alerts: [
    { severity: "HIGH", code: "CASH_SHORT", message: "2 إغلاق بعجز نقدي — صافي الفروق -30 ج.م" },
    { severity: "MEDIUM", code: "OPEN_DUES", message: "مستحقات مفتوحة 3000 ج.م على 4 عضو/تسجيل" },
  ],
  readiness: { collections: true, discounts: true, variances: true },
};

beforeEach(() => {
  api.fetchCockpit.mockReset();
  api.fetchCockpit.mockResolvedValue(cockpit);
});

afterEach(() => cleanup());

describe("FinanceCockpitTab", () => {
  it("renders the composed KPIs", async () => {
    render(<FinanceCockpitTab isEn={false} />);

    expect(await screen.findByText("النظرة المالية الشاملة")).toBeInTheDocument();
    expect(screen.getByText("5,000")).toBeInTheDocument();
    expect(screen.getByText("+25%")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("-30")).toBeInTheDocument();
    expect(screen.getByText("2 عجز")).toBeInTheDocument();
    expect(api.fetchCockpit).toHaveBeenCalledWith(6);
  });

  it("lists alerts with severities", async () => {
    render(<FinanceCockpitTab isEn={false} />);
    await screen.findByText("محتاج تدخّل");

    expect(screen.getByText("HIGH")).toBeInTheDocument();
    expect(screen.getByText("MEDIUM")).toBeInTheDocument();
    expect(screen.getByText(/مستحقات مفتوحة 3000/)).toBeInTheDocument();
  });

  it("shows the all-clear state and refetches on window change", async () => {
    api.fetchCockpit.mockResolvedValueOnce({ ...cockpit, alerts: [], summary: { ...cockpit.summary, shortCloses: 0, openDues: 0 } });
    render(<FinanceCockpitTab isEn={false} />);

    expect(await screen.findByText("كل المؤشرات سليمة")).toBeInTheDocument();

    fireEvent.click(screen.getByText("12 شهور"));
    await waitFor(() => expect(api.fetchCockpit).toHaveBeenCalledWith(12));
  });
});
