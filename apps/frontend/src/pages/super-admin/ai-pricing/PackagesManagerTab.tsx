import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { AiCreditPackage } from '../../../services/aiCreditsService';

interface Props {
  packages: AiCreditPackage[];
  onChange: (next: AiCreditPackage[]) => void;
}

export const PackagesManagerTab: React.FC<Props> = ({ packages, onChange }) => {
  const updatePkg = (idx: number, patch: Partial<AiCreditPackage>) => {
    const next = packages.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    onChange(next);
  };

  const addPackage = () => {
    onChange([
      ...packages,
      {
        id: `pack-${Date.now().toString(36)}`,
        nameAr: 'باقة جديدة',
        nameEn: 'Custom Pack',
        priceEgp: 250,
        credits: 5000,
        bonusCredits: 500,
        validityDays: 365,
        isPopular: false,
        isActive: true,
      },
    ]);
  };

  const removePackage = (idx: number) => {
    onChange(packages.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <span className="text-xs text-muted-foreground">
          تُعرض الباقات المفعّلة مباشرة للتاجر عند اختيار طريقة الشحن
        </span>
        <Button type="button" size="sm" variant="outline" onClick={addPackage} className="h-8 gap-1">
          <Plus className="size-3.5" />
          <span>إضافة باقة</span>
        </Button>
      </div>

      <div className="divide-y divide-border/60">
        {packages.map((pkg, idx) => {
          const totalCr = pkg.credits + (pkg.bonusCredits || 0);
          const unitEgp = totalCr > 0 ? pkg.priceEgp / totalCr : 0;
          return (
            <div key={pkg.id} className="grid gap-3 py-3 sm:grid-cols-12 sm:items-end">
              <div className="sm:col-span-3">
                <label className="mb-1 block text-[11px] text-muted-foreground">الاسم بالعربية</label>
                <Input
                  className="h-8 text-xs"
                  value={pkg.nameAr}
                  onChange={(e) => updatePkg(idx, { nameAr: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] text-muted-foreground">السعر (ج.م)</label>
                <Input
                  type="number"
                  min={1}
                  className="h-8 font-mono text-xs tabular-nums"
                  value={pkg.priceEgp}
                  onChange={(e) => updatePkg(idx, { priceEgp: Math.max(1, Number(e.target.value)) })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] text-muted-foreground">Credits أساسي</label>
                <Input
                  type="number"
                  min={1}
                  className="h-8 font-mono text-xs tabular-nums"
                  value={pkg.credits}
                  onChange={(e) => updatePkg(idx, { credits: Math.max(1, Number(e.target.value)) })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] text-muted-foreground">بونص (Cr)</label>
                <Input
                  type="number"
                  min={0}
                  className="h-8 font-mono text-xs tabular-nums"
                  value={pkg.bonusCredits}
                  onChange={(e) => updatePkg(idx, { bonusCredits: Math.max(0, Number(e.target.value)) })}
                />
              </div>
              <div className="flex items-center justify-between gap-2 sm:col-span-3">
                <div className="space-y-1 text-[11px]">
                  <div className="font-mono tabular-nums text-muted-foreground">
                    {unitEgp.toFixed(4)} ج.م/Cr
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex cursor-pointer items-center gap-1">
                      <input
                        type="checkbox"
                        checked={pkg.isPopular}
                        onChange={(e) => updatePkg(idx, { isPopular: e.target.checked })}
                        className="accent-primary"
                      />
                      <span>الأكثر طلباً</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-1">
                      <input
                        type="checkbox"
                        checked={pkg.isActive}
                        onChange={(e) => updatePkg(idx, { isActive: e.target.checked })}
                        className="accent-primary"
                      />
                      <span>نشطة</span>
                    </label>
                  </div>
                </div>
                {packages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePackage(idx)}
                    aria-label="حذف الباقة"
                    className="rounded p-1.5 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
