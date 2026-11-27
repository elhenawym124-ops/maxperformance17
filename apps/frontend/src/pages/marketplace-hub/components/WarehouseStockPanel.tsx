import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Boxes, RefreshCw, Save } from 'lucide-react';
import { StockDistributionPlan, marketplaceHubService } from '../../../services/marketplaceHubService';

export const WarehouseStockPanel: React.FC = () => {
  const [plan, setPlan] = useState<StockDistributionPlan | null>(null);
  const [safetyBuffer, setSafetyBuffer] = useState<number>(2);
  const [shares, setShares] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const loadPlan = async () => {
    setLoading(true);
    try {
      const data = await marketplaceHubService.getStockDistribution();
      setPlan(data);
      setSafetyBuffer(data.safetyBuffer);
      setShares(data.shares);
    } catch {
      toast.error('تعذر تحميل خطة توزيع المخزون');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPlan();
  }, []);

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await marketplaceHubService.saveStockDistribution({
        safetyBuffer,
        channelShares: shares,
      });
      setPlan(data);
      toast.success('تم تحديث قواعد التوزيع وفحص التعارضات');
    } catch {
      toast.error('تعذر حفظ قواعد التوزيع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSaveRules} className="space-y-4 rounded-md border border-border/70 bg-background p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">توزيع المخزون وحل التعارضات متعدد المستودعات</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs tabular-nums text-muted-foreground">
            <span>المستودعات: {plan?.warehouses.length ?? 0}</span>
            <span>·</span>
            <span className={plan && plan.conflictCount > 0 ? 'text-destructive font-semibold' : 'text-primary'}>
              تعارضات: {plan?.conflictCount ?? 0}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">هامش الأمان (وحدة)</label>
            <input
              type="number"
              min={0}
              value={safetyBuffer}
              onChange={(e) => setSafetyBuffer(Math.max(0, Number(e.target.value)))}
              className="w-full rounded border border-border/70 bg-card px-3 py-1.5 font-mono text-xs tabular-nums"
            />
          </div>
          {(plan?.activeChannels || ['amazon', 'noon']).map((ch) => (
            <div key={ch}>
              <label className="mb-1 block text-xs font-medium uppercase text-muted-foreground">نسبة {ch} (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={shares[ch] ?? 0}
                onChange={(e) => setShares((prev) => ({ ...prev, [ch]: Math.max(0, Number(e.target.value)) }))}
                className="w-full rounded border border-border/70 bg-card px-3 py-1.5 font-mono text-xs tabular-nums"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-mono tabular-nums text-muted-foreground">
            مجموع الحصص: {Object.values(shares).reduce((a, b) => a + b, 0)}%
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void loadPlan()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded border border-border/70 bg-card px-3 py-1.5 font-medium"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>تحديث</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded bg-primary px-4 py-1.5 font-semibold text-primary-foreground"
            >
              <Save className="h-3.5 w-3.5" />
              <span>تطبيق قواعد التوزيع</span>
            </button>
          </div>
        </div>
      </form>

      {plan && plan.items.length > 0 ? (
        <div className="overflow-x-auto border-t border-border/70 sm:rounded-md sm:border">
          <table className="w-full text-start text-xs">
            <thead className="border-b border-border/70 bg-muted/30 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-start">المنتج</th>
                <th className="px-3 py-2 text-start">المستودع</th>
                <th className="px-3 py-2 text-end">المتاح</th>
                <th className="px-3 py-2 text-end">القابل للتوزيع</th>
                {plan.activeChannels.map((ch) => (
                  <th key={ch} className="px-3 py-2 text-end uppercase">{ch}</th>
                ))}
                <th className="px-3 py-2 text-start">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {plan.items.map((row) => (
                <tr key={`${row.productId}-${row.warehouseName}`}>
                  <td className="px-3 py-2">
                    <div className="font-medium text-foreground">{row.name}</div>
                    {row.sku && <div className="font-mono text-[10px] text-muted-foreground">{row.sku}</div>}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{row.warehouseName}</td>
                  <td className="px-3 py-2 text-end font-mono tabular-nums">{row.available}</td>
                  <td className="px-3 py-2 text-end font-mono tabular-nums text-primary">{row.distributable}</td>
                  {plan.activeChannels.map((ch) => (
                    <td key={ch} className="px-3 py-2 text-end font-mono tabular-nums">
                      {row.channelAllocations[ch] ?? 0}
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    {row.conflicts.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-destructive">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>{row.conflicts[0]}</span>
                      </span>
                    ) : (
                      <span className="text-primary">متوازن</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-md border border-border/70 bg-background p-8 text-center text-xs text-muted-foreground">
          لا توجد منتجات أو مستودعات مرتبطة بعد — استورد ملف CSV أو أضف منتجات لبدء التوزيع.
        </div>
      )}
    </div>
  );
};
