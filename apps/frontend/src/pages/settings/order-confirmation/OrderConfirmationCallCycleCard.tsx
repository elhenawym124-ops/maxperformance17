import React from "react";

export interface OrderConfirmationCallCycleCardProps {
  maxCallsNoAnswer: number;
  intervalMinutes: number;
  onChangeMaxCalls: (val: number) => void;
  onChangeIntervalMinutes: (val: number) => void;
}

export function OrderConfirmationCallCycleCard({
  maxCallsNoAnswer,
  intervalMinutes,
  onChangeMaxCalls,
  onChangeIntervalMinutes,
}: OrderConfirmationCallCycleCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border dark:border-border p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-foreground">دورة مكالمات التأكيد</h3>
        <p className="text-xs text-muted-foreground">
          تحكم في عدد محاولات الاتصال والوقت بين المحاولات لطلبات "لا يوجد رد".
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1 text-foreground">
            أقصى عدد محاولات بدون رد
          </label>
          <input
            type="number"
            min={0}
            value={maxCallsNoAnswer}
            onChange={(e) => onChangeMaxCalls(Math.max(0, Math.floor(Number(e.target.value))))}
            className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-muted text-sm font-mono tabular-nums"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            بعد هذا العدد يتوقف عرض زر "لا رد" لهذا الطلب. صفر = غير محدود.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-foreground">
            الوقت بين محاولات الاتصال (بالدقائق)
          </label>
          <input
            type="number"
            min={0}
            value={intervalMinutes}
            onChange={(e) => onChangeIntervalMinutes(Math.max(0, Math.floor(Number(e.target.value))))}
            className="w-full px-3 py-2 border border-border rounded-lg bg-white dark:bg-muted text-sm font-mono tabular-nums"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            يمنع تسجيل محاولة جديدة قبل مرور هذه المدة. صفر = بدون انتظار.
          </p>
        </div>
      </div>
    </div>
  );
}