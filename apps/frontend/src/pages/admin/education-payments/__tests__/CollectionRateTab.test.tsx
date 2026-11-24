// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const api = vi.hoisted(() => ({ fetchCollectionReport: vi.fn() }));
vi.mock("../api", () => api);

import { CollectionRateTab } from "../CollectionRateTab";

const report = {
  period: { from: "2026-06-01", to: "2026-11-24", months: 6 },
  summary: {
    billed: 2300,
    collected: 700,
    gap: 1600,
    rate: 30.4,
    openDues: 1550,
    openPackageDues: 1200,
    openGroupDues: 350,
    payments: 3,
    enrollments: 3,
  },
  byMonth: [
    { month: "2026-10", billed: 1000, collected: 400, rate: 40 },
    { month: "2026-11", billed: 800, collected: 300, rate: 37.5 },
  ],
  byBranch: [
    { id: "b1", name: "فرع مدينة نصر", billed: 1000, collected: 500, rate: 50 },
    { id: "b2", name: "فرع المعادي", billed: 800, collected: 200, rate: 25 },
  ],
};

beforeEach(() => {
  api.fetchCollectionReport.mockReset();
  api.fetchCollectionReport.mockResolvedValue(report);
});

afterEach(() => cleanup());

describe("CollectionRateTab", () => {
  it("renders summary KPIs and the collection rate", async () => {
    render(<CollectionRateTab isEn={false} />);

    expect(await screen.findByText("التحصيل مقابل المستحق")).toBeInTheDocument();
    expect(screen.getByText("نسبة التحصيل")).toBeInTheDocument();
    expect(screen.getByText(/30\.4%/)).toBeInTheDocument();
    expect(screen.getByText(/2,300/)).toBeInTheDocument();
    expect(screen.getByText(/1,550/)).toBeInTheDocument();
    expect(api.fetchCollectionReport).toHaveBeenCalledWith(6);
  });

  it("renders monthly rows and branch rows with rates", async () => {
    render(<CollectionRateTab isEn={false} />);
    await screen.findByText("شهريًا");

    expect(screen.getByText("2026-10")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
    expect(screen.getByText("فرع مدينة نصر")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
  });

  it("refetches when the window changes", async () => {
    render(<CollectionRateTab isEn={false} />);
    await waitFor(() => expect(api.fetchCollectionReport).toHaveBeenCalledWith(6));

    fireEvent.click(screen.getByText("12 شهور"));
    await waitFor(() => expect(api.fetchCollectionReport).toHaveBeenCalledWith(12));
  });

  it("shows an error banner when the request fails", async () => {
    api.fetchCollectionReport.mockRejectedValue(new Error("فشل التحميل"));
    render(<CollectionRateTab isEn={false} />);

    expect(await screen.findByText("فشل التحميل")).toBeInTheDocument();
  });
});
