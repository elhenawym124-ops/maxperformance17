import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye, Plus, Save, Sparkles } from "lucide-react";
import { buildMessagingPreset, CADENCE_OPTIONS } from "../catalog";
import { WorkReportField, WorkReportTemplateDraft } from "../types";

export const BuilderBadge: React.FC<{ label: string; tone?: string }> = ({
  label,
  tone = "border-slate-200 bg-muted text-foreground dark:border-border dark:bg-muted dark:text-muted-foreground",
}) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${tone}`}
  >
    {label}
  </span>
);

interface WorkReportFormHeaderProps {
  isEditing: boolean;
  formId?: string;
  title: string;
  saving: boolean;
  onApplyPreset: (draft: WorkReportTemplateDraft) => void;
  onSave: () => void;
}

export const WorkReportFormHeader: React.FC<WorkReportFormHeaderProps> = ({
  isEditing,
  formId,
  title,
  saving,
  onApplyPreset,
  onSave,
}) => {
  return (
    <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-3">
        <Link
          to="/hr/reporting/forms"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-sm text-foreground transition hover:border-border hover:text-foreground dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:border-border dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          العودة لفورمات التقارير
        </Link>
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
            {isEditing ? "تعديل فورم" : "إنشاء فورم جديد"}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {isEditing ? title || "تعديل الفورم" : "بناء فورم التقرير"}
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-foreground dark:text-muted-foreground">
            حدّد بيانات تُسحب من النظام، وبيانات يكتبها الموظف، وأخرى تتحسب
            تلقائيًا. النتيجة النهائية ستظهر في شاشة التعبئة وسجلات التحليل.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onApplyPreset(buildMessagingPreset())}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground transition hover:border-border hover:text-foreground dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:border-border"
        >
          <Sparkles className="h-4 w-4" />
          تحميل قالب فريق الرد
        </button>
        {isEditing && formId ? (
          <Link
            to={`/hr/reporting/forms/${formId}/preview`}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground transition hover:border-border hover:text-foreground dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:border-border"
          >
            <Eye className="h-4 w-4" />
            معاينة
          </Link>
        ) : null}
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm font-medium text-white transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-foreground dark:hover:bg-muted"
        >
          <Save className="h-4 w-4" />
          {saving ? "جاري الحفظ..." : "حفظ الفورم"}
        </button>
      </div>
    </div>
  );
};

interface WorkReportMetadataCardProps {
  formState: WorkReportTemplateDraft;
  onChange: React.Dispatch<React.SetStateAction<WorkReportTemplateDraft>>;
  onAddField: (sourceType: WorkReportField["sourceType"]) => void;
}

export const WorkReportMetadataCard: React.FC<WorkReportMetadataCardProps> = ({
  formState,
  onChange,
  onAddField,
}) => {
  return (
    <>
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground dark:text-muted-foreground">
              اسم الفورم
            </label>
            <input
              value={formState.title}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm outline-none transition focus:border-border focus:bg-white dark:border-border dark:bg-muted dark:text-white dark:focus:border-border"
              placeholder="مثال: تقرير يومي - فريق خدمة العملاء"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground dark:text-muted-foreground">
              دورة التقرير
            </label>
            <select
              value={formState.cadence}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  cadence: event.target
                    .value as WorkReportTemplateDraft["cadence"],
                }))
              }
              className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm outline-none transition focus:border-border focus:bg-white dark:border-border dark:bg-muted dark:text-white dark:focus:border-border"
            >
              {CADENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground dark:text-muted-foreground">
            وصف مختصر
          </label>
          <textarea
            value={formState.description}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            rows={3}
            className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm outline-none transition focus:border-border focus:bg-white dark:border-border dark:bg-muted dark:text-white dark:focus:border-border"
            placeholder="اشرح الغرض من التقرير ومن الذي سيستخدمه."
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-6">
          <label className="inline-flex items-center gap-2 text-sm text-foreground dark:text-muted-foreground">
            <input
              type="checkbox"
              checked={formState.isActive}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-border"
            />
            الفورم مفعل
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-foreground dark:text-muted-foreground">
            <input
              type="checkbox"
              checked={formState.allowMultipleSubmissions}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  allowMultipleSubmissions: event.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-border"
            />
            السماح بأكثر من إرسال لنفس الفترة
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onAddField("MANUAL")}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground transition hover:border-border hover:text-foreground dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:border-border"
        >
          <Plus className="h-4 w-4" />
          إضافة حقل يدوي
        </button>
        <button
          type="button"
          onClick={() => onAddField("SYSTEM")}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground transition hover:border-border hover:text-foreground dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:border-border"
        >
          <Plus className="h-4 w-4" />
          إضافة حقل من النظام
        </button>
        <button
          type="button"
          onClick={() => onAddField("CALCULATED")}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground transition hover:border-border hover:text-foreground dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:border-border"
        >
          <Plus className="h-4 w-4" />
          إضافة حقل حسابي
        </button>
      </div>
    </>
  );
};
