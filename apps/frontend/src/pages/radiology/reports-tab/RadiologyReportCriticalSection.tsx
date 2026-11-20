import React from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { MODAL_INPUT_CLS, RadiologyReport } from "../shared";

interface RadiologyReportCriticalSectionProps {
  critCategory: string;
  setCritCategory: (value: string) => void;
  critFindingText: string;
  setCritFindingText: (value: string) => void;
  saveCritical: () => Promise<void>;
  savingCritical: boolean;
  critChanged: boolean;
  criticalMeta: { label: string; color: string } | undefined;
  criticalCat: string | null;
  report: RadiologyReport | null;
  fmtDateTime: (iso?: string) => string;
  canManage: boolean;
  acknowledgeCritical: () => Promise<void>;
  acknowledging: boolean;
}

export const RadiologyReportCriticalSection: React.FC<RadiologyReportCriticalSectionProps> = ({
  critCategory,
  setCritCategory,
  critFindingText,
  setCritFindingText,
  saveCritical,
  savingCritical,
  critChanged,
  criticalMeta,
  criticalCat,
  report,
  fmtDateTime,
  canManage,
  acknowledgeCritical,
  acknowledging,
}) => {
  const { t } = useTranslation();

  return (
    <div className="mt-3 border dark:border-border rounded-lg p-3">
      <p className="text-sm font-semibold text-foreground mb-2">
        {t("radiology.critical.title")}
      </p>
      <div className="space-y-2">
        <select
          className={MODAL_INPUT_CLS}
          value={critCategory}
          onChange={(e) => setCritCategory(e.target.value)}
        >
          <option value="NONE">{t("radiology.critical.none")}</option>
          <option value="CAT1">{t("radiology.critical.CAT1")}</option>
          <option value="CAT2">{t("radiology.critical.CAT2")}</option>
          <option value="CAT3">{t("radiology.critical.CAT3")}</option>
        </select>
        <input
          className={MODAL_INPUT_CLS}
          value={critFindingText}
          onChange={(e) => setCritFindingText(e.target.value)}
          placeholder={t("radiology.critical.findingPlaceholder") as string}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => void saveCritical()}
            disabled={savingCritical || !critChanged}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border font-medium border-destructive text-destructive bg-destructive/10 hover:bg-destructive dark:border-destructive dark:text-destructive dark:bg-destructive/30 dark:hover:bg-destructive/50 disabled:opacity-50 cursor-pointer"
          >
            {savingCritical ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5" />
            )}
            {critCategory === "NONE" ? t("radiology.critical.clear") : t("radiology.critical.flag")}
          </button>
          {criticalMeta ? (
            <span className={`px-2 py-0.5 rounded-full text-xs ${criticalMeta.color}`}>
              {t(criticalMeta.label)}
            </span>
          ) : null}
        </div>
        {criticalCat ? (
          <div className="text-xs text-muted-foreground space-y-1 pt-1">
            {report?.criticalFlaggedBy ? (
              <p>
                {t("radiology.critical.flaggedBy")}:{" "}
                <b className="text-foreground">{report.criticalFlaggedBy}</b>
                {report.criticalFlaggedAt ? ` — ${fmtDateTime(report.criticalFlaggedAt)}` : ""}
              </p>
            ) : null}
            {report?.criticalAcknowledgedBy ? (
              <p>
                {t("radiology.critical.acknowledgedBy")}:{" "}
                <b className="text-foreground">{report.criticalAcknowledgedBy}</b>
                {report.criticalAcknowledgedAt ? ` — ${fmtDateTime(report.criticalAcknowledgedAt)}` : ""}
              </p>
            ) : (
              <p>{t("radiology.critical.notAcknowledged")}</p>
            )}
            {canManage && !report?.criticalAcknowledgedBy ? (
              <button
                type="button"
                onClick={() => void acknowledgeCritical()}
                disabled={acknowledging}
                className="mt-1 flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border font-medium border-primary text-primary bg-primary/10 hover:bg-primary dark:border-primary dark:text-primary dark:bg-primary/30 dark:hover:bg-primary/50 disabled:opacity-50 cursor-pointer"
              >
                {acknowledging ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                {t("radiology.critical.acknowledge")}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};
