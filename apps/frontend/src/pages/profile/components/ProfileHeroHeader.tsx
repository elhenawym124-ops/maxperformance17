import React from "react";
import { useTranslation } from "react-i18next";
import {
  CameraIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { Employee, ProfileFormData, MerchantUserExtras } from "./types";
import { getInitials, getStatusConfig } from "./helpers";

interface ProfileHeroHeaderProps {
  user: any;
  employee: Employee | null;
  formData: ProfileFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  saving: boolean;
  uploading: boolean;
  onSave: () => void;
  onAvatarClick: () => void;
}

export const ProfileHeroHeader: React.FC<ProfileHeroHeaderProps> = ({
  user,
  employee,
  formData,
  setFormData,
  isEditing,
  setIsEditing,
  saving,
  uploading,
  onSave,
  onAvatarClick,
}) => {
  const { t } = useTranslation();
  const statusConfig = getStatusConfig(t);
  const userAvatar = (user as typeof user & MerchantUserExtras)?.avatar || "";
  const currentStatus = employee?.status ? statusConfig[employee.status] : null;

  return (
    <header className="mb-4 overflow-hidden rounded-2xl border border-border/70 bg-card sm:mb-6">
      <div className="bg-petrol px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onAvatarClick}
              data-testid="profile-avatar"
              aria-label={t("employee.profile.updateAvatar")}
              className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-inset ring-on-petrol/25 bg-on-petrol/10 text-on-petrol transition active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-petrol/40 sm:h-20 sm:w-20"
            >
              {employee?.avatar || userAvatar ? (
                <img src={employee?.avatar || userAvatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-lg font-semibold sm:text-xl">
                  {getInitials(formData.firstName, formData.lastName)}
                </span>
              )}
              {uploading ? (
                <span className="absolute inset-0 flex items-center justify-center bg-petrol/80">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-on-petrol/30 border-t-on-petrol" />
                </span>
              ) : (
                <span className="absolute inset-0 flex items-center justify-center bg-petrol/70 opacity-0 transition group-hover:opacity-100">
                  <CameraIcon className="h-5 w-5" />
                </span>
              )}
            </button>

            <div className="min-w-0">
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  <input
                    value={formData.firstName}
                    onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                    placeholder={t("employee.profile.firstNamePlaceholder")}
                    className="w-28 rounded-lg ring-1 ring-inset ring-on-petrol/30 bg-petrol-hover px-2.5 py-1.5 text-base font-semibold text-on-petrol outline-none placeholder:text-on-petrol/50 focus:border-on-petrol/60 sm:w-32"
                  />
                  <input
                    value={formData.lastName}
                    onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                    placeholder={t("employee.profile.lastNamePlaceholder")}
                    className="w-28 rounded-lg ring-1 ring-inset ring-on-petrol/30 bg-petrol-hover px-2.5 py-1.5 text-base font-semibold text-on-petrol outline-none placeholder:text-on-petrol/50 focus:border-on-petrol/60 sm:w-32"
                  />
                </div>
              ) : (
                <h1 className="truncate text-xl font-semibold text-on-petrol sm:text-2xl">
                  {formData.firstName} {formData.lastName}
                </h1>
              )}

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-petrol/70">
                {currentStatus && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${currentStatus.dot}`} />
                    {currentStatus.label}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <BriefcaseIcon className="h-3.5 w-3.5" />
                  {employee?.position?.title || t("employee.profile.employeeTitle")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <BuildingOfficeIcon className="h-3.5 w-3.5" />
                  {employee?.department?.name || t("employee.profile.noDepartment")}
                </span>
                {employee?.employeeNumber && (
                  <span className="font-mono tabular-nums">#{employee.employeeNumber}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-persimmon px-3 py-2 text-xs font-semibold text-white transition hover:bg-persimmon-hover active:scale-[0.97] disabled:opacity-60"
                >
                  {saving ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <CheckIcon className="h-4 w-4" />
                  )}
                  {saving ? t("employee.common.saving") : t("employee.common.save")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg ring-1 ring-inset ring-on-petrol/30 px-3 py-2 text-xs font-semibold text-on-petrol transition hover:bg-on-petrol/10 active:scale-[0.97] disabled:opacity-60"
                >
                  <XMarkIcon className="h-4 w-4" />
                  {t("employee.common.cancel")}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-lg ring-1 ring-inset ring-on-petrol/30 px-3 py-2 text-xs font-semibold text-on-petrol transition hover:bg-on-petrol/10 active:scale-[0.97]"
              >
                <PencilIcon className="h-4 w-4" />
                {t("profile.editProfile")}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
