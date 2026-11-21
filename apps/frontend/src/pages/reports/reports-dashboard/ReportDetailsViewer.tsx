import React from "react";
import { useTranslation } from "react-i18next";
import { Download as ArrowDownTrayIcon } from "lucide-react";
import { useDateFormat } from "../../../hooks/useDateFormat";
import { useCurrency } from "../../../hooks/useCurrency";
import { ReportData } from "./types";

interface ReportDetailsViewerProps {
  selectedReport: ReportData | null;
}

export const ReportDetailsViewer: React.FC<ReportDetailsViewerProps> = ({
  selectedReport,
}) => {
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();
  const { formatPrice } = useCurrency();

  if (!selectedReport) return null;

  const renderReportData = (report: ReportData) => {
    switch (report.type) {
      case "sales":
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border dark:divide-border">
              <thead className="bg-gray-50 dark:bg-muted">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    المبيعات
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    الطلبات
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    متوسط الطلب
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border dark:divide-border">
                {report.data.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-muted">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground tabular-nums">
                      {formatDate(row.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-success dark:text-success tabular-nums">
                      {formatPrice(row.sales)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground tabular-nums">
                      {row.orders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground tabular-nums">
                      {formatPrice(row.avgOrder)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "customers":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {report.data.map((item, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-muted rounded-lg p-4 border border-border dark:border-border"
              >
                <h4 className="font-medium text-foreground mb-2">
                  {item.week}
                </h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground dark:text-muted-foreground">
                      عملاء جدد:
                    </span>
                    <span className="font-medium text-foreground tabular-nums">
                      {item.newCustomers}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground dark:text-muted-foreground">
                      تحويلات:
                    </span>
                    <span className="font-medium text-foreground tabular-nums">
                      {item.conversions}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-foreground dark:text-muted-foreground">
                      معدل التحويل:
                    </span>
                    <span className="font-medium text-success dark:text-success tabular-nums">
                      {item.rate}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case "moderators":
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border dark:divide-border">
              <thead className="bg-gray-50 dark:bg-muted">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    الموظف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    الرسائل المرسلة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    المحادثات المكتملة
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border dark:divide-border">
                {report.data.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-muted">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {row.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-bold tabular-nums">
                      {row.messagesCount} رسالة
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground tabular-nums">
                      {row.conversationsCount} محادثة
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            {t("reports.noDataAvailable", "لا توجد بيانات متاحة لهذا التقرير")}
          </div>
        );
    }
  };

  return (
    <div className="bg-white shadow rounded-lg dark:bg-muted border border-border dark:border-border overflow-hidden">
      <div className="border-b border-border px-6 py-4 dark:border-border">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold">
              {t("reports.selectedReport", "التقرير المحدد")}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              {selectedReport.name}
            </h2>
            <p className="mt-1 text-sm text-foreground dark:text-muted-foreground">
              {t(
                "reports.selectedReportHint",
                "تفاصيل وسجلات التقرير للفترة الزمنية المحددة",
              )}
            </p>
            <p className="mt-2 text-sm text-muted-foreground tabular-nums">
              آخر تحديث: {formatDate(selectedReport.lastUpdated)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              disabled
              title={t("reports.exportSoonHint", "التصدير متاح قريباً")}
              className="inline-flex items-center rounded-md border border-border bg-muted px-3 py-2 text-sm font-medium leading-4 text-muted-foreground shadow-sm cursor-not-allowed dark:border-border dark:bg-muted dark:text-muted-foreground"
            >
              <ArrowDownTrayIcon className="me-2 h-4 w-4" />
              {t("reports.exportPdfSoon", "تصدير PDF")}
            </button>
            <button
              disabled
              title={t("reports.exportSoonHint", "التصدير متاح قريباً")}
              className="inline-flex items-center rounded-md border border-border bg-muted px-3 py-2 text-sm font-medium leading-4 text-muted-foreground shadow-sm cursor-not-allowed dark:border-border dark:bg-muted dark:text-muted-foreground"
            >
              <ArrowDownTrayIcon className="me-2 h-4 w-4" />
              {t("reports.exportExcelSoon", "تصدير Excel")}
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">{renderReportData(selectedReport)}</div>
    </div>
  );
};
