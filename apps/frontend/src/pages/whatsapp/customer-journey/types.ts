import React from "react";
import { type FlowStep } from "../components/journey/FlowCanvas";

export interface Flow {
  id: string;
  name: string;
  isEnabled: boolean;
  createdAt: string;
  channels?: string[];
  _count?: {
    steps: number;
    journeys: number;
    categories: number;
  };
}

export interface Step extends FlowStep {
  flowId: string;
  templateId?: string | null;
  eventType?: string | null;
  boundTemplate?: {
    id: string;
    name: string;
    eventType: string;
    metaTemplateName?: string | null;
    metaTemplateStatus?: string | null;
    health: TemplateHealthStatus;
    hasButtons?: boolean;
    buttons?: { title?: string; text?: string; payload?: string }[];
  } | null;
}

export type JourneyStageKey =
  | "all"
  | "pre_purchase"
  | "order_lifecycle"
  | "post_delivery"
  | "loyalty_retention"
  | "occasions_campaigns";

export type JourneyViewMode = "canvas" | "list";

export type TemplateHealthStatus =
  | "APPROVED"
  | "REJECTED"
  | "PENDING"
  | "PENDING_DELETION"
  | "UNBOUND"
  | "INSIDE_24H"
  | "UNKNOWN";

export interface TelemetryStats {
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  responded: number;
}

export interface UnifiedEngineItem {
  key: string;
  stage: Exclude<JourneyStageKey, "all">;
  title: string;
  description: string;
  isEnabled: boolean;
  windowPolicy: "INSIDE_24H" | "OUTSIDE_24H_HSM";
  templateHealth: TemplateHealthStatus;
  metaTemplateName?: string | null;
  canToggle: boolean;
  manageHref?: string;
  flowsCount?: number;
  activeEnrollments?: number;
  scheduledCount?: number;
  unboundCount?: number;
  items?: Array<{
    eventType: string;
    templateId?: string | null;
    name: string;
    metaTemplateName?: string | null;
    health: TemplateHealthStatus;
    hasButtons?: boolean;
    stats: TelemetryStats;
  }>;
  stats: TelemetryStats;
}

export interface SelectableTemplate {
  id: string;
  name: string;
  category: string;
  eventType: string;
  content: string;
  metaTemplateName?: string | null;
  metaTemplateStatus?: string | null;
  health: TemplateHealthStatus;
  hasButtons: boolean;
  buttons: Array<{ title?: string; text?: string; type?: string }>;
}

export interface OccasionOverviewItem {
  id: string;
  name: string;
  status: string;
  templateId?: string | null;
  scheduledAt: string;
  nextRunAt?: string | null;
  recurrence: string;
  totalSent: number;
  lastSentCount: number;
}

export interface UnifiedOverviewData {
  hasMetaSession: boolean;
  connectedSessionsCount: number;
  guardrails: {
    weeklyFrequencyCap: number;
    deliveryWindowHours: number;
    pauseOnUnreadInbox: boolean;
    respectBotUnsubscribe: boolean;
    blockUnboundOccasions: boolean;
  };
  journeyStatusSummary: Record<string, number>;
  telemetry7d: TelemetryStats;
  templateHealthSummary: {
    total: number;
    approved: number;
    rejected: number;
    unbound: number;
  };
  engines: UnifiedEngineItem[];
  occasions: OccasionOverviewItem[];
  selectableTemplates: SelectableTemplate[];
}

export interface Journey {
  id: string;
  status: string;
  currentStep: number;
  nextSendAt: string;
  lastSentAt?: string;
  logs?: string;
  customer: { firstName: string; lastName: string; phone: string };
  order: { orderNumber: string };
  flow: { name: string; steps?: Step[] };
  whatsappContactId?: string;
  whatsappPhone?: string;
}

export type NoticeTone = "success" | "error";

export type NoticeState = {
  tone: NoticeTone;
  message: string;
} | null;

export type DeleteTarget =
  | {
      type: "flow" | "step";
      id: string;
    }
  | null;

export const journeyStatusClasses: Record<string, string> = {
  ACTIVE:
    "border-emerald-300/70 bg-success/10 text-success dark:border-success/40 dark:text-success",
  COMPLETED:
    "border-blue-300/70 bg-primary/10 text-primary dark:border-primary/40 dark:text-primary",
  CANCELLED:
    "border-slate-300/70 bg-muted text-foreground dark:border-border dark:text-muted-foreground",
  FAILED:
    "border-rose-300/70 bg-destructive/10 text-destructive dark:border-destructive/40 dark:text-destructive",
  NOT_STARTED:
    "border-amber-300/70 bg-warning/10 text-warning dark:border-warning/40 dark:text-warning",
};

export const journeyStatusTranslationKey: Record<string, string> = {
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  FAILED: "failed",
  NOT_STARTED: "notStarted",
  INACTIVE: "inactive",
};

export const getJourneyStatusKey = (status: string) =>
  journeyStatusTranslationKey[status.toUpperCase()] || "inactive";

export const noticeStyles: Record<NoticeTone, string> = {
  success:
    "border-emerald-300/70 bg-success/12 text-success dark:border-success/40 dark:text-success",
  error:
    "border-rose-300/70 bg-destructive/12 text-destructive dark:border-destructive/40 dark:text-destructive",
};

export const variableTokens = [
  "{firstName}",
  "{lastName}",
  "{orderNumber}",
  "{totalPrice}",
];

export const previewBackgroundStyle: React.CSSProperties = {
  backgroundColor: "var(--color-muted)",
  backgroundImage:
    'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
  backgroundPosition: "center",
  backgroundSize: "cover",
};

export const floatingNoticeBaseClass =
  "rounded-xl border shadow-[0_18px_40px_rgba(15,27,45,0.12)] backdrop-blur";

export const isNotFoundError = (error: unknown) => {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return false;
  }

  return (
    (error as { response?: { status?: number } }).response?.status === 404
  );
};

export function parseInteger(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function replaceVariables(content: string) {
  return content
    .replace(/{firstName}/g, "أحمد")
    .replace(/{lastName}/g, "محمد")
    .replace(/{orderNumber}/g, "ORD-2024")
    .replace(/{totalPrice}/g, "1250");
}
