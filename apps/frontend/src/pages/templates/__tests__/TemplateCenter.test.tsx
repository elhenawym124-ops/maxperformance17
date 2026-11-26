// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import TemplateCenter, {
  WhatsAppBubblePreview,
  resolveVariablesForPreview,
  buildLocalContentFromMetaBody,
} from "../TemplateCenter";
import { orderScopeConfig } from "../scopes/orderScope";
import type { TemplateScopeConfig, EventRow } from "../types";

const { mockApiGet, mockApiPost } = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
  mockApiPost: vi.fn(),
}));

vi.mock("../../../services/apiClient", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockApiGet(...args),
    post: (...args: unknown[]) => mockApiPost(...args),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_k: string, fb: string) => fb,
    i18n: { language: "ar" },
  }),
}));

const mockConfig: TemplateScopeConfig = {
  scope: "orders",
  documentTitle: "قوالب إشعارات الطلبات",
  title: "إشعارات الطلبات التلقائية عبر واتساب",
  description: "تحكم في رسائل الواتساب التي ترسل للعملاء عند تغير حالة طلباتهم",
  templateCrudBase: "/order-status-templates",
  metaOpsBase: "/order-status-templates",
  variableSyntax: "double",
  variables: [
    { var: "{{customerName}}", desc: "اسم العميل" },
    { var: "{{orderNumber}}", desc: "رقم الطلب" },
  ],
  sampleVariables: {
    customerName: "أحمد محمد",
    orderNumber: "ORD-12345",
  },
  metaToLocalDefaultOrder: ["customerName", "orderNumber"],
  defaultContent: "مرحباً {{customerName}}، رقم طلبك {{orderNumber}}",
  eventLabelResolver: (e: string) => e,
  loadEvents: async () => [
    {
      id: "stat_1",
      code: "CONFIRMED",
      name: "تم التأكيد",
      color: "#10B981",
      sortOrder: 1,
      statusType: "order",
      notifyCustomer: true,
      isSystemStatus: true,
      template: {
        id: "tpl_1",
        name: "قالب التأكيد",
        content: "تم تأكيد طلبك {{orderNumber}} يا {{customerName}}",
        eventType: "CONFIRMED",
        isActive: true,
      },
      hasTemplate: true,
      hasMetaTemplate: false,
    },
  ],
  toggleNotify: async () => {},
  tabs: [
    { key: "all", label: "كل الحالات", kind: "list" },
    { key: "reports", label: "سجل الإرسال", kind: "reports" },
  ],
  features: {
    enableButtons: true,
    enableHeaderProductImage: false,
    enableMetaSwitch: true,
    enableMetaMultiBind: false,
    enableTestSender: false,
    enableSchedule: false,
    enableReports: true,
    enableSettings: false,
    enableFilterChips: true,
    enableInternalToggle: false,
    sortModes: ["statusType", "alphabetical"],
    categoryMode: "auto",
  },
};

