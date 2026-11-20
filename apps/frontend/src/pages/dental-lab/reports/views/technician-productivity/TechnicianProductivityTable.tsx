import React from "react";
import { Check } from "lucide-react";
import {
  type TechnicianProductivity,
  ROLE_CONFIG,
  fmtMoney,
} from "../../../shared";
import { tableWrap, thCls, tdCls } from "../../types/reportsTypes";

export interface TechnicianProductivityTableProps {
  rows: TechnicianProductivity[];
}

export const TechnicianProductivityTable: React.FC<TechnicianProductivityTableProps> = ({
  rows,
}) => {
  return (
    <div className={tableWrap}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b dark:border-border bg-muted dark:bg-muted text-muted-foreground dark:text-muted-foreground">
            <th className={thCls}>عضو الفريق</th>
            <th className={thCls}>التخصص / المحطة</th>
            <th className={thCls}>الحالات المسندة</th>
            <th className={thCls}>المراحل المنجزة</th>
            <th className={thCls}>الوحدات المنجزة</th>
            <th className={thCls}>متوسط سرعة الإنجاز</th>
            <th className={thCls}>أجر المرحلة</th>
            <th className={thCls}>إجمالي المستحقات</th>
            <th className={thCls}>الإعادات المرتبطة</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const roleMeta = ROLE_CONFIG[r.role || ""];
            return (
              <tr
                key={r.technicianId ?? r.name ?? "—"}
                className="border-b dark:border-border last:border-b-0 hover:bg-muted dark:hover:bg-muted"
              >
                <td
                  className={`${tdCls} font-semibold text-foreground`}
                >
                  {r.name || "—"}
                </td>
                <td className={tdCls}>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      roleMeta?.color ||
                      "bg-muted text-foreground"
                    }`}
                  >
                    {roleMeta?.label || r.role || "فني"}
                  </span>
                </td>
                <td className={`${tdCls} font-mono tabular-nums`}>
                  {r.assignedCases ?? 0}
                </td>
                <td
                  className={`${tdCls} font-bold text-primary dark:text-primary font-mono tabular-nums`}
                >
                  {r.completedStages ?? 0}
                </td>
                <td
                  className={`${tdCls} font-bold text-primary dark:text-primary font-mono tabular-nums`}
                >
                  {r.completedUnits ?? 0}
                </td>
                <td className={tdCls}>
                  {r.avgHoursPerStage ? (
                    <span className="text-xs text-muted-foreground font-mono tabular-nums">
                      {r.avgHoursPerStage} ساعة (~{r.avgDaysPerStage} يوم)
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className={`${tdCls} font-mono tabular-nums`}>
                  {r.wagePerStage ? `${fmtMoney(r.wagePerStage)} ج.م` : "—"}
                </td>
                <td
                  className={`${tdCls} font-bold text-success dark:text-success font-mono tabular-nums`}
                >
                  {fmtMoney(r.earnedWages ?? 0)} ج.م
                </td>
                <td className={tdCls}>
                  {(r.remakesCount ?? 0) > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-warning text-warning dark:bg-warning/40 dark:text-warning font-mono tabular-nums">
                      {r.remakesCount} إعادات
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-success dark:text-success font-medium">
                      <Check className="w-3.5 h-3.5" />
                      ممتاز (0)
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TechnicianProductivityTable;
