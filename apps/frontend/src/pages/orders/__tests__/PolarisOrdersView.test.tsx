// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PolarisOrdersView } from "../PolarisOrdersView";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string, opts?: any) => opts?.defaultValue || key }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

vi.mock("../../../i18n", () => ({
  __esModule: true,
  default: { t: (key: string) => key },
}));

vi.mock("../../../services/api", () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: { success: true, notifications: [], unreadCount: 0 } }),
    post: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
}));

vi.mock("../../../services/apiClient", () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: { success: true, data: { rows: [] }, pagination: { total: 0 } } }),
  },
}));

vi.mock("../../../hooks/useSocket", () => ({
  __esModule: true,
  default: () => ({ on: vi.fn(), off: vi.fn(), isConnected: false }),
}));

afterEach(() => {
  cleanup();
});

const makeOrder = (id: string) =>
  ({
    id,
    orderNumber: id,
    customerName: "أحمد علي",
    customerPhone: "01012345678",
    status: "PENDING",
    paymentStatus: "pending",
    items: [],
    subtotal: 200,
    tax: 0,
    shipping: 30,
    total: 230,
    createdAt: "2026-11-25T10:00:00.000Z",
    updatedAt: "2026-11-25T10:00:00.000Z",
    isViewed: true,
  }) as any;

const makeProps = (overrides: { filters?: any; orders?: any[] } = {}) => {
  const onApplyFilters = vi.fn();
  const baseProps = {
    toolbarSectionProps: {
      filters: {
        status: [],
        paymentStatus: [],
        sourceType: [],
        merchantId: [],
        affiliateId: [],
        fulfillmentSource: [],
        merchantOperationStatus: [],
        merchantSettlementStatus: [],
        extractionMethod: "",
        minConfidence: "",
        onlyUnseen: false,
        onlyPostPurchaseOffer: false,
        timeRange: "",
        startDate: "",
        endDate: "",
        search: "",
        ...(overrides.filters || {}),
      },
      advancedFilterCount: 0,
      ordersLoadError: null,
      showAdvancedFilters: false,
      fieldClassName: "",
      filterableOrderStatuses: [],
      filterablePaymentStatuses: [],
      merchantOptions: [],
      affiliateOptions: [],
      storeOptions: [],
      showOrderSourceFilter: false,
      showUnifiedOperationFilters: false,
      showMerchantOperationFilters: false,
      showAffiliateOperationFilter: false,
      hasCustomDateFilters: false,
      getAffiliateDisplayName: () => "",
      onFilterChange: vi.fn(),
      onApplyFilters,
      onClearAdvancedFilters: vi.fn(),
      onToggleAdvancedFilters: vi.fn(),
      onSetQuickDate: vi.fn(),
      onRetry: vi.fn(),
      onRefresh: vi.fn(),
      onExportExcel: vi.fn(),
      isExporting: false,
      isAdmin: true,
      isMerchant: false,
      merchantSettlementSummary: null,
      merchantSettlementLoading: false,
      merchantSettlementError: null,
      formatPrice: (n: any) => `${n ?? 0} ج.م`,
      getFulfillmentSourceText: () => "",
      onClearMerchantFilters: vi.fn(),
      onShowDueOrders: vi.fn(),
    } as any,
    tableSectionProps: {
      canSelectOrders: true,
      selectedOrders: [],
      bulkUpdatableStatuses: [],
      isTrashView: false,
      bulkProcessing: false,
      printingInvoices: false,
      onClearSelection: vi.fn(),
      onBulkStatusUpdate: vi.fn(),
      onBulkPrintInvoices: vi.fn(),
      onBulkDelete: vi.fn(),
      hasActiveTurbo: false,
      hasActiveQpExpress: false,
      hasActiveBosta: false,
      handleBulkCreateTurboShipments: vi.fn(),
      handleBulkCreateQpExpressShipments: vi.fn(),
      handleBulkCreateBostaShipments: vi.fn(),
      displayedOrders: overrides.orders ?? [makeOrder("ORD-1")],
      loading: false,
      ordersLoadError: null,
      isMerchant: false,
      activeFilterCount: 0,
      search: "",
      columnsToRender: ["orderNumber", "customer", "amount", "status", "payment", "date", "actions"],
      tableColumnCount: 8,
      tableDensity: "comfortable" as const,
      page: 1,
      totalPages: 5,
      totalOrders: 100,
      limit: 20,
      mobileListHelpers: {
        getCustomerDisplayName: (o: any) => o.customerName,
        formatPrice: (n: any) => `${n ?? 0} ج.م`,
        getOrderAmount: (o: any) => o.total,
        getOrderSourceText: () => "متجر",
        getRelativeTime: () => "الآن",
        formatDate: () => "2026-11-25",
        getPaymentStatusBadgeStyle: () => undefined,
        getPaymentStatusColor: () => "",
        getPaymentStatusText: () => "غير مدفوع",
        getUnifiedStatusDisplay: () => ({
          text: "قيد الانتظار",
          labelKey: "pending",
          className: "bg-muted",
          style: undefined,
        }),
      },
      tableHelpers: {
        getCustomerDisplayName: (o: any) => o.customerName,
        formatPrice: (n: any) => `${n ?? 0} ج.م`,
        getRelativeTime: () => "الآن",
        formatDate: () => "2026-11-25",
        getPaymentStatusBadgeStyle: () => undefined,
        getPaymentStatusDotStyle: () => undefined,
        getPaymentStatusColor: () => "",
        getPaymentStatusText: () => "غير مدفوع",
        getUnifiedStatusDisplay: () => ({
          text: "قيد الانتظار",
          labelKey: "pending",
          className: "bg-muted",
          style: undefined,
        }),
        getConfidenceColor: () => "",
        getConfidenceIcon: () => null,
      },
      onOpenOrder: vi.fn(),
      toggleOrderSelection: vi.fn(),
      toggleAllSelection: vi.fn(),
      onMarkAsViewed: vi.fn(),
      clearAllFilters: vi.fn(),
      handleCustomerRatingChange: vi.fn(),
      handlePageChange: vi.fn(),
      handleLimitChange: vi.fn(),
      changeTableDensity: vi.fn(),
    } as any,
    modalsContainerProps: {
      selectedOrder: null,
      isOrderModalOpen: false,
      onCloseOrderModal: vi.fn(),
      isMerchant: false,
      orderStatuses: [],
      orders: [],
      onUpdateStatus: vi.fn(),
      onUpdateNotes: vi.fn(),
      selectedInvoice: null,
      onCloseInvoice: vi.fn(),
    } as any,
  };
  return { ...baseProps, onApplyFilters };
};

