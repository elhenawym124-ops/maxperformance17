import React from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";

export interface QpExpressDirectShipmentCardProps {
  qpSettings: { customerId?: string | number } | null | undefined;
  qpNotes: string;
  setQpNotes: (notes: string) => void;
  loading: boolean;
  onQpExpressDirectShipment: () => void;
}

export const QpExpressDirectShipmentCard: React.FC<QpExpressDirectShipmentCardProps> = React.memo(
  ({
    qpSettings,
    qpNotes,
    setQpNotes,
    loading,
    onQpExpressDirectShipment,
  }) => {
    return (
      <div className="p-3.5 rounded-lg border border-primary dark:border-primary/60 bg-primary/30 dark:bg-primary/20 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-primary dark:text-primary">
            إرسال فوري إلى شركة كيو بي إكسبريس (QP Express)
          </span>
          {qpSettings?.customerId ? (
            <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
              عميل رقم: #{qpSettings.customerId}
            </span>
          ) : (
            <span className="text-[11px] text-success font-medium flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
              متصل
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground dark:dark:text-muted-foreground mb-1">
            ملاحظات المعاينة والتسليم للمندوب:
          </label>
          <input
            type="text"
            value={qpNotes}
            onChange={(e) => setQpNotes(e.target.value)}
            placeholder="مثال: المعاينة في وجود المندوب ولا يوجد استرجاع إلا في حالة عيوب الصناعة"
            className="w-full px-3 py-2 text-xs border border-border dark:dark:border-border rounded-lg bg-white dark:dark:bg-muted text-foreground dark:text-white focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={onQpExpressDirectShipment}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-primary text-white hover:bg-primary disabled:opacity-50 transition shadow-xs flex items-center justify-center gap-2 active:scale-97"
          >
            <PaperAirplaneIcon className="h-4 w-4 rotate-180" />
            <span>
              {loading
                ? "جاري الإرسال وتوليد البوليصة..."
                : "إرسال إلى كيو بي إكسبريس وتوليد البوليصة"}
            </span>
          </button>
        </div>
      </div>
    );
  }
);

QpExpressDirectShipmentCard.displayName = "QpExpressDirectShipmentCard";
