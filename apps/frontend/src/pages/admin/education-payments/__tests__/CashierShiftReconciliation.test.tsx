// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const api = vi.hoisted(() => ({
  fetchCurrentShift: vi.fn(),
  fetchCashierShifts: vi.fn(),
  fetchShiftReconciliation: vi.fn(),
  openCashierShift: vi.fn(),
  closeCashierShift: vi.fn(),
}));

vi.mock("../api", () => api);
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ i18n: { language: "ar" }, t: (key: string) => key }),
}));

import CashierShiftTab from "../CashierShiftTab";

const shiftRecord = {
  id: "shift-1",
  cashierName: "محمود",
  status: "CLOSED",
  openedAt: "2026-11-24T08:00:00Z",
  closedAt: "2026-11-24T16:00:00Z",
  openingBalance: 200,
  closingBalance: 640,
  cashCollected: 500,
  cashReversed: 50,
  expectedCash: 650,
  difference: -10,
};

beforeEach(() => {
  Object.values(api).forEach((value) => value.mockReset());
  api.fetchCurrentShift.mockResolvedValue({ shift: null, live: null });
  api.fetchCashierShifts.mockResolvedValue({
    items: [shiftRecord],
    pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
  });
  api.fetchShiftReconciliation.mockResolvedValue({
    shift: shiftRecord,
    window: { from: shiftRecord.openedAt, to: shiftRecord.closedAt },
    openingBalance: 200,
    expectedCash: 650,
    byMethod: [
      { method: "CASH", collected: 500, reversed: 50, net: 450, expected: 650, declared: 640, difference: -10 },
      { method: "TRANSFER", collected: 300, reversed: 0, net: 300, expected: 300, declared: 300, difference: 0 },
    ],
    totals: { collected: 800, reversed: 50, net: 750, declared: 940, difference: -10 },
  });
});

afterEach(() => cleanup());

describe("CashierShiftTab reconciliation", () => {
  it("lists shifts with expected, actual and variance", async () => {
    render(<CashierShiftTab reloadKey={0} onChanged={vi.fn()} />);

    expect(await screen.findByText("محمود")).toBeInTheDocument();
    expect(screen.getByText(/-10/)).toBeInTheDocument();
  });

  it("expands the per-method reconciliation with expected, counted and difference", async () => {
    render(<CashierShiftTab reloadKey={0} onChanged={vi.fn()} />);
    await screen.findByText("محمود");

    fireEvent.click(screen.getByText("مطابقة"));
    await waitFor(() => expect(api.fetchShiftReconciliation).toHaveBeenCalledWith("shift-1"));

    expect(await screen.findByText("CASH")).toBeInTheDocument();
    expect(screen.getByText("TRANSFER")).toBeInTheDocument();
    expect(screen.getByText("640")).toBeInTheDocument();
    expect(screen.getByText("650")).toBeInTheDocument();
  });
});
