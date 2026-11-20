import React from "react";
import { useTranslation } from "react-i18next";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import { TurboRecordsTopKpis } from "./turbo/TurboRecordsTopKpis";
import {
  TurboRecordsStatusPills,
  type StatusFilterOption,
} from "./turbo/TurboRecordsStatusPills";
import { TurboRecordsTable } from "./turbo/TurboRecordsTable";
import { useTurboRecordsData } from "./turbo/useTurboRecordsData";

export const TurboRecords: React.FC = () => {
  const { t } = useTranslation();
  const {
    orders,
    loading,
    refreshingStatuses,
    creatingShipments,
    page,
    setPage,
    searchQuery,
    setSearchQuery,
    filterType,
    totalPages,
    totalOrders,
    selectedOrders,
    updateUrlParams,
    handleSearchClick,
    handleFilterChange,
    toggleOrderSelection,
    toggleAllSelection,
    handleBulkCreateShipments,
    handleRefreshStatuses,
    getStatusCount,
  } = useTurboRecordsData();

  const filterOptions: StatusFilterOption[] = [
    {
      key: "all",
      label: t("orders.k_67"),
      color:
        "border-primary dark:border-primary bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary",
    },
    {
      key: "active",
      label: t("orders.k_66"),
      color:
        "border-warning dark:border-warning bg-warning/10 dark:bg-warning/30 text-warning dark:text-warning font-bold",
    },
    {
      key: "merchant_preparing",
      label: t("orders.k_68"),
      color:
        "border-primary dark:border-primary bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary font-bold",
    },
    {
      key: "preparing",
      label: t("orders.k_69"),
      color:
        "border-primary dark:border-primary bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary font-semibold",
    },
    {
      key: "processing",
      label: t("orders.k_47"),
      color:
        "border-primary dark:border-primary bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary",
    },
    {
      key: "out_for_delivery",
      label: t("orders.k_28"),
      color:
        "border-info dark:border-info bg-info/10 dark:bg-info/30 text-info dark:text-info",
    },
    {
      key: "delayed",
      label: t("orders.k_9"),
      color:
        "border-warning dark:border-warning bg-warning/10 dark:bg-warning/30 text-warning dark:text-warning",
    },
    {
      key: "delivered",
      label: t("orders.deliveredOrders"),
      color:
        "border-success dark:border-success bg-success/10 dark:bg-success/30 text-success dark:text-success",
    },
    {
      key: "remitted",
      label: t("orders.k_70"),
      color:
        "border-success dark:border-success bg-success/10 dark:bg-success/30 text-success dark:text-success",
    },
    {
      key: "returned_to_company",
      label: t("orders.k_18"),
      color:
        "border-destructive dark:border-destructive bg-destructive/10 dark:bg-destructive/30 text-destructive dark:text-destructive",
    },
    {
      key: "returned_received",
      label: t("orders.k_72"),
      color:
        "border-primary dark:border-primary bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary",
    },
    {
      key: "returned_to_customer",
      label: t("orders.k_73"),
      color:
        "border-primary dark:border-primary bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary",
    },
    {
      key: "returned_resent",
      label: t("orders.k_20"),
      color:
        "border-info dark:border-info bg-info/10 dark:bg-info/30 text-info dark:text-info",
    },
    {
      key: "returned_missing",
      label: t("orders.k_21"),
      color:
        "border-destructive dark:border-destructive bg-destructive/10 dark:bg-destructive/30 text-destructive dark:text-destructive",
    },
    {
      key: "returned_destroyed",
      label: t("orders.k_22"),
      color:
        "border-border dark:dark:border-border bg-muted dark:dark:bg-muted text-foreground dark:dark:text-muted-foreground",
    },
    {
      key: "cancelled",
      label: t("orders.k_15"),
      color:
        "border-border dark:dark:border-border bg-muted dark:dark:bg-muted text-foreground dark:dark:text-muted-foreground",
    },
    {
      key: "archived",
      label: t("orders.k_71"),
      color:
        "border-border dark:dark:border-border bg-muted dark:dark:bg-muted text-foreground dark:dark:text-muted-foreground",
    },
  ];

  return (
    <div className="p-4 sm:p-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <TruckIcon className="h-6 w-6 text-primary dark:text-primary" />
            {t("orders.turboRecordsTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {t("orders.k_41")}
          </p>
        </div>

        <div className="flex gap-2 mt-4 md:mt-0">
          <button
            onClick={handleRefreshStatuses}
            disabled={refreshingStatuses}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-card border border-border rounded-lg text-xs sm:text-sm font-medium text-foreground hover:bg-muted/50 disabled:opacity-50 cursor-pointer"
          >
            <ArrowPathIcon
              className={`h-4 w-4 ${refreshingStatuses ? "animate-spin" : ""}`}
            />
            {t("orders.turboRecordsUpdateStatus")}
          </button>

          <button
            onClick={handleBulkCreateShipments}
            disabled={creatingShipments || selectedOrders.length === 0}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary border border-transparent rounded-lg text-xs sm:text-sm font-medium text-white hover:bg-primary disabled:opacity-50 cursor-pointer"
          >
            <TruckIcon className="h-4 w-4" />
            {t("orders.turboRecordsSendToTurbo")}
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <TurboRecordsTopKpis
        filterType={filterType}
        totalOrders={totalOrders}
        getStatusCount={getStatusCount}
        onFilterChange={handleFilterChange}
      />

      {/* Structured Status Category Pills */}
      <TurboRecordsStatusPills
        filterOptions={filterOptions}
        filterType={filterType}
        getStatusCount={getStatusCount}
        onFilterChange={handleFilterChange}
      />

      {/* Search Bar */}
      <div className="bg-card p-4 rounded-xl border border-border dark:dark:border-border shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">
            {t("orders.k_32")}
          </span>
          <span className="px-3 py-1 bg-primary text-primary rounded-full text-xs font-bold font-mono">
            {filterOptions.find((f) => f.key === filterType)?.label ||
              filterType}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("orders.turboRecordsSearchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
              className="w-full ps-3 pe-9 py-1.5 border border-border rounded-lg text-xs bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <button
            onClick={handleSearchClick}
            className="px-3 py-1.5 bg-muted text-foreground rounded-lg hover:hover:bg-muted dark:hover:dark:hover:bg-muted font-medium text-xs whitespace-nowrap"
          >
            {t("orders.search")}
          </button>
        </div>
      </div>

      {/* Main Table */}
      <TurboRecordsTable
        orders={orders}
        loading={loading}
        selectedOrders={selectedOrders}
        totalOrders={totalOrders}
        page={page}
        totalPages={totalPages}
        onToggleAll={toggleAllSelection}
        onToggleOrder={toggleOrderSelection}
        onPageChange={(newPage) => {
          setPage(newPage);
          updateUrlParams({ page: String(newPage) });
        }}
      />
    </div>
  );
};

export default TurboRecords;
