import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Layers, Plus, Trash2, Coins } from 'lucide-react';
import { CostGroup, CostGroupItem, CurrencyPolicy, marketplaceHubService } from '../../../services/marketplaceHubService';

interface CostGroupsBarProps {
  selectedGroupItems: CostGroupItem[];
  onApplyCostGroup: (items: CostGroupItem[]) => void;
}

const PRESET_COSTS: Array<{ label: string; type: 'FIXED' | 'PERCENT'; value: number }> = [
  { label: 'Packaging', type: 'FIXED', value: 15 },
  { label: 'Shipping', type: 'FIXED', value: 35 },
  { label: 'Customs duty', type: 'PERCENT', value: 5 },
  { label: 'Payment fee', type: 'PERCENT', value: 2.5 },
];

export const CostGroupsBar: React.FC<CostGroupsBarProps> = ({ selectedGroupItems, onApplyCostGroup }) => {
  const [groups, setGroups] = useState<CostGroup[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [draftItems, setDraftItems] = useState<CostGroupItem[]>([{ label: 'Packaging', type: 'FIXED', value: 15 }]);
  const [currencyPolicy, setCurrencyPolicy] = useState<CurrencyPolicy | null>(null);

  useEffect(() => {
    Promise.all([marketplaceHubService.listCostGroups(), marketplaceHubService.getCurrencyPolicy()])
      .then(([cgList, pol]) => {
        setGroups(cgList);
        setCurrencyPolicy(pol);
      })
      .catch(() => {});
  }, []);

  const handleSelectGroup = (id: string) => {
    setSelectedId(id);
    const found = groups.find((g) => g.id === id);
    onApplyCostGroup(found ? found.items : []);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error('أدخل اسم مجموعة التكاليف');
      return;
    }
    try {
      const saved = await marketplaceHubService.saveCostGroup({ name: newName, items: draftItems });
      setGroups((prev) => [saved, ...prev.filter((g) => g.id !== saved.id)]);
      setSelectedId(saved.id);
      onApplyCostGroup(saved.items);
      setNewName('');
      setOpenCreate(false);
      toast.success('تم حفظ مجموعة التكاليف وتطبيقها');
    } catch {
      toast.error('تعذر حفظ مجموعة التكاليف');
    }
  };

  const handleToggleCurrencyView = async (amountView: 'NATIVE' | 'REPORTING') => {
    try {
      const updated = await marketplaceHubService.saveCurrencyPolicy({ ...(currencyPolicy || {}), amountView });
      setCurrencyPolicy(updated);
      toast.success(`عرض التقارير: ${amountView}`);
    } catch {
      toast.error('تعذر تحديث سياسة العملة');
    }
  };

  const handleReportingCurrencyChange = async (reportingCurrency: string) => {
    try {
      const updated = await marketplaceHubService.saveCurrencyPolicy({ ...(currencyPolicy || {}), reportingCurrency });
      setCurrencyPolicy(updated);
    } catch {
      toast.error('تعذر تغيير عملة التقارير');
    }
  };

  return (
    <div className="mb-4 rounded-md border border-border/70 bg-background p-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span>قوالب التكلفة (Cost Groups):</span>
          </span>
          <select
            value={selectedId}
            onChange={(e) => handleSelectGroup(e.target.value)}
            className="rounded border border-border/70 bg-card px-2.5 py-1 text-xs"
          >
            <option value="">بدون قالب تكلفة</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.items.length} عناصر)
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setOpenCreate((v) => !v)}
            className="inline-flex items-center gap-1 rounded border border-border/70 bg-card px-2.5 py-1 font-medium text-primary hover:border-primary/60"
          >
            <Plus className="h-3 w-3" />
            <span>قالب جديد</span>
          </button>
          {selectedGroupItems.length > 0 && (
            <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[11px] tabular-nums text-primary">
              {selectedGroupItems.length} بنود مطبقة
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Coins className="h-3.5 w-3.5" />
            <span>التقارير:</span>
          </span>
          <select
            value={currencyPolicy?.reportingCurrency || 'EGP'}
            onChange={(e) => void handleReportingCurrencyChange(e.target.value)}
            className="rounded border border-border/70 bg-card px-2 py-1 font-mono text-[11px]"
          >
            {['EGP', 'SAR', 'AED', 'USD', 'KWD', 'QAR'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void handleToggleCurrencyView(currencyPolicy?.amountView === 'REPORTING' ? 'NATIVE' : 'REPORTING')}
            className="rounded border border-border/70 bg-card px-2.5 py-1 font-mono text-[11px]"
          >
            {currencyPolicy?.amountView === 'REPORTING' ? 'Reporting View' : 'Native View'}
          </button>
        </div>
      </div>

      {openCreate && (
        <form onSubmit={handleCreateGroup} className="mt-3 space-y-2.5 border-t border-border/70 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="اسم المجموعة (مثال: Small parcel)"
              className="min-w-[180px] flex-1 rounded border border-border/70 bg-card px-2.5 py-1.5 text-xs"
            />
            {PRESET_COSTS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setDraftItems((prev) => [...prev, { ...p }])}
                className="rounded border border-border/70 bg-card px-2 py-1 text-[11px] hover:border-primary/60"
              >
                + {p.label}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            {draftItems.map((it, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={it.label}
                  onChange={(e) =>
                    setDraftItems((prev) => prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                  }
                  placeholder="البند"
                  className="flex-1 rounded border border-border/70 bg-card px-2 py-1 text-xs"
                />
                <select
                  value={it.type}
                  onChange={(e) =>
                    setDraftItems((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, type: e.target.value as 'FIXED' | 'PERCENT' } : x)),
                    )
                  }
                  className="rounded border border-border/70 bg-card px-2 py-1 text-xs"
                >
                  <option value="FIXED">ثابت</option>
                  <option value="PERCENT">%</option>
                </select>
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  value={it.value}
                  onChange={(e) =>
                    setDraftItems((prev) => prev.map((x, i) => (i === idx ? { ...x, value: Number(e.target.value) } : x)))
                  }
                  className="w-20 rounded border border-border/70 bg-card px-2 py-1 font-mono tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => setDraftItems((prev) => prev.filter((_, i) => i !== idx))}
                  className="rounded p-1 text-muted-foreground hover:text-destructive"
                  aria-label="حذف"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpenCreate(false)} className="rounded border border-border/70 px-3 py-1">
              إلغاء
            </button>
            <button type="submit" className="rounded bg-primary px-3 py-1 font-semibold text-primary-foreground">
              حفظ وتطبيق
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
