import React, { useCallback, useEffect, useState } from 'react';
import { Coins, Loader2, RefreshCcw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import {
  aiCreditsService,
  AiCreditPricingSettings,
  EffectiveModelCatalogItem,
} from '../../../services/aiCreditsService';
import { PricingSettingsTab } from './PricingSettingsTab';
import { ModelCatalogTab } from './ModelCatalogTab';
import { PackagesManagerTab } from './PackagesManagerTab';
import { CompaniesCreditsTab } from './CompaniesCreditsTab';

type TabKey = 'pricing' | 'models' | 'packages' | 'companies';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'pricing', label: 'التسعير والمحاكي' },
  { key: 'models', label: 'أسعار الموديلات' },
  { key: 'packages', label: 'باقات الشحن' },
  { key: 'companies', label: 'أرصدة الشركات' },
];

export default function SuperAdminAiPricingPage() {
  const [tab, setTab] = useState<TabKey>('pricing');
  const [draft, setDraft] = useState<AiCreditPricingSettings | null>(null);
  const [models, setModels] = useState<EffectiveModelCatalogItem[]>([]);
  const [baseline, setBaseline] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await aiCreditsService.getAdminSettings();
      setDraft(res.settings);
      setModels(res.modelCatalog);
      setBaseline(JSON.stringify(res.settings));
    } catch {
      toast.error('فشل تحميل إعدادات تسعير الوكلاء والكريدت');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = draft ? JSON.stringify(draft) !== baseline : false;

  const patchDraft = (patch: Partial<AiCreditPricingSettings>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await aiCreditsService.updateAdminSettings(draft);
      setDraft(res.settings);
      setModels(res.modelCatalog);
      setBaseline(JSON.stringify(res.settings));
      toast.success('تم حفظ إعدادات التسعير وتفعيلها فوراً');
    } catch {
      toast.error('فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !draft) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 p-3 sm:p-5" dir="rtl">
      {/* Header Bar */}
      <div className="flex flex-col gap-3 border-b border-border/70 pb-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/30 text-primary">
            <Coins className="size-4.5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
              إدارة تسعير الوكلاء والتوكن والكريدت
            </h1>
            <p className="text-xs text-muted-foreground">
              التحكم الفوري في سعر الصرف، هوامش الربح، أسعار الموديلات، وباقات الشحن
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => void load()} aria-label="تحديث">
            <RefreshCcw className="size-3.5" />
          </Button>
          {tab !== 'companies' && (
            <Button
              type="button"
              size="sm"
              disabled={!dirty || saving}
              onClick={() => void handleSave()}
              className="gap-1.5"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              <span>حفظ التعديلات</span>
            </Button>
          )}
        </div>
      </div>

      {/* Single-Surface Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border/70 pb-2 scrollbar-none">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === item.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-5">
        {tab === 'pricing' && (
          <PricingSettingsTab draft={draft} models={models} onChange={patchDraft} />
        )}
        {tab === 'models' && (
          <ModelCatalogTab
            models={models}
            overrides={draft.modelCostOverrides}
            onUpdateOverrides={(next) => patchDraft({ modelCostOverrides: next })}
          />
        )}
        {tab === 'packages' && (
          <PackagesManagerTab
            packages={draft.packages}
            onChange={(next) => patchDraft({ packages: next })}
          />
        )}
        {tab === 'companies' && <CompaniesCreditsTab />}
      </div>
    </div>
  );
}
