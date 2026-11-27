import React from "react";
import { useTranslation } from "react-i18next";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { useDateFormat } from "../../../hooks/useDateFormat";
import { Employee } from "./types";
import { SectionCard } from "./ProfileWidgets";

interface ProfileDocumentsTabProps {
  employee: Employee | null;
}

export const ProfileDocumentsTab: React.FC<ProfileDocumentsTabProps> = ({ employee }) => {
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();

  return (
    <div className="mt-0 space-y-5 focus-visible:outline-none">
      <SectionCard icon={DocumentTextIcon} title={t("employee.profile.myDocuments")}>
        {!employee?.documents_rel?.length ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <DocumentTextIcon className="h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">{t("employee.profile.noDocuments")}</p>
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            {employee.documents_rel.map((doc, idx) => (
              <div
                key={`${doc.type}-${idx}`}
                className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-medium text-foreground">{doc.title || doc.name}</h4>
                  <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                    {doc.createdAt ? formatDate(doc.createdAt) : "—"}
                  </p>
                </div>
                <span className="shrink-0 rounded-lg bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
                  {doc.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
};
