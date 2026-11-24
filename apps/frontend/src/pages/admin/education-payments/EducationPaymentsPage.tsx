import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CalendarClock, CreditCard, Plus, RefreshCw, TrendingUp, Wallet } from "lucide-react";
import { fetchSummary } from "./api";
import { KpiCard, money } from "./shared";
import PaymentsLedgerTab from "./PaymentsLedgerTab";
import DuesTab, { CollectTarget } from "./DuesTab";
import TopupsTab from "./TopupsTab";
import CashierShiftTab from "./CashierShiftTab";
import DailyClosingTab from "./DailyClosingTab";
import CouponsTab from "./CouponsTab";
import CollectionRateTab from "./CollectionRateTab";
import FinanceCockpitTab from "./FinanceCockpitTab";
import EngagementTab from "./EngagementTab";
import RecordPaymentModal from "./RecordPaymentModal";
import ReceiptModal from "./ReceiptModal";
import type { PaymentsSummary } from "./types";

type TabKey = "ledger" | "dues" | "topups" | "shift" | "closing" | "coupons" | "collections" | "cockpit" | "engagement";

const EducationPaymentsPage: React.FC = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const [tab, setTab] = useState<TabKey>("ledger");
  const [summary, setSummary] = useState<PaymentsSummary | null>(null);
  const [summaryError, setSummaryError] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [recordPreset, setRecordPreset] = useState<CollectTarget | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [receiptId, setReceiptId] = useState<string | null>(null);

  const loadSummary = useCallback(() => {
    let alive = true;
    setSummaryLoading(true);
    setSummaryError("");
    fetchSummary()
      .then((data) => alive && setSummary(data))
      .catch((e) => alive && setSummaryError(e.message || "فشل جلب الملخص"))
      .finally(() => alive && setSummaryLoading(false));
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    const cleanup = loadSummary();
    return cleanup;
  }, [loadSummary]);

  const refreshAll = () => setReloadKey((key) => key + 1);

  const openRecord = (preset?: CollectTarget | null) => {
    setRecordPreset(preset || null);
    setRecordOpen(true);
  };

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "ledger", label: isEn ? "Payments ledger" : "سجل المدفوعات" },
    { key: "dues", label: isEn ? "Outstanding dues" : "المستحقات" },
    {
      key: "topups",
      label: isEn ? "Wallet top-ups" : "طلبات شحن المحفظة",
      count: summary?.pendingTopups,
    },
    { key: "shift", label: isEn ? "Cashier shift" : "شيفت الكاشير" },
    { key: "closing", label: isEn ? "Daily closing" : "الإغلاق اليومي" },
    { key: "coupons", label: isEn ? "Discount codes" : "أكواد الخصم" },
    { key: "collections", label: isEn ? "Collection rate" : "نسبة التحصيل" },
    { key: "cockpit", label: isEn ? "Finance cockpit" : "النظرة المالية" },
    { key: "engagement", label: isEn ? "Parent engagement" : "تفاعل أولياء الأمور" },
  ];

  return (
    <div className="space-y-5 pb-10" dir={isEn ? "ltr" : "rtl"}>
      <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-primary/10 text-primary border border-primary/20">
                EDUCATION PAYMENTS
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {summaryLoading
                  ? isEn ? "Loading..." : "جارٍ التحميل..."
                  : isEn ? "Live ledger" : "دفتر تحصيل مباشر"}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {isEn ? "Payments & Collections" : "المدفوعات والتحصيل"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isEn
                ? "Collections, outstanding dues and parent wallet top-ups in one ledger."
                : "التحصيل والمستحقات وطلبات شحن المحفظة في دفتر واحد مربوط بالخزينة."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-[11px] font-semibold text-foreground hover:bg-muted"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${summaryLoading ? "animate-spin" : ""}`} />
              {isEn ? "Refresh" : "تحديث"}
            </button>
            <button
              type="button"
              onClick={() => openRecord(null)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:bg-primary/90 active:scale-[0.98] transition-transform"
            >
              <Plus className="w-3.5 h-3.5" />
              {isEn ? "Record payment" : "تسجيل دفعة"}
            </button>
          </div>
        </div>

        {summaryError ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-[11px] text-destructive">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{summaryError}</span>
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 lg:grid-cols-5 gap-2.5">
          <KpiCard
            icon={TrendingUp}
            label={isEn ? "Collected today" : "محصّل اليوم"}
            value={`${money(summary?.today.amount)} ${isEn ? "EGP" : "ج.م"}`}
            sub={`${summary?.today.count || 0} ${isEn ? "payments" : "دفعة"}`}
            tone="success"
          />
          <KpiCard
            icon={CreditCard}
            label={isEn ? "Collected this month" : "محصّل هذا الشهر"}
            value={`${money(summary?.month.amount)} ${isEn ? "EGP" : "ج.م"}`}
            sub={`${summary?.month.count || 0} ${isEn ? "payments" : "دفعة"}`}
          />
          <KpiCard
            icon={Wallet}
            label={isEn ? "Outstanding" : "مستحق غير محصل"}
            value={`${money(summary?.outstanding.amount)} ${isEn ? "EGP" : "ج.م"}`}
            sub={`${summary?.outstanding.count || 0} ${isEn ? "enrollments" : "تسجيل"}`}
            tone="warning"
          />
          <KpiCard
            icon={AlertTriangle}
            label={isEn ? "Overdue installments" : "أقساط متأخرة"}
            value={`${money(summary?.overdueInstallments.amount)} ${isEn ? "EGP" : "ج.م"}`}
            sub={`${summary?.overdueInstallments.count || 0} ${isEn ? "installments" : "قسط"}`}
            tone={summary?.overdueInstallments.count ? "danger" : "default"}
          />
          <KpiCard
            icon={CalendarClock}
            label={isEn ? "Pending top-ups" : "طلبات شحن معلقة"}
            value={String(summary?.pendingTopups || 0)}
            sub={isEn ? "need review" : "بانتظار المراجعة"}
            tone={summary?.pendingTopups ? "warning" : "default"}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none border-b border-border/70">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`relative px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === item.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
            {item.count ? (
              <span className="ms-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-warning/15 text-warning text-[10px] font-mono">
                {item.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "ledger" ? (
        <PaymentsLedgerTab
          reloadKey={reloadKey}
          onChanged={refreshAll}
          onOpenReceipt={setReceiptId}
        />
      ) : null}
      {tab === "dues" ? <DuesTab reloadKey={reloadKey} onCollect={openRecord} /> : null}
      {tab === "topups" ? <TopupsTab reloadKey={reloadKey} onChanged={refreshAll} /> : null}
      {tab === "shift" ? <CashierShiftTab reloadKey={reloadKey} onChanged={refreshAll} /> : null}
      {tab === "closing" ? <DailyClosingTab reloadKey={reloadKey} onChanged={refreshAll} /> : null}
      {tab === "coupons" ? <CouponsTab isEn={isEn} reloadKey={reloadKey} onChanged={refreshAll} /> : null}
      {tab === "collections" ? <CollectionRateTab isEn={isEn} reloadKey={reloadKey} /> : null}
      {tab === "cockpit" ? <FinanceCockpitTab isEn={isEn} reloadKey={reloadKey} /> : null}
      {tab === "engagement" ? <EngagementTab isEn={isEn} reloadKey={reloadKey} /> : null}

      {recordOpen ? (
        <RecordPaymentModal
          preset={recordPreset}
          onClose={() => {
            setRecordOpen(false);
            setRecordPreset(null);
          }}
          onSaved={refreshAll}
        />
      ) : null}

      {receiptId ? <ReceiptModal paymentId={receiptId} onClose={() => setReceiptId(null)} /> : null}
    </div>
  );
};

export default EducationPaymentsPage;
