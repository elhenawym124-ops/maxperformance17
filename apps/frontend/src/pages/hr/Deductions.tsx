import React from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { PolarisDeductionsView } from "./PolarisDeductionsView";
import {
  useDeductionsController,
  DeductionsHeader,
  DeductionStatsCards,
  DeductionFilters,
  DeductionTable,
  DeductionCreateModal,
  DeductionDetailsModal,
} from "./deductions/index";

export const Deductions: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlLayout = searchParams.get("layout");
  const sessionLayout =
    typeof window !== "undefined"
      ? sessionStorage.getItem("maxp_session_layout")
      : null;
  const isPolaris = urlLayout !== "legacy" && sessionLayout !== "legacy";

  const {
    filteredDeductions,
    loading,
    stats,
    showCreateModal,
    setShowCreateModal,
    showDetailsModal,
    setShowDetailsModal,
    selectedDeduction,
    setSelectedDeduction,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterType,
    setFilterType,
    filterMonth,
    setFilterMonth,
    filterYear,
    setFilterYear,
    employees,
    isEditing,
    createForm,
    setCreateForm,
    handleCreateDeduction,
    handleEdit,
    handleDelete,
    resetCreateForm,
    openNewDeductionModal,
  } = useDeductionsController();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full pb-8" dir="rtl">
      {isPolaris ? (
        <PolarisDeductionsView
          deductions={filteredDeductions}
          stats={stats}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterType={filterType}
          setFilterType={setFilterType}
          filterMonth={filterMonth}
          setFilterMonth={setFilterMonth}
          filterYear={filterYear}
          setFilterYear={setFilterYear}
          onAddNew={openNewDeductionModal}
          onViewDetails={(deduction) => {
            setSelectedDeduction(deduction);
            setShowDetailsModal(true);
          }}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <DeductionsHeader onAddNew={openNewDeductionModal} />

          {/* Stats Cards */}
          <DeductionStatsCards stats={stats} />

          {/* Filters */}
          <DeductionFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterType={filterType}
            setFilterType={setFilterType}
            filterMonth={filterMonth}
            setFilterMonth={setFilterMonth}
            filterYear={filterYear}
            setFilterYear={setFilterYear}
          />

          {/* Deductions Table */}
          <DeductionTable
            deductions={filteredDeductions}
            onViewDetails={(deduction) => {
              setSelectedDeduction(deduction);
              setShowDetailsModal(true);
            }}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      )}

      {/* Create / Edit Modal */}
      <DeductionCreateModal
        open={showCreateModal}
        isEditing={isEditing}
        createForm={createForm}
        setCreateForm={setCreateForm}
        employees={employees}
        onClose={() => {
          setShowCreateModal(false);
          resetCreateForm();
        }}
        onSubmit={handleCreateDeduction}
      />

      {/* Details Modal */}
      <DeductionDetailsModal
        open={showDetailsModal}
        selectedDeduction={selectedDeduction}
        onClose={() => setShowDetailsModal(false)}
      />
    </div>
  );
};

export default Deductions;
