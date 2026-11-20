import React from "react";
import {
  useCompanyOrdersDetailsController,
  CompanyOrdersHeaderAndStats,
  CompanyOrdersListAndExpandedDetails,
} from "./company-orders";

const CompanyOrdersDetails: React.FC = () => {
  const {
    t,
    navigate,
    isLoading,
    company,
    orders,
    stats,
    expandedOrder,
    statusFilter,
    setStatusFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    page,
    setPage,
    totalPages,
    total,
    handleExport,
    toggleOrderExpand,
  } = useCompanyOrdersDetailsController();

  if (isLoading && !company) {
    return (
      <div
        className="p-6 min-h-screen bg-muted dark:bg-muted flex items-center justify-center"
        dir="rtl"
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-foreground dark:text-muted-foreground">
            جاري تحميل البيانات...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-6 space-y-6 bg-muted dark:bg-muted min-h-screen"
      dir="rtl"
    >
      <CompanyOrdersHeaderAndStats
        company={company}
        stats={stats}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onBack={() => navigate("/my-companies/reports")}
        onExport={handleExport}
      />

      <CompanyOrdersListAndExpandedDetails
        t={t}
        isLoading={isLoading}
        orders={orders}
        total={total}
        expandedOrder={expandedOrder}
        toggleOrderExpand={toggleOrderExpand}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};

export default CompanyOrdersDetails;
