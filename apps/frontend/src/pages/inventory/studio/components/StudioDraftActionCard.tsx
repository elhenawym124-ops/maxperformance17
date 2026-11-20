import React from "react";
import { Zap, CheckCircle2, AlertTriangle, RefreshCw, ShieldCheck } from "lucide-react";
import type { StudioDraftAction } from "../../../components/agent-studio/types";

interface StudioDraftActionCardProps {
  draft: StudioDraftAction;
  currentPriceFallback: number;
  isApplying: boolean;
  actionSuccessMessage: string | null;
  actionErrorMessage: string | null;
  onApplyDraft: () => void;
  onDismissDraft?: () => void;
}

export const StudioDraftActionCard: React.FC<StudioDraftActionCardProps> = ({
  draft,
  currentPriceFallback,
  isApplying,
  actionSuccessMessage,
  actionErrorMessage,
  onApplyDraft,
  onDismissDraft,
}) => {
  return (
    <div className="p-4 rounded-xl border-2 border-primary bg-primary/40 dark:bg-primary/30 shadow-xs space-y-3 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-primary text-white">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs font-black text-primary dark:text-primary">
            {draft.title || "مسودة توصية من وكيل المخزون"}
          </h4>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/80 dark:bg-primary text-primary dark:text-primary font-bold">
          بانتظار الاعتماد
        </span>
      </div>

      {draft.reason && (
        <p className="text-xs text-foreground dark:text-muted-foreground leading-relaxed bg-white/70 dark:bg-muted p-2.5 rounded-xl border border-primary/60 dark:border-primary/60">
          {draft.reason}
        </p>
      )}

      {/* Value Comparison */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="p-2 rounded-xl bg-white dark:bg-muted border border-border dark:border-border">
          <span className="text-[10px] text-muted-foreground block mb-0.5">القيمة الحالية</span>
          <span className="text-sm font-bold text-foreground dark:text-muted-foreground tabular-nums font-mono">
            {draft.currentValue !== undefined ? draft.currentValue : currentPriceFallback}
          </span>
        </div>
        <div className="p-2 rounded-xl bg-success/10 dark:bg-success/50 border border-success dark:border-success">
          <span className="text-[10px] text-success dark:text-success block mb-0.5 font-bold">
            القيمة المقترحة
          </span>
          <span className="text-sm font-black text-success dark:text-success tabular-nums font-mono">
            {draft.proposedValue}
          </span>
        </div>
      </div>

      {/* Success / Error Banners */}
      {actionSuccessMessage && (
        <div className="p-2.5 rounded-xl bg-success text-success dark:bg-success/80 dark:text-success text-xs font-bold flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {actionErrorMessage && (
        <div className="p-2.5 rounded-xl bg-destructive text-destructive dark:bg-destructive/80 dark:text-destructive text-xs font-bold flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <span>{actionErrorMessage}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onApplyDraft}
          disabled={isApplying}
          className="flex-1 py-2 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.97] text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
        >
          {isApplying ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5" />
          )}
          <span>اعتماد وتطبيق الإجراء</span>
        </button>

        {onDismissDraft && (
          <button
            type="button"
            onClick={onDismissDraft}
            disabled={isApplying}
            className="px-3 py-2 rounded-xl border border-border dark:border-border hover:bg-muted dark:hover:bg-muted text-foreground dark:text-muted-foreground font-bold text-xs transition cursor-pointer"
          >
            تجاهل
          </button>
        )}
      </div>
    </div>
  );
};
