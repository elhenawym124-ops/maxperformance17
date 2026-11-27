export type DashboardFontFamily =
  | "ibm-plex-sans-arabic"
  | "cairo"
  | "tajawal"
  | "noto-kufi-arabic"
  | "inter"
  | "geist";

export interface DashboardFontOption {
  id: DashboardFontFamily;
  label: string;
  labelEn: string;
  cssStack: string;
  googleFontsUrl: string | null;
  arabic: boolean;
}

export const DASHBOARD_FONT_OPTIONS: DashboardFontOption[] = [
  {
    id: "ibm-plex-sans-arabic",
    label: "IBM Plex Sans Arabic",
    labelEn: "IBM Plex Sans Arabic",
    cssStack: "'IBM Plex Sans Arabic', system-ui, sans-serif",
    googleFontsUrl: null,
    arabic: true,
  },
  {
    id: "cairo",
    label: "Cairo",
    labelEn: "Cairo",
    cssStack: "'Cairo', system-ui, sans-serif",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap",
    arabic: true,
  },
  {
    id: "tajawal",
    label: "Tajawal",
    labelEn: "Tajawal",
    cssStack: "'Tajawal', system-ui, sans-serif",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap",
    arabic: true,
  },
  {
    id: "noto-kufi-arabic",
    label: "Noto Kufi Arabic",
    labelEn: "Noto Kufi Arabic",
    cssStack: "'Noto Kufi Arabic', system-ui, sans-serif",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;600;700&display=swap",
    arabic: true,
  },
  {
    id: "inter",
    label: "Inter",
    labelEn: "Inter",
    cssStack: "'Inter', system-ui, sans-serif",
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
    arabic: false,
  },
  {
    id: "geist",
    label: "Geist",
    labelEn: "Geist",
    cssStack: "'Geist Variable', system-ui, sans-serif",
    googleFontsUrl: null,
    arabic: false,
  },
];

export const DEFAULT_DASHBOARD_FONT: DashboardFontFamily = "ibm-plex-sans-arabic";
export const DASHBOARD_FONT_STORAGE_KEY = "maxp-dashboard-font";

/** Inject a Google Fonts stylesheet into <head> if not already present. */
export const ensureGoogleFont = (
  fontId: DashboardFontFamily,
  url: string | null,
): void => {
  if (!url || typeof document === "undefined") return;
  const id = `gf-dashboard-${fontId}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);
};

export const getStoredDashboardFont = (): DashboardFontFamily => {
  if (typeof window === "undefined") return DEFAULT_DASHBOARD_FONT;
  try {
    const stored = window.localStorage?.getItem?.(DASHBOARD_FONT_STORAGE_KEY);
    if (stored && DASHBOARD_FONT_OPTIONS.some((f) => f.id === stored)) {
      return stored as DashboardFontFamily;
    }
  } catch {
    // Ignore storage access errors in restricted environments
  }
  return DEFAULT_DASHBOARD_FONT;
};

export const setStoredDashboardFont = (fontId: DashboardFontFamily): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage?.setItem?.(DASHBOARD_FONT_STORAGE_KEY, fontId);
  } catch {
    // Ignore storage access errors in restricted environments
  }
};

/** Apply the chosen dashboard font to document root CSS variables. */
export const applyDashboardFont = (fontId: DashboardFontFamily): void => {
  if (typeof document === "undefined") return;
  const option = DASHBOARD_FONT_OPTIONS.find((f) => f.id === fontId);
  if (!option) return;
  ensureGoogleFont(option.id, option.googleFontsUrl);
  const root = document.documentElement;
  if (fontId === DEFAULT_DASHBOARD_FONT) {
    root.style.removeProperty("--dashboard-font-sans");
    root.style.removeProperty("--font-sans");
    root.style.removeProperty("--font-heading");
    root.removeAttribute("data-dashboard-font");
    return;
  }
  root.setAttribute("data-dashboard-font", fontId);
  root.style.setProperty("--dashboard-font-sans", option.cssStack);
  root.style.setProperty("--font-sans", option.cssStack);
  root.style.setProperty("--font-heading", option.cssStack);
};

export const initDashboardFont = (): void => {
  applyDashboardFont(getStoredDashboardFont());
};
