import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, RotateCw, Download, Zap } from "lucide-react";
import { getDirection } from "../../../../i18n";
import { DateInput } from "../../../../components/ui/DateInput";

export const REPORT_PERIODS = ["today", "yesterday", "7", "30", "90", "custom"] as const;
export type ReportPeriod = typeof REPORT_PERIODS[number];

interface AutomationReportsHeaderProps {
  period: ReportPeriod;
  onPeriodChange: (p: ReportPeriod) => void;
  customFrom: string;
  onCustomFromChange: (val: string) => void;
  customTo: string;
  onCustomToChange: (val: string) => void;
  loading: boolean;
  onRefresh: () => void;
  onExportCsv: () => void;
  totalLogsCount: number;
}

export const AutomationReportsHeader: React.FC<AutomationReportsHeaderProps> = ({
  period,
  onPeriodChange,
  customFrom,
  onCustomFromChange,
  customTo,
  onCustomToChange,
  loading,
  onRefresh,
  onExportCsv,
  totalLogsCount,
}) => {
  const { t } = useTranslation();
  const isRTL = getDirection() === "rtl";
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="flex flex-col gap-4 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Link
          to="/orders/automation"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-card text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
          title={t("orders.backToAutomation", "الرجوع لإعدادات الأتمتة")}
        >
          <BackIcon className="h-4 w-4" />
        </Link>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-black text-foreground sm:text-2xl">
            {t("orders.automationReportsTitle", "تقارير أتمتة حالات الطلبات")}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t(
              "orders.automationReportsSubtitle",
              "رصد شامل لأداء القواعد الذكية، التحويلات التلقائية، وأثرها التشغيلي والمالي"
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Period Selector */}
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as ReportPeriod)}
          className="h-9 cursor-pointer rounded-lg border border-border/70 bg-card px-3 text-xs font-semibold text-foreground transition-all focus:border-border focus:ring-1 focus:ring-ring focus:outline-hidden"
          aria-label={t("orders.selectPeriod", "الفترة الزمنية")}
        >
          <option value="today">{t("common.today", "اليوم")}</option>
          <option value="yesterday">{t("common.yesterday", "أمس")}</option>
          <option value="7">{t("orders.last7Days", "آخر 7 أيام")}</option>
          <option value="30">{t("orders.last30Days", "آخر 30 يوم")}</option>
          <option value="90">{t("orders.last90Days", "آخر 90 يوم")}</option>
          <option value="custom">{t("orders.customPeriod", "فترة مخصصة")}</option>
        </select>

        {period === "custom" && (
          <div className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-card p-1">
            <DateInput
              value={customFrom}
              max={customTo || undefined}
              onChange={(e) => onCustomFromChange(e.target.value)}
              className="h-7 text-xs"
            />
            <span className="text-[11px] text-muted-foreground">-</span>
            <DateInput
              value={customTo}
              min={customFrom || undefined}
              onChange={(e) => onCustomToChange(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
        )}

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 bg-card px-3 text-xs font-semibold text-foreground transition-all hover:bg-muted active:scale-95 disabled:opacity-50"
          title={t("common.refresh", "تحديث البيانات")}
        >
          <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          <span className="hidden sm:inline">{t("common.refresh", "تحديث")}</span>
        </button>

        {/* Export CSV Button */}
        <button
          type="button"
          onClick={onExportCsv}
          disabled={loading || totalLogsCount === 0}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 bg-card px-3 text-xs font-semibold text-foreground transition-all hover:bg-muted active:scale-95 disabled:opacity-50"
          title={t("common.exportCsv", "تصدير البيانات CSV")}
        >
          <Download className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline">{t("common.export", "تصدير")}</span>
        </button>
      </div>
    </div>
  );
};
