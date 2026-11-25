import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Download,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
  BarChart3,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { ShopifyPageHeader } from "../../components/layout/ShopifyPageHeader";
import { OrderStatusAlertBell } from "./components/OrderStatusAlertBell";
import { BulkActionBar } from "./components/BulkActionBar";
import { OrdersBulkCommandPalette } from "./components/OrdersBulkCommandPalette";
import { OrdersTable } from "./components/OrdersTable";
import { OrdersMobileList } from "./components/OrdersMobileList";
import { OrdersPagination } from "./components/OrdersPagination";
import { OrdersModalsContainer } from "./components/OrdersModalsContainer";
import { OrdersFilterDrawer } from "./components/OrdersFilterDrawer";
import { FilterChips } from "./components/FilterChips";
import { OrdersStatsBar } from "./components/OrdersStatsBar";
import type { OrdersToolbarSectionProps } from "./components/OrdersToolbarSection";
import type { OrdersTableSectionProps } from "./components/OrdersTableSection";
import type { OrdersModalsContainerProps } from "./components/OrdersModalsContainer";
import { useOrderTabCounts } from "./hooks/useOrderTabCounts";
import {
  buildStatusOptions,
  buildPaymentStatusOptions,
  buildSourceOptions,
  buildFulfillmentOptions,
  buildOperationOptions,
  buildSettlementOptions,
  buildMerchantOptionsList,
  buildAffiliateOptionsList,
  buildStoreOptionsList,
} from "./utils/toolbarOptions";

export interface PolarisOrdersViewProps {
  toolbarSectionProps: OrdersToolbarSectionProps;
  tableSectionProps: OrdersTableSectionProps;
  modalsContainerProps: OrdersModalsContainerProps;
}

