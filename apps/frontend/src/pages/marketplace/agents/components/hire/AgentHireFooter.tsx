import React from "react";
import { Loader2, Check } from "lucide-react";

interface AgentHireFooterProps {
  loading: boolean;
  isPro: boolean;
  isSquad?: boolean;
  walletLoading?: boolean;
  walletError?: string | null;
  hasEnoughBalance: boolean;
  onClose: () => void;
  onConfirmHire: () => void;
}

export const AgentHireFooter: React.FC<AgentHireFooterProps> = ({
  loading,
  isPro,
  isSquad = false,
  walletLoading = false,
  walletError = null,
  hasEnoughBalance,
  onClose,
  onConfirmHire,
}) => {
  const blocked =
    loading || (isPro && (walletLoading || Boolean(walletError) || !hasEnoughBalance));

  return (
    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/70">
      <button
        type="button"
        onClick={onClose}
        disabled={loading}
        className="h-9 px-4 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted active:scale-[0.97] transition-all"
      >
        إلغاء
      </button>

      <button
        type="button"
        onClick={onConfirmHire}
        disabled={blocked}
        className="inline-flex items-center justify-center gap-1.5 h-9 px-5 rounded-lg bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {loading ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            <span>جاري التفعيل…</span>
          </>
        ) : isPro && !hasEnoughBalance && !walletLoading && !walletError ? (
          <span>اشحن المحفظة للمتابعة</span>
        ) : (
          <>
            <Check className="size-3.5 stroke-[2]" />
            <span>{isSquad ? "تأكيد تفعيل الفريق" : "تأكيد تعيين الوكيل"}</span>
          </>
        )}
      </button>
    </div>
  );
};
