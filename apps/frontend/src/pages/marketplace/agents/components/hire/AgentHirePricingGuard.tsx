import React from "react";
import { Wallet, AlertCircle, ExternalLink, Check, RefreshCw } from "lucide-react";
import { AgentListing, formatEgp } from "../../agentMarketplaceData";

interface AgentHirePricingGuardProps {
  agent: AgentListing;
  isPro: boolean;
  walletBalance: number | null;
  walletLoading: boolean;
  walletError: string | null;
  hasEnoughBalance: boolean;
  onRetryWallet: () => void;
  onNavigateToRecharge: () => void;
}

export const AgentHirePricingGuard: React.FC<AgentHirePricingGuardProps> = ({
  agent,
  isPro,
  walletBalance,
  walletLoading,
  walletError,
  hasEnoughBalance,
  onRetryWallet,
  onNavigateToRecharge,
}) => {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/25 p-3.5 space-y-2.5 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-muted-foreground">فئة التعيين:</span>
          <span className="font-semibold ms-1.5 text-foreground">
            {isPro ? "اشتراك تخصصي Pro" : "متضمن مجاناً بالباقة"}
          </span>
        </div>
        <div className="font-bold font-mono tabular-nums text-foreground">
          {isPro ? `${formatEgp(agent.priceMonthly, agent.currency)}/شهر` : "0 ج.م"}
        </div>
      </div>

      {isPro && (
        <div className="pt-2.5 border-t border-border/70 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Wallet className="size-3.5 text-primary stroke-[1.5]" />
              <span>رصيد محفظة الشركة:</span>
            </span>
            <span className="font-bold font-mono tabular-nums text-foreground">
              {walletLoading
                ? "جاري التحقق…"
                : walletBalance !== null
                ? formatEgp(walletBalance, agent.currency)
                : "غير متاح"}
            </span>
          </div>

          {walletError && !walletLoading && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-2.5 text-warning flex items-center justify-between gap-3">
              <span className="text-[11px]">{walletError}</span>
              <button
                type="button"
                onClick={onRetryWallet}
                className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-warning/30 bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted active:scale-[0.97] transition-all"
              >
                <RefreshCw className="size-3 stroke-[1.5]" />
                <span>إعادة المحاولة</span>
              </button>
            </div>
          )}

          {!walletError && !hasEnoughBalance && !walletLoading && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-destructive flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <div className="font-semibold flex items-center gap-1">
                  <AlertCircle className="size-3.5 stroke-[1.5]" />
                  <span>رصيد المحفظة غير كافٍ</span>
                </div>
                <p className="text-[11px] opacity-90">
                  يلزم توفر {formatEgp(agent.priceMonthly, agent.currency)} على الأقل لتفعيل هذا الوكيل.
                </p>
              </div>
              <button
                type="button"
                onClick={onNavigateToRecharge}
                className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-destructive px-2.5 py-1.5 text-[11px] font-semibold text-destructive-foreground hover:bg-destructive/90 active:scale-[0.97] transition-all"
              >
                <span>شحن المحفظة</span>
                <ExternalLink className="size-3 stroke-[1.5]" />
              </button>
            </div>
          )}

          {!walletError && hasEnoughBalance && !walletLoading && (
            <div className="text-[11px] text-success flex items-center gap-1">
              <Check className="size-3.5 stroke-[2]" />
              <span>الرصيد يغطي الاشتراك، وسيتم الخصم وتفعيل الوكيل فوراً.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
