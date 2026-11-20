import React from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import DepartmentSkeleton from "./components/DepartmentSkeleton";
import HierarchyView from "./components/HierarchyView";
import { PolarisDepartmentsView } from "./PolarisDepartmentsView";
import {
  useDepartmentsController,
  DepartmentStatsCards,
  DepartmentFilters,
  DepartmentGrid,
  AddDepartmentDialog,
  DepartmentDetailsDialog,
  DepartmentDeleteDialog,
  RemoveEmployeeDialog,
} from "./departments/index";

const Departments: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlLayout = searchParams.get("layout");
  const sessionLayout =
    typeof window !== "undefined"
      ? sessionStorage.getItem("maxp_session_layout")
      : null;
  const isPolaris = urlLayout !== "legacy" && sessionLayout !== "legacy";

  const {
    departments,
    employees,
    filteredEmployees,
    filteredDepartments,
    paginatedDepartments,
    loading,
    canManage,
    totalEmployees,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    currentPage,
    setCurrentPage,
    totalPages,
    employeeSearchQuery,
    setEmployeeSearchQuery,
    formData,
    setFormData,
    selectedEmployees,
    toggleEmployeeSelection,
    resetEmployeeSelection,
    assignEmployeesSelection,
    toggleAssignEmployeeSelection,
    selectedDepartment,
    setSelectedDepartment,
    showAddDialog,
    setShowAddDialog,
    showDetailsDialog,
    setShowDetailsDialog,
    showDeleteDialog,
    setShowDeleteDialog,
    showRemoveConfirm,
    setShowRemoveConfirm,
    isEditingDetails,
    setIsEditingDetails,
    isAddingEmployees,
    setIsAddingEmployees,
    isProcessing,
    isAssigningEmployees,
    handleAddDepartment,
    handleEditDepartment,
    handleDeleteDepartment,
    handleAssignEmployees,
    handleRemoveFromDepartment,
    confirmRemoveFromDepartment,
    openDetailsDialog,
    resetForm,
    fillFormFromDepartment,
  } = useDepartmentsController();

  return (
    <div className="w-full pb-8" dir="rtl">
      {isPolaris ? (
        <PolarisDepartmentsView
          departments={departments}
          filteredDepartments={filteredDepartments}
          paginatedDepartments={paginatedDepartments}
          totalEmployees={totalEmployees}
          loading={loading}
          canManage={canManage}
          viewMode={viewMode}
          setViewMode={setViewMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          openDetailsDialog={openDetailsDialog}
          fillFormFromDepartment={fillFormFromDepartment}
          setSelectedDepartment={setSelectedDepartment}
          setShowAddDialog={setShowAddDialog}
          setShowDeleteDialog={setShowDeleteDialog}
          setIsAddingEmployees={setIsAddingEmployees}
        />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                إدارة الأقسام
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 tabular-nums">
                {departments.length} قسم • {totalEmployees} موظف
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canManage && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 ms-2" />
                  إضافة قسم
                </Button>
              )}
            </div>
          </div>

          {/* Search, Filter and View Toggle */}
          <DepartmentFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />

          {/* Stats Cards */}
          <DepartmentStatsCards
            totalDepartments={departments.length}
            activeDepartments={departments.filter((d) => d.isActive).length}
            totalEmployees={totalEmployees}
          />

          {/* Main Content Area */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <DepartmentSkeleton />
              </motion.div>
            ) : viewMode === "hierarchy" ? (
              <motion.div
                key="hierarchy"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <HierarchyView departments={departments} />
              </motion.div>
            ) : (
              <DepartmentGrid
                departments={departments}
                paginatedDepartments={paginatedDepartments}
                filteredDepartments={filteredDepartments}
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
                onViewDetails={openDetailsDialog}
                onDelete={(d) => {
                  setSelectedDepartment(d);
                  setShowDeleteDialog(true);
                }}
                canManage={canManage}
                onOpenAddDialog={() => setShowAddDialog(true)}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Add Department Dialog */}
      <AddDepartmentDialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            resetForm();
            resetEmployeeSelection();
            setEmployeeSearchQuery("");
          }
        }}
        formData={formData}
        setFormData={setFormData}
        departments={departments}
        employees={employees}
        filteredEmployees={filteredEmployees}
        selectedEmployees={selectedEmployees}
        toggleEmployeeSelection={toggleEmployeeSelection}
        employeeSearchQuery={employeeSearchQuery}
        setEmployeeSearchQuery={setEmployeeSearchQuery}
        isProcessing={isProcessing}
        onAddDepartment={handleAddDepartment}
      />

      {/* Department Details Dialog */}
      <DepartmentDetailsDialog
        open={showDetailsDialog}
        onOpenChange={(open) => {
          setShowDetailsDialog(open);
          if (!open) {
            setIsEditingDetails(false);
            setIsAddingEmployees(false);
            setEmployeeSearchQuery("");
          }
        }}
        selectedDepartment={selectedDepartment}
        departments={departments}
        employees={employees}
        filteredEmployees={filteredEmployees}
        canManage={canManage}
        isEditingDetails={isEditingDetails}
        setIsEditingDetails={setIsEditingDetails}
        isAddingEmployees={isAddingEmployees}
        setIsAddingEmployees={setIsAddingEmployees}
        formData={formData}
        setFormData={setFormData}
        assignEmployeesSelection={assignEmployeesSelection}
        toggleAssignEmployeeSelection={toggleAssignEmployeeSelection}
        employeeSearchQuery={employeeSearchQuery}
        setEmployeeSearchQuery={setEmployeeSearchQuery}
        isAssigningEmployees={isAssigningEmployees}
        onSaveEdit={handleEditDepartment}
        onAssignEmployees={handleAssignEmployees}
        onRemoveEmployee={handleRemoveFromDepartment}
        fillFormFromDepartment={fillFormFromDepartment}
      />

      {/* Delete Confirmation Dialog */}
      <DepartmentDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        selectedDepartment={selectedDepartment}
        onDelete={handleDeleteDepartment}
      />

      {/* Remove Employee Confirmation */}
      <RemoveEmployeeDialog
        open={showRemoveConfirm}
        onOpenChange={(open) => {
          setShowRemoveConfirm(open);
          if (!open) {
            // Clears employee selection
          }
        }}
        onConfirm={confirmRemoveFromDepartment}
      />
    </div>
  );
};

export default Departments;
