import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  Eye,
  FilePlus2,
  PenSquare,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { tToast } from "../../../utils/i18n-toast";
import { companyAwareApi } from "../../../services/companyAwareApi";
import { buildMessagingPreset } from "./catalog";
import { formatArabicDateTime } from "./utils";
import { WorkReportFormSummary } from "./types";

const cadenceLabels: Record<string, string> = {
  DAILY: "يومي",
  WEEKLY: "أسبوعي",
  MONTHLY: "شهري",
};

const statusClasses: Record<"active" | "draft", string> = {
  active:
    "border-emerald-200 bg-success/10 text-success dark:border-success/60 dark:bg-success/40 dark:text-success",
  draft:
    "border-amber-200 bg-warning/10 text-warning dark:border-warning/60 dark:bg-warning/40 dark:text-warning",
};

const WorkReportFormsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState<WorkReportFormSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await companyAwareApi.get<{ data: WorkReportFormSummary[] }>(
        "/hr/reporting/forms",
      );
      if (response.data?.data) {
        setForms(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching work report forms:", error);
      tToast.error("WorkReportFormsDashboard.unable_load_2c82");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const filteredForms = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return forms;

    return forms.filter((form) => {
      const haystack = `${form.title} ${form.description || ""}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [forms, searchTerm]);

  const stats = useMemo(() => {
    const totalForms = forms.length;
    const activeForms = forms.filter((form) => form.isActive).length;
    const totalSubmissions = forms.reduce(
      (sum, form) => sum + Number(form.submissionsCount || 0),
      0,
    );
    const totalFields = forms.reduce(
      (sum, form) => sum + Number(form.fieldsCount || form.fields.length || 0),
      0,
    );

    return [
      {
        label: "إجمالي الفورمات",
        value: totalForms,
        icon: ClipboardList,
        tone:
          "border-slate-200 bg-white text-foreground dark:border-border dark:bg-muted dark:text-muted-foreground",
      },
      {
        label: "الفورمات المفعلة",
        value: activeForms,
        icon: Sparkles,
        tone:
          "border-emerald-200 bg-success/10 text-success dark:border-success/60 dark:bg-success/30 dark:text-success",
      },
      {
        label: "إجمالي السجلات",
        value: totalSubmissions,
        icon: BarChart3,
        tone:
          "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200",
      },
      {
        label: "عدد الحقول",
        value: totalFields,
        icon: FilePlus2,
        tone:
          "border-primary/20 bg-primary/10 text-primary",
      },
    ];
  }, [forms]);

  const handleDelete = async (formId: string) => {
    if (!window.confirm("هل تريد حذف هذا الفورم نهائيًا؟")) return;

    try {
      await companyAwareApi.delete(`/hr/reporting/forms/${formId}`);
      tToast.success("WorkReportFormsDashboard.success_delete_06ce");
      fetchForms();
    } catch (error) {
      console.error("Error deleting form:", error);
      tToast.error("WorkReportFormsDashboard.unable_delete_2762");
    }
  };

  const seedPresetInSession = () => {
    sessionStorage.setItem(
      "work-report-form-preset",
      JSON.stringify(buildMessagingPreset()),
    );
    navigate("/hr/reporting/forms/new?preset=messaging");
  };

  return (
    <div
      className="space-y-6 w-full pb-8"
      dir="rtl"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 pb-4 border-b border-border/70 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => navigate("/hr")}
              className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-card px-2.5 py-1 text-xs text-muted-foreground transition hover:text-foreground mb-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              الرجوع إلى الموارد البشرية
            </button>
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                نظام فورمات تقارير الموظفين
              </h1>
              <p className="max-w-3xl text-xs sm:text-sm text-muted-foreground">
                أنشئ الفورم، عاينه، شاركه مع الموظفين، ثم راقب السجلات والتحليل من نفس المسار.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={seedPresetInSession}
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3.5 py-2 text-xs font-medium text-foreground transition hover:bg-muted/30"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              ابدأ بقالب فريق الرد
            </button>
            <Link
              to="/hr/reporting/forms/new"
              className="inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm font-medium text-white transition hover:bg-muted dark:bg-white dark:text-foreground dark:hover:bg-muted"
            >
              <FilePlus2 className="h-4 w-4" />
              إنشاء فورم جديد
            </Link>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`rounded-xl border p-5 shadow-sm ${stat.tone}`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium opacity-80">{stat.label}</span>
                  <Icon className="h-5 w-5 opacity-80" />
                </div>
                <div className="text-3xl font-semibold">{stat.value}</div>
              </div>
            );
          })}
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-xl border border-border bg-white p-4 shadow-sm dark:border-border dark:bg-muted lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-xl border border-border bg-muted py-3 pe-10 ps-4 text-sm outline-none transition focus:border-border focus:bg-white dark:border-border dark:bg-muted dark:text-white dark:focus:border-border"
              placeholder="ابحث بالاسم أو وصف الفورم"
            />
          </div>
          <div className="text-sm text-muted-foreground dark:text-muted-foreground">
            {filteredForms.length} فورم ظاهر من أصل {forms.length}
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-border bg-white p-10 text-center text-muted-foreground shadow-sm dark:border-border dark:bg-muted dark:text-muted-foreground">
            جاري تحميل الفورمات...
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white p-12 text-center shadow-sm dark:border-border dark:bg-muted">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground">
              <ClipboardList className="h-6 w-6" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">لا توجد فورمات بعد</h2>
            <p className="mx-auto mb-6 max-w-2xl text-sm leading-7 text-muted-foreground dark:text-muted-foreground">
              ابدأ بفورم يومي للموظفين أو استخدم قالب فريق الرد الجاهز ثم عدّله
              حسب شغلك.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={seedPresetInSession}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground transition hover:border-border hover:text-foreground dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:border-border"
              >
                <Sparkles className="h-4 w-4" />
                استخدم القالب الجاهز
              </button>
              <Link
                to="/hr/reporting/forms/new"
                className="inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm font-medium text-white transition hover:bg-muted dark:bg-white dark:text-foreground dark:hover:bg-muted"
              >
                <FilePlus2 className="h-4 w-4" />
                إنشاء من الصفر
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredForms.map((form) => (
              <article
                key={form.id}
                className="rounded-xl border border-border bg-white p-5 shadow-sm transition hover:border-border hover:shadow-md dark:border-border dark:bg-muted dark:hover:border-border"
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{form.title}</h2>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                          form.isActive ? statusClasses.active : statusClasses.draft
                        }`}
                      >
                        {form.isActive ? "مفعل" : "غير مفعل"}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground dark:border-border dark:bg-muted dark:text-muted-foreground">
                        {cadenceLabels[form.cadence] || form.cadence}
                      </span>
                    </div>
                    <p className="text-sm leading-7 text-foreground dark:text-muted-foreground">
                      {form.description || "بدون وصف حتى الآن."}
                    </p>
                  </div>
                </div>

                <div className="mb-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-muted p-3 dark:bg-muted">
                    <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                      الحقول
                    </div>
                    <div className="mt-1 text-lg font-semibold">
                      {form.fieldsCount || form.fields.length}
                    </div>
                  </div>
                  <div className="rounded-xl bg-muted p-3 dark:bg-muted">
                    <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                      السجلات
                    </div>
                    <div className="mt-1 text-lg font-semibold">
                      {form.submissionsCount || 0}
                    </div>
                  </div>
                  <div className="rounded-xl bg-muted p-3 dark:bg-muted">
                    <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                      آخر إرسال
                    </div>
                    <div className="mt-1 text-sm font-medium">
                      {form.lastSubmittedAt
                        ? formatArabicDateTime(form.lastSubmittedAt)
                        : "لا يوجد"}
                    </div>
                  </div>
                </div>

                <div className="mb-5 flex flex-wrap gap-2">
                  {form.fields.slice(0, 5).map((field) => (
                    <span
                      key={`${form.id}-${field.key}`}
                      className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-foreground dark:border-border dark:bg-muted dark:text-muted-foreground"
                    >
                      {field.label}
                    </span>
                  ))}
                  {form.fields.length > 5 ? (
                    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground dark:border-border dark:bg-muted dark:text-muted-foreground">
                      +{form.fields.length - 5}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/hr/reporting/forms/${form.id}/edit`}
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:border-border hover:text-foreground dark:border-border dark:text-muted-foreground dark:hover:border-border dark:hover:text-white"
                  >
                    <PenSquare className="h-4 w-4" />
                    تحرير
                  </Link>
                  <Link
                    to={`/hr/reporting/forms/${form.id}/preview`}
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:border-border hover:text-foreground dark:border-border dark:text-muted-foreground dark:hover:border-border dark:hover:text-white"
                  >
                    <Eye className="h-4 w-4" />
                    معاينة
                  </Link>
                  <Link
                    to={`/hr/reporting/forms/${form.id}/fill`}
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:border-border hover:text-foreground dark:border-border dark:text-muted-foreground dark:hover:border-border dark:hover:text-white"
                  >
                    <ClipboardList className="h-4 w-4" />
                    تعبئة
                  </Link>
                  <Link
                    to={`/hr/reporting/forms/${form.id}/records`}
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:border-border hover:text-foreground dark:border-border dark:text-muted-foreground dark:hover:border-border dark:hover:text-white"
                  >
                    <BarChart3 className="h-4 w-4" />
                    السجلات والتحليل
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(form.id)}
                    className="me-auto inline-flex items-center gap-2 rounded-xl border border-destructive px-3 py-2 text-sm font-medium text-destructive transition hover:border-destructive hover:bg-destructive/10 dark:border-destructive/60 dark:text-destructive dark:hover:bg-destructive/30"
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkReportFormsDashboard;
