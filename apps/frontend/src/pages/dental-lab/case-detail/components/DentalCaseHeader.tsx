import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  ArrowRight,
  ArrowRightCircle,
  BadgeCheck,
  Box,
  CheckCircle2,
  ExternalLink,
  FileDown,
  Loader2,
  Pencil,
  RefreshCw,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  CASE_STATUS_MAP,
  PRIORITY_CONFIG,
  type DentalLabCaseDetail,
} from "../../shared";
import { FALLBACK_BADGE } from "../types/dentalCaseDetailTypes";

interface DentalCaseHeaderProps {
  c: DentalLabCaseDetail;
  next?: string;
  isOverdue: boolean;
  daysOverdue: number;
  workOrderLoading: boolean;
  panLabelLoading: boolean;
  warrantyLoading: boolean;
  caseBusy: boolean;
  openWorkOrder: () => void;
  openPanLabel: () => void;
  openWarrantyCertificate: () => void;
  onRefresh: () => void;
  onOpenEdit: () => void;
  onOpenAdvance: () => void;
  onOpenTryInSend: () => void;
  onOpenTryInReturn: () => void;
  onOpenOutsource: () => void;
  onReturnFromOutsource: () => void;
  onTrash: () => void;
  onRestore: () => void;
  onPermanentDelete: () => void;
}

