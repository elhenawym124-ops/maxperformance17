export type SmartReplyChannel =
  | "WHATSAPP"
  | "FACEBOOK"
  | "INSTAGRAM"
  | "TIKTOK"
  | "TELEGRAM_USER"
  | "TELEGRAM_BOT";

export interface AutoReplyTemplate {
  id: string;
  name: string;
  type: "greeting" | "thanks" | "confirmation" | "farewell" | "custom";
  channels?: SmartReplyChannel[];
  keywords: string[];
  responses: string[];
  isDefault?: boolean;
}

export interface SmartRepliesSettingsData {
  enabled: boolean;
  channels: SmartReplyChannel[];
  templates: AutoReplyTemplate[];
}

export interface ChannelConfig {
  id: SmartReplyChannel;
  label: string;
  shortLabel: string;
  activeClass: string;
  inactiveClass: string;
  badgeClass: string;
}

export const DEFAULT_CHANNELS: SmartReplyChannel[] = [
  "WHATSAPP",
  "FACEBOOK",
  "INSTAGRAM",
];

export const ALL_CHANNELS: ChannelConfig[] = [
  {
    id: "WHATSAPP",
    label: "واتساب (WhatsApp)",
    shortLabel: "واتساب",
    activeClass:
      "bg-emerald-100 text-success border-success dark:bg-success/70 dark:text-success dark:border-success shadow-xs",
    inactiveClass:
      "bg-gray-100 text-muted-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border hover:bg-muted dark:hover:bg-muted",
    badgeClass:
      "bg-emerald-50 text-success dark:bg-success/60 dark:text-success border-success/80 dark:border-success/80",
  },
  {
    id: "FACEBOOK",
    label: "فيسبوك ماسنجر (Messenger)",
    shortLabel: "ماسنجر",
    activeClass:
      "bg-blue-100 text-primary border-primary dark:bg-primary/70 dark:text-primary dark:border-primary shadow-xs",
    inactiveClass:
      "bg-gray-100 text-muted-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border hover:bg-muted dark:hover:bg-muted",
    badgeClass:
      "bg-blue-50 text-primary dark:bg-primary/60 dark:text-primary border-primary/80 dark:border-primary/80",
  },
  {
    id: "INSTAGRAM",
    label: "إنستغرام (Instagram)",
    shortLabel: "إنستغرام",
    activeClass:
      "bg-fuchsia-100 text-primary border-primary dark:bg-primary/70 dark:text-primary dark:border-primary shadow-xs",
    inactiveClass:
      "bg-gray-100 text-muted-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border hover:bg-muted dark:hover:bg-muted",
    badgeClass:
      "bg-fuchsia-50 text-primary dark:bg-primary/60 dark:text-primary border-primary/80 dark:border-primary/80",
  },
  {
    id: "TIKTOK",
    label: "تيك توك (TikTok)",
    shortLabel: "تيك توك",
    activeClass:
      "bg-neutral-900 text-white border-border dark:bg-muted dark:text-foreground dark:border-border shadow-xs",
    inactiveClass:
      "bg-gray-100 text-muted-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border hover:bg-muted dark:hover:bg-muted",
    badgeClass:
      "bg-neutral-100 text-foreground dark:bg-muted dark:text-muted-foreground border-border dark:border-border",
  },
  {
    id: "TELEGRAM_USER",
    label: "تلجرام - حساب شخصي (User)",
    shortLabel: "تلجرام يوزر",
    activeClass:
      "bg-sky-100 text-info border-info dark:bg-info/70 dark:text-info dark:border-info shadow-xs",
    inactiveClass:
      "bg-gray-100 text-muted-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border hover:bg-muted dark:hover:bg-muted",
    badgeClass:
      "bg-sky-50 text-info dark:bg-info/60 dark:text-info border-info/80 dark:border-info/80",
  },
  {
    id: "TELEGRAM_BOT",
    label: "تلجرام - بوت (Bot)",
    shortLabel: "تلجرام بوت",
    activeClass:
      "bg-cyan-100 text-info border-info dark:bg-info/70 dark:text-info dark:border-info shadow-xs",
    inactiveClass:
      "bg-gray-100 text-muted-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border hover:bg-muted dark:hover:bg-muted",
    badgeClass:
      "bg-cyan-50 text-info dark:bg-info/60 dark:text-info border-info/80 dark:border-info/80",
  },
];
