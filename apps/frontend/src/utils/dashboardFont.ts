export type DashboardFontFamily =
  | "cairo"
  | "ibm-plex-sans-arabic"
  | "tajawal"
  | "almarai"
  | "noto-sans-arabic"
  | "noto-kufi-arabic"
  | "rubik"
  | "readex-pro"
  | "alexandria"
  | "changa"
  | "amiri"
  | "inter"
  | "roboto"
  | "plus-jakarta-sans"
  | "geist"
  | "poppins"
  | "dm-sans"
  | "open-sans"
  | "manrope"
  | "outfit"
  | "nunito";

export interface DashboardFontOption {
  id: DashboardFontFamily;
  label: string;
  cssStack: string;
  googleFontsUrl: string | null;
  group: "ar" | "en";
}

const gf = (familyQuery: string) =>
  `https://fonts.googleapis.com/css2?family=${familyQuery}&display=swap`;

/**
 * Ordered from most used to least used in 2026 within each language group.
 */
export const DASHBOARD_FONT_OPTIONS: DashboardFontOption[] = [
  // Arabic fonts (2026 popularity: most -> least)
  {
    id: "cairo",
    label: "Cairo (كايرو)",
    cssStack: "'Cairo', system-ui, sans-serif",
    googleFontsUrl: gf("Cairo:wght@400;500;600;700"),
    group: "ar",
  },
  {
    id: "ibm-plex-sans-arabic",
    label: "IBM Plex Sans Arabic (الافتراضي)",
    cssStack: "'IBM Plex Sans Arabic', system-ui, sans-serif",
    googleFontsUrl: null,
    group: "ar",
  },
  {
    id: "tajawal",
    label: "Tajawal (تجوال)",
    cssStack: "'Tajawal', system-ui, sans-serif",
    googleFontsUrl: gf("Tajawal:wght@400;500;700"),
    group: "ar",
  },
  {
    id: "almarai",
    label: "Almarai (المراعي)",
    cssStack: "'Almarai', system-ui, sans-serif",
    googleFontsUrl: gf("Almarai:wght@400;700"),
    group: "ar",
  },
  {
    id: "noto-sans-arabic",
    label: "Noto Sans Arabic",
    cssStack: "'Noto Sans Arabic', system-ui, sans-serif",
    googleFontsUrl: gf("Noto+Sans+Arabic:wght@400;500;600;700"),
    group: "ar",
  },
  {
    id: "noto-kufi-arabic",
    label: "Noto Kufi Arabic",
    cssStack: "'Noto Kufi Arabic', system-ui, sans-serif",
    googleFontsUrl: gf("Noto+Kufi+Arabic:wght@400;600;700"),
    group: "ar",
  },
  {
    id: "rubik",
    label: "Rubik (روبيك)",
    cssStack: "'Rubik', system-ui, sans-serif",
    googleFontsUrl: gf("Rubik:wght@400;500;600;700"),
    group: "ar",
  },
  {
    id: "readex-pro",
    label: "Readex Pro",
    cssStack: "'Readex Pro', system-ui, sans-serif",
    googleFontsUrl: gf("Readex+Pro:wght@400;500;600;700"),
    group: "ar",
  },
  {
    id: "alexandria",
    label: "Alexandria (الإسكندرية)",
    cssStack: "'Alexandria', system-ui, sans-serif",
    googleFontsUrl: gf("Alexandria:wght@400;500;600;700"),
    group: "ar",
  },
  {
    id: "changa",
    label: "Changa (تشانجا)",
    cssStack: "'Changa', system-ui, sans-serif",
    googleFontsUrl: gf("Changa:wght@400;500;600;700"),
    group: "ar",
  },
  {
    id: "amiri",
    label: "Amiri (أميري)",
    cssStack: "'Amiri', Georgia, serif",
    googleFontsUrl: gf("Amiri:wght@400;700"),
    group: "ar",
  },

  // English / Latin fonts (2026 popularity: most -> least)
  {
    id: "inter",
    label: "Inter",
    cssStack: "'Inter', system-ui, sans-serif",
    googleFontsUrl: gf("Inter:wght@400;500;600;700"),
    group: "en",
  },
  {
    id: "roboto",
    label: "Roboto",
    cssStack: "'Roboto', system-ui, sans-serif",
    googleFontsUrl: gf("Roboto:wght@400;500;700"),
    group: "en",
  },
  {
    id: "plus-jakarta-sans",
    label: "Plus Jakarta Sans",
    cssStack: "'Plus Jakarta Sans', system-ui, sans-serif",
    googleFontsUrl: gf("Plus+Jakarta+Sans:wght@400;500;600;700"),
    group: "en",
  },
  {
    id: "geist",
    label: "Geist",
    cssStack: "'Geist Variable', system-ui, sans-serif",
    googleFontsUrl: null,
    group: "en",
  },
  {
    id: "poppins",
    label: "Poppins",
    cssStack: "'Poppins', system-ui, sans-serif",
    googleFontsUrl: gf("Poppins:wght@400;500;600;700"),
    group: "en",
  },
  {
    id: "dm-sans",
    label: "DM Sans",
    cssStack: "'DM Sans', system-ui, sans-serif",
    googleFontsUrl: gf("DM+Sans:wght@400;500;700"),
    group: "en",
  },
  {
    id: "open-sans",
    label: "Open Sans",
    cssStack: "'Open Sans', system-ui, sans-serif",
    googleFontsUrl: gf("Open+Sans:wght@400;500;600;700"),
    group: "en",
  },
  {
    id: "manrope",
    label: "Manrope",
    cssStack: "'Manrope', system-ui, sans-serif",
    googleFontsUrl: gf("Manrope:wght@400;500;600;700"),
    group: "en",
  },
  {
    id: "outfit",
    label: "Outfit",
    cssStack: "'Outfit', system-ui, sans-serif",
    googleFontsUrl: gf("Outfit:wght@400;500;600;700"),
    group: "en",
  },
  {
    id: "nunito",
    label: "Nunito",
    cssStack: "'Nunito', system-ui, sans-serif",
    googleFontsUrl: gf("Nunito:wght@400;600;700"),
    group: "en",
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
