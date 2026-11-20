import React from "react";
import type { FormData } from "../../types";
import { WhatsAppGreetingEditor } from "../WhatsAppGreetingEditor";

interface CreativeCallToActionSectionProps {
  formData: FormData;
  handleChange: (field: keyof FormData, value: any) => void;
  callToActions: { label: string; value: string }[];
  isEn: boolean;
}

export const CreativeCallToActionSection: React.FC<CreativeCallToActionSectionProps> = ({
  formData,
  handleChange,
  callToActions,
  isEn,
}) => {
  return (
    <div className="space-y-4">
      {/* Call to Action Grid */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {isEn ? "Call to Action" : "زر الإجراء"}
        </label>
        <div className="grid grid-cols-4 gap-2">
          {callToActions.map((cta) => (
            <button
              key={cta.value}
              type="button"
              onClick={() => handleChange("callToAction", cta.value)}
              className={`py-2 px-3 text-xs rounded-lg border transition-all ${
                formData.callToAction === cta.value
                  ? "border-blue-500 bg-primary/10 dark:bg-primary/40 text-primary dark:text-primary"
                  : "border-gray-200 dark:border-border hover:border-border text-foreground bg-card"
              }`}
            >
              {cta.label}
            </button>
          ))}
        </div>
      </div>

      {/* WhatsApp Greeting & Quick FAQs Editor */}
      {(formData.callToAction === "WHATSAPP_MESSAGE" ||
        formData.conversionLocation === "WHATSAPP") && (
        <WhatsAppGreetingEditor
          greeting={formData.whatsappGreeting || ""}
          onGreetingChange={(val) => handleChange("whatsappGreeting", val)}
          quickFaqs={formData.whatsappQuickFaqs || []}
          onQuickFaqsChange={(faqs) =>
            handleChange("whatsappQuickFaqs", faqs)
          }
        />
      )}
    </div>
  );
};
