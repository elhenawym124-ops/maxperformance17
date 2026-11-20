import React from "react";
import { ArrowDownTrayIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { CreateCustomAudienceData } from "./types";

interface Step2CustomerListCriteriaProps {
  formData: CreateCustomAudienceData;
  onInputChange: (field: keyof CreateCustomAudienceData, value: any) => void;
  onParseManualCustomers: (text: string) => void;
  onCsvUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Step2CustomerListCriteria: React.FC<Step2CustomerListCriteriaProps> = ({
  formData,
  onInputChange,
  onParseManualCustomers,
  onCsvUpload,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex rounded-lg border border-border p-1 bg-muted text-xs font-semibold">
        <button
          type="button"
          onClick={() => onInputChange("sourceType", "STORE_CUSTOMERS")}
          className={`flex-1 py-2 rounded-md transition-all ${
            formData.sourceType === "STORE_CUSTOMERS"
              ? "bg-white text-primary shadow-sm"
              : "text-gray-600 hover:text-foreground"
          }`}
        >
          عملاء متجر MaxP (استيراد تلقائي)
        </button>
        <button
          type="button"
          onClick={() => onInputChange("sourceType", "MANUAL")}
          className={`flex-1 py-2 rounded-md transition-all ${
            formData.sourceType === "MANUAL"
              ? "bg-white text-primary shadow-sm"
              : "text-gray-600 hover:text-foreground"
          }`}
        >
          إدخال يدوي / لصق نصوص
        </button>
        <button
          type="button"
          onClick={() => onInputChange("sourceType", "CSV_IMPORT")}
          className={`flex-1 py-2 rounded-md transition-all ${
            formData.sourceType === "CSV_IMPORT"
              ? "bg-white text-primary shadow-sm"
              : "text-gray-600 hover:text-foreground"
          }`}
        >
          رفع ملف CSV
        </button>
      </div>

      {formData.sourceType === "STORE_CUSTOMERS" && (
        <div className="p-4 bg-primary/60 border border-primary rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <CheckCircleIcon className="w-5 h-5 text-primary" />
            <span>المزامنة التلقائية مع قاعدة بيانات متجرك</span>
          </div>
          <p className="text-xs text-primary leading-relaxed">
            سيقوم النظام تلقائياً بجمع وتنسيق أرقام وإيميلات عملائك الحاليين من جدول الطلبات وتشفيرها عبر خوارزمية SHA256 الآمنة قبل مطابقتها مع Meta.
          </p>
        </div>
      )}

      {formData.sourceType === "MANUAL" && (
        <div className="space-y-3">
          <label
            htmlFor="custom-audience-manual-text"
            className="block text-sm font-medium text-foreground"
          >
            الصق أرقام الهواتف أو الإيميلات (سطر أو فاصلة بين كل عنصر)
          </label>
          <textarea
            id="custom-audience-manual-text"
            rows={5}
            value={formData.rawCustomerText || ""}
            onChange={(e) => onInputChange("rawCustomerText", e.target.value)}
            placeholder="01012345678&#10;user@example.com&#10;01123456789"
            className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary"
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => onParseManualCustomers(formData.rawCustomerText || "")}
              className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary shadow-sm"
            >
              تحليل وتأكيد القائمة
            </button>
            <span className="text-xs text-muted-foreground tabular-nums">
              العدد الجاهز للرفع: {formData.customerList?.length || 0}
            </span>
          </div>
        </div>
      )}

      {formData.sourceType === "CSV_IMPORT" && (
        <div className="space-y-3">
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center bg-muted hover:bg-muted transition">
            <ArrowDownTrayIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <label className="cursor-pointer text-sm font-semibold text-primary hover:text-primary">
              <span>اختر ملف CSV من جهازك</span>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={onCsvUpload}
                className="sr-only"
              />
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              الملف يجب أن يحتوي على أعمدة (Email, Phone, First Name, Last Name)
            </p>
          </div>
          {formData.customerList && formData.customerList.length > 0 && (
            <div className="p-3 bg-success/10 border border-success rounded-lg text-xs text-success font-medium tabular-nums">
              تم تجهيز {formData.customerList.length} جهة اتصال من الملف المرفق.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