describe("TemplateCenter Domain Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiGet.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/whatsapp/sessions")) {
        return Promise.resolve({ data: { sessions: [] } });
      }
      return Promise.resolve({ data: { success: true, data: [] } });
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("resolves preview variables with sample values correctly", () => {
    const text = "مرحباً {{customerName}}، طلبك {{orderNumber}} جاهز";
    const res = resolveVariablesForPreview(text);
    expect(res).toContain("أحمد محمد");
    expect(res).toContain("ORD-12345");
  });

  it("converts meta body numeric parameters to named variables", () => {
    const metaBody = "Hello {{1}}, your order {{2}} has shipped";
    const res = buildLocalContentFromMetaBody(metaBody, ["customerName", "orderNumber"]);
    expect(res).toBe("Hello {{customerName}}, your order {{orderNumber}} has shipped");
  });

  it("renders WhatsAppBubblePreview with bubble content and buttons", () => {
    render(
      <WhatsAppBubblePreview
        content="شكراً لتسوقك {{customerName}}"
        hasButtons={true}
        buttons={[{ id: "btn_1", text: "تأكيد الطلب", action: "CONFIRMED", type: "QUICK_REPLY" }]}
      />
    );

    expect(screen.getByTestId("whatsapp-preview")).toBeTruthy();
    expect(screen.getByText(/أحمد محمد/)).toBeTruthy();
    expect(screen.getByText("تأكيد الطلب")).toBeTruthy();
  });

  it("mounts TemplateCenter and displays title, tabs and events", async () => {
    render(
      <MemoryRouter>
        <TemplateCenter config={mockConfig} />
      </MemoryRouter>
    );

    expect(screen.getByText("إشعارات الطلبات التلقائية عبر واتساب")).toBeTruthy();
    expect(screen.getByText("كل الحالات")).toBeTruthy();
    expect(screen.getByText("سجل الإرسال")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("تم التأكيد")).toBeTruthy();
    });
  });

  it("reads initial ?tab= query parameter from URL and activates that tab", async () => {
    render(
      <MemoryRouter initialEntries={["/orders/status-templates?tab=reports"]}>
        <TemplateCenter config={mockConfig} />
      </MemoryRouter>
    );

    const reportsTab = screen.getByRole("tab", { name: /سجل الإرسال/ });
    expect(reportsTab.getAttribute("aria-selected")).toBe("true");
  });

  it("maps order/cart system events and recovery variables in orderScopeConfig", async () => {
    const varNames = orderScopeConfig.variables.map((v) => v.var);
    expect(varNames).toContain("{{cartUrl}}");
    expect(varNames).toContain("{{couponCode}}");
    expect(varNames).toContain("{{discountedTotal}}");
    expect(orderScopeConfig.resolveCategory?.({ code: "CART_ABANDONED_1H" } as EventRow)).toBe("ABANDONED_CART");
    expect(orderScopeConfig.resolveCategory?.({ code: "CART_ABANDONED_WITH_DISCOUNT" } as EventRow)).toBe("ABANDONED_CART");

    const mockPut = vi.fn().mockResolvedValue({ data: { success: true } });
    await orderScopeConfig.toggleNotify({ put: mockPut } as any, {
      id: "CART_ABANDONED_24H",
      code: "CART_ABANDONED_24H",
      notifyCustomer: false,
    } as EventRow);
    expect(mockPut).toHaveBeenCalledWith("/whatsapp/notifications/settings", { abandonedCartEnabled: true });

    await orderScopeConfig.toggleNotify({ put: mockPut } as any, {
      id: "ORDER_CREATED",
      code: "ORDER_CREATED",
      notifyCustomer: true,
    } as EventRow);
    expect(mockPut).toHaveBeenCalledWith("/whatsapp/notifications/settings", { orderCreatedEnabled: false });
  });

  it("displays configured incomplete-cart timing hint and settings link when scope is orders", async () => {
    const { default: OrderStatusTemplatesPage } = await import("../../orders/OrderStatusTemplatesPage");
    mockApiGet.mockImplementation((url: string) => {
      if (url === "/order-status/with-templates") {
        return Promise.resolve({
          data: {
            success: true,
            data: [
              {
                id: "CART_ABANDONED_1H",
                code: "CART_ABANDONED_1H",
                name: "تذكير السلة المتروكة - ساعة",
                color: "#0D9488",
                sortOrder: 94,
                statusType: "incomplete",
                notifyCustomer: true,
                isSystemStatus: true,
                hasTemplate: false,
                template: null,
              },
            ],
          },
        });
      }
      if (url === "/whatsapp/notifications/settings") {
        return Promise.resolve({
          data: { success: true, settings: { abandonedCartFirstReminder: 3 }, sessions: [] },
        });
      }
      return Promise.resolve({ data: { sessions: [] } });
    });

    render(
      <MemoryRouter initialEntries={["/orders/status-templates?tab=incomplete"]}>
        <OrderStatusTemplatesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("بعد 3 ساعة")).toBeTruthy();
    });
    const link = screen.getByRole("link", { name: /تعديل التوقيت/ });
    expect(link.getAttribute("href")).toBe("/orders/incomplete");
  });
});
