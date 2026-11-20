import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import type {
  PreparationOrder,
  ShortageFollowUpVisual,
} from "../types";

interface PreparationOrderNoticesProps {
  order: PreparationOrder;
  shortageFollowUpVisual: ShortageFollowUpVisual | null;
}

const PreparationOrderNotices = ({
  order,
  shortageFollowUpVisual,
}: PreparationOrderNoticesProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-1.5">
      {order.notes ? (
        <div className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/5 px-2.5 py-1.5 text-xs text-warning dark:text-warning">
          <span className="font-semibold shrink-0">{t("preparation.notices.notes")}</span>
          <span>{order.notes}</span>
        </div>
      ) : null}

      {!order.isReady ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-2.5 py-1.5 text-xs text-destructive dark:text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{t("preparation.notices.needsReview")}</span>
        </div>
      ) : null}

      {order.stage === "STOCK_SHORTAGE" ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-2.5 py-1.5 text-xs text-destructive dark:text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{t("preparation.notices.shortageHold")}</span>
        </div>
      ) : null}

      {order.stage === "ON_HOLD_PREP" ? (
        <div className="flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/5 px-2.5 py-1.5 text-xs text-warning dark:text-warning">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{t("preparation.notices.problemHold")}</span>
        </div>
      ) : null}

      {shortageFollowUpVisual ? (
        <div className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${shortageFollowUpVisual.alertClass}`}>
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{shortageFollowUpVisual.alertText}</span>
        </div>
      ) : null}
    </div>
  );
};

export default PreparationOrderNotices;
