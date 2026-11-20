import React from "react";
import { useSearchParams } from "react-router-dom";
import { PolarisPositionsView } from "./PolarisPositionsView";
import {
  usePositionsController,
  PositionsHeader,
  PositionsSearchBar,
  PositionsGrid,
  PositionFormDialog,
  PositionDeleteDialog,
} from "./positions-management/index";

const PositionsManagement: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlLayout = searchParams.get("layout");
  const sessionLayout =
    typeof window !== "undefined"
      ? sessionStorage.getItem("maxp_session_layout")
      : null;
  const isPolaris = urlLayout !== "legacy" && sessionLayout !== "legacy";

  const {
    positions,
    departments,
    loading,
    searchTerm,
    setSearchTerm,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    editingPosition,
    setEditingPosition,
    deleteDialogOpen,
    setDeleteDialogOpen,
    positionToDelete,
    filteredPositions,
    form,
    onSubmit,
    handleEdit,
    handleDelete,
    openDeleteDialog,
    handleNavigateBack,
  } = usePositionsController();

  if (loading && positions.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full pb-8" dir="rtl">
      {isPolaris ? (
        <PolarisPositionsView
          positions={positions}
          filteredPositions={filteredPositions}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onEdit={handleEdit}
          onDelete={openDeleteDialog}
          onNewPosition={() => {
            form.reset({
              title: "",
              description: "",
              code: "",
              level: 1,
              departmentId: "",
              minSalary: undefined,
              maxSalary: undefined,
            });
            setIsCreateDialogOpen(true);
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <PositionsHeader
            onBack={handleNavigateBack}
            onNewPosition={() => {
              form.reset({
                title: "",
                description: "",
                code: "",
                level: 1,
                departmentId: "",
                minSalary: undefined,
                maxSalary: undefined,
              });
              setIsCreateDialogOpen(true);
            }}
          />

          {/* Search */}
          <PositionsSearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />

          {/* Positions Grid */}
          <PositionsGrid
            positions={filteredPositions}
            searchTerm={searchTerm}
            onEdit={handleEdit}
            onDelete={openDeleteDialog}
            onNewPosition={() => setIsCreateDialogOpen(true)}
          />
        </div>
      )}

      {/* Create Dialog */}
      <PositionFormDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        isEditing={false}
        departments={departments}
        form={form}
        loading={loading}
        onSubmit={onSubmit}
        onCancel={() => setIsCreateDialogOpen(false)}
      />

      {/* Edit Dialog */}
      <PositionFormDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        isEditing={true}
        editingTitle={editingPosition?.title}
        departments={departments}
        form={form}
        loading={loading}
        onSubmit={onSubmit}
        onCancel={() => {
          setIsEditDialogOpen(false);
          setEditingPosition(null);
          form.reset();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <PositionDeleteDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        position={positionToDelete}
        onConfirm={() => positionToDelete && handleDelete(positionToDelete)}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
};

export default PositionsManagement;
