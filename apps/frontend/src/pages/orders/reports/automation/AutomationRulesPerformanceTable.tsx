import React from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Clock, CheckCircle2, XCircle, AlertCircle, PlayCircle } from "lucide-react";
import { AutomationRulePerformance } from "./OrderAutomationReportsTypes";

interface AutomationRulesPerformanceTableProps {
  rules: AutomationRulePerformance[];
  loading: boolean;
  getStatusName: (code: string) => string;
}

export const AutomationRulesPerformanceTable: React.FC<AutomationRulesPerformanceTableProps> = ({
  rules,
  loading,
  getStatusName,
}) => {
  const { t } = useTranslation();

  const formatWaitTime = (waitTime: number, timeUnit: string) => {
    const unitMap: Record<string, string> = {
      Minutes: "دقيقة",
      Hours: "ساعة",
      Days: "يوم",
    };
    return `${waitTime} ${unitMap[timeUnit] || timeUnit}`;
  };

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-2xs">
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div>
          <h2 className="text-sm font-bold text-foreground">
            {t("orders.rulesPerformanceTitle", "أداء القواعد الزمنية (Time-based Rules)")}
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {t(
              "orders.rulesPerformanceDesc",
              "إحصائيات تنفيذ القواعد المجدولة، قيمة المبيعات المحولة، وطابور الانتظار الحالي"
            )}
          </p>
        </div>
        <span className="flex h-5 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-mono tabular-nums font-bold text-primary">
          {rules.length} قواعد
        </span>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">
          {t("common.loading", "جاري التحميل...")}
        </div>
      ) : rules.length === 0 ? (
        <div className="py-10 text-center text-xs text-muted-foreground">
          {t("orders.noRulesFound", "لا توجد قواعد أتمتة زمنية مضافة حالياً")}
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-border/50 text-[11px] font-semibold text-muted-foreground">
                <th className="pb-2.5 ps-2">{t("orders.ruleFlow", "مسار التحويل")}</th>
                <th className="pb-2.5 px-3">{t("orders.waitTime", "مدة الانتظار")}</th>
                <th className="pb-2.5 px-3">{t("orders.executions", "التحويلات المنفذة")}</th>
                <th className="pb-2.5 px-3">{t("orders.ruleRevenue", "القيمة الإجمالية")}</th>
                <th className="pb-2.5 px-3">{t("orders.currentPending", "في الطابور الآن")}</th>
                <th className="pb-2.5 px-3">{t("orders.ruleOutcomes", "المآل النهائي")}</th>
                <th className="pb-2.5 pe-2">{t("orders.ruleStatus", "الحالة")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {rules.map((rule) => {
                const totalOutcomes = rule.outcomes.delivered + rule.outcomes.cancelled + rule.outcomes.inProgress;
                const deliveryRate = totalOutcomes > 0 ? Math.round((rule.outcomes.delivered / totalOutcomes) * 100) : 0;

                return (
                  <tr key={rule.id} className="transition-colors hover:bg-muted/30">
                    {/* Flow */}
                    <td className="py-3 ps-2">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        <span className="inline-flex items-center rounded-md border border-border/70 bg-muted/30 px-2 py-0.5 text-[11px]">
                          {getStatusName(rule.fromStatus)}
                        </span>
                        <ArrowLeft className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 text-primary px-2 py-0.5 text-[11px]">
                          {getStatusName(rule.toStatus)}
                        </span>
                      </div>
                    </td>

                    {/* Wait Time */}
                    <td className="py-3 px-3">
                      <div className="inline-flex items-center gap-1 text-[11px] font-mono tabular-nums text-muted-foreground">
                        <Clock className="h-3 w-3 text-primary shrink-0" />
                        <span>{formatWaitTime(rule.waitTime, rule.timeUnit)}</span>
                      </div>
                    </td>

                    {/* Executions */}
                    <td className="py-3 px-3">
                      <span className="font-mono tabular-nums font-bold text-foreground">
                        {rule.executionsCount.toLocaleString("ar-EG")}
                      </span>
                    </td>

                    {/* Revenue */}
                    <td className="py-3 px-3 font-mono tabular-nums text-foreground">
                      {rule.totalRevenue.toLocaleString("ar-EG")} ج.م
                    </td>

                    {/* Current Pending */}
                    <td className="py-3 px-3">
                      {rule.pendingCount > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-mono tabular-nums font-bold text-amber-500">
                          <PlayCircle className="h-3 w-3" />
                          {rule.pendingCount} في الانتظار
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">0 طلب</span>
                      )}
                    </td>

                    {/* Outcomes */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span
                          className="inline-flex items-center gap-0.5 text-emerald-500 font-mono tabular-nums font-semibold"
                          title="تم التوصيل"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {rule.outcomes.delivered} ({deliveryRate}%)
                        </span>
                        <span
                          className="inline-flex items-center gap-0.5 text-destructive font-mono tabular-nums font-semibold"
                          title="ملغي / مرتجع"
                        >
                          <XCircle className="h-3 w-3" />
                          {rule.outcomes.cancelled}
                        </span>
                      </div>
                    </td>

                    {/* Active Status */}
                    <td className="py-3 pe-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          rule.isActive
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-muted text-muted-foreground border border-border/70"
                        }`}
                      >
                        {rule.isActive ? "نشط" : "معطل"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
