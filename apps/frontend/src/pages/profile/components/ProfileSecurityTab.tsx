import React from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useOptionalAuth } from "../../../hooks/useAuthSimple";
import { useDateFormat } from "../../../hooks/useDateFormat";
import { SecuritySettings } from "../../settings/settings-hub/SecuritySettings";
import { SectionCard, InfoField } from "./ProfileWidgets";

type SecuritySnapshot = {
  lastLoginAt?: string | null;
  passwordChangedAt?: string | null;
};

export const ProfileSecurityTab: React.FC = () => {
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();
  const auth = useOptionalAuth();
  const snapshot = (auth?.user || {}) as SecuritySnapshot;

  return (
    <div className="mt-0 space-y-5 focus-visible:outline-none">
      <SectionCard icon={ShieldCheckIcon} title={t("profile.securityLog", "سجل الأمان")}>
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
          <InfoField
            label={t("profile.lastLogin", "آخر تسجيل دخول")}
            value={snapshot.lastLoginAt ? formatDate(snapshot.lastLoginAt) : "—"}
          />
          <InfoField
            label={t("profile.passwordChangedAt", "آخر تحديث لكلمة المرور")}
            value={snapshot.passwordChangedAt ? formatDate(snapshot.passwordChangedAt) : "—"}
          />
        </div>
      </SectionCard>

      <div className="border-t border-border/70 pt-5">
        <SecuritySettings />
      </div>
    </div>
  );
};

export default ProfileSecurityTab;
