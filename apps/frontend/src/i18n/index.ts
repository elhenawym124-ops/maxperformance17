import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ar from "../locales/ar/translation.json";
import { getBackendUrl, isProduction } from "../config/environment";

let enPromise: Promise<void> | null = null;
export const loadEnglishTranslations = async (): Promise<void> => {
  if (i18n.hasResourceBundle("en", "translation")) return;
  if (!enPromise) {
    enPromise = import("../locales/en/translation.json")
      .then((mod) => {
        const messages = (mod as { default?: Record<string, unknown> }).default || mod;
        i18n.addResourceBundle("en", "translation", messages, true, true);
      })
      .catch((err) => {
        enPromise = null;
        console.warn("[i18n] Failed to load English translations dynamically:", err);
      });
  }
  return enPromise;
};

// قائمة الدول العربية
const ARABIC_COUNTRIES = [
  "EG", // مصر
  "SA", // السعودية
  "AE", // الإمارات
  "KW", // الكويت
  "QA", // قطر
  "BH", // البحرين
  "OM", // عمان
  "JO", // الأردن
  "LB", // لبنان
  "SY", // سوريا
  "IQ", // العراق
  "YE", // اليمن
  "PS", // فلسطين
  "LY", // ليبيا
  "TN", // تونس
  "DZ", // الجزائر
  "MA", // المغرب
  "SD", // السودان
  "SO", // الصومال
  "DJ", // جيبوتي
  "KM", // جزر القمر
  "MR", // موريتانيا
];

// دالة للكشف عن الدولة من خلال IP
const detectCountryByIP = async (): Promise<string | null> => {
  if (!isProduction()) {
    return null;
  }

  try {
    // Prefer backend endpoint to avoid leaking user IP/location to third-party services from the browser
    const response = await fetch(`${getBackendUrl()}/api/geolocation/detect`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result?.data?.countryCode || null;
  } catch (error) {
    return null;
  }
};

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {}
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {}
  },
};

// دالة لتحديد اللغة بناءً على الدولة
const getLanguageByCountry = async (): Promise<string> => {
  // أولاً، تحقق من اللغة المحفوظة في localStorage
  const savedLanguage = safeLocalStorage.getItem("language");
  if (savedLanguage) {
    return savedLanguage;
  }

  // إذا لم تكن هناك لغة محفوظة، اكتشف الدولة
  const countryCode = await detectCountryByIP();

  if (countryCode && ARABIC_COUNTRIES.includes(countryCode)) {
    return "ar";
  }

  return "en";
};

// إعداد i18n - تهيئة متزامنة أولية
const getUrlLanguage = (): string | null => {
  try {
    const params = new URLSearchParams(window.location.search);
    const candidate = params.get("lang") || params.get("lng");
    return candidate === "ar" || candidate === "en" ? candidate : null;
  } catch {
    return null;
  }
};

const urlLanguage = getUrlLanguage();
if (urlLanguage) {
  safeLocalStorage.setItem("language", urlLanguage);
}

const savedLanguage = urlLanguage || safeLocalStorage.getItem("language");
const initialLanguage = savedLanguage || "ar";

// Ensure localStorage is set BEFORE detector runs so it never falls through to navigator.language
safeLocalStorage.setItem("language", initialLanguage);
safeLocalStorage.setItem("i18nextLng", initialLanguage);

// تهيئة i18n متزامنة أولية (لضمان جاهزية الترجمات عند التحميل الأول)
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
    },
    lng: initialLanguage,
    fallbackLng: "ar",
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "language",
    },
  });

if (initialLanguage === "en") {
  void loadEnglishTranslations().then(() => {
    void i18n.changeLanguage("en");
  });
}

// تطبيق اتجاه النص
if (typeof document !== "undefined" && document.documentElement) {
  document.documentElement.dir = initialLanguage === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = initialLanguage;
}

// إذا لم تكن هناك لغة محفوظة، اكتشف الدولة بعد ما الصفحة تبقى interactive
// (مش في الـ import time عشان متعملش block للـ first paint)
if (!savedLanguage) {
  const runDetection = () => {
    getLanguageByCountry().then((detectedLanguage) => {
      if (detectedLanguage !== initialLanguage) {
        void (async () => {
          if (detectedLanguage === "en") {
            await loadEnglishTranslations();
          }
          await i18n.changeLanguage(detectedLanguage);
          safeLocalStorage.setItem("language", detectedLanguage);
          safeLocalStorage.setItem("i18nextLng", detectedLanguage);
          document.documentElement.dir = detectedLanguage === "ar" ? "rtl" : "ltr";
          document.documentElement.lang = detectedLanguage;
        })();
      }
    });
  };
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(runDetection, { timeout: 5000 });
  } else {
    setTimeout(runDetection, 2000);
  }
}

// دالة للحصول على اتجاه النص
export const getDirection = () => {
  return i18n.language === "ar" ? "rtl" : "ltr";
};

// دالة لتغيير اللغة
export const changeLanguage = async (language: string) => {
  if (language === "en") {
    await loadEnglishTranslations();
  }
  await i18n.changeLanguage(language);
  safeLocalStorage.setItem("language", language);
  safeLocalStorage.setItem("i18nextLng", language);
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = language;
  // إعادة تحميل الصفحة لتطبيق التغييرات على جميع المكونات
  window.location.reload();
};

export const toggleLanguage = async () => {
  const currentLang = i18n.language;
  const newLang = currentLang === "ar" ? "en" : "ar";
  await changeLanguage(newLang);
  return newLang;
};

export default i18n;
