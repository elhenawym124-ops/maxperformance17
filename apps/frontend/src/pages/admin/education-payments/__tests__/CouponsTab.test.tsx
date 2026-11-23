// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const api = vi.hoisted(() => ({
  fetchCoupons: vi.fn(),
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
});
