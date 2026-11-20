import React from 'react';
import { Star, MessageSquare, ThumbsUp, Frown } from 'lucide-react';
import { FeedbackReportResponse } from '../../../services/shippingReportsService';
import { formatNumber } from './shippingReportsHelpers';

interface Props {
  data: FeedbackReportResponse | null;
  loading: boolean;
}

export const ShippingReportsFeedbackTab: React.FC<Props> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="py-12 flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || !data.summary || data.summary.totalCount === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground dark:text-muted-foreground border border-border dark:border-border rounded-lg bg-white dark:bg-muted">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="font-medium">لا توجد تقييمات عملاء مسجلة في هذه الفترة</p>
        <p className="text-xs text-muted-foreground mt-1">يتم إرسال رابط التقييم تلقائياً للعملاء فور تسليم الشحنة</p>
      </div>
    );
  }

  const { summary, worstShipments } = data;
  const dist = summary.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const positiveCount = (dist[4] || 0) + (dist[5] || 0);
  const positiveRate = summary.totalCount > 0 ? Math.round((positiveCount / summary.totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Average Rating */}
        <div className="p-4 rounded-xl border border-border dark:border-border bg-white dark:bg-muted shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground dark:text-muted-foreground font-medium">متوسط التقييم العام</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold tabular-nums text-foreground dark:text-muted-foreground">
                {summary.averageRating.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">/ 5.0</span>
            </div>
            <div className="flex items-center gap-0.5 mt-1.5 text-warning">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3.5 h-3.5 ${
                    s <= Math.round(summary.averageRating)
                      ? 'fill-amber-400 text-warning'
                      : 'text-slate-200 dark:text-foreground'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-warning/10 dark:bg-warning/40 text-warning flex items-center justify-center">
            <Star className="w-5 h-5 fill-warning text-warning" />
          </div>
        </div>

        {/* Total Feedback Count */}
        <div className="p-4 rounded-xl border border-border dark:border-border bg-white dark:bg-muted shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground dark:text-muted-foreground font-medium">إجمالي التقييمات المستلمة</span>
            <div className="text-2xl font-bold tabular-nums text-foreground dark:text-muted-foreground mt-1">
              {formatNumber(summary.totalCount)}
            </div>
            <span className="text-xs text-muted-foreground mt-1 block">مشاركة مباشرة من المستلمين</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/40 text-primary flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Positive Sentiment Rate */}
        <div className="p-4 rounded-xl border border-border dark:border-border bg-white dark:bg-muted shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground dark:text-muted-foreground font-medium">نسبة الرضا الإيجابي (4-5 نجوم)</span>
            <div className="text-2xl font-bold tabular-nums text-success dark:text-success mt-1">
              {positiveRate}%
            </div>
            <span className="text-xs text-muted-foreground mt-1 block">{formatNumber(positiveCount)} تقييم إيجابي</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-success/10 dark:bg-success/40 text-success flex items-center justify-center">
            <ThumbsUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Distribution Bars */}
      <div className="p-4 rounded-xl border border-border dark:border-border bg-white dark:bg-muted shadow-sm space-y-3">
        <h3 className="text-xs font-semibold text-foreground dark:text-muted-foreground">
          توزيع التقييمات حسب عدد النجوم
        </h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = dist[stars] || 0;
            const pct = summary.totalCount > 0 ? Math.round((count / summary.totalCount) * 100) : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <div className="w-14 flex items-center gap-1 font-semibold text-foreground dark:text-muted-foreground">
                  <span>{stars}</span>
                  <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                </div>
                <div className="flex-1 bg-muted dark:bg-muted h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      stars >= 4 ? 'bg-emerald-500' : stars === 3 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-12 text-left font-semibold tabular-nums text-foreground dark:text-muted-foreground">
                  {pct}%
                </div>
                <div className="w-16 text-left tabular-nums text-muted-foreground">
                  ({formatNumber(count)})
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Worst 10 Shipments Feedback */}
      <div className="border border-border dark:border-border rounded-xl bg-white dark:bg-muted overflow-hidden shadow-sm">
        <div className="p-3.5 bg-muted dark:bg-muted border-b border-border dark:border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Frown className="w-4 h-4 text-destructive" />
            <span className="text-xs font-bold text-foreground dark:text-muted-foreground">
              أقل الشحنات تقييماً للتدخل والمتابعة (Worst 10)
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {worstShipments?.length || 0} شحنات
          </span>
        </div>

        {(!worstShipments || worstShipments.length === 0) ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            لا توجد شحنات بتقييمات منخفضة تستدعي المعالجة
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-muted text-muted-foreground dark:text-muted-foreground font-medium">
                <tr>
                  <th className="py-2.5 px-3">التقييم</th>
                  <th className="py-2.5 px-3">رقم التتبع</th>
                  <th className="py-2.5 px-3">المستلم</th>
                  <th className="py-2.5 px-3">المندوب</th>
                  <th className="py-2.5 px-3">ملاحظة العميل</th>
                  <th className="py-2.5 px-3">الوسوم</th>
                  <th className="py-2.5 px-3">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-border">
                {worstShipments.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-muted">
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        w.rating <= 2
                          ? 'bg-rose-100 text-destructive dark:bg-destructive/60 dark:text-destructive'
                          : 'bg-amber-100 text-warning dark:bg-warning/60 dark:text-warning'
                      }`}>
                        <span>{w.rating}</span>
                        <Star className="w-3 h-3 fill-current" />
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono font-medium text-primary dark:text-primary">
                      {w.trackingNumber}
                    </td>
                    <td className="py-2 px-3 text-foreground dark:text-muted-foreground">
                      {w.recipientName}
                    </td>
                    <td className="py-2 px-3 text-foreground dark:text-muted-foreground">
                      {w.courierName || '—'}
                    </td>
                    <td className="py-2 px-3 text-foreground dark:text-muted-foreground max-w-xs truncate" title={w.comment || ''}>
                      {w.comment || '—'}
                    </td>
                    <td className="py-2 px-3">
                      {Array.isArray(w.tags) && w.tags.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {w.tags.map((tag, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-muted dark:bg-muted rounded text-[10px] text-foreground dark:text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground text-[11px] tabular-nums whitespace-nowrap">
                      {w.submittedAt ? new Date(w.submittedAt).toLocaleDateString('ar-EG') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
