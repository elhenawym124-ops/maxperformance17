import {
  AlertTriangle,
  Box,
  CheckCircle2,
  ExternalLink,
  Eye,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  fmtDate,
  fmtMoney,
  type DentalCaseAttachment,
  type DentalCaseHistoryEntry,
  type DentalLabCaseDetail,
} from "../../shared";

interface DentalCaseAlertBannersProps {
  c: DentalLabCaseDetail;
  attachments: DentalCaseAttachment[];
  history: DentalCaseHistoryEntry[];
  isOverdue: boolean;
  daysOverdue: number;
  snoozing: boolean;
  caseBusy: boolean;
  handleSnoozeOverdue: (days: number) => void;
  handleReturnFromOutsource: () => void;
  handleRestore: () => void;
  handlePermanentDelete: () => void;
  onOpenTryInReturn: () => void;
  onSelectModel: (model: { name: string; url: string }) => void;
}

export default function DentalCaseAlertBanners({
  c,
  attachments,
  history,
  isOverdue,
  daysOverdue,
  snoozing,
  caseBusy,
  handleSnoozeOverdue,
  handleReturnFromOutsource,
  handleRestore,
  handlePermanentDelete,
  onOpenTryInReturn,
  onSelectModel,
}: DentalCaseAlertBannersProps) {
  const designAtt = attachments.find((a) => a.kind === "DESIGN_REVIEW");
  const designHist = history.find((h) => h.dimension === "DESIGN_REVIEW");
  const isApproved = designHist?.status === "APPROVED";
  const isChanges = designHist?.status === "CHANGES_REQUESTED";

  return (
    <>
      {isOverdue && (
        <div className="mb-6 p-4 rounded-xl border border-destructive dark:border-destructive bg-destructive/10 dark:bg-destructive/40 flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive text-white flex items-center justify-center shrink-0 shadow-sm">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-destructive dark:text-destructive">
                تنبيه تأخير: هذه الحالة متأخرة بمقدار {daysOverdue} يوم عن موعد التسليم المحدد!
              </h4>
              <p className="text-xs text-destructive dark:text-destructive mt-0.5">
                تاريخ الاستحقاق كان في: <b className="font-mono tabular-nums">{fmtDate(c.dueDate)}</b> —
                يرجى الإسراع في إنهاء المراحل المتبقية وتجهيز الشغل للتسليم.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-destructive dark:text-destructive hidden sm:inline">
              تأجيل التنبيه (Snooze):
            </span>
            <button
              type="button"
              onClick={() => handleSnoozeOverdue(1)}
              disabled={snoozing}
              className="px-2.5 py-1.5 rounded-lg bg-card border border-destructive dark:border-destructive text-destructive dark:text-destructive text-xs font-bold hover:bg-destructive dark:hover:bg-destructive/50 shadow-sm disabled:opacity-50 transition-colors"
              title="تأجيل تنبيه التأخير وتمديد الموعد ليوم إضافي"
            >
              تأجيل +1 يوم
            </button>
            <button
              type="button"
              onClick={() => handleSnoozeOverdue(3)}
              disabled={snoozing}
              className="px-2.5 py-1.5 rounded-lg bg-card border border-destructive dark:border-destructive text-destructive dark:text-destructive text-xs font-bold hover:bg-destructive dark:hover:bg-destructive/50 shadow-sm disabled:opacity-50 transition-colors"
              title="تأجيل تنبيه التأخير وتمديد الموعد لـ 3 أيام"
            >
              تأجيل +3 أيام
            </button>
            <button
              type="button"
              onClick={() => handleSnoozeOverdue(7)}
              disabled={snoozing}
              className="px-2.5 py-1.5 rounded-lg bg-card border border-destructive dark:border-destructive text-destructive dark:text-destructive text-xs font-bold hover:bg-destructive dark:hover:bg-destructive/50 shadow-sm disabled:opacity-50 transition-colors"
              title="تأجيل تنبيه التأخير وتمديد الموعد لأسبوع كامل"
            >
              تأجيل +أسبوع
            </button>
          </div>
        </div>
      )}

      {c.status === "OUTSOURCED" && (
        <div className="mb-6 p-4 rounded-xl border border-warning dark:border-warning bg-warning/10 dark:bg-warning/40 flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning text-white flex items-center justify-center shrink-0 shadow-sm">
              <ExternalLink className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-warning dark:text-warning">
                  الشغل حالياً لدى جهة خارجية: {c.externalLabName || "معمل خارجي"}
                </h4>
                {c.expectedReturnAt && new Date(c.expectedReturnAt) < new Date() && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-destructive text-white animate-pulse">
                    متأخر عن موعد العودة المتوقع
                  </span>
                )}
              </div>
              <p className="text-xs text-warning dark:text-warning mt-0.5 font-mono tabular-nums">
                {c.expectedReturnAt ? `موعد الاستلام المتوقع: ${fmtDate(c.expectedReturnAt)}` : "جاري التشغيل الخارجي"}
                {c.outsourceCost != null ? ` | التكلفة: ${fmtMoney(c.outsourceCost)}` : ""}
                {c.outsourceNotes ? ` | ${c.outsourceNotes}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReturnFromOutsource}
            disabled={caseBusy}
            className="px-4 py-2 bg-success hover:bg-success text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            استلام الشغل وفحص الجودة
          </button>
        </div>
      )}

      {c.isDeleted && (
        <div className="mb-6 p-4 rounded-xl border border-border dark:border-border bg-muted dark:bg-muted flex items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted text-white flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground dark:text-muted-foreground">
                هذه الحالة موجودة حالياً في سلة المهملات
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                تم نقل الحالة إلى سلة المهملات ولا تظهر في القوائم النشطة أو الإحصائيات. يمكنك
                استعادتها أو حذفها نهائياً.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestore}
              disabled={caseBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              استعادة الحالة
            </button>
            <button
              onClick={handlePermanentDelete}
              disabled={caseBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive hover:bg-destructive text-white text-xs font-semibold rounded-lg disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              حذف نهائي
            </button>
          </div>
        </div>
      )}

      {c.isTryIn && (
        <div className="mb-6 p-4 rounded-xl bg-warning/10 dark:bg-warning/40 border border-warning dark:border-warning flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-warning text-white font-bold text-sm">بروفة</span>
            <div>
              <h4 className="font-bold text-warning dark:text-warning">
                الحالة حالياً في مرحلة بروفة (Try-in) لدى العيادة — {c.tryInStage || "بروفة عامة"}
              </h4>
              <p className="text-xs text-warning dark:text-warning mt-0.5">
                عدد مرات خروج البروفة لهذه الحالة:{" "}
                <span className="font-mono tabular-nums font-bold">{c.tryInCount || 1}</span> مرات.
                الفاتورة والبيانات المالية محفوظة دون تكرار.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenTryInReturn}
            className="flex items-center gap-2 px-4 py-2 bg-warning hover:bg-warning text-white rounded-lg text-sm font-semibold shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            استلام الحالة من البروفة
          </button>
        </div>
      )}

      {designAtt && (
        <div
          className={`mb-6 p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
            isApproved
              ? "bg-emerald-50 dark:bg-success/30 border-success dark:border-success text-success dark:text-success"
              : isChanges
              ? "bg-amber-50 dark:bg-warning/30 border-warning dark:border-warning text-warning dark:text-warning"
              : "bg-indigo-50 dark:bg-primary/30 border-primary dark:border-primary text-primary dark:text-primary"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl text-white font-bold ${
                isApproved ? "bg-emerald-600" : isChanges ? "bg-amber-600" : "bg-indigo-600"
              }`}
            >
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">
                {isApproved
                  ? `تم اعتماد تصميم الـ 3D من الطبيب المعالج (${designHist?.userName || "الطبيب"})`
                  : isChanges
                  ? "الطبيب طلب تعديل على تصميم الـ 3D"
                  : "تصميم الـ 3D مرفوع وبانتظار اعتماد الطبيب المعالج عبر البوابة"}
              </h4>
              <p className="text-xs opacity-90 mt-0.5 font-mono">
                {designHist?.reason
                  ? `ملاحظات الطبيب: "${designHist.reason}"`
                  : `الملف المرفق: ${designAtt.fileName}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onSelectModel({
                  name: designAtt.fileName,
                  url: `/api/v1/dental-lab/files/${designAtt.storedPath}`,
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 bg-card border rounded-lg text-xs font-semibold shadow-sm hover:bg-muted/50"
            >
              <Eye className="w-3.5 h-3.5 text-primary" />
              معاينة التصميم ثلاثي الأبعاد
            </button>
          </div>
        </div>
      )}
    </>
  );
}
