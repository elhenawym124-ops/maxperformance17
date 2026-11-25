import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import OrderAutomationReportsPage from "./OrderAutomationReportsPage";
import { apiClient } from "../../../../services/apiClient";

jest.mock("../../../../i18n", () => ({
  getDirection: () => "rtl",
}));

const stableT = (k: string, defaultValue?: string) => (typeof defaultValue === "string" ? defaultValue : k);

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: stableT,
    i18n: { language: "ar" },
  }),
}));

jest.mock("../../../../services/apiClient", () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

describe("OrderAutomationReportsPage", () => {
  const mockReportData = {
    success: true,
    data: {
      kpis: {
        totalTransitions: 42,
        uniqueOrders: 35,
        totalRevenue: 15400,
        rulesTransitions: 25,
        printTransitions: 10,
        turboTransitions: 7,
      },
      rulesPerformance: [
        {
          id: "rule-1",
          fromStatus: "PENDING",
          toStatus: "CONFIRMED",
          waitTime: 30,
          timeUnit: "Minutes",
          isActive: true,
          executionsCount: 25,
          totalRevenue: 9800,
          pendingCount: 4,
          outcomes: { delivered: 20, cancelled: 3, inProgress: 2 },
        },
      ],
      eventsSummary: {
        print: {
          enabled: true,
          targetStatus: "PROCESSING",
          executionsCount: 10,
          totalRevenue: 3600,
        },
        turbo: {
          enabled: true,
          targetStatus: "SHIPPED",
          executionsCount: 7,
          totalRevenue: 2000,
        },
      },
      dailyTrends: [{ date: "2026-11-20", rules: 10, print: 3, turbo: 2, total: 15 }],
      recentLogs: [
        {
          id: "log-1",
          orderId: "ord-1",
          orderNumber: "10023",
          customerName: "محمد علي",
          customerPhone: "01012345678",
          total: 450,
          currentOrderStatus: "CONFIRMED",
          oldStatus: "PENDING",
          newStatus: "CONFIRMED",
          reason: "Auto-changed by rule: after 30 Minutes",
          type: "RULE",
          createdAt: "2026-11-20T14:30:00.000Z",
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/order-status?")) {
        return Promise.resolve({
          data: {
            success: true,
            data: [
              { code: "PENDING", name: "قيد الانتظار" },
              { code: "CONFIRMED", name: "مؤكد" },
            ],
          },
        });
      }
      if (url.includes("/order-status-rules/reports")) {
        return Promise.resolve({ data: mockReportData });
      }
      return Promise.resolve({ data: { success: true } });
    });
  });

  test("renders reports page title and KPIs correctly", async () => {
    render(
      <BrowserRouter>
        <OrderAutomationReportsPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/تقارير أتمتة حالات الطلبات/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText((42).toLocaleString("ar-EG"))).toBeInTheDocument();
      expect(screen.getByText((35).toLocaleString("ar-EG"))).toBeInTheDocument();
      expect(screen.getByText(/#10023/)).toBeInTheDocument();
      expect(screen.getByText(/محمد علي/)).toBeInTheDocument();
    });
  });

  test("renders active rules and events cards", async () => {
    render(
      <BrowserRouter>
        <OrderAutomationReportsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/أداء القواعد الزمنية/i)).toBeInTheDocument();
      expect(screen.getByText(/أتمتة طباعة الفواتير/i)).toBeInTheDocument();
      expect(screen.getByText(/أتمتة شحن تربو/i)).toBeInTheDocument();
    });
  });
});
