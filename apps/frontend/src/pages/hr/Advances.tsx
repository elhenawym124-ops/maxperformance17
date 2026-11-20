import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PolarisAdvancesView } from "./PolarisAdvancesView";
import {
  useAdvancesController,
  AdvancesHeader,
  AdvancesStatsGrid,
  AdvancesFiltersCard,
  AdvancesTable,
  AdvanceRejectDialog,
  AdvanceDetailsDialog,
  AdvanceUpdateStatusDialog,
} from "./advances/index";

export const Advances: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlLayout = searchParams.get("layout");
  const sessionLayout =
    typeof window !== "undefined"
      ? sessionStorage.getItem("maxp_session_layout")
      : null;
  const isPolaris = urlLayout === "polaris" || sessionLayout === "polaris";

  const {
    loading,
    requests,
    rawTotalCount,
    pagination,
    handlePageChange,
    statusFilter,
    setStatusFilter,
    payStatusFilter,
    setPayStatusFilter,
    searchTerm,
    setSearchTerm,
    selectedRequest,
    isRejectDialogOpen,
    setIsRejectDialogOpen,
    rejectionReason,
    setRejectionReason,
    isDetailsOpen,
    setIsDetailsOpen,
    isUpdateStatusDialogOpen,
    setIsUpdateStatusDialogOpen,
    handleApprove,
    confirmReject,
    openRejectDialog,
    openDetailsDialog,
    openUpdateStatusDialog,
    handleUpdateStatus,
    handleDelete,
    markAsPaid,
    stats,
  } = useAdvancesController();

  return (
    <div className="w-full pb-8" dir="rtl">
      {isPolaris ? (
        <PolarisAdvancesView
          loading={loading}
          requests={requests}
          rawTotalCount={rawTotalCount}
          pagination={pagination}
          handlePageChange={handlePageChange}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          payStatusFilter={payStatusFilter}
          setPayStatusFilter={setPayStatusFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          stats={stats}
          onCreateNew={() => navigate("/hr/advances/new")}
          handleApprove={handleApprove}
          openRejectDialog={openRejectDialog}
          openDetailsDialog={openDetailsDialog}
          openUpdateStatusDialog={openUpdateStatusDialog}
          handleDelete={handleDelete}
          markAsPaid={markAsPaid}
        />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <AdvancesHeader onCreateNew={() => navigate("/hr/advances/new")} />

          {/* Summary Stats Cards */}
          <AdvancesStatsGrid stats={stats} />

          {/* Filters & Search Card */}
          <AdvancesFiltersCard
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            payStatusFilter={payStatusFilter}
            onPayStatusFilterChange={setPayStatusFilter}
          />

          {/* Main Advances Table */}
          <AdvancesTable
            loading={loading}
            requests={requests}
            rawTotalCount={rawTotalCount}
            pagination={pagination}
            onPageChange={handlePageChange}
            onApprove={handleApprove}
            onOpenReject={openRejectDialog}
            onOpenDetails={openDetailsDialog}
            onOpenUpdateStatus={openUpdateStatusDialog}
            onDelete={handleDelete}
            onMarkAsPaid={markAsPaid}
          />
        </div>
      )}

      {/* Reject Reason Dialog */}
      <AdvanceRejectDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        rejectionReason={rejectionReason}
        onReasonChange={setRejectionReason}
        onConfirmReject={confirmReject}
      />

      {/* Details & Installments Schedule Dialog */}
      <AdvanceDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        request={selectedRequest}
      />

      {/* Update Status Dialog */}
      <AdvanceUpdateStatusDialog
        open={isUpdateStatusDialogOpen}
        onOpenChange={setIsUpdateStatusDialogOpen}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};

export default Advances;
