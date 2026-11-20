import React from 'react';
import { AgentReportBreakdown, WorkspaceReportsData } from './useWorkspaceReports';

interface ReportsBreakdownTableProps {
  agentBreakdown: AgentReportBreakdown[];
  kpis: WorkspaceReportsData['kpis'];
  isManager: boolean;
  isArabic: boolean;
}

export const ReportsBreakdownTable: React.FC<ReportsBreakdownTableProps> = ({
  agentBreakdown,
  kpis,
  isManager,
  isArabic,
}) => {
  const formatSeconds = (totalSecs: number) => {
    if (!totalSecs || totalSecs <= 0) return isArabic ? '0 ث' : '0s';
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins === 0) return isArabic ? `${secs} ث` : `${secs}s`;
    return isArabic ? `${mins} د ${secs > 0 ? `${secs} ث` : ''}` : `${mins}m ${secs > 0 ? `${secs}s` : ''}`;
  };

  const formatHandlingMinutes = (mins: number) => {
    if (!mins || mins <= 0) return isArabic ? '0 دقيقة' : '0 min';
    if (mins < 60) return isArabic ? `${mins} دقيقة` : `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return isArabic ? `${hrs} س ${remMins > 0 ? `${remMins} د` : ''}` : `${hrs}h ${remMins > 0 ? `${remMins}m` : ''}`;
  };

  return (
    <div className="rounded-lg border border-border/50 bg-card shadow-xs overflow-hidden dark:dark:border-border dark:dark:bg-muted">
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5 bg-muted/20 dark:dark:border-border dark:dark:bg-muted">
        <span className="text-xs font-bold text-foreground dark:dark:text-muted-foreground">
          {isManager
            ? isArabic ? 'تفاصيل أداء فريق التأكيد' : 'Confirmation Team Breakdown'
            : isArabic ? 'تفاصيل أدائي الفردي' : 'My Individual Performance'}
        </span>
        <span className="text-[11px] font-medium text-muted-foreground tabular-nums dark:dark:text-muted-foreground">
          {agentBreakdown.length} {isArabic ? 'وكيل' : 'agents'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/40 bg-muted/30 text-muted-foreground font-semibold dark:dark:border-border dark:dark:bg-muted dark:dark:text-muted-foreground">
              <th className="py-2.5 px-3 text-start">{isArabic ? 'الوكيل' : 'Agent'}</th>
              <th className="py-2.5 px-3 text-center">{isArabic ? 'تواصل بها' : 'Contacted'}</th>
              <th className="py-2.5 px-3 text-center">{isArabic ? 'مؤكدة' : 'Confirmed'}</th>
              <th className="py-2.5 px-3 text-center">{isArabic ? 'نسبة التأكيد' : 'Conf. Rate'}</th>
              <th className="py-2.5 px-3 text-center">{isArabic ? 'مؤجلة' : 'Follow-up'}</th>
              <th className="py-2.5 px-3 text-center">{isArabic ? 'ملغية' : 'Cancelled'}</th>
              <th className="py-2.5 px-3 text-center">{isArabic ? 'مفتوحة الآن' : 'Open'}</th>
              <th className="py-2.5 px-3 text-center">{isArabic ? 'المكالمات' : 'Calls'}</th>
              <th className="py-2.5 px-3 text-center">{isArabic ? 'المدة' : 'Duration'}</th>
              <th className="py-2.5 px-3 text-center">{isArabic ? 'المحاولات/طلب' : 'Attempts/Ord'}</th>
              <th className="py-2.5 px-3 text-center">{isArabic ? 'زمن المعالجة' : 'Handling Time'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30 dark:dark:divide-border">
            {agentBreakdown.map((row) => (
              <tr
                key={row.agentId}
                className="hover:bg-muted/40 transition-colors dark:hover:dark:hover:bg-muted"
              >
                <td className="py-2.5 px-3 font-semibold text-foreground dark:dark:text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span>{row.agentName}</span>
                    {row.role && (
                      <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground font-normal dark:dark:bg-muted dark:dark:text-muted-foreground">
                        {row.role}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-center font-bold tabular-nums text-foreground dark:dark:text-muted-foreground">
                  {row.contactedOrders}
                </td>
                <td className="py-2.5 px-3 text-center font-bold tabular-nums text-success dark:text-success">
                  {row.confirmedOrders}
                </td>
                <td className="py-2.5 px-3 text-center font-bold tabular-nums dark:dark:text-muted-foreground">
                  {row.confirmationRate}%
                </td>
                <td className="py-2.5 px-3 text-center font-medium tabular-nums text-warning dark:text-warning">
                  {row.followUpOrders}
                </td>
                <td className="py-2.5 px-3 text-center font-medium tabular-nums text-destructive dark:text-destructive">
                  {row.cancelledOrders}
                </td>
                <td className="py-2.5 px-3 text-center font-medium tabular-nums text-foreground dark:dark:text-muted-foreground">
                  {row.openOrders}
                </td>
                <td className="py-2.5 px-3 text-center font-medium tabular-nums text-foreground dark:dark:text-muted-foreground">
                  {row.totalCalls}
                </td>
                <td className="py-2.5 px-3 text-center font-medium tabular-nums text-muted-foreground dark:dark:text-muted-foreground">
                  {formatSeconds(row.totalDurationSeconds)}
                </td>
                <td className="py-2.5 px-3 text-center font-medium tabular-nums text-foreground dark:dark:text-muted-foreground">
                  {row.avgAttemptsPerOrder}
                </td>
                <td className="py-2.5 px-3 text-center font-medium tabular-nums text-muted-foreground dark:dark:text-muted-foreground">
                  {formatHandlingMinutes(row.avgHandlingTimeMinutes)}
                </td>
              </tr>
            ))}
          </tbody>
          {/* Table Footer: Totals */}
          {agentBreakdown.length > 1 && (
            <tfoot>
              <tr className="border-t-2 border-border/60 bg-muted/20 font-bold dark:dark:border-border dark:dark:bg-muted">
                <td className="py-2.5 px-3 text-foreground dark:dark:text-muted-foreground">{isArabic ? 'إجمالي الفريق' : 'Team Total'}</td>
                <td className="py-2.5 px-3 text-center tabular-nums text-foreground dark:dark:text-muted-foreground">
                  {kpis.contactedOrders.value}
                </td>
                <td className="py-2.5 px-3 text-center tabular-nums text-success dark:text-success">
                  {kpis.confirmedOrders.value}
                </td>
                <td className="py-2.5 px-3 text-center tabular-nums text-foreground dark:dark:text-muted-foreground">
                  {kpis.confirmationRate.value}%
                </td>
                <td className="py-2.5 px-3 text-center tabular-nums text-warning dark:text-warning">
                  {kpis.followUpOrders.value}
                </td>
                <td className="py-2.5 px-3 text-center tabular-nums text-destructive dark:text-destructive">
                  {kpis.cancelledOrders.value}
                </td>
                <td className="py-2.5 px-3 text-center tabular-nums text-foreground dark:dark:text-muted-foreground">
                  {kpis.openOrders.value}
                </td>
                <td className="py-2.5 px-3 text-center tabular-nums text-foreground dark:dark:text-muted-foreground">
                  {kpis.totalCalls.value}
                </td>
                <td className="py-2.5 px-3 text-center tabular-nums text-muted-foreground dark:dark:text-muted-foreground">
                  {formatSeconds(kpis.totalDurationSeconds.value)}
                </td>
                <td className="py-2.5 px-3 text-center tabular-nums text-foreground dark:dark:text-muted-foreground">
                  {kpis.avgAttemptsPerOrder.value}
                </td>
                <td className="py-2.5 px-3 text-center tabular-nums text-muted-foreground dark:dark:text-muted-foreground">
                  {formatHandlingMinutes(kpis.avgHandlingTimeMinutes.value)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
