import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { CheckIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useAuth } from "../../../hooks/useAuthSimple";
import { botAutomationService, type BotAutomationSettings } from "../../../services/botAutomationService";

const defaults: BotAutomationSettings = {
  welcomeEnabled: false,
  welcomeMessage: "",
  defaultReplyEnabled: false,
  defaultReply: "",
  channels: ["WHATSAPP", "FACEBOOK"],
  widgetEnabled: false,
  widgetColor: "#4f46e5",
};

const WidgetTab: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<BotAutomationSettings>(defaults);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await botAutomationService.getSettings();
      setSettings({ ...defaults, ...(data || {}) });
    } catch (e) {
      toast.error(String(t("botStudio.loadFailed")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    try {
      setSaving(true);
      await botAutomationService.saveSettings({
        widgetEnabled: settings.widgetEnabled,
        widgetColor: settings.widgetColor,
      });
      toast.success(String(t("botStudio.saved")));
      load();
    } catch (e) {
      toast.error(String(t("botStudio.saveFailed")));
    } finally {
      setSaving(false);
    }
  };

  const snippet = () =>
    `<iframe src="${window.location.origin}/bot-widget/${user?.companyId || ""}" style="position:fixed;bottom:24px;left:24px;border:0;z-index:99999;width:64px;height:64px;border-radius:9999px;box-shadow:0 6px 20px rgba(0,0,0,.2);" loading="lazy" title="chat widget"></iframe>`;

  const copySnippet = () => {
    navigator.clipboard?.writeText(snippet()).then(
      () => toast.success(String(t("botStudio.linkCopied"))),
      () => toast.error(String(t("botStudio.saveFailed")))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary dark:border-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-card rounded-xl shadow-sm border border-border dark:border-border p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-primary dark:bg-primary">
              <DocumentDuplicateIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t("botStudio.widgetTitle")}</h3>
              <p className="text-sm text-foreground dark:text-muted-foreground">{t("botStudio.widgetDesc")}</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0" dir="ltr">
            <input
              type="checkbox"
              checked={settings.widgetEnabled}
              onChange={(e) => setSettings({ ...settings, widgetEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-muted dark:bg-muted peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:bg-indigo-600 dark:peer-checked:bg-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
          </label>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{t("botStudio.widgetColor")}</label>
            <input
              type="color"
              value={settings.widgetColor}
              onChange={(e) => setSettings({ ...settings, widgetColor: e.target.value })}
              className="h-9 w-16 rounded border border-border cursor-pointer bg-card"
            />
          </div>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-medium text-foreground mb-2">{t("botStudio.widgetPreview")}</label>
          <div className="relative border border-dashed border-border rounded-xl h-40 flex items-center justify-center bg-muted dark:bg-muted">
            <div className="flex flex-col gap-2">
              {settings.channels.includes("WHATSAPP") && (
                <span className="px-3 py-1.5 rounded-full text-xs text-white" style={{ backgroundColor: "#25D366" }}>
                  WhatsApp
                </span>
              )}
              {settings.channels.includes("FACEBOOK") && (
                <span className="px-3 py-1.5 rounded-full text-xs text-white" style={{ backgroundColor: "#1877F2" }}>
                  Messenger
                </span>
              )}
              {settings.channels.length === 0 && (
                <span className="text-xs text-muted-foreground">{t("botStudio.widgetNoChannels")}</span>
              )}
            </div>
            <span
              className="absolute bottom-2 left-2 h-14 w-14 rounded-full flex items-center justify-center text-white text-2xl"
              style={{ backgroundColor: settings.widgetColor }}
            >
              💬
            </span>
          </div>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-medium text-foreground mb-2">{t("botStudio.widgetEmbed")}</label>
          <div className="flex gap-2">
            <code className="flex-1 truncate text-xs bg-muted px-3 py-2 rounded-lg overflow-x-auto">
              {snippet()}
            </code>
            <button
              onClick={copySnippet}
              className="flex items-center gap-1 px-3 py-2 bg-muted dark:bg-muted text-foreground rounded-lg text-sm hover:bg-muted dark:hover:bg-muted"
            >
              <CheckIcon className="h-4 w-4" /> {t("botStudio.copy")}
            </button>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1 px-6 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
          >
            <CheckIcon className="h-4 w-4" /> {saving ? t("botStudio.saving") : t("botStudio.save")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetTab;
