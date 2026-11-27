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
      <SectionCard icon={ShieldCheckIcon} title={t("profile.securityLog", "سجل الأمان")} accent="emerald">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
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

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/[0.06] dark:bg-slate-900/80">
        <SecuritySettings />
      </div>
    </div>
  );
};

export default ProfileSecurityTab;