describe("PolarisOrdersView regression", () => {
  it("renders mobile pagination controls alongside desktop pagination when orders exist", () => {
    const props = makeProps();
    render(
      <MemoryRouter>
        <PolarisOrdersView {...props} />
      </MemoryRouter>,
    );

    expect(screen.getAllByLabelText("orders.next").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByLabelText("orders.previous").length).toBeGreaterThanOrEqual(2);
  });

  it("clears opposite status/paymentStatus when switching quick tabs", () => {
    const props = makeProps();
    render(
      <MemoryRouter>
        <PolarisOrdersView {...props} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "غير مدفوع" }));
    expect(props.onApplyFilters).toHaveBeenCalledWith({
      status: [],
      paymentStatus: ["PENDING"],
    });

    fireEvent.click(screen.getByRole("button", { name: "مكتمل" }));
    expect(props.onApplyFilters).toHaveBeenCalledWith({
      status: ["DELIVERED"],
      paymentStatus: [],
    });
  });

  it("hides merchant stats toggle when no merchant filter is active and keeps create CTA nowrap", () => {
    const props = makeProps();
    render(
      <MemoryRouter>
        <PolarisOrdersView {...props} />
      </MemoryRouter>,
    );

    expect(screen.queryByTitle("إحصائيات المبيعات والطلبات")).not.toBeInTheDocument();
    const createBtn = screen.getByRole("button", { name: /إنشاء طلب/i });
    expect(createBtn.className).toContain("whitespace-nowrap");
  });
});
