import React, { useState, useMemo } from "react";
import {
  XMarkIcon,
  CheckCircleIcon,
  ArrowUturnLeftIcon,
  ShieldExclamationIcon,
  DocumentCheckIcon,
  PaperClipIcon,
  CpuChipIcon,
  ExclamationCircleIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

export interface ReturnOptions {
  returnReasonType?: string;
  returnSeverity?: number;
}

interface ApprovalGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: string;
    title: string;
    status: string;
    acceptanceCriteria?: string | null;
    hasEvidence?: boolean;
    missingEvidence?: boolean;
    evidence?: any;
    returnCount?: number;
    lastReturnReason?: string | null;
    attachments?: Array<{ id: string; fileName: string; originalName?: string; filePath?: string }>;
  };
  currentUserRole?: string;
  onApprove: (options: { ownerOverride?: boolean; ownerOverrideReason?: string; criteriaChecked?: boolean }) => Promise<void>;
  onReturn: (reason: string, options?: ReturnOptions) => Promise<void>;
  isSubmitting?: boolean;
}

export const ApprovalGateModal: React.FC<ApprovalGateModalProps> = ({
  isOpen,
  onClose,
  task,
  currentUserRole = "",
  onApprove,
  onReturn,
  isSubmitting = false,
}) => {
  const isOwner = ["OWNER", "SUPER_ADMIN"].includes(currentUserRole.toUpperCase());

  // Parse acceptance criteria lines into checklist
  const initialChecklist = useMemo(() => {
    const raw = String(task.acceptanceCriteria || "").trim();
    if (!raw) {
      return [{ id: 0, text: "التحقق من إنجاز متطلبات المهمة بالكامل وعملها بدون أخطاء", checked: false }];
    }
    return raw
      .split("\n")
      .map((line) => line.replace(/^[-*•\d\.\s]+/, "").trim())
      .filter(Boolean)
      .map((text, idx) => ({ id: idx, text, checked: false }));
  }, [task.acceptanceCriteria]);

  const [checklist, setChecklist] = useState(initialChecklist);
  const [returnMode, setReturnMode] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnReasonType, setReturnReasonType] = useState<string>("QUALITY");
  const [returnSeverity, setReturnSeverity] = useState<number>(1);
  const [useOwnerOverride, setUseOwnerOverride] = useState(false);
  const [ownerOverrideReason, setOwnerOverrideReason] = useState("");

  const allCriteriaChecked = checklist.length > 0 && checklist.every((item) => item.checked);
  const evidenceObj = typeof task.evidence === "string" ? (() => { try { return JSON.parse(task.evidence); } catch { return null; } })() : task.evidence;
  const hasValidEvidence = Boolean(task.hasEvidence || evidenceObj);

  // Approval is never blocked on missing evidence or unchecked criteria
  const canApprove = !isSubmitting;

  if (!isOpen) return null;

  const toggleCheck = (idx: number) => {
    setChecklist((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, checked: !c.checked } : c))
    );
  };

  const handleApproveSubmit = async () => {
    if (!canApprove || isSubmitting) return;
    await onApprove({
      criteriaChecked: allCriteriaChecked,
      ownerOverride: useOwnerOverride,
      ownerOverrideReason: useOwnerOverride ? ownerOverrideReason.trim() : undefined,
    });
  };

  const handleReturnSubmit = async () => {
    if (!returnReason.trim() || isSubmitting) return;
    await onReturn(returnReason.trim(), {
      returnReasonType,
      returnSeverity,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-xl bg-white dark:bg-muted border border-border dark:border-border shadow-2xl overflow-hidden text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border dark:border-border bg-muted dark:bg-muted">
          <div>
            <div className="flex items-center gap-2">
              <DocumentCheckIcon className="size-5 text-success" />
              <h2 className="text-base sm:text-lg font-bold text-foreground dark:text-muted-foreground">
                بوابة الاعتماد والتحقق (Approval Gate)
              </h2>
            </div>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-0.5 truncate max-w-lg">
              {task.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground hover:bg-muted dark:hover:bg-muted transition"
          >
            <XMarkIcon className="size-5" />
          </button>
        </div>

        {/* Content Body: Two columns */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs sm:text-sm">
          {/* Column 1: Acceptance Criteria Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border dark:border-border pb-2">
              <h3 className="font-bold text-foreground dark:text-muted-foreground flex items-center gap-1.5">
                <DocumentCheckIcon className="size-4 text-primary" />
                معايير القبول (مطلوب التأشير على الكل)
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                allCriteriaChecked
                  ? "bg-emerald-100 text-success dark:bg-success dark:text-success"
                  : "bg-amber-100 text-warning dark:bg-warning dark:text-warning"
              }`}>
                {checklist.filter(c => c.checked).length} / {checklist.length}
              </span>
            </div>

            <div className="space-y-2">
              {checklist.map((item, idx) => (
                <label
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition select-none ${
                    item.checked
                      ? "border-emerald-300 bg-success/60 dark:border-success dark:bg-success/20 text-success dark:text-success"
                      : "border-zinc-200 dark:border-border hover:bg-muted dark:hover:bg-muted text-foreground dark:text-muted-foreground"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => {}}
                    className="size-4 mt-0.5 rounded text-success focus:ring-success shrink-0"
                  />
                  <span className="leading-relaxed">{item.text}</span>
                </label>
              ))}
            </div>

            {/* Return Count & Past History */}
            {Number(task.returnCount || 0) > 0 && (
              <div className="p-3 rounded-xl bg-warning/10 dark:bg-warning/20 border border-warning dark:border-warning/40 text-xs">
                <p className="font-semibold text-warning dark:text-warning flex items-center gap-1.5">
                  <ArrowUturnLeftIcon className="size-3.5" />
                  تم إرجاع هذه المهمة للتعديل سابقاً {task.returnCount} مرة
                </p>
                {task.lastReturnReason && (
                  <p className="text-zinc-600 dark:text-muted-foreground mt-1 italic">
                    «{task.lastReturnReason}»
                  </p>
                )}
              </div>
            )}

            {/* Owner Override Section */}
            {isOwner && (
              <div className="pt-3 border-t border-border dark:border-border">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-destructive dark:text-destructive">
                  <input
                    type="checkbox"
                    checked={useOwnerOverride}
                    onChange={(e) => setUseOwnerOverride(e.target.checked)}
                    className="size-3.5 rounded text-destructive focus:ring-destructive"
                  />
                  <ShieldExclamationIcon className="size-4 text-destructive" />
                  تجاوز استثنائي كمالك (Owner Override)
                </label>
                {useOwnerOverride && (
                  <div className="mt-2 space-y-1.5 animate-in fade-in">
                    <input
                      type="text"
                      value={ownerOverrideReason}
                      onChange={(e) => setOwnerOverrideReason(e.target.value)}
                      placeholder="سبب التجاوز الاستثنائي (يسجّل في سجل التدقيق)..."
                      className="w-full h-8 px-2.5 rounded-lg text-xs border border-destructive dark:border-destructive bg-destructive/30 dark:bg-destructive/20"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      سيتم تسجيل التجاوز باسمك في سجل التدقيق غير القابل للتعديل.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Column 2: Evidence Dossier */}
          <div className="space-y-3.5 bg-muted dark:bg-muted p-4 rounded-xl border border-border dark:border-border text-xs">
            <h3 className="font-bold text-foreground dark:text-muted-foreground flex items-center justify-between border-b border-border dark:border-border pb-2">
              <span className="flex items-center gap-1.5">
                <PaperClipIcon className="size-4 text-muted-foreground" />
                ملف الدليل المرفق (Delivery Evidence)
              </span>
              {hasValidEvidence ? (
                <span className="text-[11px] text-success font-semibold flex items-center gap-1">
                  <CheckCircleIcon className="size-3.5" />
                  معتمد
                </span>
              ) : (
                <span className="text-[11px] text-destructive font-semibold flex items-center gap-1">
                  <ExclamationCircleIcon className="size-3.5" />
                  بدون دليل
                </span>
              )}
            </h3>

            {evidenceObj ? (
              <div className="space-y-2.5">
                <div>
                  <span className="font-semibold text-muted-foreground block text-[11px]">1. نوع التغيير:</span>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium text-xs">
                    {evidenceObj.changeType || "غير محدد"}
                  </span>
                </div>

                {evidenceObj.pageUrl && (
                  <div>
                    <span className="font-semibold text-muted-foreground block text-[11px]">لينك الصفحة:</span>
                    <a
                      href={evidenceObj.pageUrl.startsWith("http") ? evidenceObj.pageUrl : `https://${evidenceObj.pageUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-0.5 text-xs text-primary hover:underline"
                    >
                      {evidenceObj.pageUrl} ↗
                    </a>
                  </div>
                )}

                <div>
                  <span className="font-semibold text-muted-foreground block text-[11px]">2. الكوميت / مسار الملفات:</span>
                  <code className="block mt-0.5 p-1.5 rounded bg-muted dark:bg-muted font-mono text-[11px] break-all border border-border dark:border-border">
                    {evidenceObj.commitOrPath || "غير متوفر"}
                  </code>
                </div>

                {(evidenceObj.beforeAttachmentUrl || evidenceObj.afterAttachmentUrl) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {evidenceObj.beforeAttachmentUrl && (
                      <div className="p-2 rounded-lg border border-border dark:border-border bg-white dark:bg-muted">
                        <span className="text-[10px] font-bold text-warning dark:text-warning block mb-1">صورة قبل</span>
                        <a href={evidenceObj.beforeAttachmentUrl} target="_blank" rel="noopener noreferrer">
                          <img src={evidenceObj.beforeAttachmentUrl} alt="صورة قبل" className="h-28 w-full object-cover rounded" />
                        </a>
                      </div>
                    )}
                    {evidenceObj.afterAttachmentUrl && (
                      <div className="p-2 rounded-lg border border-border dark:border-border bg-white dark:bg-muted">
                        <span className="text-[10px] font-bold text-success dark:text-success block mb-1">صورة بعد</span>
                        <a href={evidenceObj.afterAttachmentUrl} target="_blank" rel="noopener noreferrer">
                          <img src={evidenceObj.afterAttachmentUrl} alt="صورة بعد" className="h-28 w-full object-cover rounded" />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <span className="font-semibold text-muted-foreground block text-[11px]">3. الأرقام قبل / بعد:</span>
                  <p className="mt-0.5 text-foreground dark:text-muted-foreground font-medium leading-relaxed">
                    {evidenceObj.numbersBeforeAfter || "لا توجد أرقام مسجلة"}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-muted-foreground block text-[11px]">4. «إيه اللي ما اختبرتهوش»:</span>
                  <p className="mt-0.5 text-foreground dark:text-muted-foreground leading-relaxed italic bg-white dark:bg-muted p-2 rounded border border-border dark:border-border">
                    {evidenceObj.notTestedScope || "لم يتم توضيح حدود الاختبار"}
                  </p>
                </div>

                {/* Agent Evidence Box */}
                {evidenceObj.agentInfo?.isAgent && (
                  <div className="p-2.5 rounded-lg bg-primary/50 dark:bg-primary/20 border border-primary dark:border-primary/40">
                    <div className="flex items-center gap-1.5 font-bold text-primary dark:text-primary text-[11px]">
                      <CpuChipIcon className="size-3.5" />
                      مخرج الوكيل: {evidenceObj.agentInfo.agentName} ({evidenceObj.agentInfo.commitOrRunId})
                    </div>
                    <pre className="mt-1.5 p-2 rounded bg-white dark:bg-muted text-[10px] font-mono max-h-24 overflow-y-auto text-foreground dark:text-muted-foreground border border-border dark:border-border">
                      {evidenceObj.agentInfo.testOutput}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                <ExclamationCircleIcon className="size-8 mx-auto text-warning mb-1" />
                <p className="font-medium text-warning dark:text-warning">لا يوجد دليل تسليم مسجل على هذه المهمة</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  المهمة نُقلت للمراجعة بدون استيفاء بوابة التسليم. يرجى طلب تعديلات لاستكمال الدليل.
                </p>
              </div>
            )}

            {/* Proof Attachments preview/links */}
            {task.attachments && task.attachments.length > 0 && (
              <div className="pt-2 border-t border-border dark:border-border">
                <span className="font-semibold text-muted-foreground block text-[11px] mb-1">المرفقات التشغيلية:</span>
                <div className="space-y-1">
                  {task.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.filePath || `/api/tasks/attachments/${att.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-muted border border-border dark:border-border hover:text-primary transition"
                    >
                      <span className="truncate">{att.originalName || att.fileName}</span>
                      <ArrowTopRightOnSquareIcon className="size-3.5 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Return Drawer (Collapsible) */}
        {returnMode && (
          <div className="px-5 py-3.5 bg-warning/10 dark:bg-warning/30 border-t border-warning dark:border-warning/40 text-xs animate-in slide-in-from-bottom duration-150 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-warning dark:text-warning mb-1">
                  نوع سبب الإرجاع <span className="text-rose-500">*</span>
                </label>
                <select
                  value={returnReasonType}
                  onChange={(e) => setReturnReasonType(e.target.value)}
                  className="w-full p-2 rounded-lg border border-warning dark:border-warning bg-white dark:bg-muted text-foreground dark:text-muted-foreground text-xs focus:ring-2 focus:ring-warning/40"
                >
                  <option value="QUALITY">جودة ضعيفة أو غير مقبولة</option>
                  <option value="CRITERIA_VIOLATION">مخالفة معايير القبول المحددة</option>
                  <option value="WRONG_EXECUTION">خطأ في التنفيذ أو عدم مطابقة المطلوب</option>
                  <option value="MISSING_EVIDENCE">نقص أدلة التسليم أو عدم كفايتها</option>
                  <option value="LATE">تأخر في التسليم عن الموعد</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-warning dark:text-warning mb-1">
                  مستوى شدة الملاحظة <span className="text-rose-500">*</span>
                </label>
                <select
                  value={returnSeverity}
                  onChange={(e) => setReturnSeverity(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-warning dark:border-warning bg-white dark:bg-muted text-foreground dark:text-muted-foreground text-xs focus:ring-2 focus:ring-warning/40"
                >
                  <option value={1}>بسيط (تعديل طفيف / سكور -10)</option>
                  <option value={2}>متوسط (خلل يحتاج تصحيح / سكور -25)</option>
                  <option value={3}>جسيم (إخفاق جوهري / سكور -50)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-warning dark:text-warning mb-1.5">
                تفاصيل الملاحظات المطلوبة <span className="text-rose-500">* (إلزامي)</span>
              </label>
              <textarea
                rows={2}
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="اكتب بوضوح ما هو المطلوب من المنفذ تعديله أو إرفاقه قبل إعادة التسليم..."
                className="w-full p-2.5 rounded-xl border border-warning dark:border-warning bg-white dark:bg-muted text-foreground dark:text-muted-foreground placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-warning/40 resize-none text-xs"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReturnMode(false)}
                className="px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-muted dark:hover:bg-muted transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleReturnSubmit}
                disabled={!returnReason.trim() || isSubmitting}
                className="px-4 py-1.5 rounded-lg font-semibold bg-warning hover:bg-warning text-white transition disabled:opacity-50"
              >
                تأكيد الإرجاع للمنفذ
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border dark:border-border bg-muted dark:bg-muted">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border border-border dark:border-border text-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted transition"
          >
            إغلاق
          </button>

          <div className="flex items-center gap-2">
            {!returnMode && (
              <button
                type="button"
                onClick={() => setReturnMode(true)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-warning dark:border-warning text-warning dark:text-warning hover:bg-warning/10 dark:hover:bg-warning/30 transition flex items-center gap-1.5"
              >
                <ArrowUturnLeftIcon className="size-4" />
                <span>رجع للتعديل</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleApproveSubmit}
              disabled={isSubmitting}
              title="اعتماد وإنجاز المهمة"
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
                !isSubmitting
                  ? "bg-emerald-600 hover:bg-success text-white shadow-md cursor-pointer active:scale-95"
                  : "bg-zinc-200 dark:bg-muted text-muted-foreground dark:text-muted-foreground cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <span className="inline-block animate-spin size-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <CheckCircleIcon className="size-4" />
              )}
              <span>
                {useOwnerOverride ? "اعتماد بتجاوز المالك (Override)" : "اعتماد وإنجاز المهمة"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
