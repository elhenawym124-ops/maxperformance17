// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const api = vi.hoisted(() => ({ fetchEngagement: vi.fn() }));
vi.mock("../api", () => api);

import { EngagementTab } from "../EngagementTab";

const report = {
  period: { from: "2026-08-24", to: "2026-11-24", months: 3 },
  summary: {
    messages: 200,
    sent: 60,
    delivered: 80,
    read: 55,
    failed: 5,
    readRate: 27.5,
    deliveryRate: 97.5,
    guardians: 40,
    activated: 10,
    activationRate: 25,
  },
  byEventType: [
    { eventType: "education_statement_due", total: 120, read: 24, failed: 4, readRate: 20 },
    { eventType: "education_exam_result", total: 80, read: 31, failed: 1, readRate: 38.8 },
  ],
  byHour: [],
  bestHour: { hour: 18, readRate: 62.5, total: 40 },
  ignored: {
    count: 1,
    phones: [{ phone: "01330000000", total: 5, read: 0 }],
  },
};

beforeEach(() => {
  api.fetchEngagement.mockReset();
  api.fetchEngagement.mockResolvedValue(report);
});

afterEach(() => cleanup());

describe("EngagementTab", () => {
  it("renders the engagement KPIs", async () => {
    render(<EngagementTab isEn={false} />);

    expect(await screen.findByText("تفاعل أولياء الأمور")).toBeInTheDocument();
    expect(screen.getByText("27.5%")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getByText("10/40")).toBeInTheDocument();
    expect(screen.getByText("18:00")).toBeInTheDocument();
    expect(api.fetchEngagement).toHaveBeenCalledWith(3);
  });

  it("lists message types and parents who never read", async () => {
    render(<EngagementTab isEn={false} />);
    await screen.findByText("حسب نوع الرسالة");

    expect(screen.getByText("education_statement_due")).toBeInTheDocument();
    expect(screen.getByText("38.8%")).toBeInTheDocument();
    expect(screen.getByText("01330000000")).toBeInTheDocument();
    expect(screen.getByText("5 رسالة")).toBeInTheDocument();
  });

  it("refetches when the window changes", async () => {
    render(<EngagementTab isEn={false} />);
    await waitFor(() => expect(api.fetchEngagement).toHaveBeenCalledWith(3));

    fireEvent.click(screen.getByText("12 شهور"));
    await waitFor(() => expect(api.fetchEngagement).toHaveBeenCalledWith(12));
  });
});
