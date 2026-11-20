import React from 'react';
import {
  PhoneIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  InboxIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { WorkspaceReportsData } from './useWorkspaceReports';

interface ReportsKpiCardsProps {
  kpis: WorkspaceReportsData['kpis'];
  isArabic: boolean;
}

export const ReportsKpiCards: React.FC<ReportsKpiCardsProps> = ({ kpis, isArabic }) => {
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

  const renderDelta = (deltaPercent?: number, prevValue?: number) => {
    if (deltaPercent === undefined || prevValue === undefined) return null;
    const isPositive = deltaPercent > 0;
    const isNeutral = deltaPercent === 0;

    return (
      <div
        className={`flex items-center gap-1 text-[11px] font-semibold tabular-nums ${
          isNeutral
            ? 'text-muted-foreground dark:dark:text-muted-foreground'
            : isPositive
            ? 'text-success dark:text-success'
            : 'text-destructive dark:text-destructive'
        }`}
        title={isArabic ? `السابق: ${prevValue}` : `Previous: ${prevValue}`}
      >
        {isPositive ? (
          <ArrowTrendingUpIcon className="h-3 w-3" />
        ) : isNeutral ? null : (
          <ArrowTrendingDownIcon className="h-3 w-3" />
        )}
        <span>
          {isPositive ? '+' : ''}
          {deltaPercent}%
        </span>
        <span className="text-[10px] text-muted-foreground/80 font-normal dark:dark:text-muted-foreground">
          ({isArabic ? 'سابق' : 'prev'}: {prevValue})
        </span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
      {/* 1. Contacted Orders */}
      <div className="flex flex-col justify-between rounded-lg border border-border/50 bg-card p-3 shadow-xs transition-all hover:border-border dark:dark:border-border dark:dark:bg-muted dark:hover:dark:hover:border-border">
        <div className="flex items-center justify-between gap-1 text-muted-foreground pb-1 dark:dark:text-muted-foreground">
          <span className="text-xs font-semibold">{isArabic ? 'أوردرات تم التواصل بها' : 'Contacted Orders'}</span>
          <PhoneIcon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground dark:dark:text-muted-foreground">
            {kpis.contactedOrders.value}
          </span>
          {renderDelta(kpis.contactedOrders.deltaPercent, kpis.contactedOrders.prevValue)}
        </div>
        <div className="mt-1 text-[10px] font-medium text-muted-foreground/80 truncate dark:dark:text-muted-foreground" title={kpis.contactedOrders.source}>
          {isArabic ? 'المصدر: call_attempt_logs' : 'source: call_attempt_logs'}
        </div>
      </div>

      {/* 2. Confirmed Orders */}
      <div className="flex flex-col justify-between rounded-lg border border-border/50 bg-card p-3 shadow-xs transition-all hover:border-border dark:dark:border-border dark:dark:bg-muted dark:hover:dark:hover:border-border">
        <div className="flex items-center justify-between gap-1 text-muted-foreground pb-1 dark:dark:text-muted-foreground">
          <span className="text-xs font-semibold">{isArabic ? 'طلبات مؤكدة' : 'Confirmed Orders'}</span>
          <CheckCircleIcon className="h-4 w-4 text-success" />
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-2xl font-bold tracking-tight tabular-nums text-success dark:text-success">
            {kpis.confirmedOrders.value}
          </span>
          {renderDelta(kpis.confirmedOrders.deltaPercent, kpis.confirmedOrders.prevValue)}
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] font-medium text-muted-foreground/80 dark:dark:text-muted-foreground">
          <span className="truncate">{isArabic ? 'المصدر: orders.CONFIRMED' : 'source: orders.CONFIRMED'}</span>
          <span className="font-bold text-foreground tabular-nums dark:dark:text-muted-foreground">
            {kpis.confirmationRate.value}% {isArabic ? 'نجاح' : 'rate'}
          </span>
        </div>
      </div>

      {/* 3. Follow-up Orders */}
      <div className="flex flex-col justify-between rounded-lg border border-border/50 bg-card p-3 shadow-xs transition-all hover:border-border dark:dark:border-border dark:dark:bg-muted dark:hover:dark:hover:border-border">
        <div className="flex items-center justify-between gap-1 text-muted-foreground pb-1 dark:dark:text-muted-foreground">
          <span className="text-xs font-semibold">{isArabic ? 'طلبات متابعة لاحقة' : 'Follow-up Orders'}</span>
          <ClockIcon className="h-4 w-4 text-warning" />
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-2xl font-bold tracking-tight tabular-nums text-warning dark:text-warning">
            {kpis.followUpOrders.value}
          </span>
          {renderDelta(kpis.followUpOrders.deltaPercent, kpis.followUpOrders.prevValue)}
        </div>
        <div className="mt-1 text-[10px] font-medium text-muted-foreground/80 truncate dark:dark:text-muted-foreground">
          {isArabic ? 'المصدر: callback / followUpDate' : 'source: callback / followUpDate'}
        </div>
      </div>

      {/* 4. Cancelled Orders */}
      <div className="flex flex-col justify-between rounded-lg border border-border/50 bg-card p-3 shadow-xs transition-all hover:border-border dark:dark:border-border dark:dark:bg-muted dark:hover:dark:hover:border-border">
        <div className="flex items-center justify-between gap-1 text-muted-foreground pb-1 dark:dark:text-muted-foreground">
          <span className="text-xs font-semibold">{isArabic ? 'طلبات ملغية' : 'Cancelled Orders'}</span>
          <XCircleIcon className="h-4 w-4 text-destructive" />
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-2xl font-bold tracking-tight tabular-nums text-destructive dark:text-destructive">
            {kpis.cancelledOrders.value}
          </span>
          {renderDelta(kpis.cancelledOrders.deltaPercent, kpis.cancelledOrders.prevValue)}
        </div>
        <div className="mt-1 text-[10px] font-medium text-muted-foreground/80 truncate dark:dark:text-muted-foreground">
          {isArabic ? 'المصدر: orders.CANCELLED' : 'source: orders.CANCELLED'}
        </div>
      </div>

      {/* 5. Currently Open Orders */}
      <div className="flex flex-col justify-between rounded-lg border border-border/50 bg-card p-3 shadow-xs transition-all hover:border-border dark:dark:border-border dark:dark:bg-muted dark:hover:dark:hover:border-border">
        <div className="flex items-center justify-between gap-1 text-muted-foreground pb-1 dark:dark:text-muted-foreground">
          <span className="text-xs font-semibold">{isArabic ? 'أوردرات مفتوحة الآن' : 'Open Orders Now'}</span>
          <InboxIcon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground dark:dark:text-muted-foreground">
            {kpis.openOrders.value}
          </span>
          <span className="text-[10px] rounded bg-primary/10 text-primary dark:bg-primary/50 dark:text-primary px-1.5 py-0.5 font-semibold">
            {isArabic ? 'قيد العمل' : 'active'}
          </span>
        </div>
        <div className="mt-1 text-[10px] font-medium text-muted-foreground/80 truncate dark:dark:text-muted-foreground">
          {isArabic ? 'المصدر: order_assignments' : 'source: order_assignments'}
        </div>
      </div>

      {/* 6. Total Calls and Duration */}
      <div className="flex flex-col justify-between rounded-lg border border-border/50 bg-card p-3 shadow-xs transition-all hover:border-border dark:dark:border-border dark:dark:bg-muted dark:hover:dark:hover:border-border">
        <div className="flex items-center justify-between gap-1 text-muted-foreground pb-1 dark:dark:text-muted-foreground">
          <span className="text-xs font-semibold">{isArabic ? 'المكالمات ومجموع مدتها' : 'Calls & Total Duration'}</span>
          <PhoneIcon className="h-4 w-4 text-info" />
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xl font-bold tracking-tight tabular-nums text-foreground dark:dark:text-muted-foreground">
            {kpis.totalCalls.value} <span className="text-xs font-normal text-muted-foreground dark:dark:text-muted-foreground">{isArabic ? 'اتصال' : 'calls'}</span>
          </span>
          <span className="text-xs font-bold text-info dark:text-info tabular-nums">
            {formatSeconds(kpis.totalDurationSeconds.value)}
          </span>
        </div>
        <div className="mt-1 text-[10px] font-medium text-muted-foreground/80 truncate dark:dark:text-muted-foreground">
          {isArabic ? 'المصدر: call_attempt_logs.duration' : 'source: call_attempt_logs.duration'}
        </div>
      </div>

      {/* 7. Avg Attempts Per Order */}
      <div className="flex flex-col justify-between rounded-lg border border-border/50 bg-card p-3 shadow-xs transition-all hover:border-border dark:dark:border-border dark:dark:bg-muted dark:hover:dark:hover:border-border">
        <div className="flex items-center justify-between gap-1 text-muted-foreground pb-1 dark:dark:text-muted-foreground">
          <span className="text-xs font-semibold">{isArabic ? 'متوسط المحاولات / طلب' : 'Avg Attempts / Order'}</span>
          <ChartBarIcon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground dark:dark:text-muted-foreground">
            {kpis.avgAttemptsPerOrder.value}
          </span>
          <span className="text-xs font-medium text-muted-foreground dark:dark:text-muted-foreground">
            {isArabic ? 'محاولة' : 'att.'}
          </span>
        </div>
        <div className="mt-1 text-[10px] font-medium text-muted-foreground/80 truncate dark:dark:text-muted-foreground">
          {isArabic ? 'المصدر: إجمالي المكالمات ÷ الطلبات' : 'source: calls ÷ contacted orders'}
        </div>
      </div>

      {/* 8. Avg Handling Time */}
      <div className="flex flex-col justify-between rounded-lg border border-border/50 bg-card p-3 shadow-xs transition-all hover:border-border dark:dark:border-border dark:dark:bg-muted dark:hover:dark:hover:border-border">
        <div className="flex items-center justify-between gap-1 text-muted-foreground pb-1 dark:dark:text-muted-foreground">
          <span className="text-xs font-semibold">{isArabic ? 'متوسط زمن المعالجة' : 'Avg Handling Time'}</span>
          <ClockIcon className="h-4 w-4 text-success" />
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xl font-bold tracking-tight tabular-nums text-foreground dark:dark:text-muted-foreground">
            {formatHandlingMinutes(kpis.avgHandlingTimeMinutes.value)}
          </span>
          <span className="text-[10px] text-muted-foreground dark:dark:text-muted-foreground">
            {isArabic ? 'من الاستلام للتأكيد' : 'assign to confirm'}
          </span>
        </div>
        <div className="mt-1 text-[10px] font-medium text-muted-foreground/80 truncate dark:dark:text-muted-foreground">
          {isArabic ? 'المصدر: orders (confirmedAt - createdAt)' : 'source: orders (confirmedAt - createdAt)'}
        </div>
      </div>
    </div>
  );
};
