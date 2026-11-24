import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Banknote,
  CalendarCheck,
  CalendarClock,
  Clock,
  CreditCard,
  Plus,
  Receipt,
  RefreshCw,
  Tag,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { fetchSummary } from "./api";
import { KpiCard, money, monthStartInput, todayInput } from "./shared";
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
import { PAYMENT_METHOD_LABELS } from "./types";
import type { PaymentsSummary } from "./types";

type TabKey = "ledger" | "dues" | "topups" | "shift" | "closing" | "coupons" | "collections" | "cockpit" | "engagement";

const TABS: Array<{ key: TabKey; icon: LucideIcon; ar: string; en: string }> = [
  { key: "ledger", icon: Receipt, ar: "سجل المدفوعات", en: "Payments ledger" },
  { key: "dues", icon: Banknote, ar: "المستحقات", en: "Outstanding dues" },
  { key: "topups", icon: Wallet, ar: "طلبات شحن المحفظة", en: "Wallet top-ups" },
  { key: "shift", icon: Clock, ar: "شيفت الكاشير", en: "Cashier shift" },
  { key: "closing", icon: CalendarCheck, ar: "الإغلاق اليومي", en: "Daily closing" },
  { key: "coupons", icon: Tag, ar: "أكواد الخصم", en: "Discount codes" },
  { key: "collections", icon: TrendingUp, ar: "نسبة التحصيل", en: "Collection rate" },
  { key: "cockpit", icon: Activity, ar: "النظرة المالية", en: "Finance cockpit" },
  { key: "engagement", icon: Users, ar: "تفاعل أولياء الأمور", en: "Parent engagement" },
];

const readTabFromUrl = (): TabKey => {
  if (typeof window === "undefined") return "ledger";
  const value = new URLSearchParams(window.location.search).get("tab");
  return TABS.some((tab) => tab.key === value) ? (value as TabKey) : "ledger";
};

