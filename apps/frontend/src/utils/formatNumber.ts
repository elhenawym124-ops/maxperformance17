import i18n from "i18next";

export interface FormatNumberOptions {
  /**
   * Locale override (e.g., 'ar-EG', 'en-US').
   * If omitted, defaults to the active i18n / document locale.
   */
  locale?: string;
  /**
   * Minimum number of fraction digits (0-20).
   */
  minimumFractionDigits?: number;
  /**
   * Maximum number of fraction digits (0-20).
   */
  maximumFractionDigits?: number;
  /**
   * Whether to display grouping separators (thousands commas).
   * Default: true.
   */
  useGrouping?: boolean;
  /**
   * Value returned when input is null, undefined, or invalid NaN.
   * Default: "0".
   */
  fallback?: string;
}

export interface FormatPercentOptions extends FormatNumberOptions {
  /**
   * Whether to clamp the value between min and max (defaults to 0-100).
   * Default: true.
   */
  clamp?: boolean;
  /**
   * Minimum allowed percentage value when clamp is enabled. Default: 0.
   */
  min?: number;
  /**
   * Maximum allowed percentage value when clamp is enabled. Default: 100.
   */
  max?: number;
}

/**
 * Returns true if the given or active locale is English.
 */
export const isEnglishLocale = (locale?: string): boolean => {
  if (locale) {
    return locale.toLowerCase().startsWith("en");
  }
  if (typeof document !== "undefined" && document.documentElement?.lang) {
    if (document.documentElement.lang.toLowerCase().startsWith("en")) {
      return true;
    }
  }
  if (i18n?.language) {
    return i18n.language.toLowerCase().startsWith("en");
  }
  return false;
};

/**
 * Resolve standard application locale ('ar-EG' or 'en-US').
 */
export const resolveAppLocale = (locale?: string): string => {
  if (locale) return locale;
  return isEnglishLocale() ? "en-US" : "ar-EG";
};

/**
 * Clamp a number between a minimum and maximum value.
 */
export const clamp = (value: number, min: number, max: number): number => {
  if (isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
};

/**
 * Safely parse and clamp a percentage value between [min, max] (default: [0, 100]).
 */
export const clampPercent = (
  value: number | string | null | undefined,
  min = 0,
  max = 100,
): number => {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return min;
  return clamp(numeric, min, max);
};

/**
 * Formats a number with locale-aware grouping and decimals.
 * Supports both options object and passing maximumFractionDigits as a number for ease of use.
 *
 * @example
 * formatNumber(1234567) // "١٬٢٣٤٬٥٦٧" (ar) or "1,234,567" (en)
 * formatNumber(1234.56, 1) // "١٬٢٣٤٫٦" (ar) or "1,234.6" (en)
 * formatNumber(1234.56, { maximumFractionDigits: 1, locale: "en-US" }) // "1,234.6"
 */
export const formatNumber = (
  value: number | string | null | undefined,
  optionsOrDigits?: FormatNumberOptions | number,
): string => {
  const options: FormatNumberOptions =
    typeof optionsOrDigits === "number"
      ? { maximumFractionDigits: optionsOrDigits }
      : optionsOrDigits || {};

  const { fallback = "0", locale, useGrouping = true } = options;

  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  const resolvedLocale = resolveAppLocale(locale);
  const minDigits = options.minimumFractionDigits;
  const maxDigits = options.maximumFractionDigits;

  const intlOptions: Intl.NumberFormatOptions = {
    useGrouping,
    ...(minDigits !== undefined ? { minimumFractionDigits: Math.max(0, minDigits) } : {}),
    ...(maxDigits !== undefined ? { maximumFractionDigits: Math.max(0, maxDigits) } : {}),
  };

  try {
    return new Intl.NumberFormat(resolvedLocale, intlOptions).format(numeric);
  } catch (err) {
    console.warn("[formatNumber] Failed with locale, falling back to basic:", err);
    return numeric.toString();
  }
};

/**
 * Format a percentage with optional clamp protection (defaults to 0-100%).
 *
 * @example
 * formatPercent(85.4) // "85.4%" or "٨٥٫٤%"
 * formatPercent(120) // "100%" or "١٠٠%" (clamped)
 * formatPercent(120, { clamp: false }) // "120%"
 */
export const formatPercent = (
  value: number | string | null | undefined,
  optionsOrDigits?: FormatPercentOptions | number,
): string => {
  const options: FormatPercentOptions =
    typeof optionsOrDigits === "number"
      ? { maximumFractionDigits: optionsOrDigits }
      : optionsOrDigits || {};

  const shouldClamp = options.clamp !== false;
  const min = options.min ?? 0;
  const max = options.max ?? 100;

  const numeric = typeof value === "number" ? value : Number(value);
  const safeValue = shouldClamp
    ? clampPercent(numeric, min, max)
    : Number.isFinite(numeric)
      ? numeric
      : 0;

  return `${formatNumber(safeValue, options)}%`;
};

export default formatNumber;
