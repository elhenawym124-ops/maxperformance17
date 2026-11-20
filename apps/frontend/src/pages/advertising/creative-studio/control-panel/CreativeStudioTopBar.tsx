import React from "react";
import { Wand2, Loader2, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MarketingProduct, BatchCountType } from "../types";

interface CreativeStudioTopBarProps {
  selectedProduct: MarketingProduct | null;
  isGenerating: boolean;
  batchCount: BatchCountType;
  selectedModel: string;
  dailyUsage?: number;
  dailyLimit?: number;
  onGenerate: () => void;
  onChangeBatchCount: (count: BatchCountType) => void;
  onOpenModelModal: () => void;
}

export const CreativeStudioTopBar: React.FC<CreativeStudioTopBarProps> = ({
  selectedProduct,
  isGenerating,
  batchCount,
  selectedModel,
  dailyUsage = 0,
  dailyLimit = 50,
  onGenerate,
  onChangeBatchCount,
  onOpenModelModal,
}) => {
  return (
    <div className="p-3 border-b border-border dark:border-border bg-white dark:bg-muted flex items-center justify-between gap-2 flex-shrink-0 flex-wrap">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || !selectedProduct}
          className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-xs active:scale-[0.97] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isGenerating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Wand2 className="w-3.5 h-3.5 text-primary" />
          )}
          <span>
            {isGenerating
              ? "جاري التوليد..."
              : batchCount > 1
              ? `توليد ${batchCount} تنويعات بالذكاء الاصطناعي`
              : "توليد المشهد بالذكاء الاصطناعي"}
          </span>
        </Button>

        {/* Batch Selector */}
        <div className="flex items-center bg-muted dark:bg-muted p-0.5 rounded-lg border border-border dark:border-border">
          {([1, 2, 4] as const).map((cnt) => (
            <button
              key={cnt}
              type="button"
              onClick={() => onChangeBatchCount(cnt)}
              className={`px-2 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                batchCount === cnt
                  ? "bg-white dark:bg-muted text-foreground dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-foreground"
              }`}
              title={`توليد ${cnt} ${cnt === 1 ? "صورة" : "تنويعات"}`}
            >
              {cnt}x
            </button>
          ))}
        </div>
      </div>

      {/* Model Selector Trigger & Quota */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenModelModal}
          className="h-7 px-2 text-[11px] font-bold rounded-lg border border-primary dark:border-primary bg-primary/50 dark:bg-primary/40 text-primary dark:text-primary hover:bg-primary transition flex items-center gap-1 cursor-pointer"
          title="فتح معرض نماذج الذكاء الاصطناعي والمواصفات"
        >
          <Cpu className="w-3 h-3" />
          <span className="font-mono">{selectedModel.split("/").pop()}</span>
        </button>

        <div
          className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground dark:text-muted-foreground bg-muted dark:bg-muted px-2 py-1 rounded-lg"
          title="الرصيد المتبقي لتوليد المشاهد اليوم"
        >
          <span>الرصيد المتبقي:</span>
          <span className="font-bold text-success dark:text-success tabular-nums">
            {Math.max(0, dailyLimit - dailyUsage)}/{dailyLimit}
          </span>
        </div>
      </div>
    </div>
  );
};
