import React from "react";

interface TurboAiAreaCardProps {
  enabled: boolean;
  aiAreaEnabled: boolean;
  aiAreaOnCreate: boolean;
  onToggleAiArea: (checked: boolean) => void;
  onToggleAiAreaOnCreate: (checked: boolean) => void;
}

export const TurboAiAreaCard: React.FC<TurboAiAreaCardProps> = ({
  enabled,
  aiAreaEnabled,
  aiAreaOnCreate,
  onToggleAiArea,
  onToggleAiAreaOnCreate,
}) => {
  return (
    <div className="border-t border-border pt-6 space-y-3">
      <div className="flex items-center justify-between gap-4 p-4 bg-muted rounded-lg">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground mb-1">
            خدمة تحديد منطقة تربو بالذكاء الاصطناعي
          </h3>
          <p className="text-xs text-muted-foreground">
            تخمين المدينة من عنوان العميل على خريطة تربو وتحديد المحافظة تلقائياً ومراجعتها قبل الإرسال لتجنب حالة غير مكتمل
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0" dir="ltr">
          <input
            type="checkbox"
            checked={aiAreaEnabled}
            onChange={(e) => onToggleAiArea(e.target.checked)}
            disabled={!enabled}
            className="sr-only peer"
            aria-label="خدمة تحديد منطقة تربو بالذكاء الاصطناعي"
          />
          <div
            className={`w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
              !enabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-4 px-4 py-3 border border-border/70 rounded-lg bg-card">
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-medium text-foreground">
            توسيع التشغيل على الطلبات الجديدة فور وصولها
          </h4>
          <p className="text-[11px] text-muted-foreground">
            تشغيل التحديد التلقائي للمنطقة والمحافظة بمجرد وصول الطلب الجديد (قبل التأكيد)
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0" dir="ltr">
          <input
            type="checkbox"
            checked={aiAreaOnCreate}
            onChange={(e) => onToggleAiAreaOnCreate(e.target.checked)}
            disabled={!enabled || !aiAreaEnabled}
            className="sr-only peer"
            aria-label="توسيع التشغيل على الطلبات الجديدة فور وصولها"
          />
          <div
            className={`w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
              !enabled || !aiAreaEnabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />
        </label>
      </div>
    </div>
  );
};
