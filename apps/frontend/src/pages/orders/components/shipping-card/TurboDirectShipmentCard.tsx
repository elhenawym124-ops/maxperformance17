import React from "react";
import { TruckIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { useCurrency } from "../../../../hooks/useCurrency";

export interface TurboDirectShipmentCardProps {
  orderTotal: number;
  loading: boolean;
  onTurboDirectShipment: () => void;
}

export const TurboDirectShipmentCard: React.FC<TurboDirectShipmentCardProps> = React.memo(
  ({ orderTotal, loading, onTurboDirectShipment }) => {
    const { formatPrice } = useCurrency();

    return (
      <div className="p-3.5 rounded-lg border border-primary dark:border-primary/60 bg-primary/30 dark:bg-primary/20 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-primary dark:text-primary flex items-center gap-1.5">
            <TruckIcon className="h-4 w-4 text-primary" />
            إرسال فوري إلى شركة تربو (Turbo Courier)
          </span>
          <span className="text-[11px] text-success dark:text-success font-medium flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
            الحساب مفعل وجاهز
          </span>
        </div>

        <p className="text-xs text-foreground dark:dark:text-muted-foreground">
          سيتم إرسال بيانات العميل والمنتجات ومبلغ التحصيل (
          <span className="font-mono tabular-nums font-semibold">
            {formatPrice(orderTotal)}
          </span>
          ) فوراً إلى حسابك لدى تربو وتوليد رقم التتبع وبوليصة الشحن.
        </p>

        <div className="pt-1">
          <button
            type="button"
            onClick={onTurboDirectShipment}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-primary text-white hover:bg-primary disabled:opacity-50 transition shadow-xs flex items-center justify-center gap-2 active:scale-97"
          >
            <PaperAirplaneIcon className="h-4 w-4 rotate-180" />
            <span>
              {loading
                ? "جاري الإرسال لتربو وتوليد البوليصة..."
                : "إرسال إلى شركة تربو وتوليد البوليصة"}
            </span>
          </button>
        </div>
      </div>
    );
  }
);

TurboDirectShipmentCard.displayName = "TurboDirectShipmentCard";
