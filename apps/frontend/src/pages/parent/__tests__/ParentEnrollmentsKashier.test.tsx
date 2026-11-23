// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import ParentEnrollmentsPage from "../ParentEnrollmentsPage";

const jsonResponse = (body: any) => Promise.resolve({ ok: true, json: async () => body });

const child = { id: "stu-1", firstName: "سارة", lastName: "محمد" };

const enrollment = {
  id: "enr-1",
  enrollmentType: "PACKAGE",
  package: { id: "pkg-1", name: "باقة 10 ساعات", hoursCount: 10, price: 1000 },
  teacher: { name: "أحمد" },
  subject: { name: "رياضيات" },
  remainingHours: 6,
  totalHours: 10,
  paymentStatus: "PARTIALLY_PAID",
  amountPaid: 500,
  finalAmount: 1000,
  installments: [
    { installmentNumber: 1, amount: 500, dueDate: "2026-11-01", status: "PAID", paidAt: "2026-11-01T10:00:00.000Z" },
    { installmentNumber: 2, amount: 500, dueDate: "2026-11-20", status: "PENDING" },
  ],
};

beforeEach(() => {
  window.history.replaceState({}, "", "/parent/enrollments");
  localStorage.setItem("parentToken", "parent-token");
  global.fetch = vi.fn(async (input: any) => {
    const url = String(input);
    if (url.includes("installments/kashier-verify")) {
      return jsonResponse({ success: true, data: { paid: true, installmentNumber: 2, amount: 500 } });
    }
    if (url.includes("/kashier-session")) {
      return jsonResponse({ success: true, data: { sessionUrl: "https://pay.kashier.io/session/x", orderId: "EDUINST-1" } });
    }
    if (/\/children\/[^/]+\/enrollments$/.test(url)) {
      return jsonResponse({ success: true, data: [enrollment] });
    }
    if (url.endsWith("/children")) {
      return jsonResponse({ success: true, data: [child] });
    }
    return jsonResponse({ success: true, data: [] });
  }) as any;
});

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
});

describe("ParentEnrollmentsPage — online installments", () => {
  it("renders the installment schedule with pay buttons for unpaid installments", async () => {
    render(
      <MemoryRouter>
        <ParentEnrollmentsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText("جدول الأقساط")).toBeInTheDocument();
    expect(screen.getByText("مسدد")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ادفع الآن/ })).toBeInTheDocument();
  });

  it("verifies the installment payment on return and cleans the URL", async () => {
    window.history.replaceState({}, "", "/parent/enrollments?installmentOrder=EDUINST-comp-1-enr-1-2-1");
    render(
      <MemoryRouter>
        <ParentEnrollmentsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/تم سداد القسط رقم 2 بنجاح/)).toBeInTheDocument();
    const verifyCall = (global.fetch as any).mock.calls.find((call: any[]) =>
      String(call[0]).includes("installments/kashier-verify")
    );
    expect(verifyCall).toBeTruthy();
    expect(JSON.parse(verifyCall[1].body)).toEqual({ orderId: "EDUINST-comp-1-enr-1-2-1" });
    expect(window.location.search).toBe("");
  });

  it("starts a Kashier session when an unpaid installment is selected", async () => {
    render(
      <MemoryRouter>
        <ParentEnrollmentsPage />
      </MemoryRouter>
    );

    const payButton = await screen.findByRole("button", { name: /ادفع الآن/ });
    fireEvent.click(payButton);

    await waitFor(() => {
      const sessionCall = (global.fetch as any).mock.calls.find((call: any[]) =>
        String(call[0]).includes("/enrollments/enr-1/installments/2/kashier-session")
      );
      expect(sessionCall).toBeTruthy();
    });
  });
});
