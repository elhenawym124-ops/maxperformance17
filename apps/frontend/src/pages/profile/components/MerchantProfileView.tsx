import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  BanknotesIcon,
  ShoppingBagIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import { DefaultPageSelector } from "../../../components/settings/DefaultPageSelector";
import { UserApiKeysPanel } from "../../../components/api-keys/UserApiKeysPanel";
import { ProfileFormData, MerchantUserExtras } from "./types";
import { getInitials } from "./helpers";
import { ProfileSecurityTab } from "./ProfileSecurityTab";

interface MerchantProfileViewProps {
  user: any;
  formData: ProfileFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>;
  defaultPage: string;
  settingsLoading: boolean;
  onDefaultPageChange: (page: string) => void;
  hasAffiliatePro: boolean;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  saving: boolean;
  uploading: boolean;
  onSave: () => void;
  onAvatarClick: () => void;
}

export const MerchantProfileView: React.FC<MerchantProfileViewProps> = ({
  user,
  formData,
  setFormData,
  defaultPage,
  settingsLoading,
  onDefaultPageChange,
  hasAffiliatePro,
  isEditing,
  setIsEditing,
  saving,
  uploading,
  onSave,
  onAvatarClick,
}) => {
  const { t } = useTranslation();

  const isMerchantUser = user?.role === "MERCHANT";
  const externalUser = user as typeof user & MerchantUserExtras;
  const companyName = user?.company?.name || t("employee.profile.noCompany");
  const fullName = `${formData.firstName} ${formData.lastName}`.trim() || user?.email || t("employee.profile.userAccount");
  const portalPath = isMerchantUser ? "/merchant-portal" : "/affiliates/dashboard";

  const accountTitle = isMerchantUser
    ? t("employee.profile.merchantAccount", "Ø­Ø³Ø§Ø¨ ØªØ§Ø¬Ø± Ø¯Ø±ÙˆØ¨ Ø´ÙŠØ¨Ù†Ø¬")
    : t("employee.profile.affiliateAccount", "Ø­Ø³Ø§Ø¨ Ù…Ø³ÙˆÙ‚ Ø£ÙÙ„ÙŠØª");
  const accountDescription = isMerchantUser
    ? t("employee.profile.merchantAccountDesc", { company: companyName })
    : t("employee.profile.affiliateAccountDesc", { company: companyName });
  const portalCta = isMerchantUser ? t("employee.profile.merchantPortal") : t("employee.profile.affiliateDashboard");
  const toolsHeading = isMerchantUser
    ? t("employee.profile.merchantTools", "Ø§Ù„Ø£Ø¯ÙˆØ§Øª Ø§Ù„Ù…ØªØ§Ø­Ø© Ù„Ù„ØªØ§Ø¬Ø±")
    : t("employee.profile.affiliateTools", "Ø§Ù„Ø£Ø¯ÙˆØ§Øª Ø§Ù„Ù…ØªØ§Ø­Ø© Ù„Ù„Ù…Ø³ÙˆÙ‚");

  const contactRows = [
    { label: t("employee.profile.email"), value: formData.email || "â€”", icon: EnvelopeIcon, editable: false },
    { label: t("employee.profile.phone"), value: formData.phone || externalUser?.phone || "â€”", icon: PhoneIcon, editable: true },
    { label: t("employee.profile.noCompany"), value: companyName, icon: BuildingOfficeIcon, editable: false },
  ];

  const tools = isMerchantUser
    ? [
        {
          label: t("employee.profile.merchantProducts"),
          description: t("employee.profile.merchantProductsDesc"),
          to: "/merchant-portal#merchant-products",
          icon: ClipboardDocumentListIcon,
        },
        {
          label: t("employee.profile.merchantOrders"),
          description: t("employee.profile.merchantOrdersDesc"),
          to: "/merchant-portal#merchant-orders",
          icon: ChartBarIcon,
        },
        {
          label: t("employee.profile.merchantCommissions"),
          description: t("employee.profile.merchantCommissionsDesc"),
          to: "/merchant-portal#merchant-commissions",
          icon: BanknotesIcon,
        },
      ]
    : [
        {
          label: t("employee.profile.affiliateDashboardTitle"),
          description: t("employee.profile.affiliateDashboardDesc"),
          to: "/affiliates/dashboard",
          icon: ChartBarIcon,
        },
        {
          label: t("employee.profile.affiliateProducts"),
          description: t("employee.profile.affiliateProductsDesc"),
          to: "/affiliates/products",
          icon: ShoppingBagIcon,
        },
        {
          label: t("employee.profile.affiliateClients"),
          description: t("employee.profile.affiliateClientsDesc"),
          to: "/affiliates/commission",
          icon: BanknotesIcon,
        },
      ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <header className="mb-4 overflow-hidden rounded-2xl border border-border/70 bg-card sm:mb-6">
          <div className="bg-petrol px-4 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={onAvatarClick}
                  data-testid="profile-avatar"
                  aria-label={t("employee.profile.updateAvatar")}
                  className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-inset ring-on-petrol/25 bg-on-petrol/10 text-on-petrol transition active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-petrol/40 sm:h-20 sm:w-20"
                >
                  {externalUser?.avatar ? (
                    <img src={externalUser.avatar} alt={fullName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-lg font-semibold sm:text-xl">
                      {getInitials(formData.firstName, formData.lastName) || "T"}
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
                  <p className="text-xs text-on-petrol/70">{accountTitle}</p>
                  {isEditing ? (
                    <div className="mt-1 flex flex-wrap gap-2">
                      <input
                        value={formData.firstName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                        placeholder={t("employee.profile.firstNamePlaceholder")}
                        className="w-28 rounded-lg ring-1 ring-inset ring-on-petrol/30 bg-petrol-hover px-2.5 py-1.5 text-base font-semibold text-on-petrol outline-none placeholder:text-on-petrol/50 focus:border-on-petrol/60"
                      />
                      <input
                        value={formData.lastName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                        placeholder={t("employee.profile.lastNamePlaceholder")}
                        className="w-28 rounded-lg ring-1 ring-inset ring-on-petrol/30 bg-petrol-hover px-2.5 py-1.5 text-base font-semibold text-on-petrol outline-none placeholder:text-on-petrol/50 focus:border-on-petrol/60"
                      />
                    </div>
                  ) : (
                    <h1 className="truncate text-xl font-semibold text-on-petrol sm:text-2xl">{fullName}</h1>
                  )}
                  <p className="mt-1 line-clamp-2 text-xs text-on-petrol/60">{accountDescription}</p>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onSave}
                      data-testid="profile-save"
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-persimmon px-3 py-2 text-xs font-semibold text-white transition hover:bg-persimmon-hover active:scale-[0.97] disabled:opacity-60"
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
                      data-testid="profile-cancel"
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg ring-1 ring-inset ring-on-petrol/30 px-3 py-2 text-xs font-semibold text-on-petrol transition hover:bg-on-petrol/10 active:scale-[0.97] disabled:opacity-60"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      {t("employee.common.cancel")}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg ring-1 ring-inset ring-on-petrol/30 px-3 py-2 text-xs font-semibold text-on-petrol transition hover:bg-on-petrol/10 active:scale-[0.97]"
                  >
                    <PencilIcon className="h-4 w-4" />
                    {t("profile.editProfile")}
                  </button>
                )}
                <Link
                  to={portalPath}
                  className="inline-flex items-center justify-center rounded-lg bg-persimmon px-3 py-2 text-xs font-semibold text-white transition hover:bg-persimmon-hover active:scale-[0.97]"
                >
                  {portalCta}
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
          <section className="px-4 py-4 sm:px-6">
            <dl className="divide-y divide-border/70">
              {contactRows.map((item) => (
                <div key={item.label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <dt className="w-24 shrink-0 text-xs text-muted-foreground">{item.label}</dt>
                  <dd className="min-w-0 flex-1">
                    {item.editable && isEditing ? (
                      <input
                        value={formData.phone}
                        onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                        inputMode="tel"
                        dir="ltr"
                        className="w-full rounded-lg border border-border/70 bg-card px-3 py-1.5 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
                      />
                    ) : (
                      <p className="truncate text-sm font-medium text-foreground">{item.value}</p>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {hasAffiliatePro ? (
            <section className="border-t border-border/70 px-4 py-4 sm:px-6">
              <h2 className="mb-1 text-sm font-semibold text-foreground">{toolsHeading}</h2>
              <div className="divide-y divide-border/70">
                {tools.map((tool) => (
                  <Link
                    key={tool.to}
                    to={tool.to}
                    className="flex items-center gap-3 py-3 first:pt-2 last:pb-0 transition-colors hover:text-primary"
                  >
                    <tool.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">{tool.label}</span>
                      <span className="block text-xs text-muted-foreground">{tool.description}</span>
                    </span>
                    <ChevronLeftIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <section className="border-t border-border/70 px-4 py-4 sm:px-6">
              <h2 className="text-sm font-semibold text-foreground">
                {t("employee.profile.portalNotActivated", {
                  portal: isMerchantUser ? t("employee.profile.merchantPortalName") : t("employee.profile.affiliateBoardName"),
                })}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("employee.profile.notActivatedDesc", {
                  role: isMerchantUser ? t("employee.profile.merchantRole") : t("employee.profile.affiliateRole"),
                })}
              </p>
            </section>
          )}

          <section className="border-t border-border/70 px-4 py-4 sm:px-6">
            <DefaultPageSelector value={defaultPage} onChange={onDefaultPageChange} disabled={settingsLoading} />

            <div className="mt-4 border-t border-border/70 pt-4">
              <p className="mb-1 text-xs text-muted-foreground">{t("settings.timezone", "المنطقة الزمنية")}</p>
              {isEditing ? (
                <select
                  value={formData.timezone || "Africa/Cairo"}
                  onChange={(e) => setFormData((prev) => ({ ...prev, timezone: e.target.value }))}
                  className="w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/15 sm:w-64"
                >
                  <option value="Africa/Cairo">القاهرة (Africa/Cairo)</option>
                  <option value="Asia/Riyadh">الرياض (Asia/Riyadh)</option>
                  <option value="Asia/Dubai">دبي (Asia/Dubai)</option>
                </select>
              ) : (
                <p className="text-sm font-medium text-foreground">{formData.timezone || "—"}</p>
              )}
            </div>
          </section>

          <section className="border-t border-border/70 px-4 py-4 sm:px-6">
            <ProfileSecurityTab />
            <div className="mt-5 border-t border-border/70 pt-5">
              <UserApiKeysPanel mode="self" />
            </div>
          </section>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-x-0 bottom-14 z-40 border-t border-border/70 bg-card px-4 py-3 shadow-sm sm:hidden">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="flex-1 rounded-lg bg-persimmon px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-persimmon-hover active:scale-[0.97] disabled:opacity-60"
            >
              {saving ? t("employee.common.saving") : t("employee.common.save")}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={saving}
              className="rounded-lg border border-border/70 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted active:scale-[0.97] disabled:opacity-60"
            >
              {t("employee.common.cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
