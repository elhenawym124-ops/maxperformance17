import React from "react";
import {
  ArrowRightCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
  useAssetRequestsSectionController,
  AssetRequestsContentPanels,
  CreateAssetRequestModal,
} from "./asset-requests";

const AssetRequestsSection: React.FC = () => {
  const {
    view,
    setView,
    requests,
    showRequestModal,
    setShowRequestModal,
    loading,
    newRequest,
    setNewRequest,
    fetchRequests,
    handleCreateRequest,
    handleUpdateStatus,
  } = useAssetRequestsSectionController();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ArrowRightCircleIcon className="h-7 w-7 text-primary" />
            نظام طلبات العهدة والأصول
          </h2>
          <p className="text-muted-foreground mt-1">
            تقديم طلبات عهدة جديدة ومتابعة حالات الموافقة والتخصيص (يدعم إشعارات
            WhatsApp)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchRequests()}
            className="p-2 bg-card border border-border dark:border-border rounded-xl hover:bg-muted transition-all"
          >
            <ArrowPathIcon
              className={`h-5 w-5 text-muted-foreground ${loading ? "animate-spin" : ""}`}
            />
          </button>
          <div className="flex bg-card p-1 rounded-xl border border-border/70 shadow-xs">
            <button
              onClick={() => setView("employee")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                view === "employee"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-gray-500 hover:text-foreground dark:hover:text-muted-foreground"
              }`}
            >
              طلباتي
            </button>
            <button
              onClick={() => setView("hr")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                view === "hr"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-gray-500 hover:text-foreground dark:hover:text-muted-foreground"
              }`}
            >
              إدارة HR
            </button>
          </div>
        </div>
      </div>

      <AssetRequestsContentPanels
        view={view}
        requests={requests}
        onOpenModal={() => setShowRequestModal(true)}
        onUpdateStatus={handleUpdateStatus}
      />

      <CreateAssetRequestModal
        open={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        newRequest={newRequest}
        onChangeRequest={setNewRequest}
        onSubmit={handleCreateRequest}
      />
    </div>
  );
};

export default AssetRequestsSection;
