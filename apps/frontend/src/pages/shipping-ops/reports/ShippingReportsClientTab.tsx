import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { ClientReportResponse } from '../../../services/shippingReportsService';
import { formatNumber, formatCurrency } from './shippingReportsHelpers';

interface Props {
  data: ClientReportResponse | null;
  loading: boolean;
}

export const ShippingReportsClientTab: React.FC<Props> = ({ data, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRows = useMemo(() => {
    if (!data?.rows) return [];
    if (!searchTerm.trim()) return data.rows;
    const q = searchTerm.trim().toLowerCase();
    return data.rows.filter(
      r => r.clientName.toLowerCase().includes(q) || (r.phone && r.phone.includes(q))
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
        لا توجد بيانات شحنات للعملاء في هذه الفترة
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
            placeholder="بحث بالعميل أو الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pe-8 ps-3 py-1.5 rounded-lg border border-border dark:border-border bg-white dark:bg-muted text-foreground dark:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="text-xs text-muted-foreground dark:text-muted-foreground">
          عدد العملاء: <span className="font-semibold tabular-nums text-foreground dark:text-muted-foreground">{filteredRows.length}</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="border border-border dark:border-border rounded-lg bg-white dark:bg-muted overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-muted text-foreground dark:text-muted-foreground border-b border-border dark:border-border font-medium">
              <tr>
                <th className="py-3 px-4">العميل / التاجر</th>
                <th className="py-3 px-4 text-center">الشحنات</th>
                <th className="py-3 px-4 text-center text-success dark:text-success">مسلّمة</th>
                <th className="py-3 px-4 text-center text-destructive dark:text-destructive">مرتجعة</th>
                <th className="py-3 px-4 text-left">COD محصّل</th>
                <th className="py-3 px-4 text-left">رسوم الشحن</th>
                <th className="py-3 px-4 text-left">رسوم المرتجع</th>
                <th className="py-3 px-4 text-left font-bold text-blue-600 dark:text-blue-400">صافي المستحق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border">
              {filteredRows.map((row) => (
                <tr key={row.clientId || 'none'} className="hover:bg-slate-50/50 dark:hover:bg-muted transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-foreground dark:text-muted-foreground">
                    <div>{row.clientName}</div>
                    {row.phone && (
                      <div className="text-[10px] text-muted-foreground dark:text-muted-foreground font-normal tabular-nums">{row.phone}</div>
                    )}
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
                  <td className="py-2.5 px-4 text-left tabular-nums font-medium text-foreground dark:text-muted-foreground">
                    {formatCurrency(row.codCollected)}
                  </td>
                  <td className="py-2.5 px-4 text-left tabular-nums text-foreground dark:text-muted-foreground">
                    {formatCurrency(row.shippingFees)}
                  </td>
                  <td className="py-2.5 px-4 text-left tabular-nums text-destructive dark:text-destructive">
                    {formatCurrency(row.returnFees)}
                  </td>
                  <td className="py-2.5 px-4 text-left tabular-nums font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(row.net)}
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
                <td className="py-3 px-4 text-left tabular-nums">
                  {formatCurrency(totals.codCollected)}
                </td>
                <td className="py-3 px-4 text-left tabular-nums text-foreground dark:text-muted-foreground">
                  {formatCurrency(totals.shippingFees)}
                </td>
                <td className="py-3 px-4 text-left tabular-nums text-destructive dark:text-destructive">
                  {formatCurrency(totals.returnFees)}
                </td>
                <td className="py-3 px-4 text-left tabular-nums text-blue-600 dark:text-blue-400 font-extrabold">
                  {formatCurrency(totals.net)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
