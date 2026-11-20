import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { CourierReportResponse } from '../../../services/shippingReportsService';
import { formatNumber, formatCurrency } from './shippingReportsHelpers';

interface Props {
  data: CourierReportResponse | null;
  loading: boolean;
}

export const ShippingReportsCourierTab: React.FC<Props> = ({ data, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRows = useMemo(() => {
    if (!data?.rows) return [];
    if (!searchTerm.trim()) return data.rows;
    const q = searchTerm.trim().toLowerCase();
    return data.rows.filter(
      r => r.courierName.toLowerCase().includes(q) || (r.phone && r.phone.includes(q))
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
      <div className="p-8 text-center text-muted-foreground dark:text-muted-foreground">
        لا توجد بيانات للمناديب في هذه الفترة
      </div>
    );
  }

  const { totals } = data;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="بحث بالمندوب أو الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pe-8 ps-3 py-1.5 rounded-lg border border-border dark:border-border bg-white dark:bg-muted text-foreground dark:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="text-xs text-muted-foreground dark:text-muted-foreground">
          عدد المناديب: <span className="font-semibold tabular-nums text-foreground dark:text-muted-foreground">{filteredRows.length}</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="border border-border dark:border-border rounded-lg bg-white dark:bg-muted overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-muted text-foreground dark:text-muted-foreground border-b border-border dark:border-border font-medium">
              <tr>
                <th className="py-3 px-4">اسم المندوب</th>
                <th className="py-3 px-4 text-center text-success dark:text-success">مسلّمة</th>
                <th className="py-3 px-4 text-center text-destructive dark:text-destructive">مرتجعة</th>
                <th className="py-3 px-4 text-left text-warning dark:text-warning">عمولات مستحقة (DUE)</th>
                <th className="py-3 px-4 text-left text-success dark:text-success">عمولات مدفوعة (PAID)</th>
                <th className="py-3 px-4 text-left font-bold text-foreground dark:text-muted-foreground">إجمالي العمولات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border">
              {filteredRows.map((row) => (
                <tr key={row.courierId} className="hover:bg-slate-50/50 dark:hover:bg-muted transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-foreground dark:text-muted-foreground">
                    <div>{row.courierName}</div>
                    {row.phone && (
                      <div className="text-[10px] text-muted-foreground dark:text-muted-foreground font-normal tabular-nums">{row.phone}</div>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-success dark:text-success font-semibold">
                    {formatNumber(row.delivered)}
                  </td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-destructive dark:text-destructive font-semibold">
                    {formatNumber(row.returned)}
                  </td>
                  <td className="py-2.5 px-4 text-left tabular-nums text-warning dark:text-warning font-medium">
                    {formatCurrency(row.commissionsDue)}
                  </td>
                  <td className="py-2.5 px-4 text-left tabular-nums text-success dark:text-success font-medium">
                    {formatCurrency(row.commissionsPaid)}
                  </td>
                  <td className="py-2.5 px-4 text-left tabular-nums font-bold text-foreground dark:text-muted-foreground">
                    {formatCurrency(row.totalCommissions)}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Totals Footer */}
            <tfoot className="bg-slate-100/75 dark:bg-muted text-foreground dark:text-muted-foreground font-bold border-t-2 border-border dark:border-border">
              <tr>
                <td className="py-3 px-4">الإجمالي الكلي</td>
                <td className="py-3 px-4 text-center tabular-nums text-success dark:text-success font-extrabold">
                  {formatNumber(totals.delivered)}
                </td>
                <td className="py-3 px-4 text-center tabular-nums text-destructive dark:text-destructive font-extrabold">
                  {formatNumber(totals.returned)}
                </td>
                <td className="py-3 px-4 text-left tabular-nums text-warning dark:text-warning">
                  {formatCurrency(totals.commissionsDue)}
                </td>
                <td className="py-3 px-4 text-left tabular-nums text-success dark:text-success">
                  {formatCurrency(totals.commissionsPaid)}
                </td>
                <td className="py-3 px-4 text-left tabular-nums font-extrabold">
                  {formatCurrency(totals.totalCommissions)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
