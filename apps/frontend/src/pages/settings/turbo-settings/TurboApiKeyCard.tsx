import React from "react";
import { InformationCircleIcon, KeyIcon } from "@heroicons/react/24/outline";

interface TurboApiKeyCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
  hasApiKey: boolean;
  maskedApiKey: string;
  showApiKey: boolean;
  apiKey: string;
  saving: boolean;
  onToggleShowApiKey: () => void;
  onChangeApiKey: (key: string) => void;
  onTestConnection: () => void;
}

export const TurboApiKeyCard: React.FC<TurboApiKeyCardProps> = ({
  t,
  hasApiKey,
  maskedApiKey,
  showApiKey,
  apiKey,
  saving,
  onToggleShowApiKey,
  onChangeApiKey,
  onTestConnection,
}) => {
  return (
    <div className="border-t dark:border-border pt-6">
      <div className="flex items-center mb-4">
        <KeyIcon className="h-5 w-5 text-primary ms-2" />
        <h3 className="text-lg font-medium text-foreground">
          Turbo API Key
        </h3>
      </div>

      <div className="space-y-4">
        {hasApiKey && maskedApiKey && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-foreground mb-2">
              {t("turbo.k_27")}
            </p>
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded tabular-nums">
                {maskedApiKey}
              </code>
              <button
                type="button"
                onClick={onToggleShowApiKey}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                {showApiKey ? t("turbo.k_14") : t("turbo.k_15")}
              </button>
            </div>
          </div>
        )}

        {(showApiKey || !hasApiKey) && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {hasApiKey ? t("turbo.k_16") : "Turbo API Key"}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => onChangeApiKey(e.target.value)}
              placeholder={t("turbo.k_17")}
              className="w-full px-4 py-2 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-primary focus:border-primary dark:focus:border-primary"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {t("turbo.k_28")}{" "}
              <a
                href="https://portal.turbo-eg.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {t("turbo.k_29")}
              </a>
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={onTestConnection}
          disabled={saving || (!apiKey && !hasApiKey)}
          className="inline-flex items-center px-4 py-2 bg-muted dark:bg-muted text-white rounded-lg hover:bg-muted dark:hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
        >
          <InformationCircleIcon className="h-4 w-4 ms-1" />
          {t("turbo.k_30")}
        </button>
      </div>
    </div>
  );
};
