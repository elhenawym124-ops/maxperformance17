import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { GovernorateReportResponse } from '../../../services/shippingReportsService';
import { formatNumber } from './shippingReportsHelpers';

interface Props {
  data: GovernorateReportResponse | null;
  loading: boolean;
}

export const ShippingReportsGovTab: React.FC<Props> = ({ data, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRows = useMemo(() => {
    if (!data?.rows) return [];
    if (!searchTerm.trim()) return data.rows;
    const q = searchTerm.trim().toLowerCase();
    return data.rows.filter(r => r.governorate.toLowerCase().includes(q));
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
      <div className="p-8 text-center text-muted-foreground dark:text-muted-foreground">
        لا توجد بيانات شحنات للمحافظات في هذه الفترة
      </div>
    );
  }

  const { totals } = data;

  return (
    <div className="space-y-4">
      {/* Table search filter */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="بحث بالمحافظة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pe-8 ps-3 py-1.5 rounded-lg border border-border dark:border-border bg-white dark:bg-muted text-foreground dark:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="text-xs text-muted-foreground dark:text-muted-foreground">
          عدد المحافظات: <span className="font-semibold tabular-nums text-foreground dark:text-muted-foreground">{filteredRows.length}</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="border border-border dark:border-border rounded-lg bg-white dark:bg-muted overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-muted text-foreground dark:text-muted-foreground border-b border-border dark:border-border font-medium">
              <tr>
                <th className="py-3 px-4">المحافظة</th>
                <th className="py-3 px-4 text-center">إجمالي الشحنات</th>
                <th className="py-3 px-4 text-center text-success dark:text-success">مسلّمة</th>
                <th className="py-3 px-4 text-center text-destructive dark:text-destructive">مرتجعة</th>
                <th className="py-3 px-4 text-center">نسبة النجاح</th>
                <th className="py-3 px-4 text-center">متوسط زمن التسليم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border">
              {filteredRows.map((row) => (
                <tr key={row.governorate} className="hover:bg-slate-50/50 dark:hover:bg-muted transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-foreground dark:text-muted-foreground">
                    {row.governorate}
                  </td>
                  <td className="py-2.5 px-4 text-center tabular-nums font-semibold text-foreground dark:text-muted-foreground">
                    {formatNumber(row.shipments)}
                  </td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-success dark:text-success font-medium">
                    {formatNumber(row.delivered)}
                  </td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-destructive dark:text-destructive font-medium">
                    {formatNumber(row.returned)}
                  </td>
                  <td className="py-2.5 px-4 text-center tabular-nums">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                      row.successRate >= 80
                        ? 'bg-emerald-50 text-success dark:bg-success/40 dark:text-success'
                        : row.successRate >= 60
                        ? 'bg-amber-50 text-warning dark:bg-warning/40 dark:text-warning'
                        : 'bg-rose-50 text-destructive dark:bg-destructive/40 dark:text-destructive'
                    }`}>
                      {row.successRate}%
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-foreground dark:text-muted-foreground">
                    {row.avgDeliveryHours > 0 ? `${row.avgDeliveryHours} ساعة` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Totals Footer */}
            <tfoot className="bg-slate-100/75 dark:bg-muted text-foreground dark:text-muted-foreground font-bold border-t-2 border-border dark:border-border">
              <tr>
                <td className="py-3 px-4">الإجمالي الكلي</td>
                <td className="py-3 px-4 text-center tabular-nums font-extrabold">
                  {formatNumber(totals.totalShipments)}
                </td>
                <td className="py-3 px-4 text-center tabular-nums text-success dark:text-success">
                  {formatNumber(totals.delivered)}
                </td>
                <td className="py-3 px-4 text-center tabular-nums text-destructive dark:text-destructive">
                  {formatNumber(totals.returned)}
                </td>
                <td className="py-3 px-4 text-center tabular-nums">
                  {totals.successRate}%
                </td>
                <td className="py-3 px-4 text-center tabular-nums">
                  {totals.avgDeliveryHours > 0 ? `${totals.avgDeliveryHours} ساعة` : '—'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
