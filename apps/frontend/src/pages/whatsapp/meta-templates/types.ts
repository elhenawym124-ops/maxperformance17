import React from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Megaphone,
  Shield,
  Wrench,
  XCircle,
} from "lucide-react";

export interface MetaComponent {
  type: string;
  format?: string;
  text?: string;
  buttons?: { type: string; text: string; url?: string }[];
  example?: { header_handle?: string[]; header_text?: string[]; body_text?: string[][] };
}

export interface MetaTemplate {
  name: string;
  status: string;
  category: string;
  language: string;
  id?: string;
  rejected_reason?: string;
  components?: MetaComponent[];
}

export interface TemplateHistoryEntry {
  action: "created" | "edited" | "deleted";
  name: string;
  language: string;
  timestamp: number;
  category?: string;
}

export const statusBadge: Record<string, string> = {
  APPROVED:
    "border-emerald-300/70 bg-success/10 text-success dark:border-success/40 dark:bg-success/[0.08] dark:text-success",
  PENDING:
    "border-amber-300/70 bg-warning/10 text-warning dark:border-warning/40 dark:bg-warning/[0.08] dark:text-warning",
  REJECTED:
    "border-red-300/70 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/[0.08] dark:text-destructive",
  DISABLED:
    "border-slate-300/70 bg-muted text-foreground dark:border-border dark:bg-muted/[0.08] dark:text-muted-foreground",
  PAUSED:
    "border-blue-300/70 bg-blue-500/10 text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/[0.08] dark:text-blue-200",
};

export const statusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  APPROVED: CheckCircle,
  PENDING: Clock,
  REJECTED: XCircle,
  DISABLED: XCircle,
  PAUSED: AlertTriangle,
};

export const CATEGORIES = ["MARKETING", "UTILITY", "AUTHENTICATION"] as const;

export const CATEGORY_STYLE: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
    badge: string;
    sectionBg: string;
  }
> = {
  AUTHENTICATION: {
    icon: Shield,
    gradient: "from-violet-600 to-primary dark:from-primary dark:to-primary",
    badge:
      "border-violet-200 bg-primary/10 text-primary dark:border-primary dark:bg-primary/30 dark:text-primary",
    sectionBg:
      "bg-gradient-to-b from-primary/50 to-transparent dark:from-primary/20",
  },
  MARKETING: {
    icon: Megaphone,
    gradient: "from-rose-600 to-primary dark:from-destructive dark:to-primary",
    badge:
      "border-rose-200 bg-destructive/10 text-destructive dark:border-destructive dark:bg-destructive/30 dark:text-destructive",
    sectionBg:
      "bg-gradient-to-b from-destructive/50 to-transparent dark:from-destructive/20",
  },
  UTILITY: {
    icon: Wrench,
    gradient: "from-blue-600 to-info dark:from-blue-400 dark:to-info",
    badge:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300",
    sectionBg:
      "bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-950/20",
  },
};

export function sanitizeTemplateName(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

export function hasNamedVariables(text: string): boolean {
  const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
  return matches.some((m) => !/^\{\{\d+\}\}$/.test(m));
}

export function isValidButtonUrl(url: string): boolean {
  if (!url) return true;
  return url.startsWith("https://") || url.startsWith("http://");
}

export function extractVariableNumbers(text: string): string[] {
  const matches = text.match(/\{\{(\d+)\}\}/g) || [];
  return [...new Set(matches)].sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, ""), 10);
    const nb = parseInt(b.replace(/\D/g, ""), 10);
    return na - nb;
  });
}

export const PROHIBITED_WORDS = [
  "free money",
  "guaranteed income",
  "cryptocurrency",
  "bitcoin",
  "casino",
  "gambling",
  "lottery",
  "prize",
  "winner",
  "congratulations you won",
  "click here",
  "limited time offer!!",
  "act now!!",
  "exclusive deal!!",
  "discount!!!",
  "buy now!!!",
  "call now",
  "sex",
  "adult",
  "nude",
];

