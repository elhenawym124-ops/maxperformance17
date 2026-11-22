import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, RefreshCw, Wallet, X } from "lucide-react";
import { fetchTopups, releaseTopup, rejectTopup } from "./api";
import { EmptyState, INPUT_CLS, StatusPill, formatDateTime, money } from "./shared";
import type { WalletTopup } from "./types";

interface Props {
  reloadKey: number;
  onChanged: () => void;
}

const TopupsTab: React.FC<Props> = ({ reloadKey, onChanged }) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const [status, setStatus] = useState("PENDING_RELEASE");
  const [items, setItems] = useState<WalletTopup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [decision, setDecision] = useState<{ id: string; kind: "release" | "reject" } | null>(null);
  const [reason, setReason] = useState("");
  const [working, setWorking] = useState(false);

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError("");
    fetchTopups(status)
      .then((res) => alive && setItems(Array.isArray(res) ? res : []))
      .catch((e) => alive && setError(e.message || "فشل جلب طلبات الشحن"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [status, reloadKey]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  const submitDecision = async () => {
    if (!decision) return;
    try {
      setWorking(true);
      setActionId(decision.id);
      if (decision.kind === "release") {
        await releaseTopup(decision.id);
      } else {
        await rejectTopup(decision.id, reason.trim() || undefined);
      }
      setDecision(null);
      setReason("");
      onChanged();
      load();
    } catch (e: any) {
      setError(e.message || "فشل تنفيذ الطلب");
    } finally {
      setWorking(false);
      setActionId(null);
    }
  };

  const current = decision ? items.find((item) => item.id === decision.id) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-card p-1">
          {[
            { key: "PENDING_RELEASE", ar: "معلقة", en: "Pending" },
            { key: "RELEASED", ar: "معتمدة", en: "Released" },
            { key: "CANCELLED", ar: "مرفوضة", en: "Rejected" },
            { key: "ALL", ar: "الكل", en: "All" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatus(tab.key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                status === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {isEn ? tab.en : tab.ar}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[11px] font-semibold text-foreground hover:bg-muted"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {isEn ? "Refresh" : "تحديث"}
        </button>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          title={isEn ? "No top-up requests" : "لا توجد طلبات شحن"}
          hint={isEn ? "Parent wallet top-up requests appear here for review." : "طلبات شحن محفظة أولياء الأمور تظهر هنا للمراجعة."}
        />
      ) : null}

      <div className="space-y-2">
        {items.map((item) => {
          const customer = item.wallet?.customer;
          const name = `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim() || (isEn ? "Parent" : "ولي أمر");
          const pending = item.status === "PENDING_RELEASE";
          return (
            <div key={item.id} className="rounded-xl border border-border/70 bg-card p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary self-start">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-foreground">{name}</span>
                  {customer?.phone ? <span className="text-[10px] font-mono text-muted-foreground">{customer.phone}</span> : null}
                  {pending ? (
                    <StatusPill tone="warning">{isEn ? "Pending review" : "بانتظار المراجعة"}</StatusPill>
                  ) : item.status === "RELEASED" ? (
                    <StatusPill tone="success">{isEn ? "Released" : "معتمد"}</StatusPill>
                  ) : (
                    <StatusPill tone="muted">{isEn ? "Cancelled" : "مرفوض"}</StatusPill>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  <span dir="ltr">{formatDateTime(item.createdAt)}</span>
                  {item.releasedAt ? <> · {isEn ? "released" : "اعتُمد"}: <span dir="ltr">{formatDateTime(item.releasedAt)}</span></> : ""}
                </p>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                <span className="text-sm font-bold font-mono tabular-nums text-foreground">
                  {money(item.amount)} {isEn ? "EGP" : "ج.م"}
                </span>
                {pending ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={working && actionId === item.id}
                      onClick={() => {
                        setDecision({ id: item.id, kind: "release" });
                        setReason("");
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-success/10 text-success border border-success/20 hover:bg-success/20 disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {isEn ? "Approve" : "اعتماد"}
                    </button>
                    <button
                      type="button"
                      disabled={working && actionId === item.id}
                      onClick={() => {
                        setDecision({ id: item.id, kind: "reject" });
                        setReason("");
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      {isEn ? "Reject" : "رفض"}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {decision && current ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-3"
          dir={isEn ? "ltr" : "rtl"}
          onClick={() => setDecision(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-card shadow-2xl p-4 space-y-3"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={isEn ? "Review top-up" : "مراجعة طلب شحن"}
          >
            <h3 className="text-sm font-bold text-foreground">
              {decision.kind === "release"
                ? isEn ? "Approve wallet top-up" : "اعتماد شحن المحفظة"
                : isEn ? "Reject wallet top-up" : "رفض طلب الشحن"}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {decision.kind === "release"
                ? isEn
                  ? "The amount is added to the wallet and posted to the treasury as a deposit."
                  : "سيُضاف المبلغ للمحفظة ويُسجَّل إيداعاً في الخزينة."
                : isEn
                ? "No money moves; the request is closed as cancelled."
                : "لن يتحرك أي مبلغ؛ سيُغلق الطلب كملغى."}
            </p>
            <p className="text-sm font-bold font-mono text-foreground">
              {money(current.amount)} {isEn ? "EGP" : "ج.م"}
            </p>
            {decision.kind === "reject" ? (
              <input
                className={INPUT_CLS}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={isEn ? "Rejection reason (optional)" : "سبب الرفض (اختياري)"}
              />
            ) : null}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDecision(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-muted text-foreground"
              >
                {isEn ? "Cancel" : "تراجع"}
              </button>
              <button
                type="button"
                onClick={submitDecision}
                disabled={working}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg disabled:opacity-50 ${
                  decision.kind === "release"
                    ? "bg-primary text-primary-foreground"
                    : "bg-destructive text-destructive-foreground"
                }`}
              >
                {working ? (isEn ? "Working..." : "جارٍ التنفيذ...") : isEn ? "Confirm" : "تأكيد"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TopupsTab;
