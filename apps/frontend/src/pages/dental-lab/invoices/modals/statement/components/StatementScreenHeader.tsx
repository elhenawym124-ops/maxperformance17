import React from "react";
import {
  Banknote,
  Download,
  FileSpreadsheet,
  Loader2,
  MessageCircle,
  Printer,
  X as XMarkIcon,
} from "lucide-react";
import type { DentalLabDoctor } from "../../../../shared";

interface StatementScreenHeaderProps {
  doctor: DentalLabDoctor;
  onShareWhatsApp: () => void;
  onExportExcel: () => void;
  onDownloadPdf: () => void;
  downloadingPdf: boolean;
  onPrint: () => void;
  onBulkPayment: () => void;
  onClose: () => void;
}

export const StatementScreenHeader: React.FC<StatementScreenHeaderProps> = ({
  doctor,
  onShareWhatsApp,
  onExportExcel,
  onDownloadPdf,
  downloadingPdf,
  onPrint,
  onBulkPayment,
  onClose,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between pb-3 border-b dark:border-border mb-4 gap-3 print:hidden">
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-primary/10 dark:bg-primary/40 text-primary rounded-xl">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            كشف حساب الطبيب: {doctor.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {doctor.clinicName ? `${doctor.clinicName} • ` : ""}
            {doctor.phone ? `هاتف: ${doctor.phone}` : ""}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onShareWhatsApp}
          className="px-3 py-1.5 bg-success/10 text-success border border-success dark:bg-success/30 dark:text-success dark:border-success rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-success"
          title="إرسال كشف الحساب عبر الواتساب"
        >
          <MessageCircle className="w-4 h-4 text-success" />
          <span>واتساب</span>
        </button>
        <button
          type="button"
          onClick={onExportExcel}
          className="px-3 py-1.5 bg-success/10 text-success border border-success dark:bg-success/30 dark:text-success dark:border-success rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-success"
          title="تصدير كشف الحساب كملف Excel (.xlsx)"
        >
          <FileSpreadsheet className="w-4 h-4 text-success" />
          <span>Excel</span>
        </button>
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={downloadingPdf}
          className="px-3 py-1.5 bg-primary/10 text-primary border border-primary dark:bg-primary/30 dark:text-primary dark:border-primary rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-primary disabled:opacity-50"
          title="تنزيل كشف الحساب كملف PDF رسمي عالي الدقة"
        >
          {downloadingPdf ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <Download className="w-4 h-4 text-primary" />
          )}
          <span>PDF رسمي</span>
        </button>
        <button
          type="button"
          onClick={onPrint}
          className="px-3 py-1.5 border dark:border-border rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-muted dark:hover:bg-muted"
          title="طباعة ورقية نظيفة"
        >
          <Printer className="w-4 h-4 text-foreground" />
          <span>طباعة</span>
        </button>
        <button
          type="button"
          onClick={onBulkPayment}
          className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-primary"
        >
          <Banknote className="w-4 h-4" />
          <span>تحصيل دفعة</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-muted dark:hover:bg-muted rounded-lg dark:text-muted-foreground"
          aria-label="إغلاق"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default StatementScreenHeader;
