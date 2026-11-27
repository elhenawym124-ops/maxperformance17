import React from "react";
import { useTranslation } from "react-i18next";
import { BriefcaseIcon, BanknotesIcon } from "@heroicons/react/24/outline";
import { useDateFormat } from "../../../hooks/useDateFormat";
import { Employee } from "./types";
import { calculateTenure, getContractLabels } from "./helpers";
import { SectionCard, InfoField, AnimatedNumber, SensitiveValue } from "./ProfileWidgets";

interface ProfileJobTabProps {
  employee: Employee | null;
}

export const ProfileJobTab: React.FC<ProfileJobTabProps> = ({ employee }) => {
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();
  const contractLabels = getContractLabels(t);

  const jobDetailsList = [
    { label: t("employee.profile.employeeNumber"), value: employee?.employeeNumber || "" },
    { label: t("employee.profile.jobTitle"), value: employee?.position?.title || "" },
    { label: t("employee.profile.department"), value: employee?.department?.name || "" },
    {
      label: t("employee.profile.contractType"),
      value: contractLabels[employee?.contractType || ""] || employee?.contractType || "",
    },
    { label: t("employee.profile.joinDate"), value: employee?.hireDate ? formatDate(employee.hireDate) : "" },
    { label: t("employee.profile.serviceDuration"), value: calculateTenure(employee?.hireDate || "", t) },
    {
      label: t("employee.profile.directManager"),
      value: employee?.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : "",
    },
  ];

  const financialItems = [
    {
      label: t("employee.profile.baseSalary"),
      value: employee?.baseSalary,
      suffix: "",
      unit: t("employee.profile.egpMonth"),
    },
    {
      label: t("employee.profile.annualLeaveBalance"),
      value: employee?.annualLeaveBalance,
      suffix: "",
      unit: t("employee.profile.dayAvailable"),
    },
    {
      label: t("employee.profile.sickLeaveBalance"),
      value: employee?.sickLeaveBalance,
      suffix: "",
      unit: t("employee.profile.dayAvailable"),
    },
  ];

  return (
    <div className="mt-0 space-y-5 focus-visible:outline-none">
      <SectionCard icon={BriefcaseIcon} title={t("employee.profile.jobDetails")}>
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {jobDetailsList.map((item) => (
            <InfoField key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={BanknotesIcon} title={t("employee.profile.financialInfo")}>
        <div className="grid grid-cols-1 divide-y divide-border/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {financialItems.map((item) => (
            <div key={item.label} className="py-3 sm:px-4 sm:py-0 sm:first:ps-0">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                {item.value != null ? <AnimatedNumber value={Number(item.value)} /> : "—"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{item.unit}</p>
            </div>
          ))}
        </div>
        {(employee?.bankName || employee?.bankIban) && (
          <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-5 border-t border-border/70 pt-5 sm:grid-cols-2">
            <InfoField label={t("employee.profile.bankName")} value={employee?.bankName || ""} />
            <SensitiveValue label={t("employee.profile.iban")} value={employee?.bankIban} />
          </div>
        )}
      </SectionCard>
    </div>
  );
};
