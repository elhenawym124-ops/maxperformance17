import React from "react";
import {
  WrenchScrewdriverIcon,
  PlusIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
  useAssetMaintenanceController,
  MaintenanceAlertsAndHistoryTable,
  AddMaintenanceRecordModal,
} from "./maintenance";

const AssetMaintenanceSection: React.FC = () => {
  const {
    alerts,
    history,
    assets,
    loading,
    showAddModal,
    setShowAddModal,
    formatPrice,
    newRecord,
    setNewRecord,
    fetchData,
    handleAddMaintenance,
  } = useAssetMaintenanceController();

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
            <WrenchScrewdriverIcon className="h-8 w-8 text-primary" />
            الصيانة والضمان
          </h2>
          <p className="text-muted-foreground mt-1">
            إدارة سجلات الصيانة، جدولة المواعيد، ومتابعة تنبيهات الضمان
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-xs"
          >
            <PlusIcon className="h-5 w-5" />
            تسجيل صيانة
          </button>
          <button
            onClick={() => void fetchData()}
            className="p-2.5 bg-card border border-border dark:border-border rounded-xl hover:bg-muted transition-all"
          >
            <ArrowPathIcon
              className={`h-5 w-5 text-muted-foreground ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      <MaintenanceAlertsAndHistoryTable
        alerts={alerts}
        history={history}
        formatPrice={formatPrice}
      />

      <AddMaintenanceRecordModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        assets={assets}
        newRecord={newRecord}
        onChangeRecord={setNewRecord}
        onSubmit={handleAddMaintenance}
      />
    </div>
  );
};

export default AssetMaintenanceSection;