export const PolarisOrdersView: React.FC<PolarisOrdersViewProps> = ({
  toolbarSectionProps,
  tableSectionProps,
  modalsContainerProps,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showStats, setShowStats] = React.useState(false);
  const tabCounts = useOrderTabCounts();

  const {
    filters,
    advancedFilterCount,
    ordersLoadError,
    showAdvancedFilters,
    fieldClassName,
    filterableOrderStatuses,
    filterablePaymentStatuses,
    merchantOptions,
    affiliateOptions,
    storeOptions = [],
    affiliateOptionsError,
    onRetryAffiliates,
    showOrderSourceFilter,
    showUnifiedOperationFilters,
    showMerchantOperationFilters,
    showAffiliateOperationFilter,
    hasCustomDateFilters,
    getAffiliateDisplayName,
    onFilterChange,
    onApplyFilters,
    onClearAdvancedFilters,
    onToggleAdvancedFilters,
    onSetQuickDate,
    onRetry,
    onRefresh,
    onExportExcel,
    isExporting,
    isAdmin,
    isMerchant,
    merchantSettlementSummary,
    merchantSettlementLoading,
    merchantSettlementError,
    formatPrice,
    getFulfillmentSourceText,
    onClearMerchantFilters,
    onShowDueOrders,
  } = toolbarSectionProps;

  const {
    canSelectOrders,
    selectedOrders,
    bulkUpdatableStatuses,
    isTrashView,
    bulkProcessing,
    printingInvoices,
    onClearSelection,
    onBulkStatusUpdate,
    onBulkPrintInvoices,
    onBulkDelete,
    hasActiveTurbo,
    hasActiveQpExpress,
    hasActiveBosta,
    handleBulkCreateTurboShipments,
    handleBulkCreateQpExpressShipments,
    handleBulkCreateBostaShipments,
    displayedOrders,
    loading,
    activeFilterCount,
    search,
    columnsToRender,
    tableColumnCount,
    tableDensity,
    page,
    totalPages,
    totalOrders,
    limit,
    mobileListHelpers,
    tableHelpers,
    onOpenOrder,
    toggleOrderSelection,
    toggleAllSelection,
    onMarkAsViewed,
    clearAllFilters,
    handleCustomerRatingChange,
    handlePageChange,
    handleLimitChange,
    changeTableDensity,
  } = tableSectionProps;

  // Options for filter drawer
  const statusOptions = useMemo(
    () => buildStatusOptions(filterableOrderStatuses, t),
    [filterableOrderStatuses, t],
  );
  const paymentStatusOptions = useMemo(
    () => buildPaymentStatusOptions(filterablePaymentStatuses),
    [filterablePaymentStatuses],
  );
  const sourceOptions = useMemo(() => buildSourceOptions(t), [t]);
  const fulfillmentOptions = useMemo(() => buildFulfillmentOptions(t), [t]);
  const operationOptions = useMemo(() => buildOperationOptions(t), [t]);
  const settlementOptions = useMemo(() => buildSettlementOptions(t), [t]);
  const merchantOptionsList = useMemo(
    () => buildMerchantOptionsList(merchantOptions),
    [merchantOptions],
  );
  const affiliateOptionsList = useMemo(
    () => buildAffiliateOptionsList(affiliateOptions, getAffiliateDisplayName),
    [affiliateOptions, getAffiliateDisplayName],
  );
  const storeOptionsList = useMemo(
    () => buildStoreOptionsList(storeOptions),
    [storeOptions],
  );
  const showStoreFilter = storeOptionsList.length > 1;

  // Active quick tab determination
  const activeTab = useMemo(() => {
    const st = filters.status || [];
    const pay = filters.paymentStatus || [];
    if (pay.length > 0 && st.length === 0 && (pay.includes("PENDING") || pay.includes("UNPAID"))) {
      return "unpaid";
    }
    if (st.length > 0 && pay.length === 0) {
      if (st.includes("CONFIRMED") || st.includes("PROCESSING")) return "unfulfilled";
      if (st.includes("DELIVERED") || st.includes("COMPLETED")) return "completed";
      if (st.includes("CANCELLED")) return "cancelled";
    }
    if (st.length === 0 && pay.length === 0) return "all";
    return "custom";
  }, [filters.status, filters.paymentStatus]);

  const handleTabClick = (tabKey: string) => {
    switch (tabKey) {
      case "all":
        onApplyFilters({ status: [], paymentStatus: [] });
        break;
      case "unpaid":
        onApplyFilters({ status: [], paymentStatus: ["PENDING"] });
        break;
      case "unfulfilled":
        onApplyFilters({ status: ["CONFIRMED", "PROCESSING"], paymentStatus: [] });
        break;
      case "completed":
        onApplyFilters({ status: ["DELIVERED"], paymentStatus: [] });
        break;
      case "cancelled":
        onApplyFilters({ status: ["CANCELLED"], paymentStatus: [] });
        break;
      default:
        break;
    }
  };

  const canShowMerchantStats = Boolean(isAdmin && !isMerchant && filters.merchantId?.[0]);

  return (
    <div
      data-orders-polaris-view="true"
      className="polaris-orders-container w-full max-w-[1440px] min-w-0 mx-auto space-y-4 pb-6"
    >
      {/* 1. Shopify Polaris Page Header */}
      <ShopifyPageHeader
        title={t("orders.title") || "الطلبات"}
        badges={
          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground tabular-nums">
            {totalOrders.toLocaleString("en-US")}
          </span>
        }
        actions={
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar max-w-full">
            <OrderStatusAlertBell />

            {canShowMerchantStats && (
              <button
                type="button"
                onClick={() => setShowStats(!showStats)}
                className={`inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 text-xs font-medium transition-all active:scale-95 ${
                  showStats
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/80 bg-card hover:bg-muted text-foreground"
                }`}
                title="إحصائيات المبيعات والطلبات"
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">الإحصائيات</span>
              </button>
            )}

            {onExportExcel && (
              <button
                type="button"
                onClick={onExportExcel}
                disabled={Boolean(isExporting)}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-border/80 bg-card hover:bg-muted px-2.5 text-xs font-medium text-foreground transition-all active:scale-95 shadow-2xs disabled:opacity-50"
                title={t("orders.exportExcel") || "تصدير Excel"}
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="hidden sm:inline">{t("orders.exportExcel") || "تصدير"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onRefresh}
              aria-label="تحديث البيانات"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95 shadow-2xs"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/orders/manual")}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground px-3 text-xs font-semibold transition-all active:scale-95 shadow-xs"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>إنشاء طلب</span>
            </button>
          </div>
        }
      />

      {/* Optional Collapsible Stats Bar (Admin + specific merchant selected) */}
      {canShowMerchantStats && showStats && (
        <div className="motion-safe:animate-fade-in">
          <OrdersStatsBar
            isAdmin={isAdmin}
            isMerchant={isMerchant}
            merchantId={filters.merchantId?.[0] || ""}
            merchantSettlementSummary={merchantSettlementSummary}
            merchantSettlementLoading={merchantSettlementLoading}
            merchantSettlementError={merchantSettlementError}
            merchantOptions={merchantOptions}
            formatPrice={formatPrice}
            getFulfillmentSourceText={getFulfillmentSourceText}
            onClearMerchantFilters={onClearMerchantFilters}
            onShowDueOrders={onShowDueOrders}
          />
        </div>
      )}

      {/* Error Banner if any */}
      {ordersLoadError && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="truncate">{ordersLoadError}</span>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="px-2.5 py-1 rounded bg-destructive text-destructive-foreground text-[11px] font-semibold hover:opacity-90 transition-opacity shrink-0"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* 2. Shopify Polaris Single Card Container (Tabs + Filter + Desktop Table) */}
      <div className="bg-card rounded-xl border border-border/70 shadow-xs overflow-hidden flex flex-col">
        {/* Segmented View Tabs */}
        <div className="relative border-b border-border/70 bg-card">
          <div className="flex items-center px-2 sm:px-3 overflow-x-auto no-scrollbar">
            {[
              { key: "all", label: "الكل" },
              { key: "unpaid", label: "غير مدفوع" },
              { key: "unfulfilled", label: "قيد التجهيز" },
              { key: "completed", label: "مكتمل" },
              { key: "cancelled", label: "ملغي" },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              const rawCount =
                tab.key === "all" &&
                activeTab === "all" &&
                activeFilterCount === 0 &&
                !search &&
                totalOrders > 0
                  ? totalOrders
                  : tabCounts[tab.key as keyof typeof tabCounts];
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabClick(tab.key)}
                  className={`flex items-center gap-1 px-2.5 sm:px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? "border-primary text-foreground font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
                  }`}
                >
                  <span>{tab.label}</span>
                  {typeof rawCount === "number" && (
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium tabular-nums text-muted-foreground">
                      {rawCount.toLocaleString("en-US")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 end-0 w-6 ltr:bg-gradient-to-l rtl:bg-gradient-to-r from-card to-transparent sm:hidden"
          />
        </div>

        {/* Integrated Filter & Search Bar */}
        <div
          className={`p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2 lg:border-b lg:border-border/70 ${
            advancedFilterCount > 0 ||
            filters.onlyUnseen ||
            filters.onlyPostPurchaseOffer ||
            (canSelectOrders && selectedOrders.length > 0)
              ? "border-b border-border/70"
              : ""
          }`}
        >
          <div className="flex-1 min-w-[180px] max-w-md relative">
            <Search className="absolute top-1/2 start-2.5 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => onFilterChange("search", e.target.value)}
              placeholder="بحث برقم الطلب، العميل، الهاتف…"
              className="w-full h-8 ps-8 pe-3 text-xs bg-card border border-border/70 rounded-lg text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onToggleAdvancedFilters}
              className={`inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                advancedFilterCount > 0
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/70 bg-card hover:bg-muted text-foreground"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <span>تصفية</span>
              {advancedFilterCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums bg-primary text-primary-foreground">
                  {advancedFilterCount}
                </span>
              )}
            </button>

            {(advancedFilterCount > 0 || search) && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="إلغاء جميع الفلاتر"
              >
                <X className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">مسح</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips (embedded flat inside card) */}
        {(advancedFilterCount > 0 || filters.onlyUnseen || filters.onlyPostPurchaseOffer) && (
          <FilterChips
            embedded
            filters={filters}
            filterableOrderStatuses={filterableOrderStatuses}
            filterablePaymentStatuses={filterablePaymentStatuses}
            merchantOptions={merchantOptions}
            affiliateOptions={affiliateOptions}
            onFilterChange={onFilterChange as never}
            onClearAdvancedFilters={onClearAdvancedFilters}
          />
        )}

        {/* Bulk Action Bar (embedded flat inside card) */}
        {canSelectOrders && selectedOrders.length > 0 && (
          <BulkActionBar
            embedded
            count={selectedOrders.length}
            statuses={bulkUpdatableStatuses}
            isTrashView={isTrashView}
            busy={bulkProcessing}
            printing={printingInvoices}
            onClearSelection={onClearSelection}
            onStatusChange={onBulkStatusUpdate}
            onPrintInvoices={onBulkPrintInvoices}
            onCreateTurboShipments={
              hasActiveTurbo ? handleBulkCreateTurboShipments : undefined
            }
            onCreateQpExpressShipments={
              hasActiveQpExpress ? handleBulkCreateQpExpressShipments : undefined
            }
            onCreateBostaShipments={
              hasActiveBosta ? handleBulkCreateBostaShipments : undefined
            }
            onDelete={onBulkDelete}
          />
        )}

        {/* Desktop Table View (embedded inside outer card — no duplicate card border) */}
        <div className="hidden lg:block">
          <OrdersTable
            embedded
            orders={displayedOrders}
            loading={loading}
            ordersLoadError={ordersLoadError}
            selectedOrders={selectedOrders}
            canSelectOrders={canSelectOrders}
            isMerchant={isMerchant}
            activeFilterCount={activeFilterCount}
            search={search}
            columns={columnsToRender}
            columnCount={tableColumnCount}
            density={tableDensity}
            page={page}
            totalPages={totalPages}
            totalOrders={totalOrders}
            limit={limit}
            helpers={tableHelpers}
            onOpenOrder={onOpenOrder}
            onToggleSelection={toggleOrderSelection}
            onToggleAllSelection={toggleAllSelection}
            onMarkAsViewed={onMarkAsViewed}
            onClearFilters={clearAllFilters}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onDensityChange={changeTableDensity}
            onCustomerRatingChange={handleCustomerRatingChange}
          />
        </div>
      </div>

      {/* Mobile List View + Pagination (directly on Polaris canvas — zero box-in-box) */}
      <div className="lg:hidden space-y-2">
        <OrdersMobileList
          orders={displayedOrders}
          loading={loading}
          ordersLoadError={ordersLoadError}
          selectedOrders={selectedOrders}
          canSelectOrders={canSelectOrders}
          isMerchant={isMerchant}
          activeFilterCount={activeFilterCount}
          search={search}
          density={tableDensity}
          helpers={mobileListHelpers}
          onOpenOrder={onOpenOrder}
          onToggleSelection={toggleOrderSelection}
          onMarkAsViewed={onMarkAsViewed}
          onClearFilters={clearAllFilters}
          onCustomerRatingChange={handleCustomerRatingChange}
        />

        {!loading && displayedOrders.length > 0 && (
          <OrdersPagination
            variant="mobile"
            page={page}
            totalPages={totalPages}
            totalOrders={totalOrders}
            limit={limit}
            density={tableDensity}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onDensityChange={changeTableDensity}
          />
        )}
      </div>

      {/* Command Palette Bulk Shortcuts */}
      {canSelectOrders && (
        <OrdersBulkCommandPalette
          hasActiveTurbo={hasActiveTurbo}
          hasActiveQpExpress={hasActiveQpExpress}
          hasActiveBosta={hasActiveBosta}
          handleBulkPrintInvoices={onBulkPrintInvoices}
          handleBulkCreateTurboShipments={handleBulkCreateTurboShipments}
          handleBulkCreateQpExpressShipments={handleBulkCreateQpExpressShipments}
          handleBulkCreateBostaShipments={handleBulkCreateBostaShipments}
          handleBulkDelete={onBulkDelete}
        />
      )}

      {/* Filter Drawer */}
      <OrdersFilterDrawer
        isOpen={showAdvancedFilters}
        onClose={onToggleAdvancedFilters}
        filters={filters}
        advancedFilterCount={advancedFilterCount}
        fieldClassName={fieldClassName}
        statusOptions={statusOptions}
        paymentStatusOptions={paymentStatusOptions}
        sourceOptions={sourceOptions}
        merchantOptionsList={merchantOptionsList}
        affiliateOptionsList={affiliateOptionsList}
        storeOptionsList={storeOptionsList}
        showStoreFilter={showStoreFilter}
        affiliateOptionsError={affiliateOptionsError}
        onRetryAffiliates={onRetryAffiliates}
        fulfillmentOptions={fulfillmentOptions}
        operationOptions={operationOptions}
        settlementOptions={settlementOptions}
        showOrderSourceFilter={showOrderSourceFilter}
        showUnifiedOperationFilters={showUnifiedOperationFilters}
        showMerchantOperationFilters={showMerchantOperationFilters}
        showAffiliateOperationFilter={showAffiliateOperationFilter}
        hasCustomDateFilters={hasCustomDateFilters}
        onFilterChange={onFilterChange}
        onSetQuickDate={onSetQuickDate}
        onClearAdvancedFilters={onClearAdvancedFilters}
      />

      {/* Modals Container */}
      <OrdersModalsContainer {...modalsContainerProps} />
    </div>
  );
};

export default PolarisOrdersView;
