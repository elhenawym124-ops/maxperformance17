import React from "react";
import {
  ArrowUpLeft,
  Check,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Users,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Briefcase,
  ShoppingBag,
  Truck,
  Megaphone,
  TrendingUp,
  Stethoscope,
  GraduationCap,
  Building2,
  UserCheck,
} from "lucide-react";
import {
  AGENT_KIND_META,
  AgentListing,
  CATEGORY_LABEL_MAP,
  REQUIRED_APP_LABELS,
} from "./agentMarketplaceData";

interface AgentMarketCardProps {
  agent: AgentListing;
  adminMode?: boolean;
  updating?: boolean;
  onViewProfile: (agent: AgentListing) => void;
  onHire: (agent: AgentListing) => void;
  onManageHired: (agent: AgentListing) => void;
  onToggleVisibility?: (agent: AgentListing) => void;
  onOpenAdminConfig?: (agent: AgentListing) => void;
}

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  executive: Briefcase,
  sales: ShoppingBag,
  operations: Truck,
  marketing: Megaphone,
  growth: TrendingUp,
  healthcare: Stethoscope,
  education: GraduationCap,
  hospitality: Building2,
  hr: UserCheck,
};

export const AgentMarketCard: React.FC<AgentMarketCardProps> = ({
  agent,
  adminMode = false,
  updating = false,
  onViewProfile,
  onHire,
  onManageHired,
  onToggleVisibility,
  onOpenAdminConfig,
}) => {
  const isPro = agent.tier === "pro" && agent.priceMonthly > 0;
  const isHired = Boolean(agent.isHired);
  const isSquad = agent.kind === "squad";
  const CategoryIcon = CATEGORY_ICON_MAP[agent.category] || Layers;
  const kindMeta = AGENT_KIND_META[agent.kind] || AGENT_KIND_META.solo;
  const missingAppLabel =
    agent.requiredAppSlug && agent.prerequisiteMet === false
      ? REQUIRED_APP_LABELS[agent.requiredAppSlug] || agent.requiredAppSlug
      : null;

  return (
    <article
      onClick={() => onViewProfile(agent)}
      className={`polaris-card group relative flex flex-col justify-between p-4 sm:p-5 transition-colors duration-150 hover:border-foreground/25 cursor-pointer text-start ${
        !agent.visible ? "opacity-65 border-dashed" : ""
      } ${isSquad ? "md:col-span-2" : ""}`}
    >
      {/* Top Identity & Pricing */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${
                isSquad
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-primary/10 text-primary border-primary/20"
              }`}
              aria-hidden="true"
            >
              {isSquad ? (
                <Users className="size-5 stroke-[1.5]" />
              ) : (
                <CategoryIcon className="size-5 stroke-[1.5]" />
              )}
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3
                  dir="auto"
                  className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors"
                >
                  {agent.name}
                </h3>
                {!agent.visible && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border/70">
                    <EyeOff className="size-2.5 stroke-[1.5]" />
                    <span>مخفي</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {agent.position}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-end space-y-1">
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                isSquad
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-muted text-muted-foreground border-border/70"
              }`}
            >
              {kindMeta.shortLabel}
            </span>
            <div className="text-xs font-bold text-foreground whitespace-nowrap">
              {isPro ? (
                <>
                  <span className="font-mono tabular-nums">
                    {Number(agent.priceMonthly).toLocaleString("en-US")}
                  </span>{" "}
                  <span>{agent.currency}</span>
                  <span className="text-[10px] font-normal text-muted-foreground">
                    /شهر
                  </span>
                </>
              ) : (
                <span className="text-[11px] font-semibold text-success">
                  مجاني
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {agent.summary}
        </p>

        {/* Squad members preview (when kind === squad) */}
        {isSquad && agent.squadMemberDetails && agent.squadMemberDetails.length > 0 && (
          <div className="rounded-lg border border-border/70 bg-muted/30 p-2.5 space-y-1.5">
            <div className="text-[11px] font-semibold text-foreground flex items-center justify-between">
              <span>أعضاء الفريق المتكامل</span>
              <span className="font-mono tabular-nums text-muted-foreground">
                {agent.squadMemberDetails.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {agent.squadMemberDetails.map((member) => (
                <div
                  key={member.slug}
                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0"
                >
                  <span className="size-1.5 rounded-full bg-primary shrink-0" />
                  <span className="truncate text-foreground font-medium">{member.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Channels + Category metadata */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {CATEGORY_LABEL_MAP[agent.category] || agent.category}
          </span>
          {agent.channelLabels.slice(0, 3).map((ch) => (
            <span
              key={ch}
              className="inline-flex items-center rounded-md border border-border/70 bg-background px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {ch}
            </span>
          ))}
        </div>

        {/* Prerequisite warning if required app not installed */}
        {missingAppLabel && (
          <div className="flex items-center gap-1.5 rounded-lg border border-warning/30 bg-warning/10 px-2.5 py-1.5 text-[11px] text-warning">
            <AlertTriangle className="size-3.5 shrink-0 stroke-[1.5]" />
            <span className="truncate">يتطلب تفعيل: {missingAppLabel}</span>
          </div>
        )}
      </div>

      {/* Bottom Governance & Action Bar */}
      <div className="mt-4 pt-3 border-t border-border/70 space-y-2.5">
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 min-w-0 truncate">
            <ShieldCheck className="size-3.5 shrink-0 text-primary stroke-[1.5]" />
            <span className="truncate">
              {agent.governance === "human_in_loop"
                ? "بموافقة قبل التنفيذ"
                : "تشغيل تلقائي منضبط"}
            </span>
          </span>
          {typeof agent.toolsCount === "number" && agent.toolsCount > 0 && (
            <span className="shrink-0 text-[11px] text-muted-foreground">
              <span className="font-mono tabular-nums">{agent.toolsCount}</span> أداة
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile(agent);
            }}
            className="flex-1 h-9 px-3 rounded-lg border border-border/80 bg-background text-xs font-medium text-foreground hover:bg-muted active:scale-[0.97] transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            التفاصيل
          </button>

          {isHired ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onManageHired(agent);
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-success/30 bg-success/10 text-xs font-semibold text-success hover:bg-success/15 active:scale-[0.97] transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <Check className="size-3.5 stroke-[2]" />
              <span>إدارة الوكيل</span>
              <ArrowUpLeft className="size-3.5 stroke-[1.5]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onHire(agent);
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span>{isSquad ? "تفعيل الفريق" : "توظيف"}</span>
            </button>
          )}
        </div>

        {/* Super Admin Inline Controls */}
        {adminMode && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="pt-2 border-t border-dashed border-border/70 flex items-center justify-between gap-2"
          >
            <button
              type="button"
              disabled={updating}
              onClick={() => onToggleVisibility?.(agent)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-lg text-[11px] font-semibold border active:scale-[0.97] transition-all disabled:opacity-50 ${
                agent.visible
                  ? "border-border bg-muted/40 text-foreground hover:bg-muted"
                  : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
              }`}
            >
              {agent.visible ? (
                <>
                  <EyeOff className="size-3.5 stroke-[1.5]" />
                  <span>إخفاء من السوق</span>
                </>
              ) : (
                <>
                  <Eye className="size-3.5 stroke-[1.5]" />
                  <span>إظهار في السوق</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={updating}
              onClick={() => onOpenAdminConfig?.(agent)}
              className="inline-flex items-center justify-center gap-1 h-8 px-2.5 rounded-lg border border-border bg-background text-[11px] font-medium text-foreground hover:bg-muted active:scale-[0.97] transition-all disabled:opacity-50"
              aria-label={`تعديل إعدادات ${agent.name}`}
            >
              <SlidersHorizontal className="size-3.5 stroke-[1.5]" />
              <span>تعديل</span>
            </button>
          </div>
        )}
      </div>
    </article>
  );
};
