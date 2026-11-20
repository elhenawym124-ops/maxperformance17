import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ExternalLink, Pencil, X as XMarkIcon } from "lucide-react";
import type { DentalLabCase } from "../../../../shared";

interface CaseCreateDrawerHeaderProps {
  initial?: DentalLabCase | null;
  saving: boolean;
  onClose: () => void;
}

export const CaseCreateDrawerHeader: React.FC<CaseCreateDrawerHeaderProps> = ({
  initial,
  saving,
  onClose,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="px-6 py-4 border-b dark:border-border flex items-center justify-between bg-muted dark:bg-muted">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              <Pencil className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-bold text-foreground">
              {initial
                ? `تعديل الأوردر ${initial.caseNumber || initial.id.slice(0, 8)}`
                : t("dentalLab.cases.createTitle")}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {initial
              ? "تعديل تفاصيل وأسنان ومواصفات الحالة السريعة عبر الدرج الجانبي"
              : "إدخال بيانات حالة جديدة في معمل الأسنان"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => !saving && onClose()}
          className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground transition-colors"
          aria-label="إغلاق"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {initial && (
        <div className="px-6 py-2.5 bg-blue-50/90 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/60 flex items-center justify-between gap-3 text-xs">
          <span className="text-blue-800 dark:text-blue-200">
            تريد إدارة فحص الجودة (QC)، الأشعة ثلاثية الأبعاد (STL)، أو الفواتير الموسعة؟
          </span>
          <Link
            to={`/dental-lab/cases/${initial.id}`}
            className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0"
            onClick={onClose}
          >
            <span>فتح صفحة الأوردر</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </>
  );
};

export default CaseCreateDrawerHeader;
