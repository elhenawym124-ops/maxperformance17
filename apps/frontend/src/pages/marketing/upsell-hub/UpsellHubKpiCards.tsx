import React from "react";
import { Layers, CheckCircle2, TrendingUp, ShoppingCart } from "lucide-react";

interface UpsellHubKpiCardsProps {
  stats: {
    total: number;
    withOffers: number;
    coverage: number;
    totalUpsells: number;
    totalCrossSells: number;
    activePlacements: number;
  };
}

export const UpsellHubKpiCards: React.FC<UpsellHubKpiCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm dark:border-border dark:bg-muted">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
          <span>مواضع الظهور</span>
          <Layers className="h-4 w-4 text-primary" />
        </div>
        <div className="mt-2 text-2xl font-black text-foreground tabular-nums">
          {stats.activePlacements} / 3
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          صفحة المنتج، السلة، صفحة الشكر
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white p-4 shadow-sm dark:border-border dark:bg-muted">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
          <span>تغطية المنتجات</span>
          <CheckCircle2 className="h-4 w-4 text-success" />
        </div>
        <div className="mt-2 text-2xl font-black text-success dark:text-success tabular-nums">
          {stats.coverage}%
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">
          {stats.withOffers} من {stats.total} منتج بعروض
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white p-4 shadow-sm dark:border-border dark:bg-muted">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
          <span>روابط الترقية (Upsell)</span>
          <TrendingUp className="h-4 w-4 text-success" />
        </div>
        <div className="mt-2 text-2xl font-black text-foreground tabular-nums">
          {stats.totalUpsells}
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          بدائل أعلى قيمة جاهزة
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white p-4 shadow-sm dark:border-border dark:bg-muted">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
          <span>المكملات (Cross-sell)</span>
          <ShoppingCart className="h-4 w-4 text-primary" />
        </div>
        <div className="mt-2 text-2xl font-black text-foreground tabular-nums">
          {stats.totalCrossSells}
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          مكملات السلة و Bought Together
        </p>
      </div>
    </div>
  );
};
