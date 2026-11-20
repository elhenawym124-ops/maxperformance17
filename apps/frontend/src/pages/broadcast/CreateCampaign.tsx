import React from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import CampaignProgressModal from "../../components/broadcast/CampaignProgressModal";
import {
  useCreateCampaign,
  CreateCampaignHeader,
  CampaignFormFields,
  CampaignScheduleOptions,
  CampaignMediaUpload,
  CampaignSettings,
  CampaignPreviewCard,
  CampaignSuccessState,
  CampaignSubmitActions,
} from "./create-campaign";

const CreateCampaign: React.FC = () => {
  const {
    formData,
    customerLists,
    newTag,
    setNewTag,
    addTag,
    removeTag,
    previewMode,
    setPreviewMode,
    loading,
    error,
    showProgressModal,
    setShowProgressModal,
    currentCampaignId,
    currentCampaignName,
    success,
    successMessage,
    setMessageTextareaRef,
    handleInputChange,
    handleImageChange,
    removeImage,
    handleSendNowChange,
    handleSubmit,
    insertVariable,
    getPreviewMessage,
    selectedList,
  } = useCreateCampaign();

  if (success) {
    return <CampaignSuccessState message={successMessage} />;
  }

  return (
    <div className="w-full p-6">
      <div className="bg-card shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <CreateCampaignHeader
            previewMode={previewMode}
            onTogglePreview={() => setPreviewMode(!previewMode)}
          />

          {error && (
            <div className="mb-6 bg-destructive/10 dark:bg-destructive/20 border border-destructive dark:border-destructive rounded-md p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-destructive" />
                <div className="me-3">
                  <p className="text-sm text-destructive dark:text-destructive">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Form */}
              <div className="space-y-6">
                <CampaignFormFields
                  formData={formData}
                  customerLists={customerLists}
                  selectedList={selectedList}
                  loading={loading}
                  onInputChange={handleInputChange}
                  onInsertVariable={insertVariable}
                  setMessageTextareaRef={setMessageTextareaRef}
                />

                <CampaignScheduleOptions
                  formData={formData}
                  onSendNowChange={handleSendNowChange}
                  onInputChange={handleInputChange}
                />

                <CampaignMediaUpload
                  images={formData.images}
                  onImageChange={handleImageChange}
                  onRemoveImage={removeImage}
                />

                <CampaignSettings
                  formData={formData}
                  newTag={newTag}
                  onNewTagChange={setNewTag}
                  onAddTag={addTag}
                  onRemoveTag={removeTag}
                  onInputChange={handleInputChange}
                />
              </div>

              {/* Right Column - Preview */}
              {previewMode && (
                <CampaignPreviewCard
                  formData={formData}
                  previewMessage={getPreviewMessage()}
                />
              )}
            </div>

            {/* Submit Buttons */}
            <CampaignSubmitActions
              loading={loading}
              sendNow={formData.sendNow}
            />
          </form>
        </div>
      </div>

      {/* Progress Modal */}
      <CampaignProgressModal
        campaignId={currentCampaignId}
        campaignName={currentCampaignName}
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
      />
    </div>
  );
};

export default CreateCampaign;
export * from "./create-campaign";
