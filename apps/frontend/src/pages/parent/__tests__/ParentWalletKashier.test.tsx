// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import ParentWalletPage from "../ParentWalletPage";

const jsonResponse = (body: any) => Promise.resolve({ ok: true, json: async () => body });

const walletPayload = {
  success: true,
  data: {
    wallet: { balance: 100, totalEarned: 100, totalSpent: 0 },
    transactions: [],
  },
};

beforeEach(() => {
  window.history.replaceState({}, "", "/parent/wallet");
  localStorage.setItem("parentToken", "parent-token");
  global.fetch = vi.fn(async (input: any) => {
    const url = String(input);
    if (url.includes("/wallet/kashier-verify")) {
      return jsonResponse({ success: true, data: { paid: true, amount: 500 } });
    }
    if (url.includes("/parent-portal/wallet")) return jsonResponse(walletPayload);
    if (url.includes("/parent-portal/payments")) return jsonResponse({ success: true, data: [] });
    return jsonResponse({ success: true, data: [] });
  }) as any;
});

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
});

describe("ParentWalletPage — online top-up return", () => {
  it("verifies the Kashier order on return and shows the credited amount", async () => {
    window.history.replaceState({}, "", "/parent/wallet?topupOrder=EDUTOP-comp-1-1");
    render(<ParentWalletPage />);

    expect(await screen.findByText(/تم شحن .* في محفظتك بنجاح/)).toBeInTheDocument();

    const verifyCall = (global.fetch as any).mock.calls.find((call: any[]) =>
      String(call[0]).includes("/wallet/kashier-verify")
    );
    expect(verifyCall).toBeTruthy();
    expect(JSON.parse(verifyCall[1].body)).toEqual({ orderId: "EDUTOP-comp-1-1" });
    expect(window.location.search).toBe("");
  });

  it("shows an error banner when the payment is not confirmed yet", async () => {
    (global.fetch as any).mockImplementation(async (input: any) => {
      const url = String(input);
      if (url.includes("/wallet/kashier-verify")) {
        return jsonResponse({ success: true, data: { paid: false, status: "PENDING" } });
      }
      if (url.includes("/parent-portal/wallet")) return jsonResponse(walletPayload);
      return jsonResponse({ success: true, data: [] });
    });

    window.history.replaceState({}, "", "/parent/wallet?topupOrder=EDUTOP-comp-1-2");
    render(<ParentWalletPage />);

    expect(await screen.findByText(/لم يتم تأكيد الدفع بعد/)).toBeInTheDocument();
  });

  it("shows the online payment option in the top-up form", async () => {
    render(<ParentWalletPage />);
    await waitFor(() => expect(screen.getByText("شحن المحفظة")).toBeInTheDocument());
    fireEvent.click(screen.getByText("شحن المحفظة"));
    expect(await screen.findByText("ادفع أونلاين الآن")).toBeInTheDocument();
    expect(screen.getByText("تحويل بنكي / طلب شحن يدوي")).toBeInTheDocument();
  });
});
