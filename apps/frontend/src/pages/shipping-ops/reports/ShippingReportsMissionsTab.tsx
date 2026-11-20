import React, { useState, useMemo } from 'react';
import { Search, Navigation, CheckCircle2, DollarSign, Clock } from 'lucide-react';
import { MissionsReportResponse } from '../../../services/shippingReportsService';
import { formatNumber, formatCurrency } from './shippingReportsHelpers';

interface Props {
  data: MissionsReportResponse | null;
  loading: boolean;
}

export const ShippingReportsMissionsTab: React.FC<Props> = ({ data, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRows = useMemo(() => {
    if (!data?.rows) return [];
    if (!searchTerm.trim()) return data.rows;
    const q = searchTerm.trim().toLowerCase();
    return data.rows.filter(
      (r) =>
        r.runNumber.toLowerCase().includes(q) ||
        r.courierName.toLowerCase().includes(q)
    );
  }, [data?.rows, searchTerm]);

  if (loading) {
    return (
      <div className="py-12 flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || !data.rows || data.rows.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground dark:text-muted-foreground border border-border dark:border-border rounded-lg bg-white dark:bg-muted">
        <Navigation className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="font-medium">لا توجد رحلات توصيل مسجلة في هذه الفترة</p>
      </div>
    );
  }

  const { totals } = data;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-border dark:border-border bg-white dark:bg-muted">
          <span className="text-[11px] text-muted-foreground font-medium">إجمالي الرحلات</span>
          <div className="text-xl font-bold tabular-nums text-foreground dark:text-muted-foreground mt-0.5">
            {formatNumber(totals.totalRuns)} <span className="text-xs font-normal text-muted-foreground">رحلة</span>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-border dark:border-border bg-white dark:bg-muted">
          <span className="text-[11px] text-success dark:text-success font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            شحنات مسلّمة بالرحلات
          </span>
          <div className="text-xl font-bold tabular-nums text-success dark:text-success mt-0.5">
            {formatNumber(totals.delivered)} / {formatNumber(totals.totalShipments)}
          </div>
        </div>

        <div className="p-3 rounded-lg border border-border dark:border-border bg-white dark:bg-muted">
          <span className="text-[11px] text-success dark:text-success font-medium flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            إجمالي التحصيل الفعلي
          </span>
          <div className="text-xl font-bold tabular-nums text-success dark:text-success mt-0.5">
            {formatCurrency(totals.collectedAmount)}
          </div>
        </div>

        <div className="p-3 rounded-lg border border-border dark:border-border bg-white dark:bg-muted">
          <span className="text-[11px] text-primary dark:text-primary font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            متوسط مدة الرحلة
          </span>
          <div className="text-xl font-bold tabular-nums text-primary dark:text-primary mt-0.5">
            {Math.round(totals.avgDurationMinutes)} <span className="text-xs font-normal text-muted-foreground">دقيقة</span>
          </div>
        </div>
      </div>

      {/* Search Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="بحث برقم الرحلة أو المندوب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pe-8 ps-3 py-1.5 rounded-lg border border-border dark:border-border bg-white dark:bg-muted text-foreground dark:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="text-xs text-muted-foreground dark:text-muted-foreground">
          عدد الرحلات: <span className="font-semibold tabular-nums text-foreground dark:text-muted-foreground">{filteredRows.length}</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="border border-border dark:border-border rounded-lg bg-white dark:bg-muted overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-muted text-foreground dark:text-muted-foreground border-b border-border dark:border-border font-medium">
              <tr>
                <th className="py-3 px-4">رقم الرحلة</th>
                <th className="py-3 px-4">المندوب</th>
                <th className="py-3 px-4 text-center">الشحنات</th>
                <th className="py-3 px-4 text-center text-success dark:text-success">مسلّمة</th>
                <th className="py-3 px-4 text-center text-destructive dark:text-destructive">فاشلة</th>
                <th className="py-3 px-4 text-center">التحصيل (ج.م)</th>
                <th className="py-3 px-4 text-center">المدة</th>
                <th className="py-3 px-4 text-center">الحالة</th>
                <th className="py-3 px-4">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border">
              {filteredRows.map((row) => (
                <tr key={row.runId} className="hover:bg-slate-50/50 dark:hover:bg-muted">
                  <td className="py-2.5 px-4 font-mono font-bold text-primary dark:text-primary">
                    {row.runNumber}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="font-semibold text-foreground dark:text-muted-foreground">{row.courierName}</div>
                    {row.courierPhone && (
                      <div className="text-[11px] text-muted-foreground font-mono" dir="ltr">{row.courierPhone}</div>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center tabular-nums font-semibold text-foreground dark:text-muted-foreground">
                    {formatNumber(row.shipments)}
                  </td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-success dark:text-success font-medium">
                    {formatNumber(row.delivered)}
                  </td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-destructive dark:text-destructive font-medium">
                    {formatNumber(row.failed)}
                  </td>
                  <td className="py-2.5 px-4 text-center tabular-nums font-semibold text-foreground dark:text-muted-foreground">
                    {formatCurrency(row.collectedAmount)}
                  </td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-foreground dark:text-muted-foreground">
                    {Math.round(row.durationMinutes)} دقيقة
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-foreground dark:bg-muted dark:text-muted-foreground">
                      {row.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground text-[11px] tabular-nums whitespace-nowrap">
                    {row.createdAt ? new Date(row.createdAt).toLocaleDateString('ar-EG') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-muted font-bold border-t border-border dark:border-border">
              <tr>
                <td colSpan={2} className="py-3 px-4 text-foreground dark:text-muted-foreground">
                  الإجمالي العام
                </td>
                <td className="py-3 px-4 text-center tabular-nums text-foreground dark:text-muted-foreground">
                  {formatNumber(totals.totalShipments)}
                </td>
                <td className="py-3 px-4 text-center tabular-nums text-success dark:text-success">
                  {formatNumber(totals.delivered)}
                </td>
                <td className="py-3 px-4 text-center tabular-nums text-destructive dark:text-destructive">
                  {formatNumber(totals.failed)}
                </td>
                <td className="py-3 px-4 text-center tabular-nums text-foreground dark:text-muted-foreground">
                  {formatCurrency(totals.collectedAmount)}
                </td>
                <td className="py-3 px-4 text-center tabular-nums text-foreground dark:text-muted-foreground">
                  {Math.round(totals.avgDurationMinutes)} دقيقة
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
