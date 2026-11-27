/**
 * agentMarketplaceData.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Types, labels, and pure UI helpers for the dynamic MaxP Agents Marketplace.
 * Single Source of Truth is now GET /api/agent-manager/catalog (backend disk +
 * SystemSettings overrides). No hardcoded fake telemetry or static 14-agent list.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type AgentTier = "free" | "pro";
export type AgentKind = "solo" | "squad" | "vertical" | "internal";

export type AgentCategory =
  | "all"
  | "executive"
  | "sales"
  | "operations"
  | "marketing"
  | "growth"
  | "healthcare"
  | "education"
  | "hospitality"
  | "hr";

export interface SquadMemberSummary {
  slug: string;
  name: string;
  position: string;
  role: string;
}

export interface AgentListing {
  id: string;
  slug: string;
  name: string;
  role: string;
  version?: string;
  position: string;
  summary: string;
  category: Exclude<AgentCategory, "all">;
  kind: AgentKind;
  tier: AgentTier;
  priceMonthly: number;
  currency: string;
  featured?: boolean;
  sortOrder?: number;
  visible: boolean;
  channels: string[];
  channelLabels: string[];
  department: string;
  requiredAppSlug?: string | null;
  prerequisiteMet?: boolean;
  squadMembers?: string[];
  squadMemberDetails?: SquadMemberSummary[];
  governance: "human_in_loop" | "autonomous";
  toolsCount?: number;
  capabilities: string[];
  boundaries: string[];
  dialect?: string;
  isHired?: boolean;
  hiredAgentId?: string | null;
  hiredAgentName?: string | null;
  hasOverride?: boolean;
}

export interface CatalogStats {
  total: number;
  totalDiscovered: number;
  visibleCount: number;
  hiddenCount: number;
  hiredCount: number;
  freeCount: number;
  proCount: number;
  squadCount: number;
  soloCount: number;
  verticalCount: number;
}

export interface CatalogOption {
  id: string;
  label: string;
}

export interface AgentCatalogResponse {
  success: boolean;
  agents: AgentListing[];
  categories: CatalogOption[];
  kinds: CatalogOption[];
  stats: CatalogStats;
  walletBalance: number | null;
  defaultNewAgentVisible: boolean;
  isSuperAdmin?: boolean;
}

export const AGENT_CATEGORIES: Array<{ id: AgentCategory; label: string }> = [
  { id: "all", label: "الكل" },
  { id: "executive", label: "الإدارة التنفيذية" },
  { id: "sales", label: "المبيعات وخدمة العملاء" },
  { id: "operations", label: "الطلبات والشحن والمخزون" },
  { id: "marketing", label: "التسويق والإعلانات" },
  { id: "growth", label: "النمو ورفع AOV" },
  { id: "healthcare", label: "القطاع الطبي والتجميل" },
  { id: "education", label: "التعليم والأكاديميات" },
  { id: "hospitality", label: "الفنادق والضيافة" },
  { id: "hr", label: "الموارد البشرية" },
];

export const AGENT_KIND_META: Record<
  AgentKind,
  { label: string; shortLabel: string; description: string }
> = {
  solo: {
    label: "وكيل مستقل",
    shortLabel: "مستقل",
    description: "موظف رقمي متخصص لمهمة تشغيلية محددة",
  },
  squad: {
    label: "فريق متكامل",
    shortLabel: "فريق",
    description: "مجموعة وكلاء يعملون معاً كحزمة واحدة مترابطة",
  },
  vertical: {
    label: "قطاع متخصص",
    shortLabel: "قطاعي",
    description: "مصمم لأنشطة متخصصة كالعيادات والتعليم والفنادق",
  },
  internal: {
    label: "داخلي / قالب",
    shortLabel: "داخلي",
    description: "وكيل بنية تحتية أو قالب مخصص (مخفي عن التجار افتراضياً)",
  },
};

export const CATEGORY_LABEL_MAP: Record<string, string> = AGENT_CATEGORIES.reduce(
  (acc, item) => {
    acc[item.id] = item.label;
    return acc;
  },
  {} as Record<string, string>
);

export const REQUIRED_APP_LABELS: Record<string, string> = {
  "hr-core": "تطبيق الموارد البشرية (HR Core)",
};

export function getArabicInitials(name: string): string {
  if (!name) return "وك";
  const cleaned = name.replace(/[—–\-()]/g, " ").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0]}${parts[1][0]}`;
}

export function formatEgp(amount: number, currency = "ج.م"): string {
  return `${Number(amount || 0).toLocaleString("en-US")} ${currency}`;
}