export interface TemplateFormState {
  name: string;
  language: string;
  category: string;
  headerFormat: string;
  headerText: string;
  headerMediaHandle: string;
  headerMediaName: string;
  bodyText: string;
  footerText: string;
  buttonText: string;
  buttonUrl: string;
}

export interface ComplianceResult {
  id: string;
  message: string;
  severity: "error" | "warning";
}

export const COMPLIANCE_RULES: Array<{
  id: string;
  check: (f: TemplateFormState) => boolean;
  message: string;
  severity?: "error" | "warning";
}> = [
  {
    id: "body_required",
    check: (f) => f.category !== "AUTHENTICATION" && !f.bodyText,
    message: "محتوى الرسالة (BODY) مطلوب — لا يمكن ترك الحقل فارغاً",
  },
  {
    id: "header_text_length",
    check: (f) =>
      f.category !== "AUTHENTICATION" &&
      f.headerFormat === "TEXT" &&
      f.headerText.length > 60,
    message: "نص رأس الرسالة (HEADER) يجب ألا يتجاوز 60 حرفاً",
  },
  {
    id: "footer_length",
    check: (f) =>
      f.category !== "AUTHENTICATION" && f.footerText.length > 60,
    message: "نص التذييل (FOOTER) يجب ألا يتجاوز 60 حرفاً",
  },
  {
    id: "footer_vars",
    check: (f) =>
      f.category !== "AUTHENTICATION" && /\{\{.+?\}\}/.test(f.footerText),
    message:
      "Meta يمنع تماماً وجود أي متغيرات في التذييل (FOOTER). استخدم نصاً ثابتاً فقط بدون {{1}} أو أقواس.",
  },
  {
    id: "var_sequential_body",
    check: (f) => {
      if (f.category === "AUTHENTICATION") return false;
      const matches = (f.bodyText.match(/\{\{(\d+)\}\}/g) || []).map((m) =>
        parseInt(m.replace(/\D/g, ""), 10),
      );
      if (matches.length === 0) return false;
      let expected = 1;
      const seen = new Set<number>();
      for (const num of matches) {
        if (!seen.has(num)) {
          if (num !== expected) return true;
          seen.add(num);
          expected++;
        }
      }
      return false;
    },
    message:
      "المتغيرات في محتوى الرسالة يجب أن تبدأ بـ {{1}} وتتسلسل تصاعدياً ({{1}}, {{2}}, ...) بدون قفزات أو ترتيب معكوس",
  },
  {
    id: "body_length",
    check: (f) =>
      f.category !== "AUTHENTICATION" && f.bodyText.length > 1024,
    message: "محتوى الرسالة (BODY) يجب ألا يتجاوز 1024 حرفاً",
  },
  {
    id: "named_vars_header",
    check: (f) =>
      f.category !== "AUTHENTICATION" &&
      f.headerFormat === "TEXT" &&
      hasNamedVariables(f.headerText),
    message:
      "Meta لا يقبل أسماء متغيرات في HEADER. استخدم {{1}}, {{2}} بدلاً من {{name}}",
  },
  {
    id: "named_vars_body",
    check: (f) =>
      f.category !== "AUTHENTICATION" && hasNamedVariables(f.bodyText),
    message:
      "Meta لا يقبل أسماء متغيرات في BODY. استخدم {{1}}, {{2}} بدلاً من {{name}}",
  },
  {
    id: "header_media_required",
    check: (f) =>
      f.category !== "AUTHENTICATION" &&
      f.headerFormat !== "TEXT" &&
      !f.headerMediaHandle,
    message:
      "رأس IMAGE/VIDEO/DOCUMENT يتطلب رفع وسيط — ميتا ترفض القالب بدونه (header_handle)",
  },
  {
    id: "button_url_invalid",
    check: (f) =>
      f.category !== "AUTHENTICATION" &&
      f.buttonText.length > 0 &&
      !isValidButtonUrl(f.buttonUrl),
    message:
      "رابط الزر (URL) يجب أن يبدأ بـ https:// — مثال: https://example.com/pay",
  },
  {
    id: "var_start_body",
    check: (f) =>
      f.category !== "AUTHENTICATION" && /^\{\{1\}\}/.test(f.bodyText.trim()),
    message:
      "Meta لا يقبل أن يبدأ محتوى الرسالة (BODY) بمتغير {{1}}. أضف نصاً قبل المتغير.",
    severity: "warning",
  },
  {
    id: "var_end_body",
    check: (f) =>
      f.category !== "AUTHENTICATION" &&
      /\{\{\d+\}\}$/.test(f.bodyText.trim()),
    message:
      "Meta لا يقبل أن ينتهي محتوى الرسالة (BODY) بمتغير. أضف نقطة أو نصاً بعد المتغير.",
    severity: "warning",
  },
  {
    id: "prohibited_words",
    check: (f) => {
      if (f.category === "AUTHENTICATION") return false;
      const allText = [f.headerText, f.bodyText, f.footerText]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return PROHIBITED_WORDS.some((w) => allText.includes(w));
    },
    message:
      "النص يحتوي على كلمات قد تسبب رفض القالب من ميتا (تجنب العبارات التسويقية المبالغ فيها)",
    severity: "warning",
  },
  {
    id: "excessive_punctuation",
    check: (f) => {
      if (f.category === "AUTHENTICATION") return false;
      const allText = [f.headerText, f.bodyText, f.footerText]
        .filter(Boolean)
        .join(" ");
      const exclaimMatch = allText.match(/!{3,}/g);
      const questMatch = allText.match(/\?{3,}/g);
      return Boolean(exclaimMatch?.length || questMatch?.length);
    },
    message:
      "تجنب استخدام علامات الترقيم المتكررة (!!!, ???) — قد تسبب رفض القالب",
    severity: "warning",
  },
  {
    id: "all_caps",
    check: (f) => {
      if (f.category === "AUTHENTICATION") return false;
      const words = f.bodyText.split(/\s+/).filter((w) => w.length > 3);
      const capsWords = words.filter(
        (w) => w === w.toUpperCase() && /[A-Z]/.test(w),
      );
      return capsWords.length > words.length * 0.5;
    },
    message:
      "تجنب استخدام الأحرف الكبيرة (CAPS) في معظم النص — قد يُعتبر SPAM",
    severity: "warning",
  },
];

