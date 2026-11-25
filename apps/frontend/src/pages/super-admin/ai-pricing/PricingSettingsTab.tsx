import React, { useEffect, useState } from 'react';
import { Calculator } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import {
  aiCreditsService,
  AiCreditPricingSettings,
  EffectiveModelCatalogItem,
  UsageQuoteResult,
} from '../../../services/aiCreditsService';

interface Props {
  draft: AiCreditPricingSettings;
  models: EffectiveModelCatalogItem[];
  onChange: (patch: Partial<AiCreditPricingSettings>) => void;
}

const num = (v: string, fallback = 0) => {
  const parsed = Number(v);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const PricingSettingsTab: React.FC<Props> = ({ draft, models, onChange }) => {
  const [simInput, setSimInput] = useState({
    modelName: models[0]?.modelName || 'deepseek-flash',
    inputTokens: 2500,
    outputTokens: 500,
    agentSteps: 2,
    source: 'AGENT_RUN',
  });
  const [simResult, setSimResult] = useState<UsageQuoteResult | null>(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      aiCreditsService
        .simulateUsage(simInput, draft)
        .then((res) => {
          if (active) setSimResult(res);
        })
        .catch(() => {});
    }, 180);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [simInput, draft]);

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Financial & Policy Parameters */}
      <div className="space-y-5 lg:col-span-7">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="aic-fx" className="text-xs">سعر الصرف (ج.م / $)</Label>
            <Input
              id="aic-fx"
              type="number"
              min={1}
              step="0.5"
              className="font-mono tabular-nums"
              value={draft.usdToEgp}
              onChange={(e) => onChange({ usdToEgp: num(e.target.value, 50) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aic-cr" className="text-xs">سعر الكريدت (ج.م)</Label>
            <Input
              id="aic-cr"
              type="number"
              min={0.001}
              step="0.01"
              className="font-mono tabular-nums"
              value={draft.creditPriceEgp}
              onChange={(e) => onChange({ creditPriceEgp: num(e.target.value, 0.05) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aic-mode" className="text-xs">وضع التفعيل (Gate)</Label>
            <select
              id="aic-mode"
              value={draft.enforcementMode}
              onChange={(e) =>
                onChange({ enforcementMode: e.target.value as AiCreditPricingSettings['enforcementMode'] })
              }
              className="h-9 w-full rounded-md border border-border/70 bg-background px-2.5 text-xs text-foreground"
            >
              <option value="warn">مراقبة وخصم بدون حظر (Warn)</option>
              <option value="enforce">حظر عند نفاد الرصيد (Enforce)</option>
              <option value="off">تسجيل صامت فقط (Off)</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="aic-mflash" className="text-xs">هامش الموديلات الاقتصادية (Flash %)</Label>
            <Input
              id="aic-mflash"
              type="number"
              min={0}
              step="5"
              className="font-mono tabular-nums"
              value={draft.flashMarkupPercent}
              onChange={(e) => onChange({ flashMarkupPercent: num(e.target.value, 80) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aic-mpro" className="text-xs">هامش الموديلات المتقدمة (Pro %)</Label>
            <Input
              id="aic-mpro"
              type="number"
              min={0}
              step="5"
              className="font-mono tabular-nums"
              value={draft.proMarkupPercent}
              onChange={(e) => onChange({ proMarkupPercent: num(e.target.value, 40) })}
            />
          </div>
        </div>

        <div className="grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="aic-minchat" className="text-xs">أقل خصم للرد (Cr)</Label>
            <Input
              id="aic-minchat"
              type="number"
              min={0}
              className="font-mono tabular-nums"
              value={draft.minCreditsPerChat}
              onChange={(e) => onChange({ minCreditsPerChat: Math.round(num(e.target.value, 1)) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aic-minagent" className="text-xs">أقل خصم للأيجنت (Cr)</Label>
            <Input
              id="aic-minagent"
              type="number"
              min={0}
              className="font-mono tabular-nums"
              value={draft.minCreditsPerAgentRun}
              onChange={(e) => onChange({ minCreditsPerAgentRun: Math.round(num(e.target.value, 2)) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aic-step" className="text-xs">رسوم كل أداة/خطوة (Cr)</Label>
            <Input
              id="aic-step"
              type="number"
              min={0}
              className="font-mono tabular-nums"
              value={draft.agentStepFeeCredits}
              onChange={(e) => onChange({ agentStepFeeCredits: Math.round(num(e.target.value, 1)) })}
            />
          </div>
        </div>

        <div className="grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="aic-trial" className="text-xs">رصيد الترحيب المجاني (Cr)</Label>
            <Input
              id="aic-trial"
              type="number"
              min={0}
              className="font-mono tabular-nums"
              value={draft.trialBonusCredits}
              onChange={(e) => onChange({ trialBonusCredits: Math.round(num(e.target.value, 200)) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aic-daily" className="text-xs">السقف اليومي الافتراضي (Cr)</Label>
            <Input
              id="aic-daily"
              type="number"
              min={0}
              className="font-mono tabular-nums"
              value={draft.defaultDailyCreditLimit}
              onChange={(e) => onChange({ defaultDailyCreditLimit: Math.round(num(e.target.value, 5000)) })}
            />
          </div>
          <div className="flex items-end pb-1.5">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                checked={draft.byokFreeTokens}
                onChange={(e) => onChange({ byokFreeTokens: e.target.checked })}
                className="size-4 rounded border-border/70 accent-primary"
              />
              <span>إعفاء مفاتيح التاجر (BYOK)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Live Cost & Profit Simulator */}
      <div className="space-y-4 border-t border-border/60 pt-4 lg:col-span-5 lg:border-s lg:border-t-0 lg:ps-6 lg:pt-0">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
          <Calculator className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">محاكي التسعير والربحية المباشر</h3>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <Label className="mb-1 block text-xs">الموديل</Label>
            <select
              value={simInput.modelName}
              onChange={(e) => setSimInput((p) => ({ ...p, modelName: e.target.value }))}
              dir="ltr"
              className="h-9 w-full rounded-md border border-border/70 bg-background px-2.5 font-mono text-xs"
            >
              {models.map((m) => (
                <option key={m.modelName} value={m.modelName}>
                  {m.modelName} ({m.tier})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="mb-1 block text-[11px]">Input Tokens</Label>
              <Input
                type="number"
                min={0}
                className="h-8 font-mono text-xs tabular-nums"
                value={simInput.inputTokens}
                onChange={(e) => setSimInput((p) => ({ ...p, inputTokens: num(e.target.value, 0) }))}
              />
            </div>
            <div>
              <Label className="mb-1 block text-[11px]">Output Tokens</Label>
              <Input
                type="number"
                min={0}
                className="h-8 font-mono text-xs tabular-nums"
                value={simInput.outputTokens}
                onChange={(e) => setSimInput((p) => ({ ...p, outputTokens: num(e.target.value, 0) }))}
              />
            </div>
            <div>
              <Label className="mb-1 block text-[11px]">خطوات الأيجنت</Label>
              <Input
                type="number"
                min={0}
                className="h-8 font-mono text-xs tabular-nums"
                value={simInput.agentSteps}
                onChange={(e) => setSimInput((p) => ({ ...p, agentSteps: Math.round(num(e.target.value, 0)) }))}
              />
            </div>
          </div>

          {simResult && (
            <div className="divide-y divide-border/50 rounded-lg border border-border/70 bg-muted/20">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-muted-foreground">تكلفة المزود الفعلية</span>
                <span className="font-mono font-medium tabular-nums">
                  ${simResult.costUsd.toFixed(4)} ({simResult.rawCostEgp.toFixed(3)} ج.م)
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-muted-foreground">الخصم على التاجر</span>
                <span className="font-mono text-sm font-bold tabular-nums text-primary">
                  {simResult.credits} Cr ({simResult.revenueEgp.toFixed(2)} ج.م)
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-muted-foreground">صافي ربح المنصة</span>
                <span className="font-mono font-semibold tabular-nums text-success">
                  +{simResult.grossProfitEgp.toFixed(3)} ج.م
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
