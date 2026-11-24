import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Clock, LockKeyhole, RefreshCw, Wallet } from "lucide-react";
import { toast } from "sonner";
import { closeCashierShift, fetchCashierShifts, fetchCurrentShift, fetchShiftReconciliation, openCashierShift } from "./api";
import { StatusPill, formatDateTime, money } from "./shared";
import type { CashierShiftRecord, CurrentShiftPayload, ShiftReconciliation } from "./types";

interface Props {
  reloadKey: number;
  onChanged: () => void;
}

const CashierShiftTab: React.FC<Props> = ({ reloadKey, onChanged }) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const [current, setCurrent] = useState<CurrentShiftPayload | null>(null);
  const [history, setHistory] = useState<CashierShiftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openingBalance, setOpeningBalance] = useState<number | "">(0);
  const [closingBalance, setClosingBalance] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [working, setWorking] = useState(false);
  const [openReconciliation, setOpenReconciliation] = useState<ShiftReconciliation | null>(null);
  const [reconciliationBusyId, setReconciliationBusyId] = useState<string | null>(null);

  const toggleReconciliation = async (shiftId: string) => {
    if (openReconciliation?.shift.id === shiftId) {
      setOpenReconciliation(null);
      return;
    }
    setReconciliationBusyId(shiftId);
    try {
      const data = await fetchShiftReconciliation(shiftId);
      setOpenReconciliation(data);
    } catch (e: any) {
      toast.error(e.message || (isEn ? "Failed to load reconciliation" : "فشل جلب المطابقة"));
    } finally {
      setReconciliationBusyId(null);
    }
  };

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError("");
    Promise.all([fetchCurrentShift(), fetchCashierShifts({ limit: 20 })])
      .then(([shiftPayload, list]) => {
        if (!alive) return;
        setCurrent(shiftPayload);
        setHistory(list.items);
        setClosingBalance(shiftPayload.live ? shiftPayload.live.expected : "");
      })
      .catch((e) => alive && setError(e.message || "فشل جلب شيفت الكاشير"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  const handleOpen = async () => {
    const value = Number(openingBalance);
    if (!Number.isFinite(value) || value < 0) {
      toast.error(isEn ? "Invalid opening balance" : "رصيد الافتتاح غير صالح");
      return;
    }
    try {
      setWorking(true);
      await openCashierShift(value);
      toast.success(isEn ? "Shift opened" : "تم فتح الشيفت");
      load();
    } catch (e: any) {
      toast.error(e.message || (isEn ? "Failed to open shift" : "فشل فتح الشيفت"));
    } finally {
      setWorking(false);
    }
  };

  const handleClose = async () => {
    if (!current?.shift) return;
    const value = Number(closingBalance);
    if (!Number.isFinite(value) || value < 0) {
      toast.error(isEn ? "Invalid counted cash" : "النقد الفعلي غير صالح");
      return;
    }
    try {
      setWorking(true);
      const result: any = await closeCashierShift(current.shift.id, value, notes.trim() || undefined);
      const diff = Number(result?.difference || 0);
      toast.success(
        Math.abs(diff) < 0.01
          ? isEn ? "Shift closed — balanced" : "تم إغلاق الشيفت — مطابق"
          : isEn
          ? `Shift closed — difference ${money(diff)} EGP`
          : `تم إغلاق الشيفت — الفرق ${money(diff)} ج.م`
      );
      setClosingBalance("");
      setNotes("");
      load();
      onChanged();
    } catch (e: any) {
      toast.error(e.message || (isEn ? "Failed to close shift" : "فشل إغلاق الشيفت"));
    } finally {
      setWorking(false);
    }
  };

  const shift = current?.shift || null;
  const live = current?.live || null;
  const counted = Number(closingBalance);
  const liveDifference = Number.isFinite(counted) && live ? counted - live.expected : null;

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive flex items-center justify-between gap-3">
        <span>{error}</span>
        <button type="button" onClick={load} className="inline-flex items-center gap-1 font-semibold">
          <RefreshCw className="w-3.5 h-3.5" />
          {isEn ? "Retry" : "إعادة المحاولة"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!shift ? (
        <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              {isEn ? "No open cashier shift" : "لا يوجد شيفت كاشير مفتوح"}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {isEn
              ? "Open a shift before collecting cash so every payment is reconciled to the drawer."
              : "افتح شيفت قبل تحصيل الكاش عشان كل دفعة تتحسب على الدرج وتتطابق في نهاية اليوم."}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end gap-2.5">
            <div className="space-y-1 flex-1">
              <label className="text-[11px] font-semibold text-foreground" htmlFor="shift-opening">
                {isEn ? "Opening cash (EGP)" : "رصيد الافتتاح (ج.م)"}
              </label>
              <input
                id="shift-opening"
                type="number"
                min={0}
                step="0.01"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background font-mono tabular-nums focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <button
              type="button"
              onClick={handleOpen}
              disabled={working}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {working ? (isEn ? "Opening..." : "جارٍ الفتح...") : isEn ? "Open shift" : "فتح الشيفت"}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <LockKeyhole className="w-4 h-4 text-success" />
                <h3 className="text-sm font-semibold text-foreground">
                  {isEn ? "Shift open" : "شيفت مفتوح"}
                </h3>
                <StatusPill tone="success">{shift.cashierName}</StatusPill>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                <Clock className="w-3 h-3 inline me-1" />
                <span dir="ltr">{formatDateTime(shift.openedAt)}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[11px] font-semibold text-foreground hover:bg-muted self-start"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              {isEn ? "Refresh" : "تحديث"}
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[
              { label: isEn ? "Opening" : "رصيد الافتتاح", value: shift.openingBalance, tone: "text-foreground" },
              { label: isEn ? "Cash collected" : "محصّل كاش", value: live?.collected ?? 0, tone: "text-success" },
              { label: isEn ? "Cash reversed" : "ملغى كاش", value: live?.reversed ?? 0, tone: "text-destructive" },
              { label: isEn ? "Expected in drawer" : "المتوقع في الدرج", value: live?.expected ?? 0, tone: "text-primary" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border/70 bg-background p-2.5">
                <span className="text-[10px] text-muted-foreground">{item.label}</span>
                <p className={`text-sm font-bold font-mono tabular-nums mt-1 ${item.tone}`}>
                  {money(item.value)} {isEn ? "EGP" : "ج.م"}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-foreground" htmlFor="shift-closing">
                {isEn ? "Counted cash (EGP)" : "النقد الفعلي في الدرج (ج.م)"}
              </label>
              <input
                id="shift-closing"
                type="number"
                min={0}
                step="0.01"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background font-mono tabular-nums focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-semibold text-foreground" htmlFor="shift-notes">
                {isEn ? "Notes (optional)" : "ملاحظات (اختياري)"}
              </label>
              <input
                id="shift-notes"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isEn ? "Reason for any difference..." : "سبب أي فرق في الدرج..."}
              />
            </div>
          </div>

          {liveDifference !== null && Math.abs(liveDifference) > 0.009 ? (
            <div className="rounded-lg border border-warning/20 bg-warning/10 px-3 py-2 text-[11px] text-warning flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {isEn ? "Difference: " : "الفرق: "}
              <span className="font-mono font-bold">{money(liveDifference)}</span>
              {isEn ? " EGP" : " ج.م"}
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={working}
              className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 disabled:opacity-50"
            >
              {working ? (isEn ? "Closing..." : "جارٍ الإغلاق...") : isEn ? "Close shift" : "إغلاق الشيفت"}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold text-foreground">{isEn ? "Shift history" : "سجل الشيفتات"}</h3>
          <span className="text-[10px] text-muted-foreground font-mono">{history.length}</span>
        </div>
        {history.length === 0 ? (
          <p className="p-4 text-[11px] text-muted-foreground">{isEn ? "No shifts yet" : "لا توجد شيفتات بعد"}</p>
        ) : (
          <div className="divide-y divide-border/60">
            {history.map((row) => (
              <div key={row.id} className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 text-[11px]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{row.cashierName}</span>
                    {row.status === "OPEN" ? (
                      <StatusPill tone="success">{isEn ? "Open" : "مفتوح"}</StatusPill>
                    ) : (
                      <StatusPill tone="muted">{isEn ? "Closed" : "مغلق"}</StatusPill>
                    )}
                  </div>
                  <p className="text-muted-foreground font-mono">
                    <span dir="ltr">{formatDateTime(row.openedAt)}</span>
                    {row.closedAt ? <> → <span dir="ltr">{formatDateTime(row.closedAt)}</span></> : null}
                  </p>
                </div>
                <div className="flex items-center gap-4 font-mono tabular-nums">
                  <span className="text-muted-foreground">
                    {isEn ? "Expected" : "متوقع"}: {money(row.expectedCash)}
                  </span>
                  <span className="text-foreground">
                    {isEn ? "Actual" : "فعلي"}: {row.closingBalance === null || row.closingBalance === undefined ? "—" : money(row.closingBalance)}
                  </span>
                  {row.difference !== null && row.difference !== undefined ? (
                    <span className={Math.abs(row.difference) < 0.01 ? "text-success" : "text-destructive"}>
                      {money(row.difference)}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => toggleReconciliation(row.id)}
                    disabled={reconciliationBusyId === row.id}
                    className="px-2 py-0.5 rounded border border-border text-[10px] font-semibold text-muted-foreground hover:bg-muted disabled:opacity-50"
                  >
                    {reconciliationBusyId === row.id
                      ? (isEn ? "..." : "...")
                      : (isEn ? "Reconcile" : "مطابقة")}
                  </button>
                </div>
                {openReconciliation?.shift.id === row.id ? (
                  <div className="w-full mt-2 rounded-lg border border-border/70 bg-muted/30 p-2">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>{isEn ? "Method" : "الطريقة"}</span>
                      <span className="flex items-center gap-4">
                        <span>{isEn ? "Expected" : "المتوقع"}</span>
                        <span>{isEn ? "Counted" : "المُعد"}</span>
                        <span>{isEn ? "Diff" : "الفرق"}</span>
                      </span>
                    </div>
                    {openReconciliation.byMethod.map((methodRow) => (
                      <div
                        key={methodRow.method}
                        className="flex items-center justify-between text-[11px] font-mono tabular-nums py-0.5"
                      >
                        <span className="text-foreground">{methodRow.method}</span>
                        <span className="flex items-center gap-4">
                          <span className="text-muted-foreground">{money(methodRow.expected)}</span>
                          <span>{methodRow.declared === null ? "—" : money(methodRow.declared)}</span>
                          <span
                            className={
                              methodRow.difference === null
                                ? "text-muted-foreground"
                                : Math.abs(methodRow.difference) < 0.01
                                  ? "text-success"
                                  : "text-destructive"
                            }
                          >
                            {methodRow.difference === null ? "—" : money(methodRow.difference)}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CashierShiftTab;
