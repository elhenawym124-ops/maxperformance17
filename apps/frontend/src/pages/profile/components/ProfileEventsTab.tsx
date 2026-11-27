import React from "react";
import { useTranslation } from "react-i18next";
import { CakeIcon, GiftIcon } from "@heroicons/react/24/outline";
import { useDateFormat } from "../../../hooks/useDateFormat";
import { Employee } from "./types";
import { calculateAge, getNextOccasion } from "./helpers";
import { SectionCard } from "./ProfileWidgets";

interface ProfileEventsTabProps {
  employee: Employee | null;
}

export const ProfileEventsTab: React.FC<ProfileEventsTabProps> = ({ employee }) => {
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();

  return (
    <div className="mt-0 space-y-5 focus-visible:outline-none">
      <SectionCard icon={CakeIcon} title={t("employee.profile.nextBirthday")}>
        {employee?.dateOfBirth ? (
          <>
            <p className="text-sm text-muted-foreground tabular-nums">
              {formatDate(getNextOccasion(employee.dateOfBirth)?.date.toISOString() || "")}
            </p>
            <div className="mt-4 grid grid-cols-2 divide-x divide-border/70">
              <div className="pe-4">
                <span className="block text-2xl font-semibold tabular-nums text-foreground">
                  {getNextOccasion(employee.dateOfBirth)?.days}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {t("employee.profile.daysRemaining")}
                </span>
              </div>
              <div className="ps-4">
                <span className="block text-2xl font-semibold tabular-nums text-foreground">
                  {(calculateAge(employee.dateOfBirth) as number) + 1}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {t("employee.profile.yearsOld")}
                </span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t("employee.profile.noBirthdaySet")}</p>
        )}
      </SectionCard>

      <SectionCard icon={GiftIcon} title={t("employee.profile.workAnniversary")}>
        {employee?.hireDate ? (
          <>
            <p className="text-sm text-muted-foreground tabular-nums">
              {formatDate(getNextOccasion(employee.hireDate)?.date.toISOString() || "")}
            </p>
            <div className="mt-4 grid grid-cols-2 divide-x divide-border/70">
              <div className="pe-4">
                <span className="block text-2xl font-semibold tabular-nums text-foreground">
                  {getNextOccasion(employee.hireDate)?.days}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {t("employee.profile.daysRemaining")}
                </span>
              </div>
              <div className="ps-4">
                <span className="block text-2xl font-semibold tabular-nums text-foreground">
                  {Math.floor(
                    (new Date().getTime() - new Date(employee.hireDate).getTime()) / (1000 * 60 * 60 * 24)
                  )}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {t("employee.profile.daysWorked")}
                </span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t("employee.profile.noJoinDateSet")}</p>
        )}
      </SectionCard>
    </div>
  );
};
