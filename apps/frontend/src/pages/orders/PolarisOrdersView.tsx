import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { Loader2, AlertTriangle } from "lucide-react";
import { ShopifyPageHeader } from "../../components/layout/ShopifyPageHeader";
import { OrderStatusAlertBell } from "./components/OrderStatusAlertBell";
import { BulkActionBar } from "./components/BulkActionBar";
import { OrdersTable } from "./components/OrdersTable";
import { OrdersMobileList } from "./components/OrdersMobileList";
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
    if (pay.includes("PENDING") || pay.includes("UNPAID")) return "unpaid";
    if (st.includes("CONFIRMED") || st.includes("PROCESSING")) return "unfulfilled";
    if (st.includes("DELIVERED") || st.includes("COMPLETED")) return "completed";
    if (st.includes("CANCELLED")) return "cancelled";
    return "all";
  }, [filters.status, filters.paymentStatus]);

  const handleTabClick = (tabKey: string) => {
    switch (tabKey) {
      case "all":
        onApplyFilters({ status: [], paymentStatus: [] });
        break;
      case "unpaid":
        onApplyFilters({ paymentStatus: ["PENDING"] });
        break;
      case "unfulfilled":
        onApplyFilters({ status: ["CONFIRMED", "PROCESSING"] });
        break;
      case "completed":
        onApplyFilters({ status: ["DELIVERED"] });
        break;
      case "cancelled":
        onApplyFilters({ status: ["CANCELLED"] });
        break;
      default:
        break;
    }
  };

  return (
    <div
      data-orders-polaris-view="true"
      className="polaris-orders-container w-full max-w-7xl min-w-0 mx-auto h-full min-h-0 overflow-y-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4"
    >
      {/* 1. Authentic Shopify Polaris Page Header */}
      <ShopifyPageHeader
        title={t("orders.title") || "الطلبات"}
        badges={
          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground tabular-nums">
            {totalOrders}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <OrderStatusAlertBell />

            <button
              type="button"
              onClick={() => setShowStats(!showStats)}
              className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs font-medium transition-all active:scale-95 ${
                showStats
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/80 bg-card hover:bg-muted text-foreground"
              }`}
              title="إحصائيات المبيعات والطلبات"
            >
              <ChartBarIcon className="w-4 h-4" />
              <span className="hidden sm:inline">الإحصائيات</span>
            </button>

            {onExportExcel && (
              <button
                type="button"
                onClick={onExportExcel}
                disabled={Boolean(isExporting)}
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border/80 bg-card hover:bg-muted text-xs font-medium text-foreground transition-all active:scale-95 shadow-2xs disabled:opacity-50"
                title={t("orders.exportExcel") || "تصدير Excel"}
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                ) : (
                  <ArrowDownTrayIcon className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span className="hidden sm:inline">{t("orders.exportExcel") || "تصدير"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border/80 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95 shadow-2xs"
              title="تحديث البيانات"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/orders/new")}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[var(--p-action-primary,#008060)] hover:bg-[#006e52] text-white text-xs font-semibold transition-all active:scale-95 shadow-xs"
            >
              <PlusIcon className="w-4 h-4" />
              <span>إنشاء طلب</span>
            </button>
          </div>
        }
      />

      {/* Optional Collapsible Stats Bar */}
      {showStats && (
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

      {/* 2. Authentic Shopify Polaris Single Card Container */}
      <div className="bg-card rounded-xl border border-border/70 shadow-xs overflow-hidden flex flex-col">
        {/* Segmented View Tabs */}
        <div className="flex items-center border-b border-border/70 px-3 overflow-x-auto scrollbar-none bg-card">
          {[
            { key: "all", label: "الكل" },
            { key: "unpaid", label: "غير مدفوع" },
            { key: "unfulfilled", label: "قيد التجهيز" },
            { key: "completed", label: "مكتمل" },
            { key: "cancelled", label: "ملغي" },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabClick(tab.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-[var(--petrol,#013735)] dark:border-[#3ec8b7] text-foreground font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
                }`}
              >
                <span>{tab.label}</span>
                {typeof tabCounts[tab.key as keyof typeof tabCounts] === "number" && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium tabular-nums text-muted-foreground">
                    {tabCounts[tab.key as keyof typeof tabCounts]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Integrated Filter & Search Bar */}
        <div className="p-2.5 sm:p-3 border-b border-border/70 flex flex-wrap items-center justify-between gap-2 bg-muted/20">
          <div className="flex-1 min-w-[220px] max-w-md relative">
            <MagnifyingGlassIcon className="absolute top-1/2 start-2.5 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => onFilterChange("search", e.target.value)}
              placeholder="تصفية برقم الطلب، العميل، الهاتف…"
              className="w-full h-8 ps-8 pe-3 text-xs bg-card border border-border/70 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onToggleAdvancedFilters}
              className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs font-medium transition-all active:scale-95 cursor-pointer ${
                advancedFilterCount > 0
                  ? "border-[var(--petrol,#013735)] bg-[var(--petrol-tint,#e6f1ef)] text-[var(--petrol,#013735)] dark:bg-[#112d2a] dark:text-[#3ec8b7]"
                  : "border-border/70 bg-card hover:bg-muted text-foreground"
              }`}
            >
              <FunnelIcon className="w-3.5 h-3.5" />
              <span>تصفية</span>
              {advancedFilterCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-primary text-primary-foreground">
                  {advancedFilterCount}
                </span>
              )}
            </button>

            {(advancedFilterCount > 0 || search) && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 h-8 px-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="إلغاء جميع الفلاتر"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">مسح</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {(advancedFilterCount > 0 || filters.onlyUnseen || filters.onlyPostPurchaseOffer) && (
          <div className="px-3 py-2 border-b border-border/70 bg-muted/10">
            <FilterChips
              filters={filters}
              filterableOrderStatuses={filterableOrderStatuses}
              filterablePaymentStatuses={filterablePaymentStatuses}
              merchantOptions={merchantOptions}
              affiliateOptions={affiliateOptions}
              onFilterChange={onFilterChange as never}
              onClearAdvancedFilters={onClearAdvancedFilters}
            />
          </div>
        )}

        {/* Bulk Action Bar */}
        {canSelectOrders && selectedOrders.length > 0 && (
          <div className="border-b border-border/70">
            <BulkActionBar
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
          </div>
        )}

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <OrdersTable
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

        {/* Mobile List View */}
        <div className="lg:hidden">
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
        </div>
      </div>

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
