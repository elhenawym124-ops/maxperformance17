import React, { useCallback, useMemo } from "react";
import {
  ChartBarIcon,
  IdentificationIcon,
  WalletIcon,
  ComputerDesktopIcon,
  DocumentTextIcon,
  BellAlertIcon,
  CakeIcon,
  KeyIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { UserApiKeysPanel } from "../../components/api-keys/UserApiKeysPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  useProfileData,
  MerchantProfileView,
  ProfileHeroHeader,
  ProfileOverviewTab,
  ProfilePersonalTab,
  ProfileJobTab,
  ProfileCustodyTab,
  ProfileDocumentsTab,
  ProfileWarningsTab,
  ProfileEventsTab,
  ProfileSecurityTab,
  TabConfig,
} from "./components";

const tabTriggerClass =
  "group relative flex items-center gap-1.5 whitespace-nowrap rounded-none px-3 py-3 text-xs font-medium text-muted-foreground transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-persimmon after:opacity-0 after:transition-opacity hover:text-foreground data-active:text-foreground data-active:after:opacity-100";

export const Profile: React.FC = () => {
  const {
    t,
    user,
    employee,
    formData,
    setFormData,
    loading,
    saving,
    uploading,
    isEditing,
    setIsEditing,
    isDirty,
    activeTab,
    setActiveTab,
    myCustody,
    warnings,
    defaultPage,
    settingsLoading,
    fileInputRef,
    hasAffiliatePro,
    hasHrBasic,
    handleSave,
    handleAvatarClick,
    handleFileChange,
    handleDefaultPageChange,
    fetchMyWarnings,
    field,
  } = useProfileData();

  const isMerchantUser = user?.role === "MERCHANT";
  const isAffiliateUser = user?.role === "AFFILIATE";

  const allTabs: TabConfig[] = useMemo(
    () => [
      { value: "overview", label: t("employee.common.overview"), icon: ChartBarIcon },
      { value: "personal", label: t("employee.common.personalInfo"), icon: IdentificationIcon },
      { value: "job", label: t("employee.common.jobAndSalary"), icon: WalletIcon, requiresHr: true },
      { value: "custody", label: t("employee.common.myCustody"), icon: ComputerDesktopIcon, requiresHr: true },
      { value: "documents", label: t("employee.common.documents"), icon: DocumentTextIcon, requiresHr: true },
      { value: "warnings", label: t("employee.common.warnings"), icon: BellAlertIcon, requiresHr: true },
      { value: "events", label: t("employee.common.occasions"), icon: CakeIcon, requiresHr: true },
      { value: "security", label: t("settings.securityTab", "الأمان"), icon: ShieldCheckIcon },
      { value: "api-keys", label: t("profile.apiKeys", "مفاتيح API"), icon: KeyIcon },
    ],
    [t]
  );

  const tabs = useMemo(() => allTabs.filter((tab) => !tab.requiresHr || hasHrBasic), [allTabs, hasHrBasic]);

  const handleTabChange = useCallback(
    (next: string) => {
      if (isEditing && isDirty) {
        const confirmed = window.confirm(t("profile.unsavedChanges", "لديك تغييرات غير محفوظة. هل تريد المتابعة؟"));
        if (!confirmed) return;
        setIsEditing(false);
      }
      setActiveTab(next);
    },
    [isDirty, isEditing, setActiveTab, setIsEditing, t]
  );

  const fileInput = (
    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="h-28 rounded-2xl bg-muted motion-safe:animate-pulse" />
          <div className="h-80 rounded-2xl bg-muted motion-safe:animate-pulse" />
        </div>
      </div>
    );
  }

  if (isMerchantUser || isAffiliateUser) {
    return (
      <>
        {fileInput}
        <MerchantProfileView
          user={user}
          formData={formData}
          setFormData={setFormData}
          defaultPage={defaultPage}
          settingsLoading={settingsLoading}
          onDefaultPageChange={handleDefaultPageChange}
          hasAffiliatePro={hasAffiliatePro}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          saving={saving}
          uploading={uploading}
          onSave={handleSave}
          onAvatarClick={handleAvatarClick}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {fileInput}

      <div className="mx-auto max-w-6xl px-4 pb-24 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <ProfileHeroHeader
          user={user}
          employee={employee}
          formData={formData}
          setFormData={setFormData}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          saving={saving}
          uploading={uploading}
          onSave={handleSave}
          onAvatarClick={handleAvatarClick}
        />

        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div className="overflow-x-auto border-b border-border/70 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <TabsList className="flex h-auto w-max min-w-full gap-0 bg-transparent p-0 px-2">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className={tabTriggerClass}>
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {tab.value === "warnings" && warnings.length > 0 && (
                      <span className="ms-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold tabular-nums text-destructive-foreground">
                        {warnings.length}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="p-4 sm:p-6">
              <TabsContent value="overview" className="mt-0 focus-visible:outline-none">
                <ProfileOverviewTab
                  employee={employee}
                  formData={formData}
                  setFormData={setFormData}
                  isEditing={isEditing}
                  hasHrBasic={hasHrBasic}
                  defaultPage={defaultPage}
                  settingsLoading={settingsLoading}
                  onDefaultPageChange={handleDefaultPageChange}
                />
              </TabsContent>

              <TabsContent value="personal" className="mt-0 focus-visible:outline-none">
                <ProfilePersonalTab
                  employee={employee}
                  formData={formData}
                  setFormData={setFormData}
                  isEditing={isEditing}
                  field={field}
                />
              </TabsContent>

              <TabsContent value="job" className="mt-0 focus-visible:outline-none">
                <ProfileJobTab employee={employee} />
              </TabsContent>

              <TabsContent value="custody" className="mt-0 focus-visible:outline-none">
                <ProfileCustodyTab myCustody={myCustody} />
              </TabsContent>

              <TabsContent value="documents" className="mt-0 focus-visible:outline-none">
                <ProfileDocumentsTab employee={employee} />
              </TabsContent>

              <TabsContent value="warnings" className="mt-0 focus-visible:outline-none">
                <ProfileWarningsTab warnings={warnings} onAcknowledgeSuccess={fetchMyWarnings} />
              </TabsContent>

              <TabsContent value="events" className="mt-0 focus-visible:outline-none">
                <ProfileEventsTab employee={employee} />
              </TabsContent>

              <TabsContent value="security" className="mt-0 focus-visible:outline-none">
                <ProfileSecurityTab />
              </TabsContent>

              <TabsContent value="api-keys" className="mt-0 focus-visible:outline-none">
                <UserApiKeysPanel mode="self" />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-x-0 bottom-14 z-40 border-t border-border/70 bg-card px-4 py-3 shadow-sm sm:hidden">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
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

export default Profile;
