import React from "react";
import { Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ALLOWED_IMAGE_MODELS } from "../types";

interface CreativeAdvancedTabProps {
  selectedModel: string;
  onSelectModel: (model: string) => void;
  onOpenModelModal: () => void;
  customPrompt: string;
  onChangeCustomPrompt: (prompt: string) => void;
}

export const CreativeAdvancedTab: React.FC<CreativeAdvancedTabProps> = ({
  selectedModel,
  onSelectModel,
  onOpenModelModal,
  customPrompt,
  onChangeCustomPrompt,
}) => {
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl border border-border dark:border-border bg-white dark:bg-muted">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-foreground dark:text-muted-foreground">
            محرك الذكاء الاصطناعي الحالي
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenModelModal}
            className="h-7 text-xs font-bold text-primary gap-1 cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>معرض النماذج (2026)</span>
          </Button>
        </div>

        <div className="space-y-1.5 mt-1.5">
          {ALLOWED_IMAGE_MODELS.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => onSelectModel(model.id)}
              className={`w-full p-2 rounded-xl border text-right transition flex items-center justify-between cursor-pointer ${
                selectedModel === model.id
                  ? "border-indigo-600 bg-primary/10 dark:bg-primary/40 text-primary dark:text-primary ring-1 ring-primary"
                  : "border-slate-200 dark:border-border bg-white dark:bg-muted text-foreground dark:text-muted-foreground"
              }`}
            >
              <span className="text-xs font-bold">{model.nameAr}</span>
              {model.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-warning dark:bg-warning text-warning dark:text-warning">
                  {model.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-border dark:border-border">
        <Label className="text-xs font-bold text-foreground dark:text-muted-foreground">
          برومبت مخصص إضافي (Prompt)
        </Label>
        <textarea
          value={customPrompt}
          onChange={(e) => onChangeCustomPrompt(e.target.value)}
          placeholder="اكتب تفاصيل إضافية لتخصيص الإضاءة أو خلفية المشهد..."
          className="w-full h-20 p-2 text-xs rounded-xl border border-border dark:border-border bg-white dark:bg-muted text-foreground dark:text-muted-foreground mt-1 focus:ring-2 focus:ring-primary"
        />
      </div>
    </div>
  );
};
