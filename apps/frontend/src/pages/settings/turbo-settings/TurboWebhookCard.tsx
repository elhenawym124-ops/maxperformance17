import React from "react";
import { KeyIcon, LinkIcon } from "@heroicons/react/24/outline";

interface TurboWebhookCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
  webhookUrl: string;
  webhookToken: string;
  onChangeWebhookUrl: (url: string) => void;
  onChangeWebhookToken: (token: string) => void;
}

export const TurboWebhookCard: React.FC<TurboWebhookCardProps> = ({
  t,
  webhookUrl,
  webhookToken,
  onChangeWebhookUrl,
  onChangeWebhookToken,
}) => {
  return (
    <>
      <div className="border-t dark:border-border pt-6">
        <div className="flex items-center mb-4">
          <LinkIcon className="h-5 w-5 text-primary ms-2" />
          <h3 className="text-lg font-medium text-foreground">
            {t("turbo.k_35")}
          </h3>
        </div>

        <div className="space-y-2">
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => onChangeWebhookUrl(e.target.value)}
            placeholder="https://maxp.online/api/v1/turbo-webhook/webhook"
            className="w-full px-4 py-2 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-primary focus:border-primary dark:focus:border-primary"
          />
          <p className="text-xs text-muted-foreground">
            {t("turbo.k_36")}
          </p>
          <p className="text-xs text-muted-foreground/80">
            {t("turbo.k_37")}{" "}
            {typeof window !== "undefined" ? window.location.origin : ""}
            /api/v1/turbo-webhook/webhook
          </p>
        </div>
      </div>

      <div className="border-t dark:border-border pt-6">
        <div className="flex items-center mb-4">
          <KeyIcon className="h-5 w-5 text-primary ms-2" />
          <h3 className="text-lg font-medium text-foreground">
            {t("turbo.k_38")}
          </h3>
        </div>

        <div className="space-y-2">
          <input
            type="password"
            value={webhookToken}
            onChange={(e) => onChangeWebhookToken(e.target.value)}
            placeholder="Bearer Token"
            className="w-full px-4 py-2 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-primary focus:border-primary dark:focus:border-primary"
          />
          <p className="text-xs text-muted-foreground">
            {t("turbo.k_39")}
          </p>
          <p className="text-xs text-muted-foreground/80">
            {t("turbo.k_40")}
          </p>
        </div>
      </div>
    </>
  );
};
