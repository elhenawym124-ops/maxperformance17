import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { BellAlertIcon, ShieldCheckIcon, CheckIcon } from "@heroicons/react/24/outline";
import api from "../../../services/api";
import { useDateFormat } from "../../../hooks/useDateFormat";
import { WarningRecord } from "./types";
import { SectionCard } from "./ProfileWidgets";

interface ProfileWarningsTabProps {
  warnings: WarningRecord[];
  onAcknowledgeSuccess: () => void;
}

export const ProfileWarningsTab: React.FC<ProfileWarningsTabProps> = ({
  warnings,
  onAcknowledgeSuccess,
}) => {
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();

  const handleAcknowledge = async (id: string) => {
    try {
      const res = await api.post(`/hr/warnings/${id}/acknowledge`);
      if ((res.data as any)?.success) {
        toast.success(t("employee.profile.acknowledgeSuccess"));
        onAcknowledgeSuccess();
      }
    } catch {
      toast.error(t("employee.profile.acknowledgeFailed"));
    }
  };

  return (
    <div className="mt-0 space-y-5 focus-visible:outline-none">
      <SectionCard
        icon={BellAlertIcon}
        title={`${t("employee.profile.warningsLog")} ${warnings.length > 0 ? `(${warnings.length})` : ""}`}
      >
        {warnings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ShieldCheckIcon className="h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm font-medium text-foreground">{t("employee.profile.noWarnings")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("employee.profile.cleanRecord")}</p>
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            {warnings.map((warning) => {
              const sev =
                warning.severity === "critical"
                  ? {
                      border: "border-destructive/40",
                      badge: "text-destructive",
                      label: t("employee.profile.warningSeverityCritical"),
                    }
                  : warning.severity === "major"
                  ? {
                      border: "border-warning/40",
                      badge: "text-warning",
                      label: t("employee.profile.warningSeverityMajor"),
                    }
                  : {
                      border: "border-border/70",
                      badge: "text-muted-foreground",
                      label: t("employee.profile.warningSeverityAlert"),
                    };

              return (
                <div key={warning.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-foreground">{warning.title}</h4>
                      <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                        {warning.incidentDate ? formatDate(warning.incidentDate) : "—"}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-lg border px-2 py-0.5 text-xs font-semibold ${sev.border} ${sev.badge}`}>
                      {sev.label}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{warning.description}</p>
                  {warning.actionTaken && (
                    <div className="mt-3 border-t border-border/70 pt-3">
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        {t("employee.profile.actionTaken")}
                      </p>
                      <p className="text-sm text-foreground">{warning.actionTaken}</p>
                    </div>
                  )}
                  {!warning.acknowledgedAt ? (
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => handleAcknowledge(warning.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.97]"
                      >
                        <CheckIcon className="h-3.5 w-3.5" /> {t("employee.warnings.acknowledge")}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckIcon className="h-3.5 w-3.5" />
                      <span>{t("employee.warnings.acknowledged", { date: warning.acknowledgedAt ? formatDate(warning.acknowledgedAt) : "—" })}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
};
