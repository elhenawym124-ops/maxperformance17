import React from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import type { FormData } from "../types";
import { getObjectives, getSpecialAdCategories } from "../constants";

interface Step1CampaignProps {
  formData: FormData;
  handleChange: (field: keyof FormData, value: any) => void;
  toggleArrayValue: (field: keyof FormData, value: string) => void;
  getError: (field: string) => string;
}

export const Step1Campaign: React.FC<Step1CampaignProps> = ({
  formData,
  handleChange,
  toggleArrayValue,
  getError,
}) => {
  const { i18n } = useTranslation();
  const isEn = Boolean(i18n.language && i18n.language.startsWith("en"));
  const objectives = React.useMemo(() => getObjectives(isEn), [isEn]);
  const specialAdCategories = React.useMemo(
    () => getSpecialAdCategories(isEn),
    [isEn],
  );

  return (
    <div className="space-y-6" dir={isEn ? "ltr" : "rtl"}>
      {/* Campaign Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {isEn ? "Campaign Name" : "اسم الحملة"} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.campaignName}
          onChange={(e) => handleChange("campaignName", e.target.value)}
          placeholder={isEn ? "e.g. Ramadan Campaign 2024" : "مثال: حملة رمضان 2024"}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-card text-foreground ${
            getError("campaignName")
              ? "border-red-500"
              : "border-border"
          }`}
        />
        {getError("campaignName") && (
          <p className="mt-1 text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {getError("campaignName")}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {isEn ? "Ad Set Name" : "اسم Ad Set"}
          </label>
          <input
            type="text"
            value={formData.adSetName}
            onChange={(e) => handleChange("adSetName", e.target.value)}
            placeholder={isEn ? "e.g. Women Egypt - Broad" : "مثال: Women Egypt - Broad"}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-card text-foreground border-border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {isEn ? "Ad Name" : "اسم الإعلان"}
          </label>
          <input
            type="text"
            value={formData.adName}
            onChange={(e) => handleChange("adName", e.target.value)}
            placeholder={isEn ? "e.g. Product Hook V1" : "مثال: Product Hook V1"}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-card text-foreground border-border"
          />
        </div>
      </div>

      {/* Objective */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          {isEn ? "Campaign Objective" : "هدف الحملة"} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {objectives.map((obj) => (
            <button
              key={obj.value}
              type="button"
              onClick={() => handleChange("objective", obj.value)}
              className={`p-4 border-2 rounded-xl text-center transition-all ${
                formData.objective === obj.value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "border-border hover:border-border dark:hover:border-border bg-card text-foreground"
              }`}
            >
              <div
                className={`mx-auto mb-2 ${formData.objective === obj.value ? "text-blue-500" : "text-gray-400"}`}
              >
                {obj.icon}
              </div>
              <div className="font-medium">{obj.label}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {obj.description}
              </div>
            </button>
          ))}
        </div>
        {getError("objective") && (
          <p className="mt-2 text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {getError("objective")}
          </p>
        )}
      </div>

      {/* Special Ad Categories */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {isEn ? "Special Ad Category" : "فئة الإعلان الخاصة"}
        </label>
        <select
          value={formData.specialAdCategories[0] || "NONE"}
          onChange={(e) =>
            handleChange(
              "specialAdCategories",
              e.target.value === "NONE" ? [] : [e.target.value],
            )
          }
          className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-card text-foreground"
        >
          {specialAdCategories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted-foreground">
          {isEn
            ? "If your ad relates to housing, employment, credit, or politics, you must declare it."
            : "إذا كان إعلانك يتعلق بالإسكان أو التوظيف أو الائتمان، يجب تحديد الفئة المناسبة"}
        </p>
      </div>

      {/* A/B Split Testing */}
      <div className="p-4 bg-muted dark:bg-muted border border-border dark:border-border rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <div>
              <h4 className="text-sm font-bold text-foreground">
                {isEn ? "Create A/B Split Test" : "إنشاء اختبار تجزئة (A/B Test)"}
              </h4>
              <p className="text-xs text-muted-foreground">
                {isEn
                  ? "Statistically compare different versions to determine the best performing strategy"
                  : "مقارنة نسخ مختلفة إحصائياً لتحديد الاستراتيجية الأفضل أداءً"}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={Boolean(formData.isSplitTest)}
              onChange={(e) => handleChange("isSplitTest", e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-muted dark:bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {formData.isSplitTest && (
          <div className="pt-2 border-t border-border dark:border-border space-y-2">
            <label className="block text-xs font-semibold text-foreground">
              {isEn ? "Test Variable" : "المتغير المراد اختباره (Test Variable)"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "CREATIVE", label: isEn ? "Creative" : "المحتوى الإبداعي" },
                { value: "AUDIENCE", label: isEn ? "Audience & Targeting" : "الجمهور والاستهداف" },
                { value: "PLACEMENT", label: isEn ? "Placements & Devices" : "المواضع والأجهزة" },
              ].map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => handleChange("splitTestVariable", v.value)}
                  className={`p-2 rounded-lg border text-xs font-medium text-center transition-all ${
                    (formData.splitTestVariable || "CREATIVE") === v.value
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-bold"
                      : "border-gray-200 bg-white hover:border-border text-foreground dark:border-border dark:bg-muted dark:hover:border-border dark:text-muted-foreground"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Campaign Spending Limit */}
      <div className="p-4 bg-muted dark:bg-muted border border-border dark:border-border rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-success dark:bg-success/60 text-success dark:text-success">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">
                {isEn ? "Campaign Spending Limit" : "حد إنفاق الحملة الإجمالي (Campaign Spending Limit)"}
              </h4>
              <p className="text-[11px] text-muted-foreground">
                {isEn
                  ? "Optional ceiling to stop the entire campaign when reached to protect your budget"
                  : "سقف مالي اختياري لإيقاف الحملة كلياً عند الوصول إليه لحماية الميزانية"}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={Boolean(formData.spendLimit && formData.spendLimit > 0)}
              onChange={(e) => {
                if (!e.target.checked) {
                  handleChange("spendLimit", undefined);
                } else {
                  handleChange("spendLimit", 10000);
                }
              }}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-muted dark:bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {Boolean(formData.spendLimit && formData.spendLimit > 0) && (
          <div className="pt-2 border-t border-border dark:border-border">
            <label className="block text-xs font-semibold text-foreground mb-1">
              {isEn ? "Cumulative Campaign Spend Cap" : "الحد الأقصى للإنفاق التراكمي للحملة"}
            </label>
            <div className="relative">
              <input
                type="number"
                min={100}
                value={formData.spendLimit || ""}
                onChange={(e) =>
                  handleChange(
                    "spendLimit",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                placeholder={isEn ? "e.g. 20000" : "مثال: 20000"}
                className={`w-full px-3 py-2 border border-border bg-card text-foreground rounded-lg text-xs font-semibold focus:ring-2 focus:ring-success ${isEn ? "pe-12" : "ps-12"}`}
              />
              <span className={`absolute top-2 text-xs text-muted-foreground/80 font-bold ${isEn ? "right-3" : "left-3"}`}>
                EGP
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {isEn
                ? "All ads and ad sets in this campaign will pause once total spend hits this amount."
                : "ستتوقف جميع الإعلانات والمجموعات داخل هذه الحملة فور وصول إجمالي الصرف لهذا الرقم."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
