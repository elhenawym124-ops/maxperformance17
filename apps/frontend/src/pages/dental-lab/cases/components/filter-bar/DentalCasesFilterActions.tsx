import React from "react";
import { useTranslation } from "react-i18next";
import {
  List,
  Columns3,
  ScanLine,
  RefreshCw,
  FileSpreadsheet,
  Stethoscope,
} from "lucide-react";

export interface DentalCasesFilterActionsProps {
  layoutMode: "TABLE" | "KANBAN";
  onLayoutModeChange: (mode: "TABLE" | "KANBAN") => void;
  onOpenKiosk: () => void;
  onRefresh: () => void;
  onExportExcel: () => void;
  onOpenQuickOrder: () => void;
}

export const DentalCasesFilterActions: React.FC<DentalCasesFilterActionsProps> = ({
  layoutMode,
  onLayoutModeChange,
  onOpenKiosk,
  onRefresh,
  onExportExcel,
  onOpenQuickOrder,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Table / Kanban Toggle */}
      <div className="flex items-center bg-muted dark:bg-muted p-0.5 rounded-xl text-xs">
        <button
          type="button"
          onClick={() => onLayoutModeChange("TABLE")}
          className={`p-1.5 rounded-lg transition-all ${
            layoutMode === "TABLE"
              ? "bg-card text-primary dark:text-primary shadow-2xs font-bold"
              : "text-slate-500 hover:text-foreground dark:text-muted-foreground"
          }`}
          title="عرض جدول الحالات"
          aria-label="عرض جدول الحالات"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onLayoutModeChange("KANBAN")}
          className={`p-1.5 rounded-lg transition-all ${
            layoutMode === "KANBAN"
              ? "bg-card text-primary dark:text-primary shadow-2xs font-bold"
              : "text-slate-500 hover:text-foreground dark:text-muted-foreground"
          }`}
          title="عرض لوحة مراحل التشغيل (كانبان)"
          aria-label="عرض لوحة مراحل التشغيل"
        >
          <Columns3 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Kiosk Button */}
      <button
        type="button"
        onClick={onOpenKiosk}
        className="flex items-center gap-1 px-2.5 py-1.5 border border-border dark:border-border bg-card hover:bg-muted dark:hover:bg-muted text-foreground dark:text-muted-foreground rounded-xl text-xs font-semibold transition-colors"
        title="فتح محطة المسح السريع بالباركود"
      >
        <ScanLine className="w-3.5 h-3.5 text-primary" />
        <span className="hidden md:inline">الكشك</span>
      </button>

      {/* Refresh */}
      <button
        type="button"
        onClick={onRefresh}
        className="p-1.5 border border-border dark:border-border bg-card hover:bg-muted dark:hover:bg-muted text-foreground dark:text-muted-foreground rounded-xl transition-colors"
        title={String(t("dentalLab.common.refresh"))}
        aria-label="تحديث"
      >
        <RefreshCw className="w-3.5 h-3.5" />
      </button>

      {/* Export Excel */}
      <button
        type="button"
        onClick={onExportExcel}
        className="p-1.5 border border-border dark:border-border bg-card hover:bg-muted dark:hover:bg-muted text-success rounded-xl transition-colors"
        title="تصدير الحالات المعروضة إلى Excel"
        aria-label="تصدير Excel"
      >
        <FileSpreadsheet className="w-3.5 h-3.5" />
      </button>

      {/* New Quick Order Primary CTA */}
      <button
        type="button"
        onClick={onOpenQuickOrder}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
      >
        <Stethoscope className="w-3.5 h-3.5" />
        <span>طلب سريع</span>
      </button>
    </div>
  );
};

export default DentalCasesFilterActions;
