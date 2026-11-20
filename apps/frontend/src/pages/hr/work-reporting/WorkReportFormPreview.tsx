import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Eye,
  ListChecks,
  Pencil,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { tToast } from "../../../utils/i18n-toast";
import { companyAwareApi } from "../../../services/companyAwareApi";
import { WorkReportFillContext, WorkReportForm } from "./types";
import {
  formatArabicDate,
  formatArabicDateTime,
  formatMetricValue,
  getTodayIsoDate,
} from "./utils";
import { DateInput } from '../../../components/ui/DateInput';

const PreviewBadge: React.FC<{ label: string; tone?: string }> = ({
  label,
  tone = "border-slate-200 bg-muted text-foreground dark:border-border dark:bg-muted dark:text-muted-foreground",
}) => (
  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${tone}`}>
    {label}
  </span>
);

const sourceLabelMap: Record<string, string> = {
  SYSTEM: "من النظام",
  MANUAL: "يدوي",
  CALCULATED: "حسابي",
};

const typeLabelMap: Record<string, string> = {
  TEXT: "نص",
  LONG_TEXT: "نص طويل",
  NUMBER: "رقم",
  PERCENT: "نسبة",
  SELECT: "قائمة",
};

const WorkReportFormPreview: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const [previewDate, setPreviewDate] = useState(getTodayIsoDate());
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<WorkReportForm | null>(null);
  const [context, setContext] = useState<WorkReportFillContext | null>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      if (!formId) return;

      try {
        setLoading(true);
        const [formResponse, contextResponse] = await Promise.all([
          companyAwareApi.get<{ data: WorkReportForm }>(`/hr/reporting/forms/${formId}`),
          companyAwareApi.get<{ data: WorkReportFillContext }>(
            `/hr/reporting/forms/${formId}/fill-context`,
            { params: { date: previewDate } },
          ),
        ]);

        if (formResponse.data?.data) setForm(formResponse.data.data);
        if (contextResponse.data?.data) setContext(contextResponse.data.data);
      } catch (error) {
        console.error("Error fetching report preview:", error);
        tToast.error("WorkReportFormPreview.unable_load_1744");
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [formId, previewDate]);

  const visibleFields = useMemo(
    () => (form?.fields || []).filter((field) => field.isVisible),
    [form],
  );
  const hiddenFields = useMemo(
    () => (form?.fields || []).filter((field) => !field.isVisible),
    [form],
  );

  if (loading) {
    return (
      <div
        className="min-h-[350px] flex items-center justify-center text-center text-sm text-muted-foreground w-full"
        dir="rtl"
      >
        جاري تجهيز المعاينة...
      </div>
    );
  }

  if (!form || !context) {
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
      <div className="mx-auto max-w-6xl 2xl:max-w-7xl space-y-6">
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
              <div className="flex flex-wrap items-center gap-2">
                <PreviewBadge
                  label={form.isActive ? "مفعل" : "غير مفعل"}
                  tone={
                    form.isActive
                      ? "border-emerald-200 bg-success/10 text-success dark:border-success/60 dark:bg-success/30 dark:text-success"
                      : "border-amber-200 bg-warning/10 text-warning dark:border-warning/60 dark:bg-warning/30 dark:text-warning"
                  }
                />
                <PreviewBadge label={context.period.cadence} />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">{form.title}</h1>
              <p className="max-w-3xl text-sm leading-7 text-foreground dark:text-muted-foreground">
                {form.description || "بدون وصف حتى الآن."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm dark:border-border dark:bg-muted">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-slate-500 dark:text-muted-foreground">تاريخ المعاينة</span>
              <DateInput
                value={previewDate}
                onChange={(event) => setPreviewDate(event.target.value)}
                className="bg-transparent outline-none"
              />
            </label>
            <Link
              to={`/hr/reporting/forms/${form.id}/edit`}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground transition hover:border-border hover:text-foreground dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:border-border"
            >
              <Pencil className="h-4 w-4" />
              تحرير
            </Link>
            <Link
              to={`/hr/reporting/forms/${form.id}/fill`}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground transition hover:border-border hover:text-foreground dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:border-border"
            >
              <Send className="h-4 w-4" />
              شاشة التعبئة
            </Link>
            <Link
              to={`/hr/reporting/forms/${form.id}/records`}
              className="inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm font-medium text-white transition hover:bg-muted dark:bg-white dark:text-foreground dark:hover:bg-muted"
            >
              <BarChart3 className="h-4 w-4" />
              السجلات والتحليل
            </Link>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
            <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground dark:text-muted-foreground">
              <span>الحقول الظاهرة</span>
              <Eye className="h-4 w-4" />
            </div>
            <div className="text-3xl font-semibold">{visibleFields.length}</div>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
            <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground dark:text-muted-foreground">
              <span>الحقول المخفية</span>
              <ListChecks className="h-4 w-4" />
            </div>
            <div className="text-3xl font-semibold">{hiddenFields.length}</div>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
            <div className="mb-2 text-sm text-muted-foreground dark:text-muted-foreground">
              فترة التقرير
            </div>
            <div className="text-lg font-semibold">{context.period.label}</div>
            <div className="mt-2 text-xs text-muted-foreground dark:text-muted-foreground">
              تاريخ التقرير: {formatArabicDate(context.period.reportDate)}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
            <div className="mb-2 text-sm text-muted-foreground dark:text-muted-foreground">
              آخر إرسال لنفس المستخدم
            </div>
            <div className="text-lg font-semibold">
              {context.existingSubmission
                ? formatArabicDateTime(context.existingSubmission.submittedAt)
                : "لا يوجد"}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
            <h2 className="mb-4 text-xl font-semibold">كيف سيظهر الفورم للموظف</h2>
            <div className="space-y-4">
              {visibleFields.map((field, index) => {
                const previewValue = context.values.byFieldKey[field.key];

                return (
                  <div
                    key={field.key}
                    className="rounded-xl border border-border bg-muted p-4 dark:border-border dark:bg-muted"
                  >
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-muted-foreground">{index + 1}</span>
                          <h3 className="font-medium">{field.label}</h3>
                          <PreviewBadge label={sourceLabelMap[field.sourceType] || field.sourceType} />
                          <PreviewBadge label={typeLabelMap[field.dataType] || field.dataType} />
                          {field.isRequired ? (
                            <PreviewBadge
                              label="مطلوب"
                              tone="border-rose-200 bg-destructive/10 text-destructive dark:border-destructive/60 dark:bg-destructive/30 dark:text-destructive"
                            />
                          ) : null}
                        </div>
                        {field.helpText ? (
                          <p className="text-sm leading-7 text-muted-foreground dark:text-muted-foreground">
                            {field.helpText}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-white px-4 py-3 text-sm dark:border-border dark:bg-muted">
                      {field.sourceType === "MANUAL" ? (
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground">حقل قابل للتعبئة</div>
                          <div className="text-slate-500 dark:text-muted-foreground">
                            {field.placeholder || "سيظهر هنا إدخال الموظف."}
                          </div>
                        </div>
                      ) : field.sourceType === "CALCULATED" ? (
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground">ناتج المعادلة</div>
                          <div className="font-medium">
                            {previewValue
                              ? formatMetricValue(previewValue.valueNumber ?? previewValue.displayValue, field.dataType)
                              : "—"}
                          </div>
                          <div className="text-xs font-mono text-muted-foreground">
                            {field.formula || "بدون معادلة"}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground">قيمة قادمة من النظام</div>
                          <div className="font-medium">
                            {previewValue
                              ? formatMetricValue(
                                  previewValue.valueNumber ?? previewValue.displayValue,
                                  field.dataType,
                                )
                              : "—"}
                          </div>
                          <div className="text-xs font-mono text-muted-foreground">
                            {field.systemKey || "SYSTEM"}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="space-y-4">
            {hiddenFields.length ? (
              <div className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
                <h2 className="mb-4 text-lg font-semibold">حقول مخفية لكنها فعالة</h2>
                <div className="space-y-3">
                  {hiddenFields.map((field) => (
                    <div
                      key={field.key}
                      className="rounded-xl bg-muted p-4 dark:bg-muted"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <strong className="text-sm">{field.label}</strong>
                        <PreviewBadge
                          label={sourceLabelMap[field.sourceType] || field.sourceType}
                        />
                      </div>
                      <p className="text-xs leading-6 text-muted-foreground dark:text-muted-foreground">
                        {field.helpText || "لن يظهر للموظف لكنه يُحفظ ويُستخدم في التحليل."}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
              <h2 className="mb-4 text-lg font-semibold">روابط التنفيذ</h2>
              <div className="space-y-2 text-sm">
                <Link
                  to={`/hr/reporting/forms/${form.id}/edit`}
                  className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 transition hover:bg-muted dark:bg-muted dark:hover:bg-muted"
                >
                  <span>تعديل الفورم</span>
                  <Pencil className="h-4 w-4" />
                </Link>
                <Link
                  to={`/hr/reporting/forms/${form.id}/fill`}
                  className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 transition hover:bg-muted dark:bg-muted dark:hover:bg-muted"
                >
                  <span>فتح شاشة التعبئة</span>
                  <Send className="h-4 w-4" />
                </Link>
                <Link
                  to={`/hr/reporting/forms/${form.id}/records`}
                  className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 transition hover:bg-muted dark:bg-muted dark:hover:bg-muted"
                >
                  <span>عرض السجلات والتحليل</span>
                  <BarChart3 className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default WorkReportFormPreview;
