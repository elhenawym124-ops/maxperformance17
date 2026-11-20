import React from "react";
import { useSearchParams } from "react-router-dom";
import { PolarisMyFeedbackView } from "./PolarisMyFeedbackView";
import {
  useMyFeedbackController,
  MyFeedbackHeaderAndStats,
  MyFeedbackListSection,
  MyFeedbackPreviewDialog,
} from "./my-feedback/index";

const MyFeedback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlLayout = searchParams.get("layout");
  const sessionLayout =
    typeof window !== "undefined"
      ? sessionStorage.getItem("maxp_session_layout")
      : null;
  const isPolaris = urlLayout !== "legacy" && sessionLayout !== "legacy";

  const {
    t,
    navigate,
    loading,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    previewItem,
    isPreviewOpen,
    handleOpenPreview,
    handlePreviewOpenChange,
    stats,
    filteredFeedback,
  } = useMyFeedbackController();

  return (
    <div className="w-full pb-8" dir="rtl">
      {isPolaris ? (
        <PolarisMyFeedbackView
          t={t}
          loading={loading}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredFeedback={filteredFeedback}
          stats={stats}
          onOpenPreview={handleOpenPreview}
          onNewMessage={() => navigate("/my-feedback/new")}
        />
      ) : (
        <div className="space-y-6">
          <MyFeedbackHeaderAndStats
            t={t}
            stats={stats}
            onNewMessage={() => navigate("/my-feedback/new")}
          />

          <MyFeedbackListSection
            t={t}
            loading={loading}
            activeTab={activeTab}
            onActiveTabChange={setActiveTab}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            filteredFeedback={filteredFeedback}
            onOpenPreview={handleOpenPreview}
            onNewMessage={() => navigate("/my-feedback/new")}
          />
        </div>
      )}

      <MyFeedbackPreviewDialog
        t={t}
        open={isPreviewOpen}
        onOpenChange={handlePreviewOpenChange}
        previewItem={previewItem}
      />
    </div>
  );
};

export default MyFeedback;
