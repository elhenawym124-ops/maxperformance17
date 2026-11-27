import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CheckCheck, CheckCircle2, RefreshCw, ShieldAlert } from 'lucide-react';
import { InventorySyncPolicy, StockTicket, marketplaceHubService } from '../../../services/marketplaceHubService';

export const StockSyncTicketsPanel: React.FC = () => {
  const [policy, setPolicy] = useState<InventorySyncPolicy>({
    frequencyMin: 60,
    toleranceQty: 2,
    zeroAction: 'MARK_OUT_OF_STOCK',
    conflictPolicy: 'MANUAL_REVIEW',
  });
  const [tickets, setTickets] = useState<StockTicket[]>([]);
  const [busy, setBusy] = useState(false);

  const loadAll = async () => {
    try {
      const [pol, list] = await Promise.all([
        marketplaceHubService.getInventorySyncPolicy(),
        marketplaceHubService.listStockTickets(),
      ]);
      setPolicy(pol);
      setTickets(list);
    } catch {
      toast.error('تعذر تحميل سياسات المزامنة والتذاكر');
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const saved = await marketplaceHubService.saveInventorySyncPolicy(policy);
      setPolicy(saved);
      toast.success('تم حفظ سياسات مزامنة المخزون');
    } catch {
      toast.error('تعذر حفظ السياسة');
    } finally {
      setBusy(false);
    }
  };

  const handleScanSample = async () => {
    setBusy(true);
    try {
      const catalog = await marketplaceHubService.getCompanyCatalog().catch(() => []);
      const snapshots = (catalog.length > 0 ? catalog.slice(0, 5) : [{ sku: 'HUB-101', name: 'Sample SKU', stock: 12 }]).map((p, idx) => ({
        sku: p.sku || `SKU-${idx + 1}`,
        productName: p.name,
        channel: idx % 2 === 0 ? 'amazon' : 'noon',
        maxpQty: p.stock,
        channelQty: Math.max(0, p.stock - (policy.toleranceQty + 3)),
      }));
      const res = await marketplaceHubService.scanStockDiscrepancies(snapshots);
      setTickets(res.tickets);
      toast.success(`تم الفحص: ${res.ticketsCreatedOrUpdated} تذكرة تعارض جديدة`);
    } catch {
      toast.error('تعذر فحص فروق المخزون');
    } finally {
      setBusy(false);
    }
  };

  const handleResolveOne = async (id: string) => {
    try {
      const updated = await marketplaceHubService.resolveStockTicket(id, 'USE_MAXP');
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast.success('تمت مطابقة الرصيد مع MaxP');
    } catch {
      toast.error('تعذر حل التذكرة');
    }
  };

  const handleResolveAll = async () => {
    setBusy(true);
    try {
      const res = await marketplaceHubService.resolveAllStockTickets('USE_MAXP');
      setTickets(res.tickets);
      toast.success(`تمت معالجة ${res.resolvedCount} تذكرة دفعة واحدة`);
    } catch {
      toast.error('تعذر حل جميع التذاكر');
    } finally {
      setBusy(false);
    }
  };

  const unresolvedCount = tickets.filter((t) => t.status === 'UNRESOLVED').length;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSavePolicy} className="space-y-3 rounded-md border border-border/70 bg-background p-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-2">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <ShieldAlert className="h-4 w-4 text-primary" />
            <span>سياسات مزامنة المخزون والتسامح (Sync Behavior)</span>
          </div>
          <span className="font-mono text-muted-foreground tabular-nums">
            Unresolved: {unresolvedCount} / {tickets.length}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-muted-foreground">التكرار (دقيقة)</label>
            <input
              type="number"
              min={5}
              value={policy.frequencyMin}
              onChange={(e) => setPolicy((p) => ({ ...p, frequencyMin: Number(e.target.value) }))}
              className="w-full rounded border border-border/70 bg-card px-2.5 py-1.5 font-mono tabular-nums"
            />
          </div>
          <div>
            <label className="mb-1 block text-muted-foreground">هامش التسامح (Tolerance)</label>
            <input
              type="number"
              min={0}
              value={policy.toleranceQty}
              onChange={(e) => setPolicy((p) => ({ ...p, toleranceQty: Number(e.target.value) }))}
              className="w-full rounded border border-border/70 bg-card px-2.5 py-1.5 font-mono tabular-nums"
            />
          </div>
          <div>
            <label className="mb-1 block text-muted-foreground">عند وصول الرصيد لصفر</label>
            <select
              value={policy.zeroAction}
              onChange={(e) => setPolicy((p) => ({ ...p, zeroAction: e.target.value as InventorySyncPolicy['zeroAction'] }))}
              className="w-full rounded border border-border/70 bg-card px-2.5 py-1.5"
            >
              <option value="MARK_OUT_OF_STOCK">Mark out of stock</option>
              <option value="DISABLE">Disable listing</option>
              <option value="IGNORE">Ignore</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-muted-foreground">سياسة التعارضات</label>
            <select
              value={policy.conflictPolicy}
              onChange={(e) => setPolicy((p) => ({ ...p, conflictPolicy: e.target.value as InventorySyncPolicy['conflictPolicy'] }))}
              className="w-full rounded border border-border/70 bg-card px-2.5 py-1.5"
            >
              <option value="MANUAL_REVIEW">Manual review (Tickets)</option>
              <option value="AUTO_RESOLVE">Auto resolve</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded bg-primary px-3.5 py-1.5 font-semibold text-primary-foreground"
          >
            <span>حفظ السياسات</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleScanSample()}
            className="inline-flex items-center gap-1.5 rounded border border-border/70 bg-card px-3.5 py-1.5 font-medium"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} />
            <span>فحص فروق المخزون الآن</span>
          </button>
          {unresolvedCount > 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleResolveAll()}
              className="inline-flex items-center gap-1.5 rounded border border-primary/50 bg-primary/10 px-3.5 py-1.5 font-semibold text-primary"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Resolve all ({unresolvedCount})</span>
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto border-t border-border/70 sm:rounded-md sm:border">
        <table className="w-full text-start text-xs">
          <thead className="border-b border-border/70 bg-muted/30 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-start">SKU</th>
              <th className="px-3 py-2 text-start">القناة</th>
              <th className="px-3 py-2 text-end">MaxP</th>
              <th className="px-3 py-2 text-end">القناة</th>
              <th className="px-3 py-2 text-end">الفرق (Diff)</th>
              <th className="px-3 py-2 text-start">الحالة</th>
              <th className="px-3 py-2 text-end">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  لا توجد تذاكر تعارض مخزون حالياً.
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id}>
                  <td className="px-3 py-2 font-mono font-medium text-foreground">{t.sku}</td>
                  <td className="px-3 py-2 uppercase">{t.channel}</td>
                  <td className="px-3 py-2 text-end font-mono tabular-nums">{t.maxpQty}</td>
                  <td className="px-3 py-2 text-end font-mono tabular-nums">{t.channelQty}</td>
                  <td className="px-3 py-2 text-end font-mono font-semibold tabular-nums text-destructive">{t.diff}</td>
                  <td className="px-3 py-2 font-mono text-[11px]">{t.status}</td>
                  <td className="px-3 py-2 text-end">
                    {t.status === 'UNRESOLVED' ? (
                      <button
                        type="button"
                        onClick={() => void handleResolveOne(t.id)}
                        className="inline-flex items-center gap-1 rounded border border-border/70 bg-card px-2 py-0.5 text-[11px] hover:border-primary/60"
                      >
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                        <span>اعتماد MaxP</span>
                      </button>
                    ) : (
                      <span className="text-primary">تم الحل</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
