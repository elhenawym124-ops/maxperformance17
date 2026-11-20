import React from "react";
import { ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TemplateCustomerRetentionBannerProps {
  isArabic: boolean;
  onNavigateToNotifications: () => void;
}

export const TemplateCustomerRetentionBanner: React.FC<TemplateCustomerRetentionBannerProps> = ({
  isArabic,
  onNavigateToNotifications,
}) => {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-info/50 bg-info/5 p-4 dark:border-info/30 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-info dark:text-info" />
          <h4 className="text-sm font-semibold text-[color:var(--color-foreground)]">
            {isArabic
              ? "محرك أتمتة رحلات العملاء والولاء (Customer Retention Engine)"
              : "Customer Retention & Loyalty Automation Engine"}
          </h4>
        </div>
        <p className="text-xs text-[color:var(--color-muted-foreground)]">
          {isArabic
            ? "تُرسل قوالب العملاء آلياً عند تسليم الطلبات، إيداع الكاش باك، انتهاء النقاط، أو رسائل المتابعة الدورية. يمكنك التحكم في مسار القنوات (Meta vs Baileys) وتأخير الإرسال في مركز إشعارات العملاء."
            : "Customer templates are dispatched automatically on order delivery, cashback credit, points expiry, or periodic cadences. Manage dual-slot channels and dispatch delays in Customer Notifications Center."}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 gap-1.5 rounded-full border-info/80 bg-[color:var(--color-card)] text-info hover:bg-info/10 dark:border-info/40 dark:text-info"
        onClick={onNavigateToNotifications}
      >
        <ExternalLink className="size-3.5" />
        {isArabic ? "إعدادات الجدولة والقنوات" : "Automation & Delays"}
      </Button>
    </div>
  );
};
