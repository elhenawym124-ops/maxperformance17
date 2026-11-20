import { useTranslation } from "react-i18next";
import { ArrowPathIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { SHORTAGE_REASON_OPTIONS } from "../constants";
import {
  getDateInputValueWithOffset,
  getShortageReasonLabel,
} from "../helpers";
import type {
  PreparationOrder,
  ShortageFollowUpVisual,
  ShortageHoldDetails,
} from "../types";
import { DateInput } from '../../../../components/ui/DateInput';

interface PreparationOrderShortagePanelProps {
  order: PreparationOrder;
  shortageHoldDetails: ShortageHoldDetails;
  shortageFollowUpVisual: ShortageFollowUpVisual | null;
  rowBusy: boolean;
  formatDate: (value: string) => string;
  onShortageFieldChange: (
    orderNumber: string,
    field: keyof ShortageHoldDetails,
    value: string | boolean,
  ) => void;
  onSaveShortageHoldDetails: (
    orderNumber: string,
    overrides?: Partial<ShortageHoldDetails>,
    options?: { successMessage?: string | null },
  ) => Promise<boolean>;
}

const PreparationOrderShortagePanel = ({
  order,
  shortageHoldDetails,
  shortageFollowUpVisual,
  rowBusy,
  formatDate,
  onShortageFieldChange,
  onSaveShortageHoldDetails,
}: PreparationOrderShortagePanelProps) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-destructive bg-destructive/60 p-4 dark:border-destructive dark:bg-destructive/15">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="font-semibold text-destructive dark:text-destructive">{t("preparation.shortagePanel.title")}</h4>
          <p className="mt-1 text-xs text-destructive dark:text-destructive">
            {t("preparation.shortagePanel.desc")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-destructive bg-white px-3 py-1 font-medium text-destructive">
            {getShortageReasonLabel(shortageHoldDetails.reason)}
          </span>
          {shortageHoldDetails.owner ? (
          <span className="rounded-full border border-destructive bg-white px-3 py-1 font-medium text-destructive dark:border-destructive dark:dark:bg-muted dark:text-destructive">
              {t("preparation.shortagePanel.ownerBadge", { name: shortageHoldDetails.owner })}
            </span>
          ) : null}
          {shortageHoldDetails.customerNotified ? (
            <span className="rounded-full border border-success bg-success/10 px-3 py-1 font-medium text-success dark:border-success dark:bg-success/20 dark:text-success">
              {t("preparation.shortagePanel.customerNotifiedBadge")}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="block">
          <span className="mb-2 block text-xs font-medium text-destructive dark:text-destructive">
            {t("preparation.shortagePanel.reasonLabel")}
          </span>
          <select
            value={shortageHoldDetails.reason}
            onChange={(event) =>
              onShortageFieldChange(order.orderNumber, "reason", event.target.value)
            }
            className="w-full rounded-xl border border-destructive bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-destructive dark:border-destructive dark:dark:bg-muted dark:dark:text-muted-foreground dark:focus:border-destructive"
          >
            {SHORTAGE_REASON_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-medium text-destructive dark:text-destructive">
            {t("preparation.shortagePanel.ownerLabel")}
          </span>
          <input
            type="text"
            value={shortageHoldDetails.owner}
            onChange={(event) =>
              onShortageFieldChange(order.orderNumber, "owner", event.target.value)
            }
            placeholder={t("preparation.shortagePanel.ownerPlaceholder")}
            className="w-full rounded-xl border border-destructive bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-destructive dark:border-destructive dark:dark:bg-muted dark:dark:text-muted-foreground dark:focus:border-destructive"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-medium text-destructive dark:text-destructive">
            {t("preparation.shortagePanel.followUpDate")}
          </span>
          <DateInput
            value={shortageHoldDetails.followUpDate}
            onChange={(event) =>
              onShortageFieldChange(
                order.orderNumber,
                "followUpDate",
                event.target.value,
              )
            }
            className="w-full rounded-xl border border-destructive bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-destructive dark:border-destructive dark:dark:bg-muted dark:dark:text-muted-foreground dark:focus:border-destructive"
          />
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-destructive bg-white px-4 py-3 text-sm text-foreground dark:border-destructive dark:dark:bg-muted dark:dark:text-muted-foreground">
          <input
            type="checkbox"
            checked={shortageHoldDetails.customerNotified}
            onChange={(event) =>
              onShortageFieldChange(
                order.orderNumber,
                "customerNotified",
                event.target.checked,
              )
            }
            className="h-4 w-4 rounded border-border text-destructive focus:ring-destructive dark:dark:border-border dark:text-destructive"
          />
          {t("preparation.shortagePanel.customerNotified")}
        </label>
      </div>

      <label className="mt-3 block">
          <span className="mb-2 block text-xs font-medium text-destructive dark:text-destructive">
            {t("preparation.shortagePanel.notesLabel")}
          </span>
          <textarea
            value={shortageHoldDetails.note}
            onChange={(event) =>
              onShortageFieldChange(order.orderNumber, "note", event.target.value)
            }
            rows={3}
            placeholder={t("preparation.shortagePanel.notesPlaceholder")}
            className="w-full rounded-xl border border-destructive bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-destructive dark:border-destructive dark:dark:bg-muted dark:dark:text-muted-foreground dark:focus:border-destructive"
        />
      </label>

      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3 text-xs text-destructive dark:text-destructive">
            {shortageHoldDetails.heldAt ? (
              <span>{t("preparation.shortagePanel.heldAt", { date: formatDate(shortageHoldDetails.heldAt) })}</span>
            ) : null}
            {shortageHoldDetails.followUpDate ? (
              <span>{t("preparation.shortagePanel.followUpOn", { date: formatDate(shortageHoldDetails.followUpDate) })}</span>
            ) : (
              <span>{t("preparation.shortagePanel.noFollowUpDate")}</span>
            )}
            {shortageFollowUpVisual ? (
              <span className={shortageFollowUpVisual.badgeClass}>
                {shortageFollowUpVisual.label}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void onSaveShortageHoldDetails(
                  order.orderNumber,
                  {
                    ...shortageHoldDetails,
                    followUpDate: getDateInputValueWithOffset(0),
                  },
                  { successMessage: t("preparation.shortagePanel.todaySuccess") },
                )
              }
              disabled={rowBusy}
              className="inline-flex items-center justify-center rounded-xl border border-info bg-white px-3 py-2 text-xs font-medium text-info transition hover:border-info disabled:cursor-not-allowed disabled:opacity-50 dark:border-info dark:dark:bg-muted dark:text-info dark:hover:border-info"
            >
              {t("preparation.shortagePanel.setToday")}
            </button>

            <button
              type="button"
              onClick={() =>
                void onSaveShortageHoldDetails(
                  order.orderNumber,
                  {
                    ...shortageHoldDetails,
                    followUpDate: getDateInputValueWithOffset(1),
                  },
                  { successMessage: t("preparation.shortagePanel.tomorrowSuccess") },
                )
              }
              disabled={rowBusy}
              className="inline-flex items-center justify-center rounded-xl border border-primary bg-white px-3 py-2 text-xs font-medium text-primary transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-primary dark:dark:bg-muted dark:text-primary dark:hover:border-primary"
            >
              {t("preparation.shortagePanel.setTomorrow")}
            </button>

            <button
              type="button"
              onClick={() =>
                void onSaveShortageHoldDetails(
                  order.orderNumber,
                  {
                    ...shortageHoldDetails,
                    followUpDate: "",
                  },
                  { successMessage: t("preparation.shortagePanel.clearDateSuccess") },
                )
              }
              disabled={rowBusy || !shortageHoldDetails.followUpDate}
              className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-3 py-2 text-xs font-medium text-foreground transition hover:hover:border-border disabled:cursor-not-allowed disabled:opacity-50 dark:dark:border-border dark:dark:bg-muted dark:dark:text-muted-foreground dark:hover:dark:hover:border-border"
            >
              {t("preparation.shortagePanel.clearDate")}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void onSaveShortageHoldDetails(order.orderNumber)}
          disabled={rowBusy}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-destructive bg-white px-5 py-3 text-sm font-medium text-destructive transition hover:border-destructive disabled:cursor-not-allowed disabled:opacity-50 dark:border-destructive dark:dark:bg-muted dark:text-destructive dark:hover:border-destructive"
        >
          {rowBusy ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircleIcon className="h-4 w-4" />
          )}
          {t("preparation.shortagePanel.save")}
        </button>
      </div>
    </div>
  );
};

export default PreparationOrderShortagePanel;
