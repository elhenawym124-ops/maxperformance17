/**
 * تقارير الحالات — تبويب التقرير اليومي: الملخص + جدول الحالات + التفاصيل.
 */
import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import OrderStatusTemplatesPage from "../OrderStatusTemplatesPage";

const mockT = jest.fn((key: string, fallback?: string) => fallback || key);

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: { language: "ar", dir: () => "rtl" },
  }),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
}));

jest.mock("../../../services/apiClient", () => ({
  apiClient: { get: jest.fn(), put: jest.fn(), post: jest.fn(), delete: jest.fn(), patch: jest.fn() },
}));

const { apiClient } = require("../../../services/apiClient") as {
  apiClient: { get: jest.Mock; put: jest.Mock; post: jest.Mock; delete: jest.Mock; patch: jest.Mock };
};

const REPORT = {
  totals: { total: 4, meta: 2, regular: 2, delivered: 2, failed: 1 },
  byEvent: {
    CONFIRMED: { total: 2, meta: 2, regular: 0, delivered: 2, failed: 0 },
    SHIPPED: { total: 2, meta: 0, regular: 2, delivered: 0, failed: 1 },
  },
  items: [
    {
      id: "l1",
      eventType: "SHIPPED",
      orderNumber: "ORD-100",
      customerName: "أحمد",
      customerPhone: "201000000000",
      provider: "META_CLOUD",
      status: "DELIVERED",
      createdAt: "2026-08-11T10:00:00Z",
      errorMessage: null,
    },
    {
      id: "l2",
      eventType: "SHIPPED",
      orderNumber: "ORD-101",
      customerName: "محمد",
      customerPhone: "201111111111",
      provider: "BAILEYS",
      status: "FAILED",
      createdAt: "2026-08-11T11:00:00Z",
      errorMessage: "rejected",
    },
  ],
};

function mockApi() {
  apiClient.get.mockImplementation((url: string) => {
    if (url === "/order-status/with-templates") {
      return Promise.resolve({
        data: {
          success: true,
          data: [
            { id: "st1", code: "CONFIRMED", name: "مؤكد", color: "#3B82F6", sortOrder: 1, statusType: "order", notifyCustomer: true, isSystemStatus: true, hasTemplate: true, isNonNotifiable: false, template: null },
            { id: "st2", code: "SHIPPED", name: "تم الشحن", color: "#10B981", sortOrder: 2, statusType: "shipping", notifyCustomer: true, isSystemStatus: true, hasTemplate: true, isNonNotifiable: false, template: null },
          ],
        },
      });
    }
    if (url === "/whatsapp/notifications/settings") {
      return Promise.resolve({ data: { success: true, settings: { defaultSessionId: null }, sessions: [] } });
    }
    if (url === "/whatsapp-notifications/templates/delivery-preview") {
      return Promise.resolve({ data: { success: true, defaultSession: null, preview: [] } });
    }
    if (url === "/whatsapp/sessions") {
      return Promise.resolve({ data: { sessions: [] } });
    }
    if (url === "/whatsapp/notifications/status-report") {
      return Promise.resolve({ data: { success: true, data: REPORT } });
    }
    if (url === "/whatsapp-templates/templates/report/status-messages") {
      return Promise.resolve({ data: { success: true, data: REPORT.items } });
    }
    return Promise.resolve({ data: {} });
  });
}

function renderPage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <OrderStatusTemplatesPage />
    </MemoryRouter>,
  );
}

describe("OrderStatusTemplatesPage تقارير الحالات", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("التبويب يعرض الملخص وعدد الميتا/العادي وصفوف الحالات", async () => {
    mockApi();
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("tab", { name: /تقارير الحالات/ }));

    const tabPanel = await screen.findByTestId("status-report-tab");
    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringContaining("status-report"),
      expect.objectContaining({ params: expect.objectContaining({ startDate: expect.any(String) }) }),
    );

    await waitFor(() => {
      expect(within(tabPanel).getByText("إجمالي الإرسالات")).toBeInTheDocument();
    });
    expect(within(tabPanel).getAllByText("قوالب ميتا").length).toBeGreaterThanOrEqual(1);
    expect(within(tabPanel).getAllByText("واتساب عادي").length).toBeGreaterThanOrEqual(1);

    expect(within(tabPanel).getByText("مؤكد")).toBeInTheDocument();
    expect(within(tabPanel).getByText("تم الشحن")).toBeInTheDocument();

    const orderConfirmedRow = within(tabPanel).getAllByRole("row").find((r) => r.textContent?.includes("مؤكد"));
    expect(orderConfirmedRow?.textContent).toContain("2");
  });

  test("فتح تفاصيل حالة يجيب السجلات ويعرض شارة ميتا/عادي وأرقام الطلبات", async () => {
    mockApi();
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("tab", { name: /تقارير الحالات/ }));
    const tabPanel = await screen.findByTestId("status-report-tab");
    await waitFor(() => expect(within(tabPanel).getByText("إجمالي الإرسالات")).toBeInTheDocument());

    const row = within(tabPanel).getAllByRole("row").find((r) => r.textContent?.includes("تم الشحن"));
    expect(row).toBeTruthy();
    await user.click(row!);

    await waitFor(() => {
      expect(within(tabPanel).getByText("ORD-101")).toBeInTheDocument();
      expect(within(tabPanel).getByText("محمد")).toBeInTheDocument();
    });

    expect(within(tabPanel).getAllByText("ميتا (Cloud)").length).toBeGreaterThanOrEqual(1);
    expect(within(tabPanel).getAllByText("واتساب عادي").length).toBeGreaterThanOrEqual(1);
    expect(within(tabPanel).getAllByText("فشل").length).toBeGreaterThanOrEqual(1);
  });

  test("فلتر ميتا بيقصر الجدول على الإرسالات عبر قالب ميتا", async () => {
    mockApi();
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("tab", { name: /تقارير الحالات/ }));
    const tabPanel = await screen.findByTestId("status-report-tab");
    await waitFor(() => expect(within(tabPanel).getByText("إجمالي الإرسالات")).toBeInTheDocument());

    await user.selectOptions(within(tabPanel).getByRole("combobox", { name: "فلترة نوع الإرسال" }), "meta");

    expect(within(tabPanel).getByText("مؤكد")).toBeInTheDocument();
    expect(within(tabPanel).queryByText("تم الشحن")).not.toBeInTheDocument();
  });
});
