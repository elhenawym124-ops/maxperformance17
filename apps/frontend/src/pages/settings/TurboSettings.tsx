import React from "react";
import {
  TurboApiKeyCard,
  TurboAiAreaCard,
  TurboAutoCreateCard,
  TurboClientCodeCard,
  TurboInfoSection,
  TurboSaveBar,
  TurboSenderNumberCard,
  TurboSettingsHeader,
  TurboStatusCard,
  TurboWebhookCard,
  useTurboSettingsController,
} from "./turbo-settings";

const TurboSettings: React.FC = () => {
  const {
    t,
    navigate,
    loading,
    saving,
    showApiKey,
    setShowApiKey,
    settings,
    setSettings,
    handleSave,
    handleTestConnection,
  } = useTurboSettingsController();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 dark:bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary dark:border-primary mx-auto"></div>
          <p className="mt-4 text-foreground dark:text-muted-foreground">
            {t("turbo.k_23")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 dark:bg-muted min-h-screen">
      <TurboSettingsHeader
        t={t}
        onNavigateShippingCompanies={() => navigate("/shipping-companies")}
        onNavigateStoreSettings={() => navigate("/store-settings")}
        onNavigateStatusMapping={() => navigate("/settings/turbo/status-mapping")}
      />

      <div className="bg-card shadow rounded-lg p-6 space-y-6 border border-border dark:border-border">
        <TurboStatusCard
          t={t}
          enabled={settings.turboEnabled}
          onToggle={(checked) => setSettings((prev) => ({ ...prev, turboEnabled: checked }))}
        />

        <TurboApiKeyCard
          t={t}
          hasApiKey={settings.hasApiKey}
          maskedApiKey={settings.maskedApiKey}
          showApiKey={showApiKey}
          apiKey={settings.turboApiKey}
          saving={saving}
          onToggleShowApiKey={() => setShowApiKey(!showApiKey)}
          onChangeApiKey={(key) => setSettings((prev) => ({ ...prev, turboApiKey: key }))}
          onTestConnection={handleTestConnection}
        />

        <TurboClientCodeCard
          t={t}
          clientCode={settings.turboMainClientCode}
          onChangeClientCode={(code) => setSettings((prev) => ({ ...prev, turboMainClientCode: code }))}
        />

        <TurboSenderNumberCard
          t={t}
          senderNumber={settings.turboSenderNumber}
          onChangeSenderNumber={(number) => setSettings((prev) => ({ ...prev, turboSenderNumber: number }))}
        />

        <TurboAutoCreateCard
          t={t}
          enabled={settings.turboEnabled}
          autoCreate={settings.turboAutoCreate}
          onToggleAutoCreate={(checked) => setSettings((prev) => ({ ...prev, turboAutoCreate: checked }))}
        />

        <TurboAiAreaCard
          enabled={settings.turboEnabled}
          aiAreaEnabled={settings.turboAiAreaResolverEnabled}
          aiAreaOnCreate={settings.turboAiAreaResolverOnCreate}
          onToggleAiArea={(checked) => setSettings((prev) => ({ ...prev, turboAiAreaResolverEnabled: checked }))}
          onToggleAiAreaOnCreate={(checked) => setSettings((prev) => ({ ...prev, turboAiAreaResolverOnCreate: checked }))}
        />

        <TurboWebhookCard
          t={t}
          webhookUrl={settings.turboWebhookUrl}
          webhookToken={settings.turboWebhookToken}
          onChangeWebhookUrl={(url) => setSettings((prev) => ({ ...prev, turboWebhookUrl: url }))}
          onChangeWebhookToken={(token) => setSettings((prev) => ({ ...prev, turboWebhookToken: token }))}
        />

        <TurboInfoSection t={t} />

        <TurboSaveBar
          t={t}
          saving={saving}
          disabled={settings.turboEnabled && !settings.turboApiKey && !settings.hasApiKey}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default TurboSettings;
