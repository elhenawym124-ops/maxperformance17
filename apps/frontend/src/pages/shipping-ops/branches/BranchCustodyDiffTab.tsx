import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GitCompare,
  RefreshCw,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';

interface DiffRow {
  branchId: string;
  branchName: string;
  branchCode: string;
  governorate: string;
  received: number;
  transferredIn: number;
  transferredOut: number;
  delivered: number;
  returned: number;
  currentInventory: number;
  discrepancies: Array<{ shipmentId: string; trackingNumber?: string; issue: string; message: string }>;
}

interface DiffTotals {
  totalBranches: number;
  totalReceived: number;
  totalTransferredIn: number;
  totalTransferredOut: number;
  totalDelivered: number;
  totalReturned: number;
  totalCurrentInventory: number;
  totalDiscrepancies: number;
}

export const BranchCustodyDiffTab: React.FC = () => {
  const { i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const todayStr = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [diff, setDiff] = useState<DiffRow[]>([]);
  const [totals, setTotals] = useState<DiffTotals | null>(null);

  const fetchDiff = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/shipping-portal/branches/custody-diff?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setDiff(data.diff || []);
        setTotals(data.totals || null);
      } else {
        toast.error(data.error || 'تعذر جلب تقرير فروق العهدة');
      }
    } catch {
      toast.error('حدث خطأ أثناء الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetchDiff();
  }, [fetchDiff]);

  return (
    <div className="space-y-5">
      {/* Filters Bar */}
      <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 dark:bg-primary/40 rounded-xl text-primary">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground dark:text-muted-foreground">
              {isEn ? 'Custody Reconciliation & Differences' : 'تقرير فروق وحركة العهدة بين الفروع'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isEn ? 'Reconciliation of receipts, transfers, deliveries, and returns' : 'مطابقة عمليات الاستلام والتحويلات والتسليمات والمرتجعات لكل فرع'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">من:</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-2.5 py-1.5 border border-border dark:border-border rounded-lg bg-muted dark:bg-muted text-xs outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">إلى:</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-2.5 py-1.5 border border-border dark:border-border rounded-lg bg-muted dark:bg-muted text-xs outline-none"
            />
          </div>

          <button
            onClick={fetchDiff}
            disabled={loading}
            className="p-2 border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted text-foreground dark:text-muted-foreground transition"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Counters */}
      {totals && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3 shadow-sm">
            <span className="text-slate-500 text-[11px] block">الفروع النشطة</span>
            <span className="text-lg font-bold font-mono text-foreground dark:text-muted-foreground">{totals.totalBranches}</span>
          </div>
          <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3 shadow-sm">
            <span className="text-slate-500 text-[11px] block">إجمالي المستلم</span>
            <span className="text-lg font-bold font-mono text-primary">{totals.totalReceived}</span>
          </div>
          <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3 shadow-sm">
            <span className="text-slate-500 text-[11px] block">تحويل صادر</span>
            <span className="text-lg font-bold font-mono text-warning">{totals.totalTransferredOut}</span>
          </div>
          <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3 shadow-sm">
            <span className="text-slate-500 text-[11px] block">تحويل وارد</span>
            <span className="text-lg font-bold font-mono text-primary">{totals.totalTransferredIn}</span>
          </div>
          <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3 shadow-sm">
            <span className="text-slate-500 text-[11px] block">إجمالي المسلّم</span>
            <span className="text-lg font-bold font-mono text-success">{totals.totalDelivered}</span>
          </div>
          <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3 shadow-sm">
            <span className="text-slate-500 text-[11px] block">إجمالي المرتجع</span>
            <span className="text-lg font-bold font-mono text-destructive">{totals.totalReturned}</span>
          </div>
          <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3 shadow-sm">
            <span className="text-slate-500 text-[11px] block">العهدة الحالية</span>
            <span className="text-lg font-bold font-mono text-foreground dark:text-muted-foreground">{totals.totalCurrentInventory}</span>
          </div>
        </div>
      )}

      {/* Discrepancies Alert Banner if any */}
      {totals && totals.totalDiscrepancies > 0 && (
        <div className="p-3 bg-destructive/10 dark:bg-destructive/30 border border-destructive dark:border-destructive rounded-xl flex items-center gap-2 text-xs text-destructive dark:text-destructive">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <span>تم رصد {totals.totalDiscrepancies} شحنة بها تعارض بين حالتها النهائية ووجودها في عهدة الفرع (يرجى مراجعة الجدول أدناه).</span>
        </div>
      )}

      {/* Diff Reconciliation Table */}
      <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 dark:bg-muted border-b border-border dark:border-border text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3">الفرع والكود</th>
                <th className="px-3 py-3 text-center">المستلم في الهاَب</th>
                <th className="px-3 py-3 text-center">محول صادر</th>
                <th className="px-3 py-3 text-center">محول وارد</th>
                <th className="px-3 py-3 text-center">المسلّم</th>
                <th className="px-3 py-3 text-center">المرتجع</th>
                <th className="px-3 py-3 text-center">العهدة الحالية</th>
                <th className="px-4 py-3">حالة المطابقة والفروق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border">
              {diff.map((row) => (
                <tr key={row.branchId} className="hover:bg-slate-50/50 dark:hover:bg-muted transition">
                  <td className="px-4 py-3">
                    <div className="font-bold text-foreground dark:text-muted-foreground">{row.branchName}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{row.branchCode} • {row.governorate}</div>
                  </td>
                  <td className="px-3 py-3 text-center font-mono font-bold text-primary">
                    {row.received}
                  </td>
                  <td className="px-3 py-3 text-center font-mono font-medium text-warning">
                    {row.transferredOut}
                  </td>
                  <td className="px-3 py-3 text-center font-mono font-medium text-primary">
                    {row.transferredIn}
                  </td>
                  <td className="px-3 py-3 text-center font-mono font-bold text-success">
                    {row.delivered}
                  </td>
                  <td className="px-3 py-3 text-center font-mono font-medium text-destructive">
                    {row.returned}
                  </td>
                  <td className="px-3 py-3 text-center font-mono font-bold text-foreground dark:text-muted-foreground bg-muted dark:bg-muted">
                    {row.currentInventory}
                  </td>
                  <td className="px-4 py-3">
                    {row.discrepancies.length === 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-success/10 text-success dark:bg-success/40 dark:text-success border border-success dark:border-success">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>مطابق بنسبة 100%</span>
                      </span>
                    ) : (
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-destructive/10 text-destructive dark:bg-destructive/40 dark:text-destructive border border-destructive dark:border-destructive">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{row.discrepancies.length} فرق مرصود</span>
                        </span>
                        <div className="text-[10px] text-destructive dark:text-destructive">
                          {row.discrepancies[0]?.message}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {diff.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    لا توجد بيانات حركة للفروع في هذه الفترة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
