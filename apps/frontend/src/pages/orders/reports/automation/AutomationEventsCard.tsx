import React from "react";
import { useTranslation } from "react-i18next";
import { Printer, Truck } from "lucide-react";
import { AutomationEventsSummary } from "./OrderAutomationReportsTypes";

interface AutomationEventsCardProps {
  events: AutomationEventsSummary;
  loading: boolean;
  getStatusName: (code: string) => string;
}

export const AutomationEventsCard: React.FC<AutomationEventsCardProps> = ({
  events,
  loading,
  getStatusName,
}) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
      {/* Print Automation Card */}
      <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
              <Printer className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {t("orders.printAutomationTitle", "أتمتة طباعة الفواتير")}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                تغيير حالة الطلب تلقائياً عند طباعة البوليصة أو الفاتورة
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              events.print.enabled
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                : "bg-muted text-muted-foreground border border-border/70"
            }`}
          >
            {events.print.enabled ? "مفعلة" : "غير مفعلة"}
          </span>
        </div>

        <div className="mt-3.5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted/20 p-2.5 border border-border/40">
            <div className="text-[11px] text-muted-foreground">الحالة المستهدفة</div>
            <div className="mt-1 text-xs font-bold text-foreground truncate">
              {events.print.targetStatus ? getStatusName(events.print.targetStatus) : "غير محددة"}
            </div>
          </div>
          <div className="rounded-lg bg-muted/20 p-2.5 border border-border/40">
            <div className="text-[11px] text-muted-foreground">التحويلات</div>
            <div className="mt-1 text-xs font-bold font-mono tabular-nums text-foreground">
              {loading ? "..." : events.print.executionsCount.toLocaleString("ar-EG")}
            </div>
          </div>
          <div className="rounded-lg bg-muted/20 p-2.5 border border-border/40">
            <div className="text-[11px] text-muted-foreground">القيمة المحولة</div>
            <div className="mt-1 text-xs font-bold font-mono tabular-nums text-foreground">
              {loading ? "..." : `${events.print.totalRevenue.toLocaleString("ar-EG")} ج.م`}
            </div>
          </div>
        </div>
      </div>

      {/* Turbo Automation Card */}
      <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {t("orders.turboAutomationTitle", "أتمتة شحن تربو (Turbo)")}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                تغيير حالة الطلب تلقائياً عند إنشاء شحنة تربو وصدور البوليصة
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              events.turbo.enabled
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                : "bg-muted text-muted-foreground border border-border/70"
            }`}
          >
            {events.turbo.enabled ? "مفعلة" : "غير مفعلة"}
          </span>
        </div>

        <div className="mt-3.5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted/20 p-2.5 border border-border/40">
            <div className="text-[11px] text-muted-foreground">الحالة المستهدفة</div>
            <div className="mt-1 text-xs font-bold text-foreground truncate">
              {events.turbo.targetStatus ? getStatusName(events.turbo.targetStatus) : "غير محددة"}
            </div>
          </div>
          <div className="rounded-lg bg-muted/20 p-2.5 border border-border/40">
            <div className="text-[11px] text-muted-foreground">التحويلات</div>
            <div className="mt-1 text-xs font-bold font-mono tabular-nums text-foreground">
              {loading ? "..." : events.turbo.executionsCount.toLocaleString("ar-EG")}
            </div>
          </div>
          <div className="rounded-lg bg-muted/20 p-2.5 border border-border/40">
            <div className="text-[11px] text-muted-foreground">القيمة المحولة</div>
            <div className="mt-1 text-xs font-bold font-mono tabular-nums text-foreground">
              {loading ? "..." : `${events.turbo.totalRevenue.toLocaleString("ar-EG")} ج.م`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
