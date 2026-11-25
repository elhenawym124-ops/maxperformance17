/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { useCurrency } from "../../../../hooks/useCurrency";

export interface ShippingTrackingHeaderProps {
  order: any;
  existingTracking: string;
  existingCarrierName: string;
  isQpExpress: boolean;
  isBosta: boolean;
  isTurbo: boolean;
  onCopyTracking: () => void;
}

export const ShippingTrackingHeader: React.FC<ShippingTrackingHeaderProps> = ({
  order,
  existingTracking,
  existingCarrierName,
  isQpExpress,
  isBosta,
  isTurbo,
  onCopyTracking,
}) => {
  const { formatPrice } = useCurrency();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-muted/40 rounded-lg border border-border/70">
      <div>
        <p className="text-xs text-muted-foreground">شركة الشحن</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <p className="text-sm font-semibold text-foreground">
            {existingCarrierName}
          </p>
          {isQpExpress && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-primary/10 text-primary border border-primary/25 font-mono">
              QP API
            </span>
          )}
          {isBosta && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-warning/10 text-warning border border-warning/25 font-mono">
              Bosta API
            </span>
          )}
          {isTurbo && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-primary/10 text-primary border border-primary/25 font-mono">
              Turbo API
            </span>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground">
          رقم التتبع (AWB)
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-sm font-mono tabular-nums font-bold text-primary">
            {existingTracking}
          </span>
          <button
            type="button"
            onClick={onCopyTracking}
            className="text-muted-foreground hover:text-foreground p-1 rounded transition active:scale-90"
            title="نسخ رقم التتبع"
          >
            <ClipboardDocumentIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground">
          قيمة التحصيل (COD)
        </p>
        <p className="text-sm font-semibold font-mono tabular-nums text-foreground mt-0.5">
          {formatPrice(order?.total || 0)}
        </p>
      </div>
    </div>
  );
};
