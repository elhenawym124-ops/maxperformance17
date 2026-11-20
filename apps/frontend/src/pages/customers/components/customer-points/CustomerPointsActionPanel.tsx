import React from "react";
import {
  History,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import {
  CustomerLoyaltyRecord,
  CustomerLoyaltyProgram,
  CustomerLoyaltyTier,
  PointsActionType,
  formatPoints,
} from "./types";

interface CustomerPointsActionPanelProps {
  selectedRecord: CustomerLoyaltyRecord | null;
  selectedProgram: CustomerLoyaltyProgram | null;
  selectedCurrentPoints: number;
  nextTier: CustomerLoyaltyTier | undefined;
  progressToNextTier: number;
  pointsToNextTier: number;
  onOpenHistory: () => void;
  actionType: PointsActionType;
  onActionTypeChange: (type: PointsActionType) => void;
  pointsValue: string;
  onPointsValueChange: (val: string) => void;
  reason: string;
  onReasonChange: (val: string) => void;
  errorMessage: string;
  successMessage: string;
  isSubmitting: boolean;
  onSubmitAction: () => void;
}

export const CustomerPointsActionPanel: React.FC<CustomerPointsActionPanelProps> = ({
  selectedRecord,
  selectedProgram,
  selectedCurrentPoints,
  nextTier,
  progressToNextTier,
  pointsToNextTier,
  onOpenHistory,
  actionType,
  onActionTypeChange,
  pointsValue,
  onPointsValueChange,
  reason,
  onReasonChange,
  errorMessage,
  successMessage,
  isSubmitting,
  onSubmitAction,
}) => {
  return (
    <div className="space-y-4">
      {/* Selected Customer Profile */}
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
        <h3 className="mb-4 text-lg font-bold text-foreground flex justify-between items-center">
          ملف العميل المختار
          {selectedRecord && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="text-xs flex items-center gap-1 font-normal text-primary bg-primary/10 dark:bg-primary/30 px-2 py-1.5 rounded hover:bg-primary transition cursor-pointer"
            >
              <History className="h-3.5 w-3.5" /> سجل الحركات
            </button>
          )}
        </h3>
        {selectedRecord ? (
          <div className="space-y-3 text-right">
            <p className="font-semibold text-foreground text-lg">
              {selectedRecord.customer.firstName} {selectedRecord.customer.lastName}
            </p>
            <div className="flex justify-between items-end border-b border-border dark:border-border pb-3">
              <div>
                <p className="text-sm text-muted-foreground">البرنامج:</p>
                <p className="font-medium text-foreground dark:text-muted-foreground">
                  {selectedProgram?.nameAr || selectedProgram?.name || "-"}
                </p>
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">الرصيد:</p>
                <span className="font-bold text-success dark:text-success text-2xl font-mono tabular-nums">
                  {formatPoints(selectedCurrentPoints)}
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground font-mono tabular-nums">
              آخر نشاط مسجل:{" "}
              {new Date(selectedRecord.lastActivity).toLocaleDateString("ar-EG")}
            </p>

            <div className="pt-3 bg-muted dark:bg-muted p-3 rounded-lg border border-border dark:border-border mt-2">
              <div className="mb-2 flex items-center justify-between text-xs text-foreground dark:text-muted-foreground font-mono tabular-nums">
                <span className="font-bold">{progressToNextTier}%</span>
                <span>التقدم للمستوى التالي</span>
              </div>
              <div className="h-2 rounded-full bg-muted dark:bg-muted overflow-hidden">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-warning to-primary"
                  style={{ width: `${progressToNextTier}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {nextTier
                  ? `يحتاج ${formatPoints(pointsToNextTier)} نقطة للوصول لـ ${nextTier.nameAr || nextTier.name}`
                  : "العميل في أعلى مستوى متاح حاليًا"}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-right text-sm text-muted-foreground py-12 flex flex-col items-center justify-center border-2 border-dashed border-border dark:border-border rounded-lg bg-muted dark:bg-muted">
            <Search className="h-8 w-8 text-muted-foreground mb-2" />
            اختَر عميلًا من جدول العرض
          </div>
        )}
      </div>

      {/* Points Action Form */}
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
        <h3 className="mb-4 text-lg font-bold text-foreground">
          إجراء عملية على النقاط
        </h3>
        <div className="space-y-3 text-right relative">
          <select
            value={actionType}
            onChange={(event) => onActionTypeChange(event.target.value as PointsActionType)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm dark:border-border dark:bg-muted dark:text-white cursor-pointer"
            disabled={!selectedRecord}
          >
            <option value="ADD">إضافة نقاط (+)</option>
            <option value="REDEEM">استبدال نقاط (-)</option>
            <option value="ADJUST">تعديل يدوي (يتطلب السبب)</option>
          </select>

          <input
            type="number"
            value={pointsValue}
            onChange={(event) => onPointsValueChange(event.target.value)}
            placeholder={
              actionType === "ADJUST"
                ? "مثال: 100 للقيمة الموجبة و -40 للخصم"
                : "أدخل عدد النقاط المُنفذة"
            }
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-right text-sm dark:border-border dark:bg-muted dark:text-white disabled:bg-muted dark:disabled:bg-muted font-mono tabular-nums"
            disabled={!selectedRecord}
          />

          <div className="relative">
            <textarea
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder={
                actionType === "ADJUST"
                  ? "سبب التعديل اليدوي (إلزامي)"
                  : "تفاصيل العملية (اختياري)"
              }
              className={`min-h-[80px] w-full rounded-lg border bg-white px-3 py-2.5 text-right text-sm dark:bg-muted dark:text-white disabled:bg-muted dark:disabled:bg-muted ${
                actionType === "ADJUST" && !reason.trim()
                  ? "border-amber-400 focus:border-warning outline-none ring-1 ring-warning"
                  : "border-border"
              }`}
              disabled={!selectedRecord}
            />
            {actionType === "ADJUST" && (
              <AlertTriangle
                className={`absolute bottom-3 left-3 h-4 w-4 ${
                  reason.trim() ? "text-emerald-500" : "text-amber-500"
                }`}
              />
            )}
          </div>

          {errorMessage && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive dark:bg-destructive/20 dark:text-destructive border border-destructive dark:border-destructive">
              {errorMessage}
            </p>
          )}
          {successMessage && (
            <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success dark:bg-success/20 dark:text-success border border-success dark:border-success">
              {successMessage}
            </p>
          )}

          <button
            type="button"
            onClick={onSubmitAction}
            disabled={!selectedRecord || isSubmitting}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${
              actionType === "REDEEM"
                ? "bg-amber-600 hover:bg-warning"
                : actionType === "ADJUST"
                ? "bg-gray-800 hover:bg-muted dark:bg-muted dark:hover:bg-muted"
                : "bg-emerald-600 hover:bg-success"
            }`}
          >
            {actionType === "ADD" && <ArrowUpCircle className="h-4 w-4" />}
            {actionType === "REDEEM" && <ArrowDownCircle className="h-4 w-4" />}
            {actionType === "ADJUST" && <Wrench className="h-4 w-4" />}
            {isSubmitting ? "جاري التنفيذ..." : "تأكيد العملية"}
          </button>
        </div>
      </div>
    </div>
  );
};
