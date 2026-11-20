import React from "react";
import { ProductFormData } from "../../types";

interface SeoTabProps {
  formData: ProductFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export const SeoTab: React.FC<SeoTabProps> = ({
  formData,
  handleInputChange,
}) => {
  return (
    <div className="bg-card shadow rounded-xl p-3.5 sm:p-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-border dark:border-border pb-4">
        <h3 className="text-lg font-medium text-foreground">
          تحسين محركات البحث (SEO)
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          تحسين ظهور المنتج في نتائج البحث على Google وغيرها
        </p>
      </div>

      {/* Google Preview */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">
          معاينة نتيجة البحث
        </h4>
        <div className="border border-border dark:border-border rounded-lg p-4 bg-white dark:bg-muted">
          <p className="text-xs text-success dark:text-success mb-1 truncate">
            {window.location.origin}/product/{formData.slug || "product-url"}
          </p>
          <p className="text-blue-700 dark:text-blue-400 text-lg font-medium truncate hover:underline cursor-pointer">
            {formData.metaTitle || formData.name || "عنوان المنتج"}
          </p>
          <p className="text-sm text-foreground dark:text-muted-foreground mt-1 line-clamp-2">
            {formData.metaDescription ||
              (formData.description
                ? formData.description.replace(/<[^>]+>/g, "").substring(0, 160)
                : "وصف المنتج سيظهر هنا في نتائج البحث...")}
          </p>
        </div>
      </div>

      <hr className="border-gray-200 dark:border-border" />

      {/* Meta Fields */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">
          بيانات SEO
        </h4>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground">
              عنوان الصفحة (Meta Title)
            </label>
            <input
              type="text"
              name="metaTitle"
              value={formData.metaTitle || ""}
              onChange={handleInputChange}
              maxLength={70}
              className="mt-1 block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-card text-foreground"
              placeholder={formData.name || "عنوان المنتج للبحث..."}
            />
            <div className="mt-1 flex justify-between">
              <p className="text-xs text-muted-foreground">
                الأمثل بين 50-60 حرف
              </p>
              <p className={`text-xs ${
                (formData.metaTitle || "").length > 60
                  ? "text-red-500"
                  : "text-muted-foreground"
              }`}>
                {(formData.metaTitle || "").length}/70
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              وصف الصفحة (Meta Description)
            </label>
            <textarea
              name="metaDescription"
              value={formData.metaDescription || ""}
              onChange={handleInputChange}
              rows={3}
              maxLength={160}
              className="mt-1 block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-card text-foreground"
              placeholder="وصف مختصر يظهر في نتائج البحث (موصى به بين 120-160 حرف)"
            />
            <div className="mt-1 flex justify-between">
              <p className="text-xs text-muted-foreground">
                الأمثل بين 120-160 حرف
              </p>
              <p className={`text-xs ${
                (formData.metaDescription || "").length > 160
                  ? "text-red-500"
                  : "text-muted-foreground"
              }`}>
                {(formData.metaDescription || "").length}/160
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              الكانونيكال URL (Canonical URL)
            </label>
            <input
              type="text"
              name="canonicalUrl"
              value={formData.canonicalUrl || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-card text-foreground"
              placeholder="اتركه فارغاً لاستخدام الرابط الافتراضي"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              يستخدم في حالة وجود صفحات مكررة لنفس المنتج
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
