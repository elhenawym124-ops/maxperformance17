import React from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  AssetFormProps,
  useAssetFormController,
  AssetFormBasicAndLocationSection,
  AssetFormFinancialAndWarrantySection,
} from "./asset-form";

const AssetForm: React.FC<AssetFormProps> = ({
  initialData,
  onClose,
  onSuccess,
  usePortal = true,
}) => {
  const {
    formData,
    setFormData,
    categories,
    suppliers,
    employees,
    loading,
    loadingEmployees,
    error,
    handleSubmit,
  } = useAssetFormController(initialData, onSuccess, usePortal);

  if (usePortal && typeof document === "undefined") return null;

  const modal = (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-card rounded-xl shadow-2xl overflow-hidden border border-border dark:border-border transform transition-all flex flex-col max-h-[90vh]">
        {/* Sticky Header */}
        <div className="bg-gray-50 dark:bg-muted px-6 py-4 border-b border-border dark:border-border flex justify-between items-center z-10 sticky top-0">
          <h3 className="text-xl font-bold text-foreground">
            {initialData ? "تعديل بيانات الأصل" : "إضافة أصل جديد"}
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-full text-muted-foreground hover:text-muted-foreground hover:bg-muted transition"
            aria-label="إغلاق نموذج الأصل"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <form id="asset-form" onSubmit={handleSubmit} className="space-y-8">
            <AssetFormBasicAndLocationSection
              formData={formData}
              onFormDataChange={setFormData}
              categories={categories}
              employees={employees}
              loadingEmployees={loadingEmployees}
            />

            <AssetFormFinancialAndWarrantySection
              formData={formData}
              onFormDataChange={setFormData}
              suppliers={suppliers}
            />
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="bg-gray-50 dark:bg-muted px-6 py-4 border-t border-border dark:border-border flex justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-border rounded-lg shadow-sm text-sm font-semibold text-foreground bg-card hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-border transition-colors"
          >
            إلغاء
          </button>
          <button
            type="submit"
            form="asset-form"
            disabled={loading}
            className="px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary/90 text-primary-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors inline-flex items-center justify-center min-w-[120px]"
          >
            {loading ? "جاري الحفظ..." : "حفظ الأصل"}
          </button>
        </div>
      </div>
    </div>
  );

  if (usePortal) {
    return createPortal(modal, document.body);
  }

  return modal;
};

export default AssetForm;
