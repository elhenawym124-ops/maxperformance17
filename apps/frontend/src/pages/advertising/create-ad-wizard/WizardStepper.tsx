import React from "react";
import type { useCreateAdWizardController } from "./useCreateAdWizardController";

interface WizardStepperProps {
  controller: ReturnType<typeof useCreateAdWizardController>;
}

export const WizardStepper: React.FC<WizardStepperProps> = ({ controller }) => {
  const { wizardSteps, currentStep } = controller;

  return (
    <div className="mb-8 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[700px] max-w-4xl mx-auto px-4">
        {wizardSteps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all " +
                  (currentStep === step.id
                    ? "bg-blue-600 text-white ring-4 ring-primary dark:ring-primary"
                    : currentStep > step.id
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 dark:bg-muted text-muted-foreground")
                }
              >
                {step.icon}
              </div>
              <span
                className={
                  "text-xs mt-2 font-medium text-center max-w-[80px] " +
                  (currentStep === step.id
                    ? "text-blue-600 dark:text-primary"
                    : "text-muted-foreground")
                }
              >
                {step.title}
              </span>
            </div>
            {index < wizardSteps.length - 1 && (
              <div
                className={
                  "flex-1 h-1 mx-2 transition-all " +
                  (currentStep > step.id
                    ? "bg-green-500"
                    : "bg-gray-200 dark:bg-muted")
                }
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
