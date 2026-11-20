import React from "react";
import { useTranslation } from "react-i18next";
import { CalendarClock, Sparkles } from "lucide-react";
import type { UninvoicedSummaryResult } from "../../../../shared";
import { fmtMoney } from "../../../../shared";

export interface DentalInvoicesUninvoicedBannerProps {
  uninvoicedSummary: UninvoicedSummaryResult;
  onBatchInvoice: () => void;
}

export const DentalInvoicesUninvoicedBanner: React.FC<DentalInvoicesUninvoicedBannerProps> = ({
  uninvoicedSummary,
  onBatchInvoice,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-gradient-to-r from-primary to-primary dark:from-primary/40 dark:to-primary/40 border border-primary dark:border-primary rounded-xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary text-white rounded-xl shadow-sm">
          <CalendarClock className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-foreground text-sm sm:text-base">
              دورة الفوترة الشهرية وتصفية الحسابات
            </h4>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-warning text-warning dark:bg-warning/50 dark:text-warning font-mono tabular-nums">
              {uninvoicedSummary.totalCases} حالة معلقة
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            يوجد {uninvoicedSummary.totalCases} حالة مكتملة/مسلمة لـ {uninvoicedSummary.totalDoctors} طبيب بإجمالي{" "}
            <span className="font-bold text-primary dark:text-primary font-mono tabular-nums">
              {fmtMoney(uninvoicedSummary.totalAmount)} {t("dentalLab.common.egp")}
            </span>{" "}
            جاهزة لإصدار فواتيرها بنقرة واحدة.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onBatchInvoice}
        className="px-4 py-2 bg-primary text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-primary shadow-sm flex items-center gap-2 transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        <span>إصدار الفواتير المجمعة الآن</span>
      </button>
    </div>
  );
};
