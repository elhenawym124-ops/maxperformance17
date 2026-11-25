import React from "react";
import { useTranslation } from "react-i18next";
import { Eye, Gift } from "lucide-react";

export interface UnseenFilterSectionProps {
  onlyUnseen: boolean;
  onToggleUnseen: (next: boolean) => void;
  onlyPostPurchaseOffer?: boolean;
  onToggleOnlyPostPurchaseOffer?: (next: boolean) => void;
}

export const UnseenFilterSection: React.FC<UnseenFilterSectionProps> = ({
  onlyUnseen,
  onToggleUnseen,
  onlyPostPurchaseOffer,
  onToggleOnlyPostPurchaseOffer,
}) => {
  const { t } = useTranslation();

  return (
    <div className="py-4 space-y-3">
      {/* Unseen Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Eye className="h-4 w-4" />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
            {t("orders.unseen", { defaultValue: "الطلبات غير المقروءة" })}
          </span>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={onlyUnseen}
          aria-label={String(t("orders.unseen", { defaultValue: "الطلبات غير المقروءة" }))}
          onClick={() => onToggleUnseen(!onlyUnseen)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
            onlyUnseen ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-xs ring-0 transition duration-200 ease-in-out ${
              onlyUnseen ? "translate-x-5 rtl:-translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Post-Purchase Offer Toggle */}
      {onToggleOnlyPostPurchaseOffer && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Gift className="h-4 w-4" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
              {t("orders.postPurchaseOffer", { defaultValue: "عروض ما بعد الشراء" })}
            </span>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={Boolean(onlyPostPurchaseOffer)}
            aria-label={String(t("orders.postPurchaseOffer", { defaultValue: "عروض ما بعد الشراء" }))}
            onClick={() => onToggleOnlyPostPurchaseOffer(!onlyPostPurchaseOffer)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
              onlyPostPurchaseOffer ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-xs ring-0 transition duration-200 ease-in-out ${
                onlyPostPurchaseOffer ? "translate-x-5 rtl:-translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      )}
    </div>
  );
};

export default UnseenFilterSection;
