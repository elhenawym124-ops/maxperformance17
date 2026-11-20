/**
 * Create Campaign Page
 *
 * صفحة إنشاء حملة إعلانية جديدة (Wizard محسّن)
 */

import React from "react";
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import {
  useCreateCampaignController,
  WizardStepper,
  Step1BasicInfo,
  Step2BudgetSchedule,
  Step3Targeting,
  Step4Placements,
  Step5AdvancedSettings,
  Step6ReviewConfirm,
} from "./create-campaign/index";

const CreateCampaign: React.FC = () => {
  const {
    navigate,
    currentStep,
    totalSteps,
    loading,
    adAccounts,
    pixels,
    loadingAccounts,
    loadingPixels,
    formData,
    handleInputChange,
    handleSpecialAdCategoryToggle,
    handleLocationToggle,
    handleInterestToggle,
    handlePlacementToggle,
    handleGenderToggle,
    handleNext,
    handlePrevious,
    handleSubmit,
    getObjectiveDescription,
  } = useCreateCampaignController();

  return (
    <div className="w-full space-y-6 min-h-screen bg-muted dark:bg-muted p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          إنشاء حملة إعلانية جديدة
        </h1>
        <p className="mt-2 text-sm text-foreground dark:text-muted-foreground">
          اتبع الخطوات لإنشاء حملة إعلانية على Facebook
        </p>
      </div>

      {/* Progress Steps */}
      <WizardStepper currentStep={currentStep} />

      {/* Form Content */}
      <div className="bg-card p-8 rounded-lg shadow dark:shadow-gray-900/20 border-0 dark:border dark:border-border">
        {currentStep === 1 && (
          <Step1BasicInfo
            formData={formData}
            handleInputChange={handleInputChange}
            getObjectiveDescription={getObjectiveDescription}
            adAccounts={adAccounts}
            loadingAccounts={loadingAccounts}
          />
        )}

        {currentStep === 2 && (
          <Step2BudgetSchedule
            formData={formData}
            handleInputChange={handleInputChange}
          />
        )}

        {currentStep === 3 && (
          <Step3Targeting
            formData={formData}
            handleInputChange={handleInputChange}
            handleGenderToggle={handleGenderToggle}
            handleLocationToggle={handleLocationToggle}
            handleInterestToggle={handleInterestToggle}
          />
        )}

        {currentStep === 4 && (
          <Step4Placements
            formData={formData}
            handleInputChange={handleInputChange}
            handlePlacementToggle={handlePlacementToggle}
          />
        )}

        {currentStep === 5 && (
          <Step5AdvancedSettings
            formData={formData}
            handleInputChange={handleInputChange}
            handleSpecialAdCategoryToggle={handleSpecialAdCategoryToggle}
            pixels={pixels}
            loadingPixels={loadingPixels}
          />
        )}

        {currentStep === 6 && (
          <Step6ReviewConfirm
            formData={formData}
            pixels={pixels}
          />
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <button
            type="button"
            onClick={() => navigate("/advertising/facebook-ads")}
            className="px-4 py-2 text-foreground bg-card border border-border rounded-lg hover:bg-muted/50"
          >
            إلغاء
          </button>

          <div className="flex gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="flex items-center gap-2 px-4 py-2 text-foreground bg-card border border-border rounded-lg hover:bg-muted/50"
              >
                <ChevronLeftIcon className="w-5 h-5" />
                السابق
              </button>
            )}
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 text-white bg-primary dark:bg-primary rounded-lg hover:bg-primary dark:hover:bg-primary"
              >
                التالي
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 text-white bg-success rounded-lg hover:bg-success disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    إنشاء الحملة
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaign;
