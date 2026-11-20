import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  BanknotesIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  PlayIcon,
  SparklesIcon,
  InformationCircleIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import courierService, {
  CourierPayroll,
  PayrollTotals
} from '../../../services/courierService';
import { useCurrency } from '../../../hooks/useCurrency';

const COMPENSATION_MODEL_LABELS: Record<string, string> = {
  COMMISSION_ONLY: 'عمولة فقط',
  SALARY_ONLY: 'مرتب شهري فقط',
  SALARY_PLUS_BONUS: 'مرتب + بونص أداء',
  SALARY_PLUS_COMMISSION: 'مرتب + عمولة',
};

const CourierPayrollPage: React.FC = () => {
  const { formatPrice } = useCurrency();
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [payrolls, setPayrolls] = useState<CourierPayroll[]>([]);
  const [totals, setTotals] = useState<PayrollTotals | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  // Pay Modal State
  const [payingPayroll, setPayingPayroll] = useState<CourierPayroll | null>(null);
  const [treasuryAccounts, setTreasuryAccounts] = useState<Array<{ id: string; name: string; balance: number }>>([]);
  const [selectedTreasuryId, setSelectedTreasuryId] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [processingPay, setProcessingPay] = useState(false);

  const fetchPayroll = async (monthToFetch?: string) => {
    setLoading(true);
    try {
      const res = await courierService.listPayroll(monthToFetch || selectedMonth);
      if (res.success && res.data) {
        setPayrolls(res.data.payrolls || []);
        setTotals(res.data.totals || null);
      }
    } catch (err: any) {
      toast.error(err?.message || 'تعذر تحميل بيانات مسير الرواتب');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll(selectedMonth);
    courierService.getTreasuryAccounts().then((res) => {
      if (res.success && Array.isArray(res.data)) {
        setTreasuryAccounts(res.data);
        if (res.data.length > 0) setSelectedTreasuryId(res.data[0].id);
      }
    });
  }, [selectedMonth]);

  const handleRunPayroll = async () => {
    setRunning(true);
    try {
      const res = await courierService.runPayroll(selectedMonth);
      if (res.success) {
        toast.success(`تم تشغيل واحتساب مسير شهر ${selectedMonth} بنجاح`);
        fetchPayroll(selectedMonth);
      }
    } catch (err: any) {
      if (err?.response?.status === 409 || err?.code === 'PAYROLL_ALREADY_PAID') {
        toast.error('تم صرف مسير رواتب هذا الشهر مسبقاً ولا يمكن إعادة تشغيله (409)');
      } else {
        toast.error(err?.message || 'تعذر تشغيل مسير الرواتب');
      }
    } finally {
      setRunning(false);
    }
  };

  const handleApprove = async (p: CourierPayroll) => {
    try {
      const res = await courierService.approvePayroll(p.id);
      if (res.success) {
        toast.success(`تم اعتماد راتب المندوب ${p.courier?.name || ''}`);
        fetchPayroll(selectedMonth);
      }
    } catch (err: any) {
      toast.error(err?.message || 'تعذر اعتماد الراتب');
    }
  };

  const handleOpenPayModal = (p: CourierPayroll) => {
    setPayingPayroll(p);
    setPayNotes(`صرف مسير شهر ${p.month}`);
  };

  const handleConfirmPay = async () => {
    if (!payingPayroll) return;
    setProcessingPay(true);
    try {
      const res = await courierService.payPayroll(payingPayroll.id, {
        treasuryAccountId: selectedTreasuryId || undefined,
        notes: payNotes.trim() || undefined,
      });
      if (res.success) {
        toast.success(`تم صرف الراتب وخصم المبلغ من الخزينة بنجاح`);
        setPayingPayroll(null);
        fetchPayroll(selectedMonth);
      }
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.error('شهر واحد لا يُصرف مرتين — تم صرف هذا المسير مسبقاً (409)');
      } else {
        toast.error(err?.message || 'تعذر إتمام صرف الراتب');
      }
    } finally {
      setProcessingPay(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-[1800px] mx-auto text-foreground dark:text-muted-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border dark:border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">مسير رواتب ومكافآت المناديب</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success dark:bg-success/40 dark:text-success border border-success">
              شهري آلي
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground mt-1">
            احتساب تلقائي للرواتب الأساسية، شرائح بونص الأداء، والعمولات مع التوريد والصرف من الخزينة
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/shipping/couriers"
            className="px-3.5 py-2 text-xs sm:text-sm font-medium border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition"
          >
            إدارة أسطول المناديب
          </Link>
          <div className="flex items-center gap-1.5 bg-white dark:bg-muted border border-border dark:border-border rounded-lg p-1 text-xs sm:text-sm">
            <span className="text-slate-500 text-xs px-1">الشهر:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-0 focus:outline-none font-mono text-xs sm:text-sm font-semibold"
            />
          </div>
          <button
            onClick={handleRunPayroll}
            disabled={running}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-success rounded-lg hover:bg-success transition active:scale-95 disabled:opacity-50 shadow-xs"
          >
            <PlayIcon className="w-4 h-4" />
            {running ? 'جاري الاحتساب...' : 'تشغيل واحتساب مسير الشهر'}
          </button>
          <button
            onClick={() => fetchPayroll(selectedMonth)}
            title="تحديث"
            className="p-2 border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3.5">
          <div className="text-xs text-muted-foreground dark:text-muted-foreground">إجمالي الأساسي</div>
          <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-foreground dark:text-muted-foreground mt-1">
            {formatPrice(totals?.totalBaseSalary || 0)}
          </div>
        </div>

        <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3.5">
          <div className="text-xs text-warning dark:text-warning flex items-center gap-1 font-medium">
            <SparklesIcon className="w-3.5 h-3.5" />
            إجمالي بونص الأداء
          </div>
          <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-warning mt-1">
            {formatPrice(totals?.totalBonus || 0)}
          </div>
        </div>

        <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3.5">
          <div className="text-xs text-primary dark:text-primary font-medium">إجمالي العمولات</div>
          <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-primary mt-1">
            {formatPrice(totals?.totalCommission || 0)}
          </div>
        </div>

        <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3.5">
          <div className="text-xs text-destructive font-medium">إجمالي الخصومات</div>
          <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-destructive mt-1">
            {formatPrice(totals?.totalDeductions || 0)}
          </div>
        </div>

        <div className="bg-emerald-50/60 dark:bg-success/30 border border-success dark:border-success rounded-xl p-3.5">
          <div className="text-xs text-success dark:text-success font-bold flex items-center gap-1">
            <BanknotesIcon className="w-3.5 h-3.5" />
            صافي المستحق الإجمالي
          </div>
          <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-success dark:text-success mt-1">
            {formatPrice(totals?.totalNetPayable || 0)}
          </div>
        </div>

        <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3.5">
          <div className="text-xs text-muted-foreground dark:text-muted-foreground">إجمالي الطلبات المسلّمة</div>
          <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-foreground dark:text-muted-foreground mt-1">
            {totals?.totalDeliveredOrders || 0} أوردر
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-muted border-b border-border dark:border-border text-muted-foreground dark:text-muted-foreground">
              <tr>
                <th className="py-3 px-4 font-medium">المندوب</th>
                <th className="py-3 px-4 font-medium">نظام التعويض</th>
                <th className="py-3 px-4 font-medium">الطلبات المسلّمة</th>
                <th className="py-3 px-4 font-medium">الأساسي</th>
                <th className="py-3 px-4 font-medium">البونص</th>
                <th className="py-3 px-4 font-medium">العمولة</th>
                <th className="py-3 px-4 font-medium">الخصومات</th>
                <th className="py-3 px-4 font-medium">الصافي المستحق</th>
                <th className="py-3 px-4 font-medium">الحالة</th>
                <th className="py-3 px-4 font-medium text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border">
              {payrolls.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted-foreground dark:text-muted-foreground">
                    لم يتم تشغيل مسير رواتب لهذا الشهر ({selectedMonth}) بعد. انقر على «تشغيل واحتساب مسير الشهر» لبدء الاحتساب التلقائي.
                  </td>
                </tr>
              ) : (
                payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-muted transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-foreground dark:text-muted-foreground">
                        {p.courier?.name || 'مندوب غير مسمى'}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono" dir="ltr">
                        {p.courier?.phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-muted dark:bg-muted text-foreground dark:text-muted-foreground font-medium">
                        {COMPENSATION_MODEL_LABELS[p.compensationModel] || p.compensationModel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums font-semibold text-primary">
                      {p.deliveredOrdersCount} أوردر
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      {formatPrice(p.baseSalary)}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-warning font-medium">
                      {p.bonus > 0 ? `+${formatPrice(p.bonus)}` : '0'}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-primary">
                      {p.commission > 0 ? `+${formatPrice(p.commission)}` : '0'}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-destructive">
                      {p.deductions > 0 ? `-${formatPrice(p.deductions)}` : '0'}
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums font-bold text-foreground dark:text-muted-foreground text-sm">
                      {formatPrice(p.netPayable)}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success dark:bg-success/40 dark:text-success border border-success">
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                          تم الصرف
                        </span>
                      ) : p.status === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary dark:bg-primary/40 dark:text-primary border border-primary">
                          معتمد
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning/10 text-warning dark:bg-warning/40 dark:text-warning border border-warning">
                          مسودة
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.status === 'DRAFT' && (
                          <button
                            onClick={() => handleApprove(p)}
                            className="px-2.5 py-1 text-xs font-semibold text-primary bg-primary/10 dark:bg-primary/40 dark:text-primary border border-primary rounded-lg hover:bg-primary transition"
                          >
                            اعتماد
                          </button>
                        )}
                        {p.status !== 'PAID' && (
                          <button
                            onClick={() => handleOpenPayModal(p)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-success rounded-lg hover:bg-success transition active:scale-95 shadow-2xs"
                          >
                            صرف نقدي
                          </button>
                        )}
                        {p.status === 'PAID' && (
                          <span className="text-[11px] text-muted-foreground font-mono">
                            مصروف {p.paidAt ? new Date(p.paidAt).toLocaleDateString('ar-EG') : ''}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Modal */}
      {payingPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-muted backdrop-blur-xs">
          <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl w-full max-w-md shadow-2xl p-6 space-y-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between border-b border-border dark:border-border pb-3">
              <h3 className="font-bold text-base flex items-center gap-1.5">
                <BanknotesIcon className="w-5 h-5 text-success" />
                صرف مسير الراتب من الخزينة
              </h3>
              <button onClick={() => setPayingPayroll(null)} className="text-slate-400 hover:text-foreground">✕</button>
            </div>

            <div className="bg-slate-50 dark:bg-muted p-3 rounded-xl border border-border dark:border-border space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">المندوب:</span>
                <span className="font-bold">{payingPayroll.courier?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">شهر الاستحقاق:</span>
                <span className="font-mono font-bold">{payingPayroll.month}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-success dark:text-success pt-1 border-t border-border dark:border-border">
                <span>المبلغ الصافي المنصرف:</span>
                <span className="font-mono">{formatPrice(payingPayroll.netPayable)}</span>
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1 flex items-center gap-1">
                <BuildingLibraryIcon className="w-4 h-4 text-muted-foreground" />
                الخزينة المصروف منها *
              </label>
              <select
                value={selectedTreasuryId}
                onChange={(e) => setSelectedTreasuryId(e.target.value)}
                className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg text-xs font-medium"
              >
                {treasuryAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — رصيد متاح: {formatPrice(acc.balance)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1">ملاحظات الصرف أو التحويل (اختياري)</label>
              <input
                type="text"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="مثال: تحويل فودافون كاش / صرف كاش بالمقر"
                className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-border">
              <button
                type="button"
                onClick={() => setPayingPayroll(null)}
                className="px-4 py-2 border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={processingPay}
                onClick={handleConfirmPay}
                className="px-5 py-2 text-white bg-success font-bold rounded-lg hover:bg-success transition active:scale-95 disabled:opacity-50"
              >
                {processingPay ? 'جاري تسجيل الصرف...' : 'تأكيد الصرف من الخزينة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourierPayrollPage;
