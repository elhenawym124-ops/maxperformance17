import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { EffectiveModelCatalogItem, ModelCostOverride } from '../../../services/aiCreditsService';

interface Props {
  models: EffectiveModelCatalogItem[];
  overrides: Record<string, ModelCostOverride>;
  onUpdateOverrides: (next: Record<string, ModelCostOverride>) => void;
}

export const ModelCatalogTab: React.FC<Props> = ({ models, overrides, onUpdateOverrides }) => {
  const [newModel, setNewModel] = useState({ modelName: '', input: 0.15, output: 0.6, tier: 'flash' as 'flash' | 'pro' });

  const patchModel = (modelName: string, patch: Partial<ModelCostOverride>) => {
    const current = overrides[modelName] || {};
    onUpdateOverrides({
      ...overrides,
      [modelName]: { ...current, ...patch },
    });
  };

  const handleAddModel = () => {
    const clean = newModel.modelName.trim();
    if (!clean) return;
    onUpdateOverrides({
      ...overrides,
      [clean]: {
        input: Number(newModel.input) || 0,
        output: Number(newModel.output) || 0,
        tier: newModel.tier,
        multiplier: 1,
        enabled: true,
      },
    });
    setNewModel({ modelName: '', input: 0.15, output: 0.6, tier: 'flash' });
  };

  return (
    <div className="space-y-4">
      {/* Add Custom Model Bar */}
      <div className="flex flex-wrap items-end gap-2 border-b border-border/60 pb-4">
        <div className="min-w-48 flex-1">
          <label className="mb-1 block text-[11px] text-muted-foreground">إضافة موديل مخصص</label>
          <Input
            dir="ltr"
            placeholder="e.g. gemini-3-flash"
            className="h-8 font-mono text-xs"
            value={newModel.modelName}
            onChange={(e) => setNewModel((p) => ({ ...p, modelName: e.target.value }))}
          />
        </div>
        <div className="w-28">
          <label className="mb-1 block text-[11px] text-muted-foreground">Input $/1M</label>
          <Input
            type="number"
            step="0.01"
            className="h-8 font-mono text-xs tabular-nums"
            value={newModel.input}
            onChange={(e) => setNewModel((p) => ({ ...p, input: Number(e.target.value) }))}
          />
        </div>
        <div className="w-28">
          <label className="mb-1 block text-[11px] text-muted-foreground">Output $/1M</label>
          <Input
            type="number"
            step="0.01"
            className="h-8 font-mono text-xs tabular-nums"
            value={newModel.output}
            onChange={(e) => setNewModel((p) => ({ ...p, output: Number(e.target.value) }))}
          />
        </div>
        <div className="w-28">
          <label className="mb-1 block text-[11px] text-muted-foreground">الفئة</label>
          <select
            value={newModel.tier}
            onChange={(e) => setNewModel((p) => ({ ...p, tier: e.target.value as 'flash' | 'pro' }))}
            className="h-8 w-full rounded-md border border-border/70 bg-background px-2 font-mono text-xs"
          >
            <option value="flash">flash</option>
            <option value="pro">pro</option>
          </select>
        </div>
        <Button type="button" size="sm" onClick={handleAddModel} className="h-8 gap-1">
          <Plus className="size-3.5" />
          <span>إضافة</span>
        </Button>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-border/70 text-start text-muted-foreground">
              <th className="py-2 pe-3 text-start font-medium">الموديل</th>
              <th className="py-2 px-2 text-start font-medium">الفئة</th>
              <th className="py-2 px-2 text-start font-medium">Input $/1M</th>
              <th className="py-2 px-2 text-start font-medium">Output $/1M</th>
              <th className="py-2 px-2 text-start font-medium">مضاعف (x)</th>
              <th className="py-2 ps-2 text-start font-medium">متاح</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {models.map((m) => (
              <tr key={m.modelName} className="hover:bg-muted/20">
                <td className="py-2 pe-3 font-mono text-xs font-medium text-foreground" dir="ltr">
                  {m.modelName}
                </td>
                <td className="py-2 px-2">
                  <select
                    value={m.tier}
                    onChange={(e) => patchModel(m.modelName, { tier: e.target.value as 'flash' | 'pro' })}
                    className="h-7 rounded border border-border/70 bg-background px-2 font-mono text-[11px]"
                  >
                    <option value="flash">flash</option>
                    <option value="pro">pro</option>
                  </select>
                </td>
                <td className="py-2 px-2">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className="h-7 w-24 font-mono text-xs tabular-nums"
                    value={m.inputPerM}
                    onChange={(e) => patchModel(m.modelName, { input: Number(e.target.value) })}
                  />
                </td>
                <td className="py-2 px-2">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className="h-7 w-24 font-mono text-xs tabular-nums"
                    value={m.outputPerM}
                    onChange={(e) => patchModel(m.modelName, { output: Number(e.target.value) })}
                  />
                </td>
                <td className="py-2 px-2">
                  <Input
                    type="number"
                    min={0.1}
                    step="0.5"
                    className="h-7 w-20 font-mono text-xs tabular-nums"
                    value={m.multiplier}
                    onChange={(e) => patchModel(m.modelName, { multiplier: Number(e.target.value) })}
                  />
                </td>
                <td className="py-2 ps-2">
                  <input
                    type="checkbox"
                    checked={m.enabled}
                    onChange={(e) => patchModel(m.modelName, { enabled: e.target.checked })}
                    className="size-4 accent-primary"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
