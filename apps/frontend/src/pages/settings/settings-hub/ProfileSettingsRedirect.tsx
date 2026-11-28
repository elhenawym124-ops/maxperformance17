import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * The account editor lives on /profile (single source of truth).
 * The settings shell keeps the tab so old links still work, then forwards there.
 */
export const ProfileSettingsRedirect: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/profile?tab=personal", { replace: true });
  }, [navigate]);

  return (
    <div className="px-6 py-10">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        <p className="mt-4 text-sm text-muted-foreground">
          {t("settings.redirecting", "جارٍ التحويل...")}
        </p>
      </div>
    </div>
  );
};