const renderBadge = (
  map: Record<string, { label: string; color: string }>,
  value?: string,
  fallback?: string
) => {
  if (!value) return null;
  const meta = map[value] ?? { ...FALLBACK_BADGE, label: fallback ?? value };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${meta.color}`}>
      {meta.label}
    </span>
  );
};

export default function DentalCaseHeader({
  c,
  next,
  isOverdue,
  daysOverdue,
  workOrderLoading,
  panLabelLoading,
  warrantyLoading,
  caseBusy,
  openWorkOrder,
  openPanLabel,
  openWarrantyCertificate,
  onRefresh,
  onOpenEdit,
  onOpenAdvance,
  onOpenTryInSend,
  onOpenTryInReturn,
  onOpenOutsource,
  onReturnFromOutsource,
  onTrash,
  onRestore,
  onPermanentDelete,
}: DentalCaseHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b dark:border-border">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/dental-lab/cases"
          className="text-blue-600 dark:text-primary text-sm flex items-center gap-1 font-medium hover:underline"
        >
          <ArrowRight className="w-4 h-4" />
          {t("dentalLab.common.back")}
        </Link>
        <h1 className="text-xl font-bold font-mono tabular-nums" dir="ltr">
          {c.caseNumber || c.id.slice(0, 8)}
        </h1>

        {c.isDeleted ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-foreground dark:bg-muted dark:text-muted-foreground">
            <Trash2 className="w-3.5 h-3.5" />
            سلة المهملات
          </span>
        ) : (
          <Link
            to={`/dental-lab/cases?status=${c.status}`}
            className="hover:opacity-85 hover:scale-105 transition-all inline-block cursor-pointer"
            title={`عرض كل حالات مرحلة "${CASE_STATUS_MAP[c.status]?.label || c.status}"`}
          >
            {renderBadge(CASE_STATUS_MAP, c.status)}
          </Link>
        )}

        {renderBadge(PRIORITY_CONFIG, c.priority)}

        {c.isTryIn && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-warning text-warning border border-warning dark:bg-warning/50 dark:text-warning">
            في بروفة ({c.tryInStage})
          </span>
        )}

        {isOverdue && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-destructive text-destructive dark:bg-destructive/50 dark:text-destructive border border-destructive dark:border-destructive animate-pulse tabular-nums">
            <AlertTriangle className="w-3.5 h-3.5" />
            متأخر {daysOverdue} يوم
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={openWorkOrder}
          disabled={workOrderLoading}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 border dark:border-border rounded-lg text-sm hover:bg-muted/50 disabled:opacity-50"
        >
          {workOrderLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          {t("dentalLab.detail.workOrder")}
        </button>

        <button
          onClick={openPanLabel}
          disabled={panLabelLoading}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 border dark:border-border rounded-lg text-sm hover:bg-muted/50 disabled:opacity-50"
          title="طباعة ملصق الباركود لعلبة الشغل (حراري 80x50 مم)"
        >
          {panLabelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Box className="w-4 h-4 text-primary dark:text-primary" />}
          ملصق العلبة
        </button>

        <button
          onClick={openWarrantyCertificate}
          disabled={warrantyLoading}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-success dark:border-success bg-success/50 dark:bg-success/20 text-success dark:text-success rounded-lg text-sm hover:bg-success dark:hover:bg-success/40 disabled:opacity-50"
          title="طباعة شهادة ضمان المريض مع تفاصيل الخامة والـ Lot Number"
        >
          {warrantyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4 text-success dark:text-success" />}
          شهادة الضمان
        </button>

        {!c.isTryIn && c.status !== "DELIVERED" && c.status !== "CLOSED" && !c.isDeleted && (
          <button
            onClick={onOpenTryInSend}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-warning dark:border-warning bg-warning/50 dark:bg-warning/20 text-warning dark:text-warning rounded-lg text-sm hover:bg-warning dark:hover:bg-warning/40"
            title="إرسال الحالة للعيادة لإجراء بروفة"
          >
            <RotateCcw className="w-4 h-4 text-warning dark:text-warning" />
            خروج بروفة
          </button>
        )}

        {c.isTryIn && (
          <button
            onClick={onOpenTryInReturn}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-warning hover:bg-warning text-white rounded-lg text-sm font-semibold shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            استلام من بروفة
          </button>
        )}

        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 border dark:border-border rounded-lg text-sm hover:bg-muted/50"
        >
          <RefreshCw className="w-4 h-4" />
          {t("dentalLab.common.refresh")}
        </button>

        {!c.isDeleted && (
          <button
            onClick={onOpenEdit}
            className="flex items-center gap-2 px-3.5 py-2 border border-primary dark:border-primary bg-primary/80 dark:bg-primary/40 text-primary dark:text-primary rounded-lg text-sm font-semibold hover:bg-primary dark:hover:bg-primary/60 shadow-sm transition-colors"
          >
            <Pencil className="w-4 h-4" />
            تعديل الحالة بالكامل
          </button>
        )}

        {c.status === "MANUFACTURING" && !c.isTryIn && !c.isDeleted && (
          <button
            type="button"
            onClick={onOpenOutsource}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 border border-warning dark:border-warning bg-warning/80 dark:bg-warning/30 text-warning dark:text-warning rounded-lg text-sm font-semibold hover:bg-warning dark:hover:bg-warning/50 shadow-sm transition"
            title="إرسال الحالة لجهة خارجية (ميلنج، صب، ليزر...)"
          >
            <ExternalLink className="w-4 h-4 text-warning dark:text-warning" />
            بره المعمل
          </button>
        )}

        {c.status === "OUTSOURCED" && !c.isDeleted && (
          <button
            type="button"
            onClick={onReturnFromOutsource}
            disabled={caseBusy}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-success hover:bg-success text-white rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-50"
            title="استلام الشغل من الجهة الخارجية ونقله لفحص الجودة"
          >
            <CheckCircle2 className="w-4 h-4" />
            استلام من بره المعمل
          </button>
        )}

        {next && !c.isTryIn && !c.isDeleted && (
          <button
            onClick={onOpenAdvance}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary"
          >
            <ArrowRightCircle className="w-4 h-4" />
            {t("dentalLab.cases.advance")}
          </button>
        )}

        {!c.isDeleted ? (
          <button
            onClick={onTrash}
            disabled={caseBusy}
            className="flex items-center gap-1.5 px-3 py-2 border border-destructive dark:border-destructive/60 text-destructive dark:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/30 rounded-lg text-sm disabled:opacity-50"
            title="نقل الحالة إلى سلة المهملات"
          >
            <Trash2 className="w-4 h-4" />
            نقل للسلة
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={onRestore}
              disabled={caseBusy}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              استعادة
            </button>
            <button
              onClick={onPermanentDelete}
              disabled={caseBusy}
              className="flex items-center gap-1.5 px-3 py-2 bg-destructive hover:bg-destructive text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              حذف نهائي
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
