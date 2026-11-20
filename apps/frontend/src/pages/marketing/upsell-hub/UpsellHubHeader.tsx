import React from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Zap,
  Calculator,
  Sparkles,
  Store,
  ExternalLink,
} from "lucide-react";

export const UpsellHubHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-6 dark:border-border dark:bg-muted">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-primary text-white shadow-md shadow-primary/20">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-black text-foreground sm:text-2xl dark:text-white">
              عروض الـ Upsell والـ Cross-sell
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm dark:text-muted-foreground">
              إدارة عروض الترقية والمكملات لزيادة متوسط قيمة الطلب (AOV) في متجرك.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
        <button
          type="button"
          onClick={() => navigate("/settings/post-purchase-offer")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-success bg-success/10 px-3.5 py-2.5 text-xs font-black text-success shadow-sm transition hover:bg-success dark:border-success dark:bg-success/40 dark:text-success"
        >
          <Zap className="h-4 w-4 text-success dark:text-success" />
          أداة العرض بعد الطلب (One-Click Offer)
        </button>
        <button
          type="button"
          onClick={() => navigate("/tools/upsell-planner")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted px-3.5 py-2.5 text-xs font-bold text-foreground transition hover:bg-muted dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted"
        >
          <Calculator className="h-4 w-4 text-success dark:text-success" />
          مخطط الأرباح
        </button>
        <button
          type="button"
          onClick={() => navigate("/settings/store/tools")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted px-3.5 py-2.5 text-xs font-bold text-foreground transition hover:bg-muted dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted"
        >
          <Sparkles className="h-4 w-4 text-warning" />
          أدوات التحويل
        </button>
        <a
          href="/shop"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary"
        >
          <Store className="h-4 w-4" />
          معاينة المتجر
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
};
