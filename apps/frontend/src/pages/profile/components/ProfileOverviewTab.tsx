import React from "react";
import { useTranslation } from "react-i18next";
import {
  CalendarDaysIcon,
  ClockIcon,
  SparklesIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { useDateFormat } from "../../../hooks/useDateFormat";
import { DefaultPageSelector } from "../../../components/settings/DefaultPageSelector";
import { Employee, ProfileFormData } from "./types";
import { calculateTenure } from "./helpers";

interface ProfileOverviewTabProps {
  employee: Employee | null;
  formData: ProfileFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>;
  isEditing: boolean;
  hasHrBasic: boolean;
  defaultPage: string;
  settingsLoading: boolean;
  onDefaultPageChange: (page: string) => void;
}

export const ProfileOverviewTab: React.FC<ProfileOverviewTabProps> = ({
  employee,
  formData,
  setFormData,
  isEditing,
  hasHrBasic,
  defaultPage,
  settingsLoading,
  onDefaultPageChange,
}) => {
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();

  const statsData = [
    {
      label: t("employee.profile.joinDate"),
      value: employee?.hireDate ? formatDate(employee.hireDate) : "—",
      icon: CalendarDaysIcon,
    },
    {
      label: t("employee.profile.serviceDuration"),
      value: calculateTenure(employee?.hireDate || "", t),
      icon: ClockIcon,
    },
    {
      label: t("employee.profile.annualLeave"),
      value: `${employee?.annualLeaveBalance ?? 0} ${t("employee.common.day")}`,
      icon: SparklesIcon,
    },
    {
      label: t("employee.profile.sickLeave"),
      value: `${employee?.sickLeaveBalance ?? 0} ${t("employee.common.day")}`,
      icon: ShieldCheckIcon,
    },
  ];

  return (
    <div className="mt-0 space-y-5 focus-visible:outline-none">
      {hasHrBasic && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 border-b border-border/70 pb-5 sm:grid-cols-4">
          {statsData.map((stat) => (
            <div key={stat.label}>
              <div className="mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                <stat.icon className="h-3.5 w-3.5" />
                <p className="text-xs">{stat.label}</p>
              </div>
              <p className="text-lg font-semibold tabular-nums text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <section>
        <p className="mb-1 text-xs font-medium text-muted-foreground">{t("employee.profile.quickContact")}</p>
        <div className="divide-y divide-border/70">
          {[
            { icon: EnvelopeIcon, value: formData.email, label: t("employee.profile.email") },
            { icon: PhoneIcon, value: formData.phone, label: t("employee.profile.phone"), editable: true, fkey: "phone" as keyof typeof formData },
            { icon: MapPinIcon, value: formData.city ? `${formData.city}، ${formData.country}` : formData.country || "", label: t("employee.profile.location") },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 py-2.5">
              <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="w-20 shrink-0 text-xs text-muted-foreground">{item.label}</span>
              {isEditing && item.editable && item.fkey ? (
                <input
                  value={formData[item.fkey]}
                  onChange={(e) => setFormData((p) => ({ ...p, [item.fkey!]: e.target.value }))}
                  className="min-w-0 flex-1 rounded-lg border border-border/70 bg-card px-3 py-1.5 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
                />
              ) : (
                <span className="truncate text-sm text-foreground">{item.value || "—"}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border/70 pt-5">
        <DefaultPageSelector value={defaultPage} onChange={onDefaultPageChange} disabled={settingsLoading} />
      </section>
    </div>
  );
};
