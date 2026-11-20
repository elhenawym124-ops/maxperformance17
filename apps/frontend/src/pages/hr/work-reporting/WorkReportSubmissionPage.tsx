import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Lock,
  Save,
  Sigma,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { tToast } from "../../../utils/i18n-toast";
import { companyAwareApi } from "../../../services/companyAwareApi";
import { WorkReportFillContext, WorkReportField, WorkReportFieldValue } from "./types";
import {
  buildLiveValuesByKey,
  formatArabicDateTime,
  getTodayIsoDate,
  valueFromRawInput,
} from "./utils";
import { DateInput } from '../../../components/ui/DateInput';

const SectionBadge: React.FC<{
  label: string;
  tone?: string;
}> = ({
  label,
  tone = "border-slate-200 bg-muted text-foreground dark:border-border dark:bg-muted dark:text-muted-foreground",
}) => (
  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${tone}`}>
    {label}
  </span>
);

const WorkReportSubmissionPage: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const [reportDate, setReportDate] = useState(getTodayIsoDate());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [context, setContext] = useState<WorkReportFillContext | null>(null);
  const [manualValues, setManualValues] = useState<Record<string, unknown>>({});

  const fetchContext = async () => {
    if (!formId) return;

    try {
      setLoading(true);
      const response = await companyAwareApi.get<{ data: WorkReportFillContext }>(
        `/hr/reporting/forms/${formId}/fill-context`,
        { params: { date: reportDate } },
      );

      if (response.data?.data) {
        const nextContext = response.data.data;
        setContext(nextContext);

        const nextManualValues: Record<string, unknown> = {};
        nextContext.form.fields.forEach((field) => {
          if (field.sourceType !== "MANUAL") return;
          const existingValue = nextContext.values.byFieldId[field.id || ""];
          if (field.dataType === "SELECT") {
            nextManualValues[field.id || field.key] = Array.isArray(existingValue?.valueJson)
              ? existingValue.valueJson
              : [];
            return;
          }

          nextManualValues[field.id || field.key] =
            existingValue?.valueText ?? existingValue?.valueNumber ?? "";
        });

        setManualValues(nextManualValues);
      }
    } catch (error: any) {
      console.error("Error fetching submission context:", error);
      toast.error(error?.response?.data?.message || "تعذر تحميل الفورم");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContext();
  }, [formId, reportDate]);

  const liveValues = useMemo(() => {
    if (!context) return {};
    return buildLiveValuesByKey(context.form, context.values.byFieldKey, manualValues);
  }, [context, manualValues]);

  const visibleFields = useMemo(
    () => (context?.form.fields || []).filter((field) => field.isVisible),
    [context],
  );

  const highlightMetrics = useMemo(() => {
    if (!context) return [];
    return context.form.fields
      .filter(
        (field) =>
          field.isVisible &&
          (field.sourceType === "SYSTEM" || field.sourceType === "CALCULATED") &&
          (field.dataType === "NUMBER" || field.dataType === "PERCENT"),
      )
      .slice(0, 4);
  }, [context]);

  const updateManualValue = (field: WorkReportField, nextValue: unknown) => {
    setManualValues((current) => ({
      ...current,
      [field.id || field.key]: nextValue,
    }));
  };

  const buildSubmitPayload = () => {
    if (!context) return {};

    const values: Record<string, Record<string, unknown>> = {};

    context.form.fields.forEach((field) => {
      if (field.sourceType !== "MANUAL") return;

      const rawValue = manualValues[field.id || field.key];
      const normalized = valueFromRawInput(field, rawValue);

      if (field.dataType === "SELECT") {
        values[field.id || field.key] = {
          valueJson: normalized.valueJson,
          valueText: normalized.valueText,
        };
        return;
      }

      if (field.dataType === "NUMBER" || field.dataType === "PERCENT") {
        values[field.id || field.key] = {
          valueNumber: normalized.valueNumber,
          valueText: normalized.valueText,
        };
        return;
      }

      values[field.id || field.key] = {
        valueText: normalized.valueText,
      };
    });

    return values;
  };

  const handleSubmit = async () => {
    if (!formId || !context) return;

    try {
      setSaving(true);
      await companyAwareApi.post(`/hr/reporting/forms/${formId}/submit`, {
        reportDate,
        values: buildSubmitPayload(),
      });
      tToast.success("WorkReportSubmissionPage.success_save_2d7a");
      fetchContext();
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast.error(error?.response?.data?.message || "تعذر حفظ التقرير");
    } finally {
      setSaving(false);
    }
  };

  const renderFieldInput = (field: WorkReportField, value: WorkReportFieldValue | undefined) => {
    if (field.sourceType !== "MANUAL") {
      return (
        <div className="rounded-xl border border-border bg-white px-4 py-3 text-sm dark:border-border dark:bg-muted">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            {field.sourceType === "SYSTEM" ? (
              <>
                <Sparkles className="h-4 w-4" />
                قيمة من النظام
              </>
            ) : (
              <>
                <Sigma className="h-4 w-4" />
                ناتج المعادلة
              </>
            )}
          </div>
          <div className="text-sm font-medium text-foreground dark:text-white">
            {value?.displayValue || "—"}
          </div>
          <div className="mt-2 text-[11px] font-mono text-muted-foreground">
            {field.sourceType === "SYSTEM" ? field.systemKey : field.formula}
          </div>
        </div>
      );
    }

    if (field.dataType === "LONG_TEXT") {
      return (
        <textarea
          rows={5}
          value={String(manualValues[field.id || field.key] || "")}
          onChange={(event) => updateManualValue(field, event.target.value)}
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-border dark:border-border dark:bg-muted dark:text-white dark:focus:border-border"
          placeholder={field.placeholder || ""}
        />
      );
    }

    if (field.dataType === "SELECT") {
      const selectedValues = Array.isArray(manualValues[field.id || field.key])
        ? (manualValues[field.id || field.key] as string[])
        : [];

      return (
        <div className="flex flex-wrap gap-2">
          {field.options.map((option) => {
            const isSelected = selectedValues.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() =>
                  updateManualValue(
                    field,
                    isSelected
                      ? selectedValues.filter((item) => item !== option)
                      : [...selectedValues, option],
                  )
                }
                className={`rounded-xl border px-3 py-2 text-sm transition ${
                  isSelected
                    ? "border-slate-900 bg-muted text-white dark:border-white dark:bg-white dark:text-foreground"
                    : "border-slate-200 bg-white text-foreground hover:border-border dark:border-border dark:bg-muted dark:text-muted-foreground"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <input
        type={field.dataType === "NUMBER" || field.dataType === "PERCENT" ? "number" : "text"}
        step={field.dataType === "PERCENT" ? "0.01" : field.dataType === "NUMBER" ? "1" : undefined}
        value={String(manualValues[field.id || field.key] ?? "")}
        onChange={(event) => updateManualValue(field, event.target.value)}
        className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-border dark:border-border dark:bg-muted dark:text-white dark:focus:border-border"
        placeholder={field.placeholder || ""}
      />
    );
  };

  if (loading) {
    return (
      <div
        className="min-h-[350px] flex items-center justify-center text-center text-sm text-muted-foreground w-full"
        dir="rtl"
      >
        جاري تحميل شاشة التقرير...
      </div>
    );
  }

  if (!context) {
    return (
      <div
        className="min-h-[350px] flex items-center justify-center text-center text-sm text-muted-foreground w-full"
        dir="rtl"
      >
        لم يتم العثور على الفورم المطلوب.
      </div>
    );
  }

  return (
    <div
      className="space-y-6 w-full pb-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Link
              to="/hr/reporting/forms"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-sm text-foreground transition hover:border-border hover:text-foreground dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:border-border dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              العودة للفورمات
            </Link>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <SectionBadge label={context.period.cadence} />
                {context.form.isActive ? (
                  <SectionBadge
                    label="مفعل"
                    tone="border-emerald-200 bg-success/10 text-success dark:border-success/60 dark:bg-success/30 dark:text-success"
                  />
                ) : (
                  <SectionBadge
                    label="غير مفعل"
                    tone="border-amber-200 bg-warning/10 text-warning dark:border-warning/60 dark:bg-warning/30 dark:text-warning"
                  />
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {context.form.title}
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-foreground dark:text-muted-foreground">
                {context.form.description || "أكمل التقرير ثم احفظه ليظهر في السجلات والتحليل."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm dark:border-border dark:bg-muted">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-slate-500 dark:text-muted-foreground">تاريخ التقرير</span>
              <DateInput
                value={reportDate}
                onChange={(event) => setReportDate(event.target.value)}
                className="bg-transparent outline-none"
              />
            </label>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm font-medium text-white transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-foreground dark:hover:bg-muted"
            >
              <Save className="h-4 w-4" />
              {saving ? "جاري الحفظ..." : "حفظ التقرير"}
            </button>
          </div>
        </div>

        {context.existingSubmission ? (
          <div className="mb-6 rounded-xl border border-success bg-success/10 p-4 text-sm text-success dark:border-success/60 dark:bg-success/30 dark:text-success">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              يوجد إرسال محفوظ لهذه الفترة
            </div>
            <div className="mt-2 text-success dark:text-success">
              آخر تحديث: {formatArabicDateTime(context.existingSubmission.submittedAt)}
            </div>
          </div>
        ) : null}

        {highlightMetrics.length ? (
          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {highlightMetrics.map((field) => {
              const value = liveValues[field.key];
              return (
                <div
                  key={field.key}
                  className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted"
                >
                  <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground dark:text-muted-foreground">
                    <span>{field.label}</span>
                    {field.sourceType === "SYSTEM" ? (
                      <Sparkles className="h-4 w-4" />
                    ) : (
                      <Sigma className="h-4 w-4" />
                    )}
                  </div>
                  <div className="text-3xl font-semibold">
                    {value?.displayValue || "—"}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="space-y-4">
          {visibleFields.map((field) => {
            const value = liveValues[field.key];

            return (
              <section
                key={field.key}
                className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted"
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-medium">{field.label}</h2>
                      <SectionBadge
                        label={
                          field.sourceType === "SYSTEM"
                            ? "من النظام"
                            : field.sourceType === "CALCULATED"
                              ? "حسابي"
                              : "يدوي"
                        }
                      />
                      {field.isRequired ? (
                        <SectionBadge
                          label="مطلوب"
                          tone="border-rose-200 bg-destructive/10 text-destructive dark:border-destructive/60 dark:bg-destructive/30 dark:text-destructive"
                        />
                      ) : null}
                    </div>
                    {field.helpText ? (
                      <p className="text-sm leading-7 text-foreground dark:text-muted-foreground">
                        {field.helpText}
                      </p>
                    ) : null}
                  </div>

                  {field.sourceType !== "MANUAL" ? (
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground dark:border-border dark:bg-muted dark:text-muted-foreground">
                      <Lock className="h-3.5 w-3.5" />
                      للعرض فقط
                    </div>
                  ) : null}
                </div>

                {renderFieldInput(field, value)}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WorkReportSubmissionPage;
