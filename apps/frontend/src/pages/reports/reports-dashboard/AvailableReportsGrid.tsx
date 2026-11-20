import React from "react";
import { useTranslation } from "react-i18next";
import {
  Activity as ChartBarIcon,
  Circle as DocumentChartBarIcon,
  Eye as EyeIcon,
} from "lucide-react";
import { ReportData } from "./types";

interface AvailableReportsGridProps {
  reports: ReportData[];
  selectedReportId?: string;
  onSelectReport: (report: ReportData) => void;
}

export const AvailableReportsGrid: React.FC<AvailableReportsGridProps> = ({
  reports,
  selectedReportId,
  onSelectReport,
}) => {
  const { t } = useTranslation();

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case "sales":
        return (
          <ChartBarIcon className="h-5 w-5 text-success dark:text-success" />
        );
      case "customers":
        return (
          <DocumentChartBarIcon className="h-5 w-5 text-primary dark:text-primary" />
        );
      case "conversations":
        return (
          <ChartBarIcon className="h-5 w-5 text-primary dark:text-primary" />
        );
      case "products":
        return (
          <DocumentChartBarIcon className="h-5 w-5 text-warning dark:text-warning" />
        );
      case "performance":
        return (
          <ChartBarIcon className="h-5 w-5 text-primary" />
        );
      case "moderators":
        return <EyeIcon className="h-5 w-5 text-primary dark:text-primary" />;
      default:
        return (
          <DocumentChartBarIcon className="h-5 w-5 text-foreground dark:text-muted-foreground" />
        );
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case "sales":
        return "bg-green-100 dark:bg-success/30 text-success dark:text-success";
      case "customers":
        return "bg-blue-100 dark:bg-primary/30 text-primary dark:text-primary";
      case "conversations":
        return "bg-purple-100 dark:bg-primary/30 text-primary dark:text-primary";
      case "products":
        return "bg-orange-100 dark:bg-warning/30 text-warning dark:text-warning";
      case "performance":
        return "bg-indigo-100 dark:bg-primary/30 text-primary dark:text-primary";
      case "moderators":
        return "bg-pink-100 dark:bg-primary/30 text-primary dark:text-primary";
      default:
        return "bg-gray-100 dark:bg-muted text-foreground dark:text-muted-foreground";
    }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "daily":
        return t("reports.periods.daily", "يومي");
      case "weekly":
        return t("reports.periods.weekly", "أسبوعي");
      case "monthly":
        return t("reports.periods.monthly", "شهري");
      default:
        return t("reports.periods.custom", "مخصص");
    }
  };

  return (
    <div className="bg-white shadow rounded-lg dark:bg-muted border border-border dark:border-border overflow-hidden">
      <div className="border-b border-border px-4 py-5 dark:border-border">
        <h3 className="text-lg font-medium text-foreground">
          {t("reports.availableReports", "التقارير المتاحة")}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("reports.availableReportsHint", "اختر تقريراً لعرض تفاصيله وإحصائياته الكاملة")}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 2xl:grid-cols-3">
        {reports.map((report) => {
          const isSelected = selectedReportId === report.id;

          return (
            <button
              key={report.id}
              type="button"
              onClick={() => onSelectReport(report)}
              className={`rounded-xl border p-4 text-right transition-all active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                isSelected
                  ? "border-indigo-500 bg-primary/10 shadow-sm ring-2 ring-primary dark:border-primary dark:bg-primary/20 dark:ring-primary/40"
                  : "border-gray-200 bg-white hover:border-primary hover:bg-primary/60 dark:border-border dark:bg-muted dark:hover:border-primary/50 dark:hover:bg-muted"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0 rounded-xl bg-muted p-2 dark:bg-muted">
                  {getReportTypeIcon(report.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {report.name}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getReportTypeColor(report.type)}`}
                    >
                      {getPeriodLabel(report.period)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    {report.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
