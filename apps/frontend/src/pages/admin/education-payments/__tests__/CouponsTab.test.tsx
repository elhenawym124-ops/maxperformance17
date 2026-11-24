// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const api = vi.hoisted(() => ({
  fetchCoupons: vi.fn(),
  fetchDiscountReport: vi.fn(),
  createCoupon: vi.fn(),
  toggleCoupon: vi.fn(),
  deleteCoupon: vi.fn(),
}));

vi.mock("../api", () => api);
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { CouponsTab } from "../CouponsTab";

const coupon = {
  id: "coupon-1",
  code: "EID25",
  type: "PERCENT",
  value: 25,
  maxUses: 100,
  usedCount: 12,
  perStudentLimit: 1,
  isActive: true,
  validUntil: "2026-12-31",
};

beforeEach(() => {
  Object.values(api).forEach((value) => value.mockReset());
  api.fetchCoupons.mockResolvedValue([coupon]);
  api.fetchDiscountReport.mockResolvedValue({
    period: { from: "2026-06-01", to: "2026-11-24", months: 6 },
    summary: {
      couponDiscounts: 550,
      couponUses: 3,
      activeWaivers: 2,
      waiversValue: 200,
      totalImpact: 750,
      manualWaivers: 1,
    },
    byCode: [],
    byMonth: [],
    byStaff: [],
    items: [
      { kind: "COUPON", id: "r1", code: "WELCOME200", discount: 100, studentName: "سارة محمد", date: "2026-11-20" },
      { kind: "WAIVER", id: "m1", discount: 150, studentName: "ليلى حسن", groupName: "مجموعة أ", date: "2026-11-19" },
    ],
  });
  api.createCoupon.mockResolvedValue({ id: "coupon-2" });
  api.toggleCoupon.mockResolvedValue({ id: "coupon-1", isActive: false });
  api.deleteCoupon.mockResolvedValue({});
});

afterEach(() => cleanup());

describe("CouponsTab", () => {
  it("lists coupons with usage counters", async () => {
    render(<CouponsTab isEn={false} />);

    expect(await screen.findByText("EID25")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getByText(/12\/100/)).toBeInTheDocument();
    expect(screen.getByText("فعّال")).toBeInTheDocument();
  });

  it("creates a coupon from the modal", async () => {
    render(<CouponsTab isEn={false} />);
    await screen.findByText("EID25");

    fireEvent.click(screen.getByText("كود جديد"));
    fireEvent.change(screen.getByPlaceholderText("EID25"), { target: { value: "new10" } });
    fireEvent.click(screen.getByText("إنشاء"));

    await waitFor(() => expect(api.createCoupon).toHaveBeenCalled());
    expect(api.createCoupon.mock.calls[0][0]).toMatchObject({ code: "new10", type: "PERCENT" });
  });

  it("toggles a coupon and reloads", async () => {
    render(<CouponsTab isEn={false} />);
    await screen.findByText("EID25");

    fireEvent.click(screen.getByText("إيقاف"));
    await waitFor(() => expect(api.toggleCoupon).toHaveBeenCalledWith("coupon-1", false));
    await waitFor(() => expect(api.fetchCoupons).toHaveBeenCalledTimes(2));
  });

  it("marks an exhausted coupon", async () => {
    api.fetchCoupons.mockResolvedValue([{ ...coupon, usedCount: 100 }]);
    render(<CouponsTab isEn={false} />);

    expect(await screen.findByText("مستهلك")).toBeInTheDocument();
  });

  it("shows the discount impact report and recent items", async () => {
    render(<CouponsTab isEn={false} />);

    expect(await screen.findByText("إجمالي أثر الإيراد")).toBeInTheDocument();
    expect(screen.getByText("750 ج.م")).toBeInTheDocument();
    expect(screen.getByText("200 ج.م")).toBeInTheDocument();
    expect(screen.getByText("سارة محمد")).toBeInTheDocument();
    expect(screen.getByText("ليلى حسن")).toBeInTheDocument();
    expect(screen.getByText("إعفاء")).toBeInTheDocument();
    expect(api.fetchDiscountReport).toHaveBeenCalledWith(6);
  });
});
