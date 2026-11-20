import { Clock, Eye, ShieldCheck, TrendingUp } from "lucide-react";
import { fmtMoney } from "../../shared";
import { type WorkTypeForm, CATEGORY_LABELS } from "../types/workTypeTypes";

interface WorkTypeLivePreviewProps {
  modal: WorkTypeForm;
  liveProfit: number;
  liveMarginPct: number;
}

export function WorkTypeLivePreview({
  modal,
  liveProfit,
  liveMarginPct,
}: WorkTypeLivePreviewProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 mb-2">
          <Eye className="w-4 h-4 text-primary" />
          معاينة حية (كيف تظهر للطبيب في البوابة)
        </label>
        <div className="rounded-xl border-2 border-primary dark:border-primary bg-gradient-to-b from-primary/50 to-white dark:from-primary/20 dark:to-gray-850 p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary dark:bg-primary/40 dark:text-primary">
                {CATEGORY_LABELS[modal.category] || modal.category}
              </span>
              <h4 className="font-bold text-sm text-foreground mt-1">
                {modal.name.trim() || "اسم نوع الشغل"}
              </h4>
            </div>
            <div className="text-end">
              <div className="text-lg font-extrabold text-primary dark:text-primary font-mono tabular-nums">
                {fmtMoney(modal.price)} ج.م
              </div>
              <span className="text-[10px] text-muted-foreground">
                {modal.pricingMode === "PER_UNIT"
                  ? "/ وحدة واحدة"
                  : "سعر شامل"}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t dark:border-border text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">الخامة:</span>
              <span className="font-medium truncate max-w-[150px]">
                {modal.defaultMaterial || "—"}
              </span>
            </div>
            {modal.materialBrand && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">الماركة:</span>
                <span className="font-semibold text-primary dark:text-primary">
                  {modal.materialBrand}
                </span>
              </div>
            )}
            {modal.defaultWarrantyYears > 0 && (
              <div className="flex items-center justify-between text-success dark:text-success font-semibold">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> الضمان:
                </span>
                <span className="font-mono tabular-nums">
                  {modal.defaultWarrantyYears} سنوات
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" /> مدة التنفيذ:
              </span>
              <span className="font-mono tabular-nums">
                {modal.leadTimeDays} أيام عمل
              </span>
            </div>
          </div>

          {modal.instructions && (
            <div className="p-2.5 rounded-lg bg-warning/10 dark:bg-warning/30 border border-warning dark:border-warning/50 text-[11px] text-warning dark:text-warning">
              <span className="font-bold block mb-0.5">
                توصيات التحضير للعيادة:
              </span>
              <p className="line-clamp-3">{modal.instructions}</p>
            </div>
          )}
        </div>
      </div>

      {/* Profit Margin Analyzer Card for Lab Owner */}
      <div className="rounded-xl border border-border dark:border-border bg-muted dark:bg-muted p-3.5 space-y-2 text-xs">
        <div className="flex items-center justify-between font-bold text-foreground dark:text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-success" /> تحليل ربحية الخدمة
          </span>
          <span className="font-mono text-success dark:text-success font-bold tabular-nums">
            {liveMarginPct}% هامش
          </span>
        </div>
        <div className="space-y-1 text-muted-foreground">
          <div className="flex justify-between">
            <span>سعر البيع للطبيب:</span>
            <span className="font-bold font-mono tabular-nums">
              {fmtMoney(modal.price)} ج.م
            </span>
          </div>
          <div className="flex justify-between">
            <span>تكلفة المواد والبلوكات:</span>
            <span className="text-red-500 font-bold font-mono tabular-nums">
              -{fmtMoney(modal.costPrice)} ج.م
            </span>
          </div>
          <div className="flex justify-between pt-1 border-t dark:border-border font-bold text-success dark:text-success">
            <span>صافي ربح الوحدة / الخدمة:</span>
            <span className="font-mono tabular-nums">
              +{fmtMoney(liveProfit)} ج.م
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkTypeLivePreview;
