export const APP_SETTINGS_SLUGS = [
  "internal-courier-fleet",
  "conversion-suite",
  "ugc-reviews-pro",
  "commerce-advanced",
  "upsell-center",
] as const;

export type AppSettingsSlug = (typeof APP_SETTINGS_SLUGS)[number];

export function supportsAppSettings(slug?: string | null, appRecord?: any): boolean {
  if (!slug) return false;
  if ((APP_SETTINGS_SLUGS as readonly string[]).includes(slug)) return true;
  // If app has a settingsSchema defined in its manifest or database record, settings are automatically generated
  if (appRecord?.app?.settingsSchema || appRecord?.settingsSchema) return true;
  return false;
}
