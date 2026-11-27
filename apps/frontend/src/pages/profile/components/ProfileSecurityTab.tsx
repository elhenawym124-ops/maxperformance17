import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRightOnRectangleIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import api from "../../../services/api";
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
  const [signingOutAll, setSigningOutAll] = useState(false);

  const handleLogoutAll = async () => {
    const confirmed = window.confirm(
      t("profile.logoutAllConfirm", "سيتم إنهاء كل الجلسات على جميع الأجهزة. هل تريد المتابعة؟")
    );
    if (!confirmed) return;

    setSigningOutAll(true);
    try {
      await api.post("/auth/logout-all");
    } catch {
      toast.error(t("profile.logoutAllFailed", "تعذر إنهاء الجلسات، حاول مرة أخرى"));
      setSigningOutAll(false);
      return;
    }

    await auth?.logout?.();
    window.location.assign("/auth/login");
  };

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

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-5">
        <p className="text-sm font-medium text-foreground">
          {t("profile.logoutAll", "تسجيل الخروج من كل الأجهزة")}
        </p>
        <button
          type="button"
          onClick={handleLogoutAll}
          disabled={signingOutAll}
          className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/10 active:scale-[0.97] disabled:opacity-60"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4" />
          {signingOutAll
            ? t("profile.logoutAllPending", "جارٍ الإنهاء...")
            : t("profile.logoutAllAction", "إنهاء كل الجلسات")}
        </button>
      </div>
    </div>
  );
};

export default ProfileSecurityTab;
