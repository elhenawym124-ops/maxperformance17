export interface TurboSettingsData {
  turboEnabled: boolean;
  turboAutoCreate: boolean;
  turboAiAreaResolverEnabled: boolean;
  turboApiKey: string;
  turboMainClientCode: number | null;
  turboSenderNumber: string;
  turboWebhookUrl: string;
  turboWebhookToken: string;
  hasApiKey: boolean;
  maskedApiKey: string;
}

export const defaultTurboSettings = (): TurboSettingsData => ({
  turboEnabled: false,
  turboAutoCreate: false,
  turboAiAreaResolverEnabled: true,
  turboApiKey: "",
  turboMainClientCode: null,
  turboSenderNumber: "",
  turboWebhookUrl: "",
  turboWebhookToken: "",
  hasApiKey: false,
  maskedApiKey: "",
});
