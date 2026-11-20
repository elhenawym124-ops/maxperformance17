import React from "react";
import {
  GlobeAltIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface CompanySlugEditorProps {
  slug: string;
  setSlug: (slug: string) => void;
  editingSlug: boolean;
  setEditingSlug: (editing: boolean) => void;
  savingSlug: boolean;
  handleSlugSave: () => void;
  companySlug?: string;
  companyName: string;
}

export const CompanySlugEditor: React.FC<CompanySlugEditorProps> = ({
  slug,
  setSlug,
  editingSlug,
  setEditingSlug,
  savingSlug,
  handleSlugSave,
  companySlug,
  companyName,
}) => {
  return (
    <div className="col-span-1 md:col-span-2 border-t border-border dark:border-border pt-4 mt-2">
      {editingSlug ? (
        <label
          htmlFor="company-slug-input"
          className="block text-sm font-medium text-foreground mb-1"
        >
          رابط الشركة (Slug){" "}
          <span className="text-xs text-muted-foreground font-normal">
            - يستخدم في روابط المتجر ودعوات المسوقين
          </span>
        </label>
      ) : (
        <span className="block text-sm font-medium text-foreground mb-1">
          رابط الشركة (Slug){" "}
          <span className="text-xs text-muted-foreground font-normal">
            - يستخدم في روابط المتجر ودعوات المسوقين
          </span>
        </span>
      )}
      {editingSlug ? (
        <div className="mt-1 flex items-center space-x-2 space-x-reverse">
          <div className="flex-1 flex items-center">
            <span className="text-gray-500 bg-muted border border-l-0 border-border rounded-r-md px-3 py-2 text-sm">
              {window.location.host}/
            </span>
            <input
              id="company-slug-input"
              name="companySlug"
              type="text"
              autoComplete="off"
              value={slug}
              onChange={(e) =>
                setSlug(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                )
              }
              className="flex-1 px-3 py-2 border border-border rounded-l-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-card text-foreground dir-ltr"
              placeholder="company-name"
              disabled={savingSlug}
              style={{ direction: "ltr" }}
            />
          </div>
          <button
            onClick={() => {
              const smartSlug = companyName
                .toLowerCase()
                .replace(/['"]/g, "")
                .replace(/[^\w\s-]/g, "")
                .trim()
                .replace(/\s+/g, "-");
              setSlug(smartSlug);
            }}
            title="توليد تلقائي من اسم الشركة"
            className="p-2 bg-primary/10 text-primary rounded-md hover:bg-primary"
            type="button"
          >
            <SparklesIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleSlugSave}
            disabled={savingSlug || !slug.trim()}
            className="px-3 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary disabled:bg-muted"
          >
            {savingSlug ? "..." : "حفظ"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingSlug(false);
              setSlug(companySlug || "");
            }}
            disabled={savingSlug}
            className="px-3 py-2 bg-muted dark:bg-muted text-foreground text-sm font-medium rounded-md hover:bg-muted"
          >
            إلغاء
          </button>
        </div>
      ) : (
        <div className="mt-1 flex items-center justify-between bg-muted dark:bg-muted p-3 rounded-lg border border-border dark:border-border">
          <div
            className="flex items-center text-foreground font-mono text-sm"
            dir="ltr"
          >
            <GlobeAltIcon className="h-4 w-4 me-2" />
            {companySlug ? `${companySlug}` : "لم يتم التعيين!"}
          </div>
          <button
            type="button"
            onClick={() => {
              if (!companySlug && companyName) {
                const smartSlug = companyName
                  .toLowerCase()
                  .replace(/['"]/g, "")
                  .replace(/[^\w\s-]/g, "")
                  .trim()
                  .replace(/\s+/g, "-");
                setSlug(smartSlug);
              }
              setEditingSlug(true);
            }}
            className="text-primary hover:text-primary text-sm font-medium"
          >
            {companySlug ? "تغيير" : "إعداد ذكي"}
          </button>
        </div>
      )}
      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-warning dark:text-warning">
        <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
        <span>تغيير الرابط قد يؤدي لتعطل الروابط القديمة التي قمت بمشاركتها.</span>
      </div>
    </div>
  );
};
