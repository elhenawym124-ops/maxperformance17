import React from "react";
import { AUDIENCE_TYPES, CreateCustomAudienceData } from "./types";

interface Step1AudienceInfoProps {
  formData: CreateCustomAudienceData;
  onInputChange: (field: keyof CreateCustomAudienceData, value: any) => void;
}

export const Step1AudienceInfo: React.FC<Step1AudienceInfoProps> = ({
  formData,
  onInputChange,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="custom-audience-name"
          className="block text-sm font-medium text-foreground mb-2"
        >
          اسم الجمهور *
        </label>
        <input
          id="custom-audience-name"
          name="name"
          type="text"
          autoComplete="off"
          value={formData.name}
          onChange={(e) => onInputChange("name", e.target.value)}
          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="مثال: عملاء نشطون - يناير 2025"
        />
      </div>

      <div>
        <label
          htmlFor="custom-audience-description"
          className="block text-sm font-medium text-foreground mb-2"
        >
          الوصف (اختياري)
        </label>
        <textarea
          id="custom-audience-description"
          name="description"
          autoComplete="off"
          value={formData.description}
          onChange={(e) => onInputChange("description", e.target.value)}
          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          rows={3}
          placeholder="وصف مختصر للجمهور..."
        />
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-foreground mb-2">
          نوع الجمهور *
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {AUDIENCE_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = formData.audienceType === type.value;
            return (
              <label
                htmlFor={`custom-audience-type-${type.value}`}
                key={type.value}
                className={`cursor-pointer p-4 border rounded-xl transition-all duration-150 flex items-start gap-3.5 ${
                  isSelected
                    ? "border-indigo-600 bg-primary/70 shadow-sm ring-1 ring-primary/20"
                    : "border-gray-200 hover:border-border bg-white hover:bg-muted"
                }`}
              >
                <input
                  id={`custom-audience-type-${type.value}`}
                  type="radio"
                  name="audienceType"
                  value={type.value}
                  checked={isSelected}
                  onChange={(e) =>
                    onInputChange("audienceType", e.target.value)
                  }
                  className="sr-only"
                />
                <div
                  className={`p-2.5 rounded-lg flex-shrink-0 ${
                    isSelected
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-foreground text-sm">
                      {type.label}
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-foreground border border-border">
                      {type.badge}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {type.description}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
};
