import { useTranslation } from "react-i18next";
import { Loader2, RefreshCw, Save, X as XMarkIcon, CheckCircle2 } from "lucide-react";
import DentalPoliciesSection from "./settings/DentalPoliciesSection";
import DentalFinancialPoliciesSection from "./settings/DentalFinancialPoliciesSection";
import { SettingsNavigation } from "./settings/components/SettingsNavigation";
import { GeneralSettingsSection } from "./settings/sections/GeneralSettingsSection";
import { StagesSettingsSection } from "./settings/sections/StagesSettingsSection";
import { WhatsappSettingsSection } from "./settings/sections/WhatsappSettingsSection";
import { CustomFieldsSettingsSection } from "./settings/sections/CustomFieldsSettingsSection";
import { WagesSettingsSection } from "./settings/sections/WagesSettingsSection";
import { DunningSettingsSection } from "./settings/sections/DunningSettingsSection";
import { BillingSettingsSection } from "./settings/sections/BillingSettingsSection";
import { useDentalLabSettings } from "./settings/hooks/useDentalLabSettings";
import { sectionCardCls } from "./settings/types/settingsTypes";

export default function DentalLabSettingsTab() {
  const { t } = useTranslation();
  const {
    loading,
    saving,
    error,
    setError,
    activeSection,
    setActiveSection,
    dirtyMap,
    activeDirty,
    isInstantSection,
    handleRefresh,
    saveActive,
    labName,
    setLabName,
    address,
    setAddress,
    phone,
    setPhone,
    stageTemplates,
    updateStage,
    addStage,
    removeStage,
    readyTemplate,
    setReadyTemplate,
    receivedTemplate,
    setReceivedTemplate,
    overdueTemplate,
    setOverdueTemplate,
    customFields,
    setCustomFields,
    billingPolicy,
    setBillingPolicy,
    guards,
    setGuards,
    wageDefault,
    setWageDefault,
    dunningEnabled,
    setDunningEnabled,
    dunningAgingDays,
    setDunningAgingDays,
  } = useDentalLabSettings();

  const saveDisabled = loading || saving || !activeDirty;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{t("dentalLab.tabs.settings")}</h2>
          {activeDirty && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-warning dark:text-warning">
              <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
              {t("dentalLab.settings.unsavedChanges")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 border dark:border-border rounded-lg text-sm hover:bg-muted/50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t("dentalLab.common.refresh")}
          </button>
          {isInstantSection ? (
            <span className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground/80">
              <CheckCircle2 className="w-4 h-4 text-success" />
              {t("dentalLab.settings.savedInstantly")}
            </span>
          ) : (
            <button
              onClick={saveActive}
              disabled={saveDisabled}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? t("dentalLab.common.saving") : t("dentalLab.common.save")}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between bg-destructive/10 dark:bg-destructive/30 text-destructive dark:text-destructive border border-destructive dark:border-destructive rounded-lg px-4 py-2 text-sm">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="p-1 hover:bg-destructive dark:hover:bg-destructive/50 rounded transition-colors"
            aria-label="Dismiss error"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-6 items-start">
        <SettingsNavigation
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          dirtyMap={dirtyMap}
          loading={loading}
        />

        <div className="min-w-0 space-y-6">
          {loading ? (
            <div className={`${sectionCardCls} space-y-4`}>
              <div className="h-5 w-44 bg-muted dark:bg-muted rounded animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="h-10 bg-muted/50 rounded-lg animate-pulse" />
                <div className="h-10 bg-muted/50 rounded-lg animate-pulse" />
                <div className="h-10 bg-muted/50 rounded-lg animate-pulse" />
              </div>
              <div className="h-24 bg-muted/50 rounded-lg animate-pulse" />
              <div className="h-24 bg-muted/50 rounded-lg animate-pulse" />
            </div>
          ) : (
            <>
              {activeSection === "general" && (
                <GeneralSettingsSection
                  labName={labName}
                  setLabName={setLabName}
                  address={address}
                  setAddress={setAddress}
                  phone={phone}
                  setPhone={setPhone}
                />
              )}

              {activeSection === "policies" && <DentalPoliciesSection />}

              {activeSection === "financial" && <DentalFinancialPoliciesSection />}

              {activeSection === "stages" && (
                <StagesSettingsSection
                  stageTemplates={stageTemplates}
                  updateStage={updateStage}
                  addStage={addStage}
                  removeStage={removeStage}
                />
              )}

              {activeSection === "whatsapp" && (
                <WhatsappSettingsSection
                  readyTemplate={readyTemplate}
                  setReadyTemplate={setReadyTemplate}
                  receivedTemplate={receivedTemplate}
                  setReceivedTemplate={setReceivedTemplate}
                  overdueTemplate={overdueTemplate}
                  setOverdueTemplate={setOverdueTemplate}
                />
              )}

              {activeSection === "fields" && (
                <CustomFieldsSettingsSection
                  customFields={customFields}
                  setCustomFields={setCustomFields}
                  setError={setError}
                />
              )}

              {activeSection === "wages" && (
                <WagesSettingsSection
                  wageDefault={wageDefault}
                  setWageDefault={setWageDefault}
                />
              )}

              {activeSection === "dunning" && (
                <DunningSettingsSection
                  dunningAgingDays={dunningAgingDays}
                  setDunningAgingDays={setDunningAgingDays}
                  dunningEnabled={dunningEnabled}
                  setDunningEnabled={setDunningEnabled}
                />
              )}

              {activeSection === "billing" && (
                <BillingSettingsSection
                  billingPolicy={billingPolicy}
                  setBillingPolicy={setBillingPolicy}
                  guards={guards}
                  setGuards={setGuards}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
