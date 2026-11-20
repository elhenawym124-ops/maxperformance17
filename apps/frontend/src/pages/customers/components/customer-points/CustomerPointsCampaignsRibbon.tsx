import React from "react";
import { Target, Sparkles, MessageCircle, Gift } from "lucide-react";
import { FilterMode } from "./types";

interface CustomerPointsCampaignsRibbonProps {
  earningRuleText: string;
  atRiskCount: number;
  onFilterModeChange: (mode: FilterMode) => void;
}

export const CustomerPointsCampaignsRibbon: React.FC<CustomerPointsCampaignsRibbonProps> = ({
  earningRuleText,
  atRiskCount,
  onFilterModeChange,
}) => {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-xl border border-warning bg-gradient-to-br from-white to-warning p-5 shadow-sm dark:border-warning/30 dark:from-gray-800 dark:to-warning/10">
        <div className="mb-3 flex items-center gap-2 text-warning dark:text-warning">
          <Target className="h-5 w-5" />
          <h4 className="font-semibold text-foreground">
            برامج ولاء كبار المتاجر
          </h4>
        </div>
        <p className="text-sm text-muted-foreground mb-4 h-16">
          فعّل إرسال رسائل آلية عند وصول العميل لمستوى VIP لمكافأته بتوصيل مجاني لتعزيز شعوره بالولاية.
        </p>
        <button
          type="button"
          onClick={() => onFilterModeChange("VIP")}
          className="w-full text-sm py-2 px-3 bg-white border border-warning text-warning rounded-lg hover:bg-warning/10 shadow-sm transition dark:bg-muted dark:border-border dark:text-warning cursor-pointer"
        >
          عرض عملاء VIP الآن
        </button>
      </div>

      <div className="rounded-xl border border-primary bg-gradient-to-br from-white to-primary p-5 shadow-sm dark:border-primary/30 dark:from-gray-800 dark:to-primary/10">
        <div className="mb-3 flex items-center gap-2 text-primary dark:text-primary">
          <Sparkles className="h-5 w-5" />
          <h4 className="font-semibold text-foreground">
            أيام المضاعفات الترويجية
          </h4>
        </div>
        <p className="text-sm text-muted-foreground mb-2 h-10">
          أبلغ العملاء عن أيام ترويجية لكسب مضاعف عبر الواتساب.
        </p>
        <p className="text-xs text-primary dark:text-primary mb-4 font-medium flex items-center line-clamp-1 w-full truncate">
          المعدل الحالي: {earningRuleText}
        </p>
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 text-sm py-2 px-3 bg-primary text-white rounded-lg hover:bg-primary shadow-sm transition cursor-pointer"
        >
          <MessageCircle className="h-4 w-4" />
          إرسال تنبيه بالبرنامج (قريباً)
        </button>
      </div>

      <div className="rounded-xl border border-destructive bg-gradient-to-br from-white to-destructive p-5 shadow-sm dark:border-destructive/30 dark:from-gray-800 dark:to-destructive/10">
        <div className="mb-3 flex items-center gap-2 text-destructive dark:text-destructive">
          <Gift className="h-5 w-5" />
          <h4 className="font-semibold text-foreground">
            حملات إنقاذ النقاط (Expiry)
          </h4>
        </div>
        <p className="text-sm text-muted-foreground mb-4 h-16">
          العملاء المهددون بخسارة رصيدهم. ارسل لهم عروض استبدال سريعة قبل خصم النقاط نهائياً.
        </p>
        <button
          type="button"
          onClick={() => onFilterModeChange("AT_RISK")}
          className="w-full text-sm py-2 px-3 bg-destructive/10 border border-destructive text-destructive font-medium rounded-lg shadow-sm hover:bg-destructive transition dark:bg-destructive/30 dark:border-destructive dark:text-destructive cursor-pointer font-mono tabular-nums"
        >
          استهداف ({atRiskCount}) عميل
        </button>
      </div>
    </div>
  );
};
