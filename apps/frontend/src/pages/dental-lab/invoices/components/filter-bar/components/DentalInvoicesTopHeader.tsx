import React from "react";
import { useTranslation } from "react-i18next";
import {
  CalendarClock,
  CreditCard,
  Download,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export interface DentalInvoicesTopHeaderProps {
  onCreateInvoice: () => void;
  onExportExcel: () => void;
  onBatchInvoice: () => void;
  onOpenSettlement: (doctorId?: string) => void;
  onRefresh: () => void;
  selectedDoctorId: string;
  uninvoicedCasesCount?: number;
}

export const DentalInvoicesTopHeader: React.FC<DentalInvoicesTopHeaderProps> = ({
  onCreateInvoice,
  onExportExcel,
  onBatchInvoice,
  onOpenSettlement,
  onRefresh,
  selectedDoctorId,
  uninvoicedCasesCount = 0,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-primary" />
          <span>{t("dentalLab.invoices.title")}</span>
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          إدارة ومتابعة فواتير الأطباء ودورات التحصيل والفوترة الشهرية
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onCreateInvoice}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-primary shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t("dentalLab.invoices.newInvoice")}</span>
        </button>

        <button
          type="button"
          onClick={onExportExcel}
          className="flex items-center gap-1.5 px-3 py-2 border border-success dark:border-success text-success dark:text-success bg-success/50 dark:bg-success/20 rounded-lg text-xs sm:text-sm font-medium hover:bg-success dark:hover:bg-success/40 transition-colors shadow-sm"
          title="تصدير الفواتير المعروضة إلى Excel"
        >
          <Download className="w-4 h-4" />
          <span>تصدير Excel</span>
        </button>

        {uninvoicedCasesCount > 0 && (
          <button
            type="button"
            onClick={onBatchInvoice}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-warning to-warning text-white rounded-lg text-xs sm:text-sm font-semibold hover:from-warning hover:to-warning shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>فوترة مجمعة ({uninvoicedCasesCount} حالة)</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onOpenSettlement(selectedDoctorId || undefined)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-primary shadow-sm transition-all"
        >
          <CalendarClock className="w-4 h-4" />
          <span>تقفيل المستحقات الشهرية</span>
        </button>

        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-2 border dark:border-border rounded-lg text-xs sm:text-sm font-medium hover:bg-muted dark:hover:bg-muted transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
          <span>{t("dentalLab.common.refresh")}</span>
        </button>
      </div>
    </div>
  );
};
