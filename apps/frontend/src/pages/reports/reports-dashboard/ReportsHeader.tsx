import React from "react";
import { useTranslation } from "react-i18next";
import {
  Calendar as CalendarIcon,
  Circle as DocumentChartBarIcon,
  RefreshCw as ArrowPathIcon,
} from "lucide-react";
import { PresetRange } from "./types";
import { DateInput } from '../../../components/ui/DateInput';

interface ReportsHeaderProps {
  dateRange: {
    start: string;
    end: string;
  };
  loading: boolean;
  presets: PresetRange[];
  activePresetId: string | null;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onRefresh: () => void;
  onSelectPreset: (range: { start: string; end: string }) => void;
}

export const ReportsHeader: React.FC<ReportsHeaderProps> = ({
  dateRange,
  loading,
  presets,
  activePresetId,
  onStartDateChange,
  onEndDateChange,
  onRefresh,
  onSelectPreset,
}) => {
  const { t } = useTranslation();

  return (
    <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <DocumentChartBarIcon className="h-8 w-8 text-primary me-3" />
          التقارير والإحصائيات
        </h1>
        <p className="mt-2 text-foreground dark:text-muted-foreground">
          تحليل شامل لأداء المنصة والمبيعات
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <span>{t("reports.dateRange", "نطاق التاريخ")}</span>
          </div>
          <DateInput
            aria-label={t("reports.startDate", "تاريخ البدء")}
            value={dateRange.start}
            max={dateRange.end}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="p-2 border rounded-md dark:bg-muted dark:border-border dark:text-white tabular-nums text-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          />
          <span className="text-gray-500">{t("reports.to", "إلى")}</span>
          <DateInput
            aria-label={t("reports.endDate", "تاريخ الانتهاء")}
            value={dateRange.end}
            min={dateRange.start}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="p-2 border rounded-md dark:bg-muted dark:border-border dark:text-white tabular-nums text-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          />
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 border rounded-md text-muted-foreground hover:bg-muted dark:hover:bg-muted disabled:opacity-60 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            title={t("common.refresh", "تحديث")}
            type="button"
          >
            <ArrowPathIcon
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset.range)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                activePresetId === preset.id
                  ? "bg-indigo-600 text-white border-primary"
                  : "bg-card text-foreground border-border dark:border-border hover:bg-muted/50"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
