import React from "react";
import {
  BanknotesIcon,
  CalendarDaysIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface AdSetBudgetStepProps {
  isCboCampaign: boolean;
  campaignBudgetText?: string;
  budgetType: "DAILY" | "LIFETIME";
  onBudgetTypeChange: (type: "DAILY" | "LIFETIME") => void;
  budgetAmount: number;
  onBudgetAmountChange: (amount: number) => void;
  dailyMinSpendTarget?: number;
  onDailyMinSpendTargetChange?: (val?: number) => void;
  dailySpendCap?: number;
  onDailySpendCapChange?: (val?: number) => void;
  startTime: string;
  onStartTimeChange: (time: string) => void;
  hasEndDate: boolean;
  onHasEndDateChange: (has: boolean) => void;
  endTime: string;
  onEndTimeChange: (time: string) => void;
  bidStrategy: string;
  onBidStrategyChange: (strategy: string) => void;
  bidValue?: number;
  onBidValueChange: (val?: number) => void;
  attributionWindow: string;
  onAttributionWindowChange: (window: string) => void;
  isDynamicCreative: boolean;
  onDynamicCreativeChange: (enabled: boolean) => void;
}

const BID_STRATEGIES = [
  {
    id: "LOWEST_COST_WITHOUT_CAP",
    title: "أعلى حجم (Highest Volume / Lowest Cost)",
    description: "الحصول على أكبر قدر من النتائج الممكنة ضمن الميزانية (الافتراضي)",
    badge: "الأكثر استخداماً",
  },
  {
    id: "COST_CAP",
    title: "سقف تكلفة النتيجة (Cost per result goal)",
    description: "تحديد حد أقصى لتكلفة كل عملية شراء (مثلاً لا تزيد عن 70 ج.م)",
    badge: "لضبط هوامش الربح",
    hasInput: true,
    inputLabel: "الحد الأقصى للتكلفة (ج.م):",
    inputPlaceholder: "مثال: 70",
    inputStep: 5,
    hint: "(سيتوقف الإعلان إذا زادت تكلفة النتيجة عن هذا المبلغ)",
  },
  {
    id: "BID_CAP",
    title: "الحد الأقصى للمزايدة (Bid Cap)",
    description: "تحديد أعلى سعر مزايدة تدفعه ميتا في المزاد الإعلاني الواحد",
    badge: "للمحترفين",
    hasInput: true,
    inputLabel: "أعلى سعر مزايدة (ج.م):",
    inputPlaceholder: "مثال: 50",
    inputStep: 5,
    hint: "(سقف المزايدة في المزاد الفردي)",
  },
  {
    id: "LOWEST_COST_WITH_MIN_ROAS",
    title: "مستهدف عائد الإنفاق الأدنى (Target Minimum ROAS)",
    description: "تحديد مضاعف العائد على الإنفاق المطلوب (مثلاً: 3.5x لضمان ربحية المبيعات)",
    badge: "جديد v26.0 - للمتاجر",
    hasInput: true,
    inputLabel: "مضاعف ROAS المستهدف:",
    inputPlaceholder: "مثال: 3.5",
    inputStep: 0.1,
    hint: "(ستعطي ميتا الأولوية للمشترين ذوي سلات الشراء الأعلى)",
  },
];

const ATTRIBUTION_WINDOWS = [
  {
    id: "7d_click_1d_view",
    title: "7 أيام نقر أو يوم واحد مشاهدة (7d click / 1d view)",
    description: "المعيار القياسي الموصى به لمتاجر التجارة الإلكترونية والتسوق",
  },
  {
    id: "1d_click_1d_view",
    title: "يوم واحد نقر أو يوم واحد مشاهدة (1d click / 1d view)",
    description: "للمنتجات سريعة الشراء والقرارات اللحظية",
  },
  {
    id: "7d_click",
    title: "7 أيام نقر فقط (7d click)",
    description: "تجاهل مشاهدات الإعلان واحتساب النقر الفعلي فقط",
  },
  {
    id: "1d_click",
    title: "يوم واحد نقر فقط (1d click)",
    description: "أقصر نافذة احتساب إسناد للشراء المباشر الفوري",
  },
];

export const AdSetBudgetStep: React.FC<AdSetBudgetStepProps> = ({
  isCboCampaign,
  campaignBudgetText,
  budgetType,
  onBudgetTypeChange,
  budgetAmount,
  onBudgetAmountChange,
  dailyMinSpendTarget,
  onDailyMinSpendTargetChange,
  dailySpendCap,
  onDailySpendCapChange,
  startTime,
  onStartTimeChange,
  hasEndDate,
  onHasEndDateChange,
  endTime,
  onEndTimeChange,
  bidStrategy,
  onBidStrategyChange,
  bidValue,
  onBidValueChange,
  attributionWindow,
  onAttributionWindowChange,
  isDynamicCreative,
  onDynamicCreativeChange,
}) => {
  return (
    <div className="space-y-6">
      {/* Budget Configuration */}
      <div>
        <label className="block text-sm font-bold text-foreground mb-1.5 flex items-center gap-2">
          <BanknotesIcon className="w-5 h-5 text-info dark:text-info" />
          <span>الميزانية ونظام الإنفاق (Budget & Spending)</span>
        </label>

        {isCboCampaign ? (
          <div className="space-y-3">
            <div className="p-4 bg-primary/10 dark:bg-primary/20 border border-primary dark:border-primary/40 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-sm text-primary dark:text-primary">
                <SparklesIcon className="w-4 h-4 text-primary dark:text-primary" />
                <span>ميزانية الحملة Advantage+ مفعلة (CBO)</span>
              </div>
              <p className="text-xs text-primary dark:text-primary">
                هذه الحملة تستخدم توزيع الميزانية الذكي على مستوى الحملة بالكامل
                {campaignBudgetText ? ` (${campaignBudgetText})` : ""}.
                سيقوم نظام ميتا بتوزيع الإنفاق تلقائياً على المجموعات الأكثر تحقيقاً للمبيعات.
              </p>
            </div>

            {/* v26.0: Ad Set Spend Limits under CBO */}
            <div className="p-3.5 bg-card border border-border dark:border-border rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">
                    حدود إنفاق المجموعة الإعلانية (Ad Set Spend Limits)
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    اختياري: التحكم في وتيرة إنفاق هذه المجموعة ضمن ميزانية CBO
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-info dark:bg-info/60 text-info dark:text-info font-bold">
                  v26.0
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                    الحد اليومي الأدنى للإنفاق (ج.م)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={dailyMinSpendTarget ?? ""}
                    onChange={(e) =>
                      onDailyMinSpendTargetChange?.(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    placeholder="مثال: 50 (ضمان حد أدنى)"
                    className="w-full px-3 py-2 bg-white dark:bg-muted border border-border dark:border-border rounded-lg text-xs font-semibold text-foreground focus:ring-2 focus:ring-info"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    يضمن حصول المجموعة على هذا الإنفاق على الأقل يومياً
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                    سقف الإنفاق اليومي الأقصى (ج.م)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={dailySpendCap ?? ""}
                    onChange={(e) =>
                      onDailySpendCapChange?.(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    placeholder="مثال: 300 (منع الاحتكار)"
                    className="w-full px-3 py-2 bg-white dark:bg-muted border border-border dark:border-border rounded-lg text-xs font-semibold text-foreground focus:ring-2 focus:ring-info"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    يمنع المجموعة من استهلاك أكثر من هذا المبلغ يومياً
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  نوع الميزانية *
                </label>
                <select
                  value={budgetType}
                  onChange={(e) =>
                    onBudgetTypeChange(e.target.value as "DAILY" | "LIFETIME")
                  }
                  className="w-full px-3.5 py-2.5 bg-card border border-border dark:border-border rounded-xl text-xs sm:text-sm font-semibold text-foreground focus:ring-2 focus:ring-info"
                >
                  <option value="DAILY">ميزانية يومية (Daily Budget)</option>
                  <option value="LIFETIME">ميزانية إجمالية طوال المدة (Lifetime Budget)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  مبلغ الميزانية (ج.م) *
                </label>
                <input
                  type="number"
                  min={1}
                  step={10}
                  value={budgetAmount || ""}
                  onChange={(e) => onBudgetAmountChange(Number(e.target.value))}
                  placeholder="مثال: 500"
                  className="w-full px-3.5 py-2.5 bg-card border border-border dark:border-border rounded-xl text-xs sm:text-sm font-semibold text-foreground focus:ring-2 focus:ring-info"
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              * سيتم إنفاق هذا المبلغ وفق وتيرة المزاد اليومي لحسابك الإعلاني.
            </p>
          </div>
        )}
      </div>

      {/* Schedule & Timing */}
      <div className="pt-4 border-t border-border dark:border-border">
        <label className="block text-sm font-bold text-foreground mb-1.5 flex items-center gap-2">
          <CalendarDaysIcon className="w-5 h-5 text-info dark:text-info" />
          <span>الجدولة وتوقيت الإطلاق (Schedule)</span>
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          حدد موعد بدء تشغيل المجموعة الإعلانية (بالتوقيت المحلي للقاهرة)
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              تاريخ وتوقيت البدء
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-card border border-border dark:border-border rounded-xl text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-info"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-foreground">
                تاريخ وتوقيت الانتهاء
              </label>
              <label className="text-[11px] text-muted-foreground flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasEndDate}
                  onChange={(e) => onHasEndDateChange(e.target.checked)}
                  className="w-3.5 h-3.5 text-info rounded cursor-pointer"
                />
                <span>تحديد موعد انتهاء</span>
              </label>
            </div>
            <input
              type="datetime-local"
              disabled={!hasEndDate}
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              className={`w-full px-3.5 py-2.5 bg-card border rounded-xl text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-info ${
                hasEndDate
                  ? "border-gray-300 dark:border-border"
                  : "border-gray-200 dark:border-border opacity-50 cursor-not-allowed"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Cost Control & Bid Strategy */}
      <div className="pt-4 border-t border-border dark:border-border">
        <label className="block text-sm font-bold text-foreground mb-1.5 flex items-center gap-2">
          <AdjustmentsHorizontalIcon className="w-5 h-5 text-info dark:text-info" />
          <span>استراتيجية التحكم بالتكلفة والمزايدة (Bid Strategy)</span>
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          التحكم في تكلفة الشراء أو ترك النظام للمزايدة التلقائية للحصول على أكبر عدد من المبيعات
        </p>

        <div className="space-y-2">
          {BID_STRATEGIES.map((bs) => {
            const isSelected = bidStrategy === bs.id;
            return (
              <div
                key={bs.id}
                onClick={() => onBidStrategyChange(bs.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-cyan-600 bg-info/50 dark:bg-info/20 dark:border-info shadow-xs"
                    : "border-gray-200 dark:border-border hover:bg-muted dark:hover:bg-muted bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="bid_strategy"
                      checked={isSelected}
                      onChange={() => onBidStrategyChange(bs.id)}
                      className="w-4 h-4 text-info focus:ring-info cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-foreground">
                          {bs.title}
                        </span>
                        {bs.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-info dark:bg-info/60 text-info dark:text-info font-semibold">
                            {bs.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                        {bs.description}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircleIcon className="w-5 h-5 text-info dark:text-info shrink-0" />
                  )}
                </div>

                {isSelected && bs.hasInput && (
                  <div className="mt-3 pt-3 border-t border-info dark:border-info/40 flex items-center gap-3">
                    <label className="text-xs font-semibold text-foreground shrink-0">
                      {bs.inputLabel || "الحد الأقصى المستهدف (ج.م):"}
                    </label>
                    <input
                      type="number"
                      min={bs.inputStep === 0.1 ? 0.1 : 1}
                      step={bs.inputStep || 5}
                      value={bidValue || ""}
                      onChange={(e) =>
                        onBidValueChange(
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                      placeholder={bs.inputPlaceholder || "مثال: 70"}
                      className="w-36 px-3 py-1.5 bg-white dark:bg-muted border border-info rounded-lg text-xs font-bold text-foreground"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-[11px] text-muted-foreground">
                      {bs.hint || "(سيتوقف الإعلان إذا زادت تكلفة النتيجة عن هذا المبلغ)"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Attribution Settings */}
      <div className="pt-4 border-t border-border dark:border-border">
        <label className="block text-sm font-bold text-foreground mb-1.5">
          إعدادات نافذة الإسناد (Attribution Setting)
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          الفترة الزمنية التي يقوم البيكسل بنسب عملية الشراء فيها إلى هذا الإعلان
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ATTRIBUTION_WINDOWS.map((win) => {
            const isSelected = attributionWindow === win.id;
            return (
              <button
                key={win.id}
                type="button"
                onClick={() => onAttributionWindowChange(win.id)}
                className={`text-right p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-cyan-600 bg-info/50 dark:bg-info/20 dark:border-info shadow-xs"
                    : "border-gray-200 dark:border-border hover:border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-xs text-foreground">
                    {win.title}
                  </span>
                  {isSelected && (
                    <CheckCircleIcon className="w-4 h-4 text-info dark:text-info shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {win.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Creative Option */}
      <div className="pt-4 border-t border-border dark:border-border">
        <div className="p-4 bg-gradient-to-r from-info to-primary dark:from-info/20 dark:to-primary/20 rounded-xl border border-info dark:border-info/50 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-info dark:text-info" />
              <span className="font-bold text-xs sm:text-sm text-foreground">
                التوليف الإبداعي الديناميكي (Dynamic Creative / DCO)
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              السماح لميتا باختبار تركيبات مختلفة من الصور والنصوص والعناوين وتوليد النسخة الأفضل لكل عميل تلقائياً
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={isDynamicCreative}
              onChange={(e) => onDynamicCreativeChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-hidden rounded-full peer dark:bg-muted peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};
