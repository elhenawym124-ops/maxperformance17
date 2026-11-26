/**
 * ربط قالب ميتا: slot ميتا مستقل جنب slot الواتساب العادي.
 * التعديل على slot ميتا بيفتح الديالوج في وضع ميتا مباشرة (مفيش تبويب).
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

const META_SESSIONS = [{ id: "ms1", name: "جلسة ميتا", provider: "META_CLOUD", metaDisplayPhoneNumber: "201000000000" }];

const META_TEMPLATES = [
  {
    name: "order_confirm_ar",
    status: "APPROVED",
    language: "ar",
    category: "UTILITY",
    components: [{ type: "BODY", text: "مرحباً {{1}}، طلبك {{2}} في الطريق" }],
    boundToLocalTemplateId: null,
    boundToEventType: null,
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeStatus(overrides: Record<string, any>) {
  return {
    id: "st1",
    code: "CONFIRMED",
    name: "مؤكد",
    color: "#3B82F6",
    sortOrder: 1,
    statusType: "order",
    notifyCustomer: true,
    isSystemStatus: true,
    isNonNotifiable: false,
    hasTemplate: true,
    template: {
      id: "t1",
      name: "t1",
      content: "مرحبا {{customerName}} أكد طلبك",
      eventType: "CONFIRMED",
      isActive: true,
      channel: "AUTO",
      metaTemplateName: null,
      metaTemplateStatus: null,
    },
    ...overrides,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockApi(status: any, options: { postResubmit?: boolean } = {}) {
  apiClient.get.mockImplementation((url: string) => {
    if (url === "/order-status/with-templates") {
      return Promise.resolve({ data: { success: true, data: [status] } });
    }
    if (url === "/whatsapp/notifications/settings") {
      return Promise.resolve({ data: { success: true, settings: { defaultSessionId: "ms1" }, sessions: [] } });
    }
    if (url === "/whatsapp-notifications/templates/delivery-preview") {
      return Promise.resolve({
        data: { success: true, defaultSession: { id: "ms1", name: "جلسة ميتا", provider: "META_CLOUD" }, preview: [] },
      });
    }
    if (url === "/whatsapp/sessions") {
      return Promise.resolve({ data: { sessions: META_SESSIONS } });
    }
    if (url.startsWith("/whatsapp-notifications/templates/meta-available")) {
      return Promise.resolve({ data: { templates: META_TEMPLATES } });
    }
    return Promise.resolve({ data: {} });
  });
  apiClient.put.mockResolvedValue({ data: { success: true } });
  apiClient.post.mockResolvedValue({ data: { success: true, metaTemplateName: "order_confirm_ar" } });
  void options;
}

function renderPage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <OrderStatusTemplatesPage />
    </MemoryRouter>,
  );
}

function metaSlot() {
  return screen.getByTestId("meta-slot-st1");
}

describe("OrderStatusTemplatesPage Meta template binding (two slots)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("slot ميتا بيفتح الديالوج في وضع ميتا ويعرض رسالة قالب ميتا المختار", async () => {
    mockApi(makeStatus({}));
    renderPage();
    const user = userEvent.setup();

    await screen.findByTestId("status-row-st1");
    await user.click(within(metaSlot()).getByRole("button", { name: /اختيار قالب معتمد/ }));

    await user.selectOptions(await screen.findByRole("combobox", { name: /قالب ميتا المعتمد/ }), "order_confirm_ar");

    expect(await screen.findByText(/الرسالة التي ستصل للعميل/)).toBeInTheDocument();
    expect(screen.getAllByText(/أحمد محمد/).length).toBeGreaterThan(0);
  });

  test("بيظهر مؤشر الحالة المربوطة والزر إرسال للمراجعة من جديد لما يكون القالب مربوط", async () => {
    mockApi(
      makeStatus({
        template: {
          id: "t1",
          name: "t1",
          content: "مرحبا {{customerName}} أكد طلبك",
          eventType: "CONFIRMED",
          isActive: true,
          hasButtons: false,
          channel: "AUTO",
          metaTemplateName: "order_confirm_ar",
          metaTemplateStatus: "APPROVED",
        },
      })
    );
    renderPage();
    const user = userEvent.setup();

    await screen.findByTestId("status-row-st1");
    await user.click(within(metaSlot()).getByRole("button", { name: /تعديل المحتوى/ }));

    const select = await screen.findByRole("combobox", { name: /قالب ميتا المعتمد/ });
    expect(select).toHaveValue("order_confirm_ar");
    expect(screen.queryByRole("button", { name: /إرسال للمراجعة من جديد/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /محتوى الرسالة/ }));
    const textarea = screen.getByRole("textbox", { name: /محتوى القالب المحلي/ });
    await user.clear(textarea);
    await user.type(textarea, "تم تحديث طلبك بنجاح - شكراً لك");

    expect(await screen.findByRole("button", { name: /إرسال للمراجعة من جديد/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /إرسال للمراجعة من جديد/ }));

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(
        expect.stringContaining("/resubmit-meta"),
        expect.objectContaining({ sessionId: "ms1" })
      )
    );
    expect(apiClient.put).toHaveBeenCalledWith(
      expect.stringContaining("/templates/t1"),
      expect.objectContaining({ content: "تم تحديث طلبك بنجاح - شكراً لك" })
    );
  });

  test("المرجع المحلي بيظهر بالتوسيع في وضع تعديل قالب ميتا المربوط", async () => {
    mockApi(
      makeStatus({
        template: {
          id: "t1",
          name: "t1",
          content: "مرحبا {{customerName}} أكد طلبك",
          eventType: "CONFIRMED",
          isActive: true,
          hasButtons: false,
          channel: "AUTO",
          metaTemplateName: "order_confirm_ar",
          metaTemplateStatus: "APPROVED",
        },
      })
    );
    renderPage();
    const user = userEvent.setup();

    await screen.findByTestId("status-row-st1");
    await user.click(within(metaSlot()).getByRole("button", { name: /تعديل المحتوى/ }));

    await user.click(screen.getByRole("button", { name: /محتوى الرسالة/ }));

    const contentArea = screen.getByPlaceholderText(/اكتب رسالتك هنا/);
    expect(contentArea).toBeInTheDocument();
    expect(contentArea).toHaveValue("مرحبا {{customerName}} أكد طلبك");
  });

  test("ربط قالب جديد (مفيش template.id) بينشئ القالب الميتا أولاً ثم يربطه بميتا", async () => {
    const createdId = "t-new";
    mockApi(makeStatus({ template: null, hasTemplate: false }));
    apiClient.post.mockImplementation((url: string, body?: any) => {
      if (url === "/whatsapp/notifications/templates") {
        return Promise.resolve({
          data: { success: true, template: { id: createdId, ...body } },
        });
      }
      if (url.endsWith("/bind-meta")) {
        return Promise.resolve({ data: { success: true } });
      }
      return Promise.resolve({ data: { success: true, metaTemplateName: "order_confirm_ar" } });
    });
    renderPage();
    const user = userEvent.setup();

    await screen.findByTestId("status-row-st1");
    await user.click(within(metaSlot()).getByRole("button", { name: /اختيار قالب معتمد/ }));
    await user.selectOptions(await screen.findByRole("combobox", { name: /قالب ميتا المعتمد/ }), "order_confirm_ar");
    await user.click(screen.getByRole("button", { name: /حفظ وربط بقالب ميتا/ }));

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(
        "/whatsapp/notifications/templates",
        expect.objectContaining({ name: "قالب ميتا مؤكد", eventType: "CONFIRMED", channel: "META_CLOUD" })
      )
    );
    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(
        expect.stringContaining("/bind-meta"),
        expect.objectContaining({ metaTemplateName: "order_confirm_ar" })
      )
    );
  });

  test("زر إنشاء قالب ميتا جديد بيحفظ المحلي ثم بينشر القالب على ميتا للمراجعة", async () => {
    mockApi(makeStatus({}));
    apiClient.post.mockImplementation((url: string, body?: any) => {
      if (url.endsWith("/publish")) {
        return Promise.resolve({ data: { success: true } });
      }
      if (url === "/whatsapp/notifications/templates") {
        return Promise.resolve({ data: { success: true, template: { id: "t-new", ...body } } });
      }
      return Promise.resolve({ data: { success: true, metaTemplateName: "order_confirm_ar" } });
    });
    renderPage();
    const user = userEvent.setup();

    await screen.findByTestId("status-row-st1");
    await user.click(within(metaSlot()).getByRole("button", { name: /إنشاء/ }));

    await user.click(screen.getByRole("button", { name: /إنشاء قالب ميتا جديد/ }));

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(
        expect.stringContaining("/publish"),
        expect.objectContaining({ sessionId: "ms1" })
      )
    );
    expect(apiClient.post).toHaveBeenCalledWith(
      "/whatsapp/notifications/templates",
      expect.objectContaining({ channel: "META_CLOUD" })
    );
  });

  test("قالب ميتا مربوط بحالة تانية لسه بيظهر للاختيار (multi-bind) + توضيح الربط", async () => {
    mockApi(makeStatus({}));
    apiClient.get.mockImplementation((url: string) => {
      if (url === "/order-status/with-templates") {
        return Promise.resolve({ data: { success: true, data: [makeStatus({})] } });
      }
      if (url === "/whatsapp/notifications/settings") {
        return Promise.resolve({ data: { success: true, settings: { defaultSessionId: "ms1" }, sessions: [] } });
      }
      if (url === "/whatsapp-notifications/templates/delivery-preview") {
        return Promise.resolve({
          data: { success: true, defaultSession: { id: "ms1", name: "جلسة ميتا", provider: "META_CLOUD" }, preview: [] },
        });
      }
      if (url === "/whatsapp/sessions") {
        return Promise.resolve({ data: { sessions: META_SESSIONS } });
      }
      if (url.startsWith("/whatsapp-notifications/templates/meta-available")) {
        return Promise.resolve({
          data: {
            templates: [
              {
                name: "order_confirm_ar",
                status: "APPROVED",
                language: "ar",
                category: "UTILITY",
                components: [{ type: "BODY", text: "مرحباً {{1}}، طلبك {{2}} في الطريق" }],
                boundToLocalTemplateIds: ["t-other"],
                boundToEventTypes: ["SHIPPED"],
                boundToLocalTemplateId: "t-other",
                boundToEventType: "SHIPPED",
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
    renderPage();
    const user = userEvent.setup();

    await screen.findByTestId("status-row-st1");
    await user.click(within(metaSlot()).getByRole("button", { name: /اختيار قالب معتمد/ }));

    const select = await screen.findByRole("combobox", { name: /قالب ميتا المعتمد/ });
    expect(within(select).getByText(/مربوط بـ SHIPPED/)).toBeInTheDocument();
  });

  test("اختيار قالب ميتا بيبني المحتوى المحلي تلقائياً لو القالب مربوط بحالة تانية (auto-fill)", async () => {
    mockApi(
      makeStatus({
        metaTemplate: {
          id: "mt1",
          name: "قالب طلب جديد",
          content: "مرحبا بدون متغيرات",
          eventType: "CONFIRMED",
          isActive: true,
          channel: "META_CLOUD",
          metaTemplateName: null,
          metaTemplateStatus: null,
        },
      })
    );
    apiClient.get.mockImplementation((url: string) => {
      if (url === "/order-status/with-templates") {
        return Promise.resolve({
          data: {
            success: true,
            data: [
              makeStatus({
                metaTemplate: {
                  id: "mt1",
                  name: "قالب طلب جديد",
                  content: "مرحبا بدون متغيرات",
                  eventType: "CONFIRMED",
                  isActive: true,
                  channel: "META_CLOUD",
                  metaTemplateName: null,
                  metaTemplateStatus: null,
                },
              }),
            ],
          },
        });
      }
      if (url === "/whatsapp/notifications/settings") {
        return Promise.resolve({ data: { success: true, settings: { defaultSessionId: "ms1" }, sessions: [] } });
      }
      if (url === "/whatsapp-notifications/templates/delivery-preview") {
        return Promise.resolve({
          data: { success: true, defaultSession: { id: "ms1", name: "جلسة ميتا", provider: "META_CLOUD" }, preview: [] },
        });
      }
      if (url === "/whatsapp/sessions") {
        return Promise.resolve({ data: { sessions: META_SESSIONS } });
      }
      if (url.startsWith("/whatsapp-notifications/templates/meta-available")) {
        return Promise.resolve({
          data: {
            templates: [
              {
                name: "order_confirm_ar",
                status: "APPROVED",
                language: "ar",
                category: "UTILITY",
                components: [{ type: "BODY", text: "مرحباً {{1}}، طلبك {{2}} في الطريق" }],
                boundToLocalTemplateIds: ["t-other"],
                boundToEventTypes: ["SHIPPED"],
                boundToLocalTemplateId: "t-other",
                boundToEventType: "SHIPPED",
                boundLocalContent: "مرحباً {{customerName}}، طلبك {{orderNumber}} في الطريق",
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
    renderPage();
    const user = userEvent.setup();

    await screen.findByTestId("status-row-st1");
    await user.click(within(metaSlot()).getByRole("button", { name: /تعديل المحتوى/ }));

    const textarea = await screen.findByRole("textbox", { name: /محتوى القالب المحلي/ });
    expect(textarea).toHaveValue("مرحبا بدون متغيرات");

    const select = await screen.findByRole("combobox", { name: /قالب ميتا المعتمد/ });
    await user.selectOptions(select, "order_confirm_ar");

    expect(textarea).toHaveValue("مرحباً {{customerName}}، طلبك {{orderNumber}} في الطريق");
  });

  test("اختيار قالب ميتا بدون ربط بيبني محتوى افتراضي من نص قالب ميتا", async () => {
    mockApi(
      makeStatus({
        metaTemplate: {
          id: "mt1",
          name: "قالب طلب جديد",
          content: "مرحبا",
          eventType: "CONFIRMED",
          isActive: true,
          channel: "META_CLOUD",
          metaTemplateName: null,
          metaTemplateStatus: null,
        },
      })
    );
    renderPage();
    const user = userEvent.setup();

    await screen.findByTestId("status-row-st1");
    await user.click(within(metaSlot()).getByRole("button", { name: /تعديل المحتوى/ }));

    const textarea = await screen.findByRole("textbox", { name: /محتوى القالب المحلي/ });
    const select = await screen.findByRole("combobox", { name: /قالب ميتا المعتمد/ });
    await user.selectOptions(select, "order_confirm_ar");

    expect(textarea).toHaveValue("مرحباً {{customerName}}، طلبك {{orderNumber}} في الطريق");
  });

  test("بيمنع الحفظ لما المتغيرات المحلية أقل من قالب ميتا ويعرض رسالة", async () => {
    const unboundMetaStatus = makeStatus({
      metaTemplate: {
        id: "mt1",
        name: "قالب طلب جديد",
        content: "مرحبا {{customerName}} أكد طلبك",
        eventType: "CONFIRMED",
        isActive: true,
        channel: "META_CLOUD",
        metaTemplateName: null,
        metaTemplateStatus: null,
      },
    });
    apiClient.get.mockImplementation((url: string) => {
      if (url === "/order-status/with-templates") {
        return Promise.resolve({ data: { success: true, data: [unboundMetaStatus] } });
      }
      if (url === "/whatsapp/notifications/settings") {
        return Promise.resolve({ data: { success: true, settings: { defaultSessionId: "ms1" }, sessions: [] } });
      }
      if (url === "/whatsapp-notifications/templates/delivery-preview") {
        return Promise.resolve({
          data: { success: true, defaultSession: { id: "ms1", name: "جلسة ميتا", provider: "META_CLOUD" }, preview: [] },
        });
      }
      if (url === "/whatsapp/sessions") {
        return Promise.resolve({ data: { sessions: META_SESSIONS } });
      }
      if (url.startsWith("/whatsapp-notifications/templates/meta-available")) {
        return Promise.resolve({ data: { templates: META_TEMPLATES } });
      }
      return Promise.resolve({ data: {} });
    });
    renderPage();
    const user = userEvent.setup();

    await screen.findByTestId("status-row-st1");
    await user.click(within(metaSlot()).getByRole("button", { name: /تعديل المحتوى/ }));

    const select = await screen.findByRole("combobox", { name: /قالب ميتا المعتمد/ });
    await user.selectOptions(select, "order_confirm_ar");

    const textarea = screen.getByRole("textbox", { name: /محتوى القالب المحلي/ });
    await user.clear(textarea);
    await user.type(textarea, "نص من غير متغيرات");

    expect(await screen.findByRole("alert")).toHaveTextContent(/محتاج/);
    expect(screen.getByRole("button", { name: /حفظ وربط بقالب ميتا/ })).toBeDisabled();
  });

  test("تغيير القالب بيفتح وضع بسيط (switch) بدون محرر محتوى ويربط القالب المختار", async () => {
    mockApi(
      makeStatus({
        metaTemplate: {
          id: "mt1",
          name: "قالب طلب جديد",
          content: "مرحبا {{customerName}} أكد طلبك",
          eventType: "CONFIRMED",
          isActive: true,
          channel: "META_CLOUD",
          metaTemplateName: "order_confirm_ar",
          metaTemplateStatus: "APPROVED",
        },
      })
    );
    renderPage();
    const user = userEvent.setup();

    await screen.findByTestId("status-row-st1");
    await user.click(within(metaSlot()).getByRole("button", { name: /تغيير القالب/ }));

    expect(await screen.findByText(/تغيير قالب ميتا: مؤكد/)).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /محتوى القالب المحلي/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /حفظ وربط بقالب ميتا/ })).toBeInTheDocument();
  });

  test("الأزرار الأربعة منفصلة في slot ميتا المربوط بدون زر إنشاء قالب", async () => {
    mockApi(
      makeStatus({
        metaTemplate: {
          id: "mt1",
          name: "قالب طلب جديد",
          content: "مرحبا {{customerName}} أكد طلبك",
          eventType: "CONFIRMED",
          isActive: true,
          channel: "META_CLOUD",
          metaTemplateName: "order_confirm_ar",
          metaTemplateStatus: "APPROVED",
        },
      })
    );
    renderPage();

    await screen.findByTestId("status-row-st1");
    const slot = metaSlot();
    expect(within(slot).getByRole("button", { name: /معاينة/ })).toBeInTheDocument();
    expect(within(slot).getByRole("button", { name: /تغيير القالب/ })).toBeInTheDocument();
    expect(within(slot).getByRole("button", { name: /تعديل المحتوى/ })).toBeInTheDocument();
    expect(within(slot).getByRole("button", { name: /فك الربط/ })).toBeInTheDocument();
    expect(within(slot).queryByRole("button", { name: /إنشاء قالب ميتا/ })).not.toBeInTheDocument();
  });
});
