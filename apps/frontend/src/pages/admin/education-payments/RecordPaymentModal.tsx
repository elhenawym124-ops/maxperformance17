import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, CheckCircle2, CreditCard, X } from "lucide-react";
import { fetchDues, recordPayment } from "./api";
import { INPUT_CLS, money, todayInput } from "./shared";
import { PAYMENT_METHOD_LABELS } from "./types";
import type { DuesResponse } from "./types";

interface RecordTarget {
  enrollmentId?: string;
  groupMemberId?: string;
  label: string;
  remaining: number;
}

interface Props {
  preset?: { enrollmentId?: string; groupMemberId?: string; label: string; remaining: number } | null;
  onClose: () => void;
  onSaved: () => void;
}

const RecordPaymentModal: React.FC<Props> = ({ preset, onClose, onSaved }) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const [dues, setDues] = useState<DuesResponse | null>(null);
  const [loading, setLoading] = useState(!preset);
  const [targetKey, setTargetKey] = useState(
    preset ? (preset.enrollmentId ? `E:${preset.enrollmentId}` : `G:${preset.groupMemberId}`) : ""
  );
  const [amount, setAmount] = useState<number | "">(preset ? Math.max(0, preset.remaining) : "");
  const [method, setMethod] = useState("CASH");
  const [paidAt, setPaidAt] = useState(todayInput());
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (preset) return;
    let alive = true;
    setLoading(true);
    fetchDues()
      .then((data) => {
        if (!alive) return;
        setDues(data);
        const firstEnrollment = data.enrollments[0];
        const firstGroup = data.groupRenewals[0];
        if (firstEnrollment) {
          setTargetKey(`E:${firstEnrollment.enrollmentId}`);
          setAmount(Math.max(0, firstEnrollment.remaining));
        } else if (firstGroup) {
          setTargetKey(`G:${firstGroup.groupMemberId}`);
          setAmount(Math.max(0, firstGroup.remaining));
        }
      })
      .catch((e) => alive && setError(e.message || "فشل تحميل المستحقات"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [preset]);

  const targets = useMemo<RecordTarget[]>(() => {
    if (preset) return [preset];
    if (!dues) return [];
    const enrollmentTargets = dues.enrollments.map((item) => ({
      enrollmentId: item.enrollmentId,
      label: `${item.studentName}${item.packageName ? ` — ${item.packageName}` : ""}`,
      remaining: item.remaining,
    }));
    const groupTargets = dues.groupRenewals.map((item) => ({
      groupMemberId: item.groupMemberId,
      label: `${item.studentName} — ${item.groupName}`,
      remaining: Math.max(0, item.remaining),
    }));
    return [...enrollmentTargets, ...groupTargets];
  }, [dues, preset]);

  const selectedTarget = targets.find(
    (target) =>
      (target.enrollmentId && `E:${target.enrollmentId}` === targetKey) ||
      (target.groupMemberId && `G:${target.groupMemberId}` === targetKey)
  );

  const submit = async () => {
    setError("");
    setSuccess("");
    const value = Number(amount);
    if (!selectedTarget) {
      setError(isEn ? "Select a student enrollment first" : "اختر تسجيل الطالب أولاً");
      return;
    }
    if (!value || value <= 0) {
      setError(isEn ? "Enter a valid amount" : "أدخل مبلغاً صحيحاً");
      return;
    }
    if (value > selectedTarget.remaining + 0.01) {
      setError(
        isEn
          ? `Amount exceeds the remaining balance (${money(selectedTarget.remaining)} EGP)`
          : `المبلغ أكبر من المتبقي (${money(selectedTarget.remaining)} ج.م)`
      );
      return;
    }
    try {
      setSaving(true);
      const payment = await recordPayment({
        enrollmentId: selectedTarget.enrollmentId,
        groupMemberId: selectedTarget.groupMemberId,
        amount: value,
        method,
        paidAt,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setSuccess(
        isEn
          ? `Payment ${payment.paymentNumber} recorded`
          : `تم تسجيل الدفعة ${payment.paymentNumber}`
      );
      onSaved();
      setTimeout(onClose, 900);
    } catch (e: any) {
      setError(e.message || (isEn ? "Failed to record payment" : "فشل تسجيل الدفعة"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-3 sm:p-4"
      dir={isEn ? "ltr" : "rtl"}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={isEn ? "Record payment" : "تسجيل دفعة"}
      >
        <div className="flex items-center justify-between gap-2 p-4 border-b border-border/70">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">{isEn ? "Record payment" : "تسجيل دفعة"}</h2>
              <p className="text-[11px] text-muted-foreground">
                {isEn ? "Cash, transfer, wallet, card or InstaPay" : "نقدي، تحويل، محفظة، بطاقة أو إنستاپاي"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label={isEn ? "Close" : "إغلاق"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {error ? (
            <div className="flex items-center gap-2 p-2.5 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
          {success ? (
            <div className="flex items-center gap-2 p-2.5 rounded-lg border border-success/20 bg-success/10 text-success text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          ) : null}

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground" htmlFor="edu-pay-target">
              {isEn ? "Due item" : "المستحق"}
            </label>
            {preset ? (
              <div className="px-3 py-2 rounded-lg border border-border/70 bg-muted/30 text-xs text-foreground">
                {preset.label}
              </div>
            ) : (
              <select
                id="edu-pay-target"
                className={INPUT_CLS}
                value={targetKey}
                onChange={(e) => {
                  setTargetKey(e.target.value);
                  const next = targets.find(
                    (target) =>
                      (target.enrollmentId && `E:${target.enrollmentId}` === e.target.value) ||
                      (target.groupMemberId && `G:${target.groupMemberId}` === e.target.value)
                  );
                  if (next) setAmount(Math.max(0, next.remaining));
                }}
                disabled={loading || targets.length === 0}
              >
                {targets.length === 0 ? (
                  <option value="">{isEn ? "No outstanding dues" : "لا توجد مستحقات"}</option>
                ) : (
                  targets.map((target) => (
                    <option
                      key={target.enrollmentId ? `E:${target.enrollmentId}` : `G:${target.groupMemberId}`}
                      value={target.enrollmentId ? `E:${target.enrollmentId}` : `G:${target.groupMemberId}`}
                    >
                      {`${target.label} — ${money(target.remaining)} ${isEn ? "EGP" : "ج.م"}`}
                    </option>
                  ))
                )}
              </select>
            )}
            {selectedTarget ? (
              <p className="text-[11px] text-muted-foreground font-mono">
                {isEn ? "Remaining: " : "المتبقي: "}
                {money(selectedTarget.remaining)} {isEn ? "EGP" : "ج.م"}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground" htmlFor="edu-pay-amount">
                {isEn ? "Amount (EGP)" : "المبلغ (ج.م)"}
              </label>
              <input
                id="edu-pay-amount"
                type="number"
                min={0}
                step="0.01"
                className={INPUT_CLS + " font-mono tabular-nums"}
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground" htmlFor="edu-pay-method">
                {isEn ? "Method" : "طريقة الدفع"}
              </label>
              <select
                id="edu-pay-method"
                className={INPUT_CLS}
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {isEn ? label.en : label.ar}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground" htmlFor="edu-pay-date">
                {isEn ? "Payment date" : "تاريخ الدفع"}
              </label>
              <input
                id="edu-pay-date"
                type="date"
                className={INPUT_CLS + " font-mono"}
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground" htmlFor="edu-pay-reference">
                {isEn ? "Reference / transfer no." : "مرجع / رقم التحويل"}
              </label>
              <input
                id="edu-pay-reference"
                className={INPUT_CLS}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={isEn ? "Optional" : "اختياري"}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground" htmlFor="edu-pay-notes">
              {isEn ? "Notes" : "ملاحظات"}
            </label>
            <textarea
              id="edu-pay-notes"
              className={INPUT_CLS + " min-h-[64px] resize-y"}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isEn ? "Optional" : "اختياري"}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-border/70">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-muted text-foreground hover:bg-muted/80"
          >
            {isEn ? "Cancel" : "إلغاء"}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving || !selectedTarget}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {saving ? (isEn ? "Saving..." : "جارٍ الحفظ...") : isEn ? "Confirm payment" : "تأكيد التحصيل"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordPaymentModal;
