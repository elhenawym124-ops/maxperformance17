import { AlertTriangle, CheckCircle2, Layers, Sparkles } from "lucide-react";
import type { MaterialsKpiCardsProps } from "../types/materialsTypes";

export function MaterialsKpiCards({
  summary,
  materialsCount,
}: MaterialsKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div className="bg-card border border-border dark:border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span>أنواع الخامات النشطة</span>
          <Layers className="w-4 h-4 text-info" />
        </div>
        <p className="text-2xl font-black text-foreground mt-2 font-mono tabular-nums">
          {summary?.totalMaterials ?? materialsCount}
        </p>
      </div>

      <div className="bg-card border border-border dark:border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span>أقراص وباتشات قيد العمل</span>
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <p className="text-2xl font-black text-primary dark:text-primary mt-2 font-mono tabular-nums">
          {summary?.totalActiveStocks ?? 0}
        </p>
      </div>

      <div className="bg-card border border-border dark:border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span>إجمالي الوحدات المتاحة للتفريز</span>
          <CheckCircle2 className="w-4 h-4 text-success" />
        </div>
        <p className="text-2xl font-black text-success dark:text-success mt-2 font-mono tabular-nums">
          {summary?.totalStockUnits ?? 0}{" "}
          <span className="text-xs font-normal">وحدة</span>
        </p>
      </div>

      <div className="bg-card border border-border dark:border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span>تنبيهات قرب النفاد</span>
          <AlertTriangle className="w-4 h-4 text-warning" />
        </div>
        <p className="text-2xl font-black text-warning dark:text-warning mt-2 font-mono tabular-nums">
          {summary?.lowStockCount ?? 0}
        </p>
      </div>
    </div>
  );
}

export default MaterialsKpiCards;
