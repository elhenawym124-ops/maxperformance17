import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  RefreshCw,
  Download,
  AlertTriangle,
  Users,
  MapPin,
  Truck,
  Search,
  DollarSign,
  PackageCheck,
  Percent,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  shippingReportsService,
  ProfitReportResponse,
} from '../../../services/shippingReportsService';
import {
  formatNumber,
  formatCurrency,
  exportToCsv,
} from '../reports/shippingReportsHelpers';

interface Props {
  getEffectiveDateRange: () => { from?: string; to?: string };
}

type GroupBy = 'client' | 'governorate' | 'courier';

const GROUP_OPTIONS: { id: GroupBy; label: string; icon: React.ElementType }[] = [
  { id: 'client', label: 'العملاء', icon: Users },
  { id: 'governorate', label: 'المحافظات', icon: MapPin },
  { id: 'courier', label: 'المناديب', icon: Truck },
];

export const ShippingReportsProfitTab: React.FC<Props> = ({ getEffectiveDateRange }) => {
  const [groupBy, setGroupBy] = useState<GroupBy>('client');
  const [data, setData] = useState<ProfitReportResponse | null>(null);
  const [uncoveredCount, setUncoveredCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [recalcing, setRecalcing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = getEffectiveDateRange();

      const [reportRes, uncoveredRes] = await Promise.all([
        shippingReportsService.getProfitReport({ ...params, groupBy }),
        shippingReportsService.getUncoveredProfit(params).catch(() => ({ count: 0 })),
      ]);

      setData(reportRes);
      setUncoveredCount(uncoveredRes.count || 0);
    } catch (err: unknown) {
      console.error('Failed to load profit report:', err);
      const msg = err instanceof Error ? err.message : 'تعذر تحميل تقرير الأرباح';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [getEffectiveDateRange, groupBy]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRecalc = async () => {
    try {
      setRecalcing(true);
      const params = getEffectiveDateRange();
      const res = await shippingReportsService.recalcProfit(params);
      toast.success(`تمت إعادة احتساب الأرباح بنجاح (${res.updatedCount || 0} شحنة محدثة)`);
      await loadData();
    } catch (err: unknown) {
      console.error('Failed to recalc profit:', err);
      const msg = err instanceof Error ? err.message : 'فشلت عملية إعادة احتساب الأرباح';
      toast.error(msg);
    } finally {
      setRecalcing(false);
    }
  };

  const handleExportCsv = () => {
    if (!data?.rows?.length) return;
    const groupLabel =
      groupBy === 'client' ? 'العميل / التاجر' : groupBy === 'governorate' ? 'المحافظة' : 'المندوب';
    const headers = [groupLabel, 'الشحنات المسلّمة', 'إيرادات الشحن', 'تكلفة المناديب', 'صافي الهامش', 'نسبة الهامش %'];
    const rows = data.rows.map((r) => [
      r.name || r.label || r.key,
      r.shipments,
      r.revenue,
      r.courierCost,
      r.margin,
      `${r.marginPct}%`,
    ]);
    exportToCsv(`profit-report-${groupBy}`, headers, rows);
  };

  const filteredRows = useMemo(() => {
    if (!data?.rows) return [];
    if (!searchTerm.trim()) return data.rows;
    const q = searchTerm.trim().toLowerCase();
    return data.rows.filter((r) => (r.name || r.label || r.key || '').toLowerCase().includes(q));
  }, [data?.rows, searchTerm]);

  const totals = data?.totals || { shipments: 0, revenue: 0, courierCost: 0, margin: 0, marginPct: 0 };

  const kpis = [
    { label: 'إجمالي الشحنات', value: formatNumber(totals.shipments), icon: PackageCheck, color: 'text-blue-500' },
    { label: 'إيرادات الشحن', value: formatCurrency(totals.revenue), icon: DollarSign, color: 'text-emerald-500' },
    { label: 'تكلفة المناديب', value: formatCurrency(totals.courierCost), icon: Truck, color: 'text-amber-500' },
    {
      label: 'صافي الهامش',
      value: formatCurrency(totals.margin),
      icon: TrendingUp,
      color: totals.margin >= 0 ? 'text-emerald-600 dark:text-success' : 'text-rose-600 dark:text-destructive',
    },
    {
      label: 'هامش الربح %',
      value: `${totals.marginPct}%`,
      icon: Percent,
      color: totals.marginPct >= 0 ? 'text-emerald-600 dark:text-success' : 'text-rose-600 dark:text-destructive',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Top Controls: GroupBy Switcher & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border dark:border-border pb-3">
        <div className="inline-flex items-center p-1 rounded-lg border border-border dark:border-border bg-muted dark:bg-muted text-xs self-start">
          {GROUP_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = groupBy === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setGroupBy(opt.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition active:scale-95 ${
                  isSelected
                    ? 'bg-white dark:bg-muted text-primary dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleRecalc}
            disabled={recalcing || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-success hover:bg-success text-white rounded-lg transition active:scale-95 disabled:opacity-50 shadow-xs"
            title="إعادة احتساب تكاليف المناديب وهوامش الربح للشحنات المسلّمة في الفترة"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalcing ? 'animate-spin' : ''}`} />
            <span>{recalcing ? 'جارٍ الاحتساب...' : 'إعادة احتساب الأرباح'}</span>
          </button>
          <button
            onClick={handleExportCsv}
            disabled={loading || !data?.rows?.length}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition active:scale-95 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-foreground dark:text-muted-foreground" />
            <span>تصدير CSV</span>
          </button>
        </div>
      </div>

      {/* Uncovered Warning Alert */}
      {uncoveredCount > 0 && (
        <div className="p-3 sm:p-4 rounded-xl border border-warning dark:border-warning/80 bg-warning/80 dark:bg-warning/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-warning dark:text-warning">
            <AlertTriangle className="w-4 h-4 shrink-0 text-warning dark:text-warning" />
            <div>
              <span className="font-bold tabular-nums">{formatNumber(uncoveredCount)}</span> شحنة مسلّمة في هذه الفترة لم يتم احتساب تكلفة المندوب أو الهامش لها بعد.
            </div>
          </div>
          <button
            onClick={handleRecalc}
            disabled={recalcing}
            className="px-3 py-1 bg-warning hover:bg-warning text-white font-medium rounded-md transition text-xs shrink-0 self-start sm:self-auto"
          >
            احتساب وتحديث الآن
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={`p-3.5 rounded-xl border border-border dark:border-border bg-white dark:bg-muted shadow-xs ${
                idx === 4 ? 'col-span-2 lg:col-span-1' : ''
              }`}
            >
              <div className="flex items-center justify-between text-muted-foreground dark:text-muted-foreground text-xs mb-1">
                <span>{kpi.label}</span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div className={`text-lg sm:text-xl font-bold tabular-nums ${kpi.color || 'text-slate-800 dark:text-muted-foreground'}`}>
                {kpi.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={groupBy === 'client' ? 'بحث باسم العميل...' : groupBy === 'governorate' ? 'بحث بالمحافظة...' : 'بحث باسم المندوب...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pe-8 ps-3 py-1.5 rounded-lg border border-border dark:border-border bg-white dark:bg-muted text-foreground dark:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="text-xs text-muted-foreground dark:text-muted-foreground">
          عدد البنود: <span className="font-semibold tabular-nums text-foreground dark:text-muted-foreground">{filteredRows.length}</span>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 dark:bg-destructive/40 border border-destructive dark:border-destructive text-destructive dark:text-destructive text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data?.rows?.length ? (
        <div className="p-8 text-center text-muted-foreground dark:text-muted-foreground border border-border dark:border-border rounded-xl bg-white dark:bg-muted">
          لا توجد بيانات ربحية مسجلة في هذه الفترة
        </div>
      ) : (
        <div className="border border-border dark:border-border rounded-xl bg-white dark:bg-muted overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-muted text-foreground dark:text-muted-foreground border-b border-border dark:border-border font-medium">
                <tr>
                  <th className="py-3 px-4">
                    {groupBy === 'client' ? 'العميل / التاجر' : groupBy === 'governorate' ? 'المحافظة' : 'المندوب'}
                  </th>
                  <th className="py-3 px-4 text-center">الشحنات المسلّمة</th>
                  <th className="py-3 px-4 text-left">إيرادات الشحن</th>
                  <th className="py-3 px-4 text-left">تكلفة المناديب</th>
                  <th className="py-3 px-4 text-left font-bold text-success dark:text-success">صافي الهامش</th>
                  <th className="py-3 px-4 text-center">نسبة الهامش</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-border">
                {filteredRows.map((row) => (
                  <tr key={row.key} className="hover:bg-slate-50/60 dark:hover:bg-muted transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-foreground dark:text-muted-foreground">
                      {row.name || row.label || row.key}
                    </td>
                    <td className="py-2.5 px-4 text-center tabular-nums text-foreground dark:text-muted-foreground">
                      {formatNumber(row.shipments)}
                    </td>
                    <td className="py-2.5 px-4 text-left tabular-nums text-foreground dark:text-muted-foreground">
                      {formatCurrency(row.revenue)}
                    </td>
                    <td className="py-2.5 px-4 text-left tabular-nums text-warning dark:text-warning">
                      {formatCurrency(row.courierCost)}
                    </td>
                    <td className={`py-2.5 px-4 text-left tabular-nums font-bold ${row.margin >= 0 ? 'text-emerald-600 dark:text-success' : 'text-rose-600 dark:text-destructive'}`}>
                      {formatCurrency(row.margin)}
                    </td>
                    <td className="py-2.5 px-4 text-center tabular-nums">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                        row.marginPct >= 20
                          ? 'bg-emerald-100 dark:bg-success/60 text-success dark:text-success'
                          : row.marginPct >= 0
                          ? 'bg-blue-100 dark:bg-primary/60 text-primary dark:text-primary'
                          : 'bg-rose-100 dark:bg-destructive/60 text-destructive dark:text-destructive'
                      }`}>
                        {row.marginPct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100/80 dark:bg-muted font-bold border-t-2 border-border dark:border-border text-foreground dark:text-muted-foreground">
                <tr>
                  <td className="py-3 px-4">الإجمالي الكلي</td>
                  <td className="py-3 px-4 text-center tabular-nums">{formatNumber(totals.shipments)}</td>
                  <td className="py-3 px-4 text-left tabular-nums">{formatCurrency(totals.revenue)}</td>
                  <td className="py-3 px-4 text-left tabular-nums text-warning dark:text-warning">{formatCurrency(totals.courierCost)}</td>
                  <td className={`py-3 px-4 text-left tabular-nums ${totals.margin >= 0 ? 'text-emerald-600 dark:text-success' : 'text-rose-600 dark:text-destructive'}`}>
                    {formatCurrency(totals.margin)}
                  </td>
                  <td className="py-3 px-4 text-center tabular-nums">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] ${
                      totals.marginPct >= 20
                        ? 'bg-emerald-200 dark:bg-success text-success dark:text-success'
                        : totals.marginPct >= 0
                        ? 'bg-blue-200 dark:bg-primary text-primary dark:text-primary'
                        : 'bg-rose-200 dark:bg-destructive text-destructive dark:text-destructive'
                    }`}>
                      {totals.marginPct}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default ShippingReportsProfitTab;
