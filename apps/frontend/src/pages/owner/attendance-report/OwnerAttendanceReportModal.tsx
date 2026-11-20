import React from "react";
import {
  CalendarDaysIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { OwnerReportOptions } from "./types";

interface OwnerAttendanceReportModalProps {
  open: boolean;
  onClose: () => void;
  reportOptions: OwnerReportOptions;
  onOptionsChange: (options: OwnerReportOptions) => void;
  startDate: string;
  endDate: string;
  filteredCount: number;
  isGeneratingReport: boolean;
  onGenerateReport: () => void;
}

export const OwnerAttendanceReportModal: React.FC<
  OwnerAttendanceReportModalProps
> = ({
  open,
  onClose,
  reportOptions,
  onOptionsChange,
  startDate,
  endDate,
  filteredCount,
  isGeneratingReport,
  onGenerateReport,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gradient-to-r from-primary to-primary p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <DocumentChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  إنشاء تقرير مفصل
                </h2>
                <p className="text-indigo-100 text-sm mt-1">
                  اختر إعدادات التقرير المطلوب
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-foreground mb-3">
              صيغة التقرير
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  onOptionsChange({ ...reportOptions, format: "pdf" })
                }
                className={`p-4 rounded-xl border-2 transition-all ${
                  reportOptions.format === "pdf"
                    ? "border-indigo-600 bg-primary/10 dark:bg-primary/20"
                    : "border-gray-200 dark:border-border hover:border-primary"
                }`}
              >
                <DocumentTextIcon
                  className={`w-8 h-8 mx-auto mb-2 ${
                    reportOptions.format === "pdf"
                      ? "text-indigo-600"
                      : "text-gray-400"
                  }`}
                />
                <div className="font-bold text-foreground">
                  PDF / HTML
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  تقرير مفصل بالتصميم
                </div>
              </button>
              <button
                onClick={() =>
                  onOptionsChange({ ...reportOptions, format: "excel" })
                }
                className={`p-4 rounded-xl border-2 transition-all ${
                  reportOptions.format === "excel"
                    ? "border-indigo-600 bg-primary/10 dark:bg-primary/20"
                    : "border-gray-200 dark:border-border hover:border-primary"
                }`}
              >
                <DocumentChartBarIcon
                  className={`w-8 h-8 mx-auto mb-2 ${
                    reportOptions.format === "excel"
                      ? "text-indigo-600"
                      : "text-gray-400"
                  }`}
                />
                <div className="font-bold text-foreground">
                  Excel / CSV
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  جدول بيانات
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold text-foreground mb-3">
              خيارات التقرير
            </label>

            <label className="flex items-center gap-3 p-4 bg-muted dark:bg-muted rounded-xl cursor-pointer hover:bg-muted transition-colors">
              <input
                type="checkbox"
                checked={reportOptions.includeCharts}
                onChange={(e) =>
                  onOptionsChange({
                    ...reportOptions,
                    includeCharts: e.target.checked,
                  })
                }
                className="w-5 h-5 text-primary rounded focus:ring-primary"
              />
              <div className="flex-1">
                <div className="font-medium text-foreground">
                  تضمين الإحصائيات العامة
                </div>
                <div className="text-xs text-muted-foreground">
                  عرض ملخص الحضور في بداية التقرير
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 bg-muted dark:bg-muted rounded-xl cursor-pointer hover:bg-muted transition-colors">
              <input
                type="checkbox"
                checked={reportOptions.includeDetails}
                onChange={(e) =>
                  onOptionsChange({
                    ...reportOptions,
                    includeDetails: e.target.checked,
                  })
                }
                className="w-5 h-5 text-primary rounded focus:ring-primary"
              />
              <div className="flex-1">
                <div className="font-medium text-foreground">
                  تضمين التفاصيل الكاملة
                </div>
                <div className="text-xs text-muted-foreground">
                  عرض جميع أرقام الحضور لكل موظف
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 bg-muted dark:bg-muted rounded-xl cursor-pointer hover:bg-muted transition-colors">
              <input
                type="checkbox"
                checked={reportOptions.groupByCompany}
                onChange={(e) =>
                  onOptionsChange({
                    ...reportOptions,
                    groupByCompany: e.target.checked,
                  })
                }
                className="w-5 h-5 text-primary rounded focus:ring-primary"
              />
              <div className="flex-1">
                <div className="font-medium text-foreground">
                  تجميع حسب الشركة
                </div>
                <div className="text-xs text-muted-foreground">
                  تنظيم الموظفين حسب شركاتهم
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 bg-warning/10 dark:bg-warning/20 rounded-xl cursor-pointer hover:bg-warning dark:hover:bg-warning/30 transition-colors border border-warning dark:border-warning/30">
              <input
                type="checkbox"
                checked={reportOptions.showOnlyIssues}
                onChange={(e) =>
                  onOptionsChange({
                    ...reportOptions,
                    showOnlyIssues: e.target.checked,
                  })
                }
                className="w-5 h-5 text-warning rounded focus:ring-warning"
              />
              <div className="flex-1">
                <div className="font-medium text-foreground">
                  عرض المشاكل فقط
                </div>
                <div className="text-xs text-foreground dark:text-muted-foreground">
                  إظهار الموظفين ذوي الأداء الضعيف فقط (أقل من 80%)
                </div>
              </div>
            </label>
          </div>

          <div className="bg-muted/30 border border-border/70 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 border border-primary/20 text-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <CalendarDaysIcon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground mb-1">
                  نطاق التقرير
                </div>
                <div className="text-sm text-muted-foreground font-mono tabular-nums">
                  من <span className="font-bold">{startDate}</span> إلى{" "}
                  <span className="font-bold">{endDate}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  سيتم تضمين{" "}
                  <span className="font-bold font-mono tabular-nums">
                    {filteredCount}
                  </span>{" "}
                  موظف في التقرير
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-muted dark:bg-muted p-6 rounded-b-2xl border-t border-border dark:border-border">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-border text-foreground rounded-xl font-medium hover:bg-muted dark:hover:bg-muted transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={onGenerateReport}
              disabled={isGeneratingReport}
              className="flex-1 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGeneratingReport ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <DocumentChartBarIcon className="w-5 h-5" />
                  إنشاء التقرير
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
