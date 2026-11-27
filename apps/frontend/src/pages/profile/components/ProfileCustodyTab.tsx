import React from "react";
import { useTranslation } from "react-i18next";
import { ClipboardDocumentListIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";
import { useDateFormat } from "../../../hooks/useDateFormat";
import { CustodyAsset } from "./types";
import { SectionCard } from "./ProfileWidgets";

interface ProfileCustodyTabProps {
  myCustody: CustodyAsset[];
}

export const ProfileCustodyTab: React.FC<ProfileCustodyTabProps> = ({ myCustody }) => {
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();

  return (
    <div className="mt-0 space-y-5 focus-visible:outline-none">
      <SectionCard
        icon={ClipboardDocumentListIcon}
        title={`${t("employee.profile.myAssets")} ${myCustody.length > 0 ? `(${myCustody.length})` : ""}`}
      >
        {myCustody.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ComputerDesktopIcon className="h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">{t("employee.profile.noCustody")}</p>
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            {myCustody.map((asset) => (
              <div key={asset.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="min-w-0 truncate text-sm font-medium text-foreground">{asset.name}</h4>
                  <span
                    className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-medium ${
                      asset.status === "ASSIGNED"
                        ? "bg-success/10 text-success"
                        : "bg-muted/60 text-muted-foreground"
                    }`}
                  >
                    {asset.status === "ASSIGNED" ? t("employee.profile.statusAssigned") : asset.status}
                  </span>
                </div>
                <div className="mt-1.5 space-y-1 text-xs">
                  {asset.code && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">{t("employee.custody.code")}</span>
                      <span className="font-mono tabular-nums text-foreground">{asset.code}</span>
                    </div>
                  )}
                  {asset.serialNumber && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">{t("employee.custody.serialNumber")}</span>
                      <span className="font-mono tabular-nums text-foreground">{asset.serialNumber}</span>
                    </div>
                  )}
                  {asset.assignedDate && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">{t("employee.custody.receiveDate")}</span>
                      <span className="tabular-nums text-foreground">{formatDate(asset.assignedDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
};
