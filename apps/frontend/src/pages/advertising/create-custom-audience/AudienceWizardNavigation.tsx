import React from "react";

interface AudienceWizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  loading: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export const AudienceWizardNavigation: React.FC<AudienceWizardNavigationProps> = ({
  currentStep,
  totalSteps,
  loading,
  onPrevious,
  onNext,
  onSubmit,
}) => {
  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
      <button
        onClick={onPrevious}
        disabled={currentStep === 1}
        className="px-6 py-2 text-foreground bg-white border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
      >
        السابق
      </button>

      {currentStep < totalSteps ? (
        <button
          onClick={onNext}
          className="px-6 py-2 text-white bg-primary rounded-lg hover:bg-primary"
        >
          التالي
        </button>
      ) : (
        <button
          onClick={onSubmit}
          disabled={loading}
          className="px-6 py-2 text-white bg-primary rounded-lg hover:bg-primary disabled:opacity-50"
        >
          {loading ? "جاري الإنشاء..." : "إنشاء الجمهور"}
        </button>
      )}
    </div>
  );
};
