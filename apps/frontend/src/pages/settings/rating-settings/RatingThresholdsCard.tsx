import React from "react";
import { AlertCircle, Award, Star, TrendingUp, Users } from "lucide-react";
import { RatingSettings } from "./types";

interface RatingThresholdsCardProps {
  settings: RatingSettings;
  validationError: string | null;
  onChange: (key: keyof RatingSettings, value: number) => void;
}

export const RatingThresholdsCard: React.FC<RatingThresholdsCardProps> = ({
  settings,
  validationError,
  onChange,
}) => {
  return (
    <div className="bg-white dark:bg-muted rounded-xl shadow-xs border border-border dark:border-border">
      <div className="p-6 border-b border-border dark:border-border">
        <h2 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
          <Award className="h-5 w-5 text-muted-foreground" />
          حدود التقييم الآلي للعملاء
        </h2>
        <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
          تحديد نسب نجاح التسليم المطلوبة والحد الأدنى للطلبات لاحتساب مستوى العميل آلياً.
        </p>
      </div>

      {validationError && (
        <div className="mx-6 mt-4 p-3 rounded-lg bg-destructive/10 dark:bg-destructive/30 border border-destructive dark:border-destructive/60 flex items-center gap-2 text-xs text-destructive dark:text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
          <span>{validationError}</span>
        </div>
      )}

      <div className="p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Excellent */}
        <div className="bg-emerald-50/70 dark:bg-success/20 p-4 rounded-lg border border-success dark:border-success/50">
          <div className="flex items-center gap-2 mb-2 text-success dark:text-success font-bold text-sm">
            <Star className="h-4 w-4 fill-success text-success" />
            ممتاز (Excellent)
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground dark:text-muted-foreground">&ge;</span>
            <input
              type="number"
              min="1"
              max="100"
              step="0.5"
              value={settings.excellentThreshold}
              onChange={(e) =>
                onChange("excellentThreshold", parseFloat(e.target.value) || 0)
              }
              className="w-20 p-1 border dark:border-border rounded text-center font-bold text-success dark:text-white dark:bg-muted tabular-nums"
            />
            <span className="text-lg font-bold text-foreground dark:text-muted-foreground">%</span>
          </div>
          <p className="mt-2 text-[11px] text-success/80 dark:text-success">
            عدد الطلبات &ge; 10 ونسبة استلام &ge; {settings.excellentThreshold}%
          </p>
        </div>

        {/* Good */}
        <div className="bg-sky-50/70 dark:bg-info/20 p-4 rounded-lg border border-info dark:border-info/50">
          <div className="flex items-center gap-2 mb-2 text-info dark:text-info font-bold text-sm">
            <Star className="h-4 w-4 text-info" />
            جيد (Good)
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground dark:text-muted-foreground">&ge;</span>
            <input
              type="number"
              min="1"
              max="100"
              step="0.5"
              value={settings.goodThreshold}
              onChange={(e) =>
                onChange("goodThreshold", parseFloat(e.target.value) || 0)
              }
              className="w-20 p-1 border dark:border-border rounded text-center font-bold text-info dark:text-white dark:bg-muted tabular-nums"
            />
            <span className="text-lg font-bold text-foreground dark:text-muted-foreground">%</span>
          </div>
          <p className="mt-2 text-[11px] text-info/80 dark:text-info">
            عدد الطلبات &ge; 5 ونسبة استلام &ge; {settings.goodThreshold}%
          </p>
        </div>

        {/* Average */}
        <div className="bg-amber-50/70 dark:bg-warning/20 p-4 rounded-lg border border-warning dark:border-warning/50">
          <div className="flex items-center gap-2 mb-2 text-warning dark:text-warning font-bold text-sm">
            <Star className="h-4 w-4 text-warning" />
            متوسط (Average)
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground dark:text-muted-foreground">&ge;</span>
            <input
              type="number"
              min="1"
              max="100"
              step="0.5"
              value={settings.averageThreshold}
              onChange={(e) =>
                onChange("averageThreshold", parseFloat(e.target.value) || 0)
              }
              className="w-20 p-1 border dark:border-border rounded text-center font-bold text-warning dark:text-white dark:bg-muted tabular-nums"
            />
            <span className="text-lg font-bold text-foreground dark:text-muted-foreground">%</span>
          </div>
          <p className="mt-2 text-[11px] text-warning/80 dark:text-warning">
            عدد الطلبات &ge; {settings.minOrdersForRating} ونسبة استلام &ge; {settings.averageThreshold}%
          </p>
        </div>

        {/* Min Orders */}
        <div className="bg-slate-50 dark:bg-muted p-4 rounded-lg border border-border dark:border-border">
          <div className="flex items-center gap-2 mb-2 text-foreground dark:text-muted-foreground font-bold text-sm">
            <Users className="h-4 w-4 text-foreground dark:text-muted-foreground" />
            الحد الأدنى للطلبات
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground dark:text-muted-foreground">&ge;</span>
            <input
              type="number"
              min="1"
              max="50"
              value={settings.minOrdersForRating}
              onChange={(e) =>
                onChange("minOrdersForRating", parseInt(e.target.value, 10) || 1)
              }
              className="w-20 p-1 border dark:border-border rounded text-center font-bold text-foreground dark:text-white dark:bg-muted tabular-nums"
            />
            <span className="text-sm font-semibold text-foreground dark:text-muted-foreground">
              طلبات
            </span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground dark:text-muted-foreground">
            أقل من هذا العدد يصنف كـ "جديد / غير مصنف"
          </p>
        </div>
      </div>

      <div className="px-6 pb-5 pt-3 border-t border-border dark:border-border bg-muted dark:bg-muted text-xs text-foreground dark:text-muted-foreground space-y-1.5 rounded-b-xl">
        <p className="flex items-center gap-1.5 font-medium text-foreground dark:text-muted-foreground">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span>قواعد الاحتساب الآلي في المنصة:</span>
        </p>
        <ul className="list-disc list-inside space-y-1 ps-1 text-[11px] leading-relaxed text-muted-foreground dark:text-muted-foreground">
          <li>التقييم <strong>تلقائي 100%</strong> ومبني مباشرةً على تطابق شرطي (عدد المحاولات + نسبة الاستلام معاً).</li>
          <li>الطلبات الجزئية (تسليم جزئي أو استرجاع جزئي) تُوزن نسبياً بمقدار 50% تسليم و50% محاولة.</li>
          <li>حالات الضياع في الشحن (LOST) واسترجاع المتجر (REFUNDED) لا تُخصم من نسبة استلام العميل افتراضياً.</li>
          <li>يتم تحديث التقييم آلياً وفورياً عند تسليم الطلبات أو استرجاعها وبواسطة Webhooks شركات الشحن.</li>
          <li>عند حفظ الإعدادات، يتم تحديث تصنيف كافة العملاء تلقائياً في الخلفية بدون الحاجة لأي تدخل يدوي.</li>
        </ul>
      </div>
    </div>
  );
};