export function runComplianceCheck(form: TemplateFormState): ComplianceResult[] {
  const results: ComplianceResult[] = [];
  for (const rule of COMPLIANCE_RULES) {
    try {
      if (rule.check(form)) {
        results.push({
          id: rule.id,
          message: rule.message,
          severity: rule.severity || "error",
        });
      }
    } catch {
      // ignore
    }
  }
  return results;
}

export const CREATE_PREFS_KEY = "maxp:whatsapp-meta-templates:create-prefs";

export function loadCreatePrefs(): { language: string; category: string } {
  try {
    const raw = localStorage.getItem(CREATE_PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        language: ["en", "ar", "fr", "tr", "ur"].includes(parsed.language)
          ? parsed.language
          : "ar",
        category: ["UTILITY", "MARKETING", "AUTHENTICATION"].includes(
          parsed.category,
        )
          ? parsed.category
          : "UTILITY",
      };
    }
  } catch {
    /* ignore storage errors */
  }
  return { language: "ar", category: "UTILITY" };
}

export function saveCreatePrefs(patch: { language?: string; category?: string }) {
  try {
    localStorage.setItem(
      CREATE_PREFS_KEY,
      JSON.stringify({ ...loadCreatePrefs(), ...patch }),
    );
  } catch {
    /* ignore storage errors */
  }
}

export const initialForm: TemplateFormState = {
  name: "",
  language: loadCreatePrefs().language,
  category: loadCreatePrefs().category,
  headerFormat: "TEXT",
  headerText: "",
  headerMediaHandle: "",
  headerMediaName: "",
  bodyText: "",
  footerText: "",
  buttonText: "",
  buttonUrl: "",
};

export const HISTORY_KEY = "meta_template_history";

export function loadHistory(): TemplateHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addHistory(entry: TemplateHistoryEntry) {
  const history = loadHistory();
  history.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
}
