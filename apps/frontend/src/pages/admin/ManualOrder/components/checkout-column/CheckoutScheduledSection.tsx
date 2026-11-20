import React from "react";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { DateInput } from '../../../../../components/ui/DateInput';

interface CheckoutScheduledSectionProps {
  isScheduledOrder: boolean;
  setIsScheduledOrder: (val: boolean) => void;
  scheduledDeliveryDate: string;
  setScheduledDeliveryDate: (val: string) => void;
  scheduledDeliveryTime: string;
  setScheduledDeliveryTime: (val: string) => void;
  scheduledNotes: string;
  setScheduledNotes: (val: string) => void;
  t: (key: string) => string;
}

export const CheckoutScheduledSection: React.FC<CheckoutScheduledSectionProps> = ({
  isScheduledOrder,
  setIsScheduledOrder,
  scheduledDeliveryDate,
  setScheduledDeliveryDate,
  scheduledDeliveryTime,
  setScheduledDeliveryTime,
  scheduledNotes,
  setScheduledNotes,
  t,
}) => {
  return (
    <div className="space-y-3">
      <div className="bg-orange-50 dark:bg-warning/10 border border-warning dark:border-warning rounded-lg p-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isScheduledOrder}
            onChange={(e) => setIsScheduledOrder(e.target.checked)}
            className="w-4 h-4 text-warning bg-muted border-border rounded focus:ring-warning dark:focus:ring-warning dark:ring-offset-gray-800 focus:ring-2 dark:bg-muted dark:border-border"
          />
          <CalendarIcon className="h-5 w-5 text-warning dark:text-warning" />
          <span className="text-sm font-medium text-foreground">
            {t("manualOrder.k_113")}
          </span>
        </label>

        {isScheduledOrder && (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  {t("manualOrder.k_114")} <span className="text-red-500">*</span>
                </label>
                <DateInput
                  value={scheduledDeliveryDate}
                  onChange={(e) => setScheduledDeliveryDate(e.target.value)}
                  min={
                    new Date(Date.now() + 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split("T")[0]
                  }
                  className="w-full px-2 py-1.5 text-sm border border-border rounded-md focus:ring-2 focus:ring-warning focus:border-transparent dark:bg-muted dark:text-muted-foreground"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  {t("manualOrder.k_115")}
                </label>
                <input
                  type="time"
                  value={scheduledDeliveryTime}
                  onChange={(e) => setScheduledDeliveryTime(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-border rounded-md focus:ring-2 focus:ring-warning focus:border-transparent dark:bg-muted dark:text-muted-foreground"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                {t("manualOrder.k_116")}
              </label>
              <textarea
                value={scheduledNotes}
                onChange={(e) => setScheduledNotes(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-border rounded-md focus:ring-2 focus:ring-warning focus:border-transparent dark:bg-muted dark:text-muted-foreground dark:placeholder-muted"
                rows={2}
                placeholder={t("manualOrder.k_11")}
              />
            </div>
            <div className="flex items-start gap-2 text-xs text-warning dark:text-warning">
              <CalendarIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>{t("manualOrder.k_117")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
