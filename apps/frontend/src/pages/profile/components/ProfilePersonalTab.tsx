import React from "react";
import { useTranslation } from "react-i18next";
import { UserIcon, MapPinIcon, HeartIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import { useDateFormat } from "../../../hooks/useDateFormat";
import { LanguageSwitcher } from "../../../components/common/LanguageSwitcher";
import { Employee, ProfileFormData } from "./types";
import { calculateAge, getMaritalLabels } from "./helpers";
import { SectionCard, InfoField, SensitiveValue } from "./ProfileWidgets";
import { DateInput } from '../../../components/ui/DateInput';

const TIMEZONE_OPTIONS = [
  { value: "Africa/Cairo", label: "القاهرة (Africa/Cairo)" },
  { value: "Asia/Riyadh", label: "الرياض (Asia/Riyadh)" },
  { value: "Asia/Dubai", label: "دبي (Asia/Dubai)" },
];

interface ProfilePersonalTabProps {
  employee: Employee | null;
  formData: ProfileFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>;
  isEditing: boolean;
  field: (key: keyof ProfileFormData) => { value: string; onChange: (v: string) => void };
}

export const ProfilePersonalTab: React.FC<ProfilePersonalTabProps> = ({
  employee,
  formData,
  setFormData,
  isEditing,
  field,
}) => {
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();
  const maritalLabels = getMaritalLabels(t);

  return (
    <div className="mt-0 space-y-5 focus-visible:outline-none">
      <SectionCard icon={UserIcon} title={t("employee.common.personalInfo")}>
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <InfoField label={t("employee.profile.fullName")} value={`${formData.firstName} ${formData.lastName}`} />

          <div className="group">
            <p className="mb-1 text-xs text-muted-foreground">
              {t("employee.profile.dateOfBirth")}
            </p>
            {isEditing ? (
              <DateInput
                value={formData.dateOfBirth}
                onChange={(e) => setFormData((p) => ({ ...p, dateOfBirth: e.target.value }))}
                className="w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
              />
            ) : (
              <p className="text-sm font-medium text-foreground tabular-nums">
                {employee?.dateOfBirth
                  ? `${formatDate(employee.dateOfBirth)} (${calculateAge(employee.dateOfBirth)} ${t("employee.profile.yearsOld")})`
                  : "—"}
              </p>
            )}
          </div>

          <div className="group">
            <p className="mb-1 text-xs text-muted-foreground">
              {t("employee.profile.gender")}
            </p>
            {isEditing ? (
              <select
                value={formData.gender}
                onChange={(e) => setFormData((p) => ({ ...p, gender: e.target.value }))}
                className="w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
              >
                <option value="">{t("employee.profile.genderNotSpecified")}</option>
                <option value="MALE">{t("employee.profile.genderMale")}</option>
                <option value="FEMALE">{t("employee.profile.genderFemale")}</option>
              </select>
            ) : (
              <p className="text-sm font-medium text-foreground">
                {formData.gender === "MALE"
                  ? t("employee.profile.genderMale")
                  : formData.gender === "FEMALE"
                  ? t("employee.profile.genderFemale")
                  : "—"}
              </p>
            )}
          </div>

          {isEditing ? (
            <InfoField label={t("employee.profile.nationalId")} editing {...field("nationalId")} />
          ) : (
            <SensitiveValue label={t("employee.profile.nationalId")} value={formData.nationalId} />
          )}
          <InfoField label={t("employee.profile.email")} value={formData.email} />

          {/* Marital status with select */}
          <div className="group">
            <p className="mb-1 text-xs text-muted-foreground">
              {t("employee.profile.maritalStatus")}
            </p>
            {isEditing ? (
              <select
                value={formData.maritalStatus}
                onChange={(e) => setFormData((p) => ({ ...p, maritalStatus: e.target.value }))}
                className="w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
              >
                <option value="">{t("employee.profile.maritalNotSpecified")}</option>
                <option value="SINGLE">{t("employee.common.maritalSingle")}</option>
                <option value="MARRIED">{t("employee.common.maritalMarried")}</option>
                <option value="DIVORCED">{t("employee.common.maritalDivorced")}</option>
                <option value="WIDOWED">{t("employee.common.maritalWidowed")}</option>
              </select>
            ) : (
              <p className="text-sm font-medium text-foreground">
                {maritalLabels[formData.maritalStatus] || "—"}
              </p>
            )}
          </div>

          <InfoField label={t("employee.profile.phone")} editing={isEditing} {...field("phone")} />
        </div>
      </SectionCard>

      <SectionCard icon={MapPinIcon} title={t("employee.profile.addressTitle")}>
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-3">
          <InfoField label={t("employee.profile.detailedAddress")} editing={isEditing} {...field("address")} />
          <InfoField label={t("employee.profile.city")} editing={isEditing} {...field("city")} />
          <InfoField label={t("employee.profile.country")} editing={isEditing} {...field("country")} />
        </div>
      </SectionCard>

      <SectionCard icon={HeartIcon} title={t("employee.profile.emergencyContact")}>
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-3">
          <InfoField label={t("employee.profile.emergencyContactName")} editing={isEditing} {...field("emergencyContactName")} />
          <InfoField label={t("employee.profile.emergencyContactRelation")} editing={isEditing} {...field("emergencyContactRelation")} />
          <InfoField label={t("employee.profile.emergencyContactPhone")} editing={isEditing} {...field("emergencyContactPhone")} />
        </div>
      </SectionCard>

      <SectionCard icon={GlobeAltIcon} title={t("profile.preferences", "التفضيلات")}>
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">{t("settings.timezone", "المنطقة الزمنية")}</p>
            {isEditing ? (
              <select
                value={formData.timezone || "Africa/Cairo"}
                onChange={(e) => setFormData((p) => ({ ...p, timezone: e.target.value }))}
                className="w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
              >
                {TIMEZONE_OPTIONS.map((zone) => (
                  <option key={zone.value} value={zone.value}>
                    {zone.label}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm font-medium text-foreground">
                {TIMEZONE_OPTIONS.find((zone) => zone.value === formData.timezone)?.label || formData.timezone || "—"}
              </p>
            )}
          </div>

          <div>
            <p className="mb-1 text-xs text-muted-foreground">{t("settings.language", "اللغة")}</p>
            <LanguageSwitcher />
          </div>
        </div>
      </SectionCard>
    </div>
  );
};