const EducationPaymentsPage: React.FC = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const [tab, setTab] = useState<TabKey>(readTabFromUrl);
  const [range, setRange] = useState({ from: monthStartInput(), to: todayInput() });
  const [summary, setSummary] = useState<PaymentsSummary | null>(null);
  const [summaryError, setSummaryError] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [recordPreset, setRecordPreset] = useState<CollectTarget | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [receiptId, setReceiptId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setSummaryLoading(true);
    setSummaryError("");
    fetchSummary(range.from, range.to)
      .then((data) => alive && setSummary(data))
      .catch((e) => alive && setSummaryError(e.message || "فشل جلب الملخص"))
      .finally(() => alive && setSummaryLoading(false));
    return () => {
      alive = false;
    };
  }, [reloadKey, range.from, range.to]);

  const currency = isEn ? "EGP" : "ج.م";

  const refreshAll = useCallback(() => setReloadKey((key) => key + 1), []);

  const handleRangeChange = useCallback((next: { from: string; to: string }) => {
    setRange((prev) => (prev.from === next.from && prev.to === next.to ? prev : next));
  }, []);

  const selectTab = (next: TabKey) => {
    setTab(next);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const openRecord = (preset?: CollectTarget | null) => {
    setRecordPreset(preset || null);
    setRecordOpen(true);
  };

  const methodEntries = Object.entries(summary?.byMethod || {}).filter(([, value]) => value.count > 0);

  return (
    <div
      className="w-full h-full min-h-0 flex-1 overflow-y-auto overflow-x-hidden font-sans"
      dir={isEn ? "ltr" : "rtl"}
    >
      <div className="w-full max-w-[1600px] mx-auto p-3.5 sm:p-5 lg:p-6 pb-24 sm:pb-12 space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
                {isEn ? "Collections & Finance" : "التحصيل والحسابات"}
              </span>
              <span className="text-xs text-muted-foreground font-mono tabular-nums">
                {summaryLoading
                  ? isEn ? "Loading…" : "جارٍ التحميل…"
                  : `${isEn ? "Live ledger" : "دفتر تحصيل مباشر"} · ${money(summary?.today.amount)} ${currency} ${isEn ? "today" : "اليوم"}`}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {isEn ? "Payments & Collections" : "المدفوعات والتحصيل"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isEn
                ? "Collections, outstanding dues and parent wallet top-ups in one ledger linked to the treasury."
                : "التحصيل والمستحقات وطلبات شحن المحفظة في دفتر واحد مربوط بالخزينة."}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={refreshAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 bg-background text-foreground text-xs font-medium hover:bg-muted/50 transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${summaryLoading ? "animate-spin" : ""}`} aria-hidden="true" />
              {isEn ? "Refresh" : "تحديث"}
            </button>
            <button
              type="button"
              onClick={() => openRecord(null)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 active:scale-[0.98] transition-transform"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              {isEn ? "Record payment" : "تسجيل دفعة"}
            </button>
          </div>
        </div>

        {summaryError ? (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-2.5 text-[11px] text-destructive">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{summaryError}</span>
          </div>
        ) : null}

        {/* Telemetry ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <KpiCard
            icon={TrendingUp}
            label={isEn ? "Collected today" : "محصّل اليوم"}
            value={`${money(summary?.today.amount)} ${currency}`}
            sub={`${summary?.today.count || 0} ${isEn ? "payments" : "دفعة"}`}
            tone="success"
            loading={summaryLoading && !summary}
          />
          <KpiCard
            icon={CreditCard}
            label={isEn ? "Collected this month" : "محصّل هذا الشهر"}
            value={`${money(summary?.month.amount)} ${currency}`}
            sub={`${summary?.month.count || 0} ${isEn ? "payments" : "دفعة"}`}
            loading={summaryLoading && !summary}
          />
          <KpiCard
            icon={Receipt}
            label={isEn ? "Collected in range" : "محصّل الفترة"}
            value={`${money(summary?.range.amount)} ${currency}`}
            sub={`\u2066${range.from} → ${range.to}\u2069`}
            loading={summaryLoading && !summary}
          />
          <KpiCard
            icon={Wallet}
            label={isEn ? "Outstanding" : "مستحق غير محصل"}
            value={`${money(summary?.outstanding.amount)} ${currency}`}
            sub={`${summary?.outstanding.count || 0} ${isEn ? "enrollments" : "تسجيل"}`}
            tone="warning"
            loading={summaryLoading && !summary}
          />
          <KpiCard
            icon={AlertTriangle}
            label={isEn ? "Overdue installments" : "أقساط متأخرة"}
            value={`${money(summary?.overdueInstallments.amount)} ${currency}`}
            sub={`${summary?.overdueInstallments.count || 0} ${isEn ? "installments" : "قسط"}`}
            tone={summary?.overdueInstallments.count ? "danger" : "default"}
            loading={summaryLoading && !summary}
          />
          <KpiCard
            icon={CalendarClock}
            label={isEn ? "Pending top-ups" : "طلبات شحن معلقة"}
            value={String(summary?.pendingTopups || 0)}
            sub={isEn ? "need review" : "بانتظار المراجعة"}
            tone={summary?.pendingTopups ? "warning" : "default"}
            loading={summaryLoading && !summary}
          />
        </div>

        {methodEntries.length > 0 ? (
          <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-[11px] text-muted-foreground">
            <span className="font-medium">{isEn ? "By method" : "حسب الطريقة"}:</span>
            {methodEntries.map(([method, value]) => (
              <span key={method} className="inline-flex items-center gap-1">
                <span className="text-foreground">
                  {isEn ? PAYMENT_METHOD_LABELS[method]?.en || method : PAYMENT_METHOD_LABELS[method]?.ar || method}
                </span>
                <span className="font-mono tabular-nums text-foreground">{money(value.amount)}</span>
                <span className="font-mono text-muted-foreground">({value.count})</span>
              </span>
            ))}
          </div>
        ) : null}

        {/* Section tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none border-b border-border/70">
          {TABS.map(({ key, icon: Icon, ar, en }) => {
            const count = key === "topups" ? summary?.pendingTopups : undefined;
            return (
              <button
                key={key}
                type="button"
                onClick={() => selectTab(key)}
                aria-current={tab === key ? "page" : undefined}
                className={`relative inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  tab === key
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                {isEn ? en : ar}
                {count ? (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-warning/15 text-warning text-[10px] font-mono">
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {tab === "ledger" ? (
          <PaymentsLedgerTab
            reloadKey={reloadKey}
            onChanged={refreshAll}
            onOpenReceipt={setReceiptId}
            onRangeChange={handleRangeChange}
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
    </div>
  );
};

export default EducationPaymentsPage;
