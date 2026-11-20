import {
  AlertTriangle,
  Building2,
  Loader2,
  Package,
  Plus,
} from "lucide-react";
import { useDentalMaterials } from "./materials/hooks/useDentalMaterials";
import { MaterialsKpiCards } from "./materials/components/MaterialsKpiCards";
import { MaterialsCategoryTabs } from "./materials/components/MaterialsCategoryTabs";
import { MaterialCard } from "./materials/components/MaterialCard";
import { AddMaterialModal } from "./materials/modals/AddMaterialModal";
import { StockInModal } from "./materials/modals/StockInModal";
import { AddSupplierModal } from "./materials/modals/AddSupplierModal";
import { ViewSuppliersModal } from "./materials/modals/ViewSuppliersModal";

export default function DentalMaterialsTab() {
  const {
    materials,
    suppliers,
    summary,
    selectedCategory,
    setSelectedCategory,
    isLoading,
    actionError,
    filteredMaterials,
    isAddMaterialModalOpen,
    setIsAddMaterialModalOpen,
    isStockInModalOpen,
    setIsStockInModalOpen,
    isAddSupplierModalOpen,
    setIsAddSupplierModalOpen,
    isViewSuppliersModalOpen,
    setIsViewSuppliersModalOpen,
    selectedMaterialForStockIn,
    isSubmitting,
    isSubmittingSupplier,
    handleCreateSupplier,
    handleCreateMaterial,
    handleStockIn,
    openStockInFor,
  } = useDentalMaterials();

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2.5">
            <Package className="w-6 h-6 text-info dark:text-info" />
            <span>خامات المعمل والموردين (Dental Materials & Supply)</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            إدارة خامات الزيركون والـ CAD/CAM والزرعات برقم التشغيلة الطبي (Lot#) وحساب استهلاك كل وحدة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsViewSuppliersModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted dark:bg-muted hover:bg-muted text-foreground text-xs font-bold transition-all border border-border dark:border-border shadow-xs active:scale-95 cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-info dark:text-info" />
            <span>الموردين والشركات ({suppliers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddSupplierModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-info/30 dark:border-info/30 hover:bg-info/10 dark:hover:bg-info/30 text-info dark:text-info text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>مورد جديد</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddMaterialModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-info hover:bg-info text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>خامة جديدة</span>
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 bg-destructive/10 dark:bg-destructive/40 border border-destructive dark:border-destructive rounded-xl text-xs text-destructive dark:text-destructive flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <MaterialsKpiCards summary={summary} materialsCount={materials.length} />

      {/* Categories Filter Tabs */}
      <MaterialsCategoryTabs
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        materials={materials}
      />

      {/* Materials List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-info" />
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border dark:border-border rounded-xl p-6">
          <Package className="w-12 h-12 text-muted-foreground dark:text-foreground mx-auto mb-3" />
          <h3 className="text-sm font-bold text-foreground">
            لا توجد خامات مسجلة في هذا التصنيف
          </h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            أضف خامات الزيركون، الإيماكس، أو أجزاء الزرعات لربطها بالحالات وأوامر التشغيل.
          </p>
          <button
            type="button"
            onClick={() => setIsAddMaterialModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-info text-white text-xs font-bold hover:bg-info cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة خامة أولى</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMaterials.map((mat) => (
            <MaterialCard
              key={mat.id}
              material={mat}
              onStockIn={openStockInFor}
            />
          ))}
        </div>
      )}

      {/* Modal 1: Add New Material */}
      <AddMaterialModal
        isOpen={isAddMaterialModalOpen}
        onClose={() => setIsAddMaterialModalOpen(false)}
        onSubmit={handleCreateMaterial}
        suppliers={suppliers}
        onOpenAddSupplier={() => setIsAddSupplierModalOpen(true)}
        isSubmitting={isSubmitting}
      />

      {/* Modal 2: Stock In */}
      <StockInModal
        isOpen={isStockInModalOpen}
        material={selectedMaterialForStockIn}
        onClose={() => setIsStockInModalOpen(false)}
        onSubmit={handleStockIn}
        suppliers={suppliers}
        onOpenAddSupplier={() => setIsAddSupplierModalOpen(true)}
        isSubmitting={isSubmitting}
      />

      {/* Modal 3: Add Supplier */}
      <AddSupplierModal
        isOpen={isAddSupplierModalOpen}
        onClose={() => setIsAddSupplierModalOpen(false)}
        onSubmit={handleCreateSupplier}
        isSubmitting={isSubmittingSupplier}
      />

      {/* Modal 4: View Suppliers */}
      <ViewSuppliersModal
        isOpen={isViewSuppliersModalOpen}
        onClose={() => setIsViewSuppliersModalOpen(false)}
        suppliers={suppliers}
        onOpenAddSupplier={() => setIsAddSupplierModalOpen(true)}
      />
    </div>
  );
}
