import React, { useState } from "react";
import {
  CommandLineIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { SimulatorEventType, SimulatorResult } from "../types";

interface RealtimeSimulatorTerminalProps {
  pixelId: string;
  hasCapiToken: boolean;
  testCode: string;
  onUpdateTestCode: (code: string) => void;
  onSendEvent: (params: {
    eventName: SimulatorEventType;
    value: number;
    contentName: string;
  }) => Promise<SimulatorResult | null>;
  isSending: boolean;
  recentEvents: SimulatorResult[];
}

export const RealtimeSimulatorTerminal: React.FC<RealtimeSimulatorTerminalProps> = ({
  pixelId,
  hasCapiToken,
  testCode,
  onUpdateTestCode,
  onSendEvent,
  isSending,
  recentEvents,
}) => {
  const [selectedEvent, setSelectedEvent] = useState<SimulatorEventType>("Purchase");
  const [value, setValue] = useState(150);
  const [contentName, setContentName] = useState("قميص كلاسيكي تجريبي للتأكد من الربط");
  const [result, setResult] = useState<SimulatorResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await onSendEvent({
      eventName: selectedEvent,
      value,
      contentName,
    });
    if (res) {
      setResult(res);
    }
  };

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isReady = Boolean(pixelId) && hasCapiToken;

  return (
    <section className="border border-border dark:border-border bg-white dark:bg-muted rounded-xl overflow-hidden shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-border dark:border-border bg-muted dark:bg-muted">
        <div className="flex items-center gap-2">
          <CommandLineIcon className="w-4 h-4 text-primary" />
          <h2 className="text-sm sm:text-base font-bold text-foreground">
            طرفية اختبار الأحداث اللحظية (Meta v26.0 Event Console)
          </h2>
        </div>

        <a
          href="https://business.facebook.com/events_manager2"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary dark:text-primary font-medium"
        >
          <span>معاينة في Meta Test Events</span>
          <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Event Selector */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                الحدث التجريبي
              </label>
              <select
                value={selectedEvent}
                onChange={(e) =>
                  setSelectedEvent(e.target.value as SimulatorEventType)
                }
                className="w-full px-3 py-2 rounded-lg border border-border dark:border-border bg-card text-foreground text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[38px]"
              >
                <option value="Purchase">Purchase (إتمام الشراء)</option>
                <option value="AddToCart">AddToCart (إضافة للسلة)</option>
                <option value="InitiateCheckout">InitiateCheckout (بدء الطلب)</option>
                <option value="ViewContent">ViewContent (عرض منتج)</option>
                <option value="PageView">PageView (عرض صفحة)</option>
              </select>
            </div>

            {/* Event Value */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                القيمة النقدية (Value)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border dark:border-border bg-card text-foreground text-xs font-mono tabular-nums focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[38px] ps-10"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted-foreground">
                  EGP
                </span>
              </div>
            </div>

            {/* Test Event Code */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Test Event Code (من فيسبوك)
              </label>
              <input
                type="text"
                dir="ltr"
                value={testCode}
                onChange={(e) => onUpdateTestCode(e.target.value.trim())}
                placeholder="TEST12345"
                className="w-full px-3 py-2 rounded-lg border border-border dark:border-border bg-card text-foreground text-xs font-mono uppercase focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[38px]"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={contentName}
                onChange={(e) => setContentName(e.target.value)}
                placeholder="اسم المنتج أو المحتوى التجريبي"
                className="w-full px-3 py-2 rounded-lg border border-border dark:border-border bg-card text-foreground text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[38px]"
              />
            </div>

            <button
              type="submit"
              disabled={isSending || !isReady}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-white transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[38px] shadow-xs"
            >
              {isSending ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  <span>جاري الإرسال لـ Meta…</span>
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-4 h-4" />
                  <span>إرسال الحدث فورياً</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Real-time Response Output */}
        {result && (
          <div className="p-3.5 rounded-lg bg-muted text-muted-foreground font-mono text-xs border border-border space-y-2">
            <div className="flex items-center justify-between border-b border-border pb-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5 text-success font-semibold">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                <span>200 OK — تم استلام الحدث بنجاح في Meta Conversions API</span>
              </span>
              <span className="tabular-nums">{result.timestamp}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
              <div>
                <span className="text-gray-500">Event: </span>
                <span className="text-white font-bold">{result.eventName}</span>
              </div>
              <div className="truncate flex items-center gap-1">
                <span className="text-gray-500">Event ID: </span>
                <span className="text-amber-300 tabular-nums">{result.eventId}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(result.eventId)}
                  className="p-0.5 text-muted-foreground hover:text-white"
                  title="نسخ"
                >
                  {copiedId === result.eventId ? (
                    <CheckIcon className="w-3 h-3 text-success" />
                  ) : (
                    <ClipboardDocumentIcon className="w-3 h-3" />
                  )}
                </button>
              </div>
              {result.testEventCode && (
                <div>
                  <span className="text-gray-500">Test Code: </span>
                  <span className="text-cyan-300">{result.testEventCode}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Events Stream Table */}
        {recentEvents.length > 1 && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground">
                سجل تدفق الأحداث الأخيرة في الجلسة (Session Event Log)
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {recentEvents.length} أحداث
              </span>
            </div>

            <div className="border border-border dark:border-border rounded-lg overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-muted border-b border-border dark:border-border text-[11px] text-muted-foreground">
                    <th className="px-3 py-2">الحدث</th>
                    <th className="px-3 py-2">معرف الحدث (Event ID)</th>
                    <th className="px-3 py-2 text-center">الوقت</th>
                    <th className="px-3 py-2 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-border font-mono text-[11px]">
                  {recentEvents.map((ev, idx) => (
                    <tr key={ev.eventId + idx} className="hover:bg-gray-50/50 dark:hover:bg-muted">
                      <td className="px-3 py-2 font-bold text-foreground">
                        {ev.eventName}
                      </td>
                      <td className="px-3 py-2 text-warning dark:text-warning">
                        {ev.eventId}
                      </td>
                      <td className="px-3 py-2 text-center tabular-nums text-muted-foreground">
                        {ev.timestamp}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success dark:bg-success/40 dark:text-success border border-success/60 font-sans font-semibold">
                          Processed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
