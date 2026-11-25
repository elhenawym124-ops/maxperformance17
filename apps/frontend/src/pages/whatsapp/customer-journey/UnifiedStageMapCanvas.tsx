import React from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDown,
  Award,
  Calendar,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  PackageCheck,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  JourneyStageKey,
  TemplateHealthStatus,
  UnifiedEngineItem,
  UnifiedOverviewData,
} from "./types";

export const JOURNEY_STAGES: Array<{
  key: JourneyStageKey;
  label: string;
  shortLabel: string;
}> = [
  { key: "all", label: "الرحلة الكاملة (End-to-End)", shortLabel: "الكل" },
  {
    key: "pre_purchase",
    label: "1. ما قبل الشراء والليدز",
    shortLabel: "الليدز والسلة",
  },
  {
    key: "order_lifecycle",
    label: "2. حالات الطلب",
    shortLabel: "حالات الطلب",
  },
  {
    key: "post_delivery",
    label: "3. ما بعد الاستلام",
    shortLabel: "ما بعد الاستلام",
  },
  {
    key: "loyalty_retention",
    label: "4. الولاء والاحتفاظ",
    shortLabel: "الولاء والدورية",
  },
  {
    key: "occasions_campaigns",
    label: "5. الأعياد والمناسبات",
    shortLabel: "المناسبات",
  },
];

export function TemplateHealthBadge({
  health,
}: {
  health: TemplateHealthStatus;
}) {
  if (health === "APPROVED") {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-emerald-500/20 bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
      >
        <CheckCircle2 className="size-3" />
        <span>قالب Meta معتمد</span>
      </Badge>
    );
  }
  if (health === "INSIDE_24H") {
    return (
      <Badge
        variant="outline"
        className="border-primary/20 bg-primary/10 text-[10px] font-semibold text-primary"
      >
        نافذة 24h مفتوحة
      </Badge>
    );
  }
  if (health === "REJECTED") {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-destructive/20 bg-destructive/10 text-[10px] font-semibold text-destructive"
      >
        <AlertTriangle className="size-3" />
        <span>قالب مرفوض من Meta</span>
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="gap-1 border-amber-500/20 bg-amber-500/10 text-[10px] font-semibold text-amber-600 dark:text-amber-400"
    >
      <AlertTriangle className="size-3" />
      <span>{health === "UNBOUND" ? "غير مربوط بقالب" : health}</span>
    </Badge>
  );
}

function getStageIcon(stage: UnifiedEngineItem["stage"]) {
  switch (stage) {
    case "pre_purchase":
      return ShoppingCart;
    case "order_lifecycle":
      return PackageCheck;
    case "post_delivery":
      return GitBranch;
    case "loyalty_retention":
      return Award;
    case "occasions_campaigns":
      return Calendar;
    default:
      return Sparkles;
  }
}

interface UnifiedStageMapCanvasProps {
  overview: UnifiedOverviewData | null;
  activeStage: JourneyStageKey;
  onSelectStage: (stage: JourneyStageKey) => void;
  onToggleEngine: (engineKey: string, nextEnabled: boolean) => void;
  togglingKey: string | null;
  postDeliverySlot: React.ReactNode;
}

export const UnifiedStageMapCanvas: React.FC<UnifiedStageMapCanvasProps> = ({
  overview,
  activeStage,
  onSelectStage,
  onToggleEngine,
  togglingKey,
  postDeliverySlot,
}) => {
  const engines = Array.isArray(overview?.engines) ? overview.engines : [];
  const visibleEngines =
    activeStage === "all"
      ? engines
      : engines.filter((e) => e.stage === activeStage);

  const showPostDeliveryEditor =
    activeStage === "all" || activeStage === "post_delivery";

  return (
    <div className="space-y-4">
      {/* Stage Switcher Tabs — MOB-015 compact horizontal scroll */}
      <div
        role="tablist"
        aria-label="مراحل رحلة العميل"
        className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border/70 bg-card p-1 scrollbar-none"
      >
        {JOURNEY_STAGES.map((stage) => {
          const active = activeStage === stage.key;
          return (
            <button
              key={stage.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelectStage(stage.key)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.97]",
                active
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              {stage.label}
            </button>
          );
        })}
      </div>

      {/* Connected Dot-Grid Canvas */}
      {visibleEngines.length > 0 && (
        <div
          className="relative overflow-hidden rounded-xl border border-border/70 bg-muted/20 p-3 sm:p-6"
          style={{
            backgroundImage:
              "radial-gradient(circle, color-mix(in srgb, var(--color-border) 80%, transparent) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        >
          <div className="mx-auto flex max-w-4xl flex-col items-center">
            {visibleEngines.map((engine, index) => {
              const Icon = getStageIcon(engine.stage);
              const stageMeta = JOURNEY_STAGES.find(
                (s) => s.key === engine.stage,
              );
              const isUnsafeActive =
                engine.isEnabled &&
                engine.windowPolicy === "OUTSIDE_24H_HSM" &&
                engine.templateHealth !== "APPROVED";

              return (
                <React.Fragment key={engine.key}>
                  <div
                    className={cn(
                      "w-full rounded-xl border bg-card p-4 text-card-foreground transition-colors",
                      isUnsafeActive
                        ? "border-destructive/50"
                        : engine.isEnabled
                          ? "border-border/70"
                          : "border-border/50 opacity-85",
                    )}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-xl border",
                            engine.isEnabled
                              ? "border-primary/20 bg-primary/10 text-primary"
                              : "border-border/70 bg-muted/40 text-muted-foreground",
                          )}
                        >
                          <Icon className="size-4" />
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-medium text-muted-foreground">
                              {stageMeta?.shortLabel}
                            </span>
                            <span aria-hidden className="text-muted-foreground">
                              ·
                            </span>
                            <TemplateHealthBadge health={engine.templateHealth} />
                            <Badge
                              variant="outline"
                              className="border-border/70 bg-muted/30 text-[10px] text-muted-foreground"
                            >
                              {engine.windowPolicy === "INSIDE_24H"
                                ? "داخل 24h"
                                : "خارج 24h (HSM)"}
                            </Badge>
                          </div>

                          <h3 className="text-sm font-semibold text-foreground sm:text-base">
                            {engine.title}
                          </h3>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {engine.description}
                          </p>
                          {engine.metaTemplateName && (
                            <p className="font-mono text-[11px] text-muted-foreground">
                              Template: {engine.metaTemplateName}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/50 pt-2.5 sm:justify-end sm:border-t-0 sm:pt-0">
                        <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums text-muted-foreground">
                          <span>مرسل: {engine.stats.sent}</span>
                          <span>توصيل: {engine.stats.delivered}</span>
                          {engine.stats.failed > 0 && (
                            <span className="text-destructive">
                              فشل: {engine.stats.failed}
                            </span>
                          )}
                        </div>

                        {engine.manageHref && (
                          <Link
                            to={engine.manageHref}
                            className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-muted/30 px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted/60"
                          >
                            <span>فتح</span>
                            <ExternalLink className="size-3" />
                          </Link>
                        )}

                        {engine.canToggle && (
                          <Switch
                            checked={engine.isEnabled}
                            disabled={togglingKey === engine.key}
                            onCheckedChange={(checked) =>
                              onToggleEngine(engine.key, checked)
                            }
                            aria-label={`تبديل ${engine.title}`}
                          />
                        )}
                      </div>
                    </div>

                    {isUnsafeActive && (
                      <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        تحذير: هذا المحرك مفعل حالياً لكن قالبه غير معتمد في Meta ({engine.templateHealth}). يُنصح بإيقافه أو ربط قالب APPROVED.
                      </div>
                    )}

                    {/* Nested breakdown for order_lifecycle or loyalty_notifications */}
                    {engine.items && engine.items.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/60 pt-3">
                        {engine.items.map((item) => (
                          <div
                            key={item.eventType}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/30 px-2 py-1 text-[11px]"
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                item.health === "APPROVED"
                                  ? "bg-emerald-500"
                                  : item.health === "REJECTED"
                                    ? "bg-destructive"
                                    : "bg-amber-500",
                              )}
                            />
                            <span className="font-mono text-[10px] text-foreground">
                              {item.eventType}
                            </span>
                            {item.hasButtons && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400">
                                (أزرار)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {index < visibleEngines.length - 1 && (
                    <div
                      className="flex flex-col items-center py-1 text-muted-foreground/60"
                      aria-hidden
                    >
                      <div className="h-3 w-px bg-border/80" />
                      <ArrowDown className="size-3.5" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Post-Delivery Interactive Flow Builder & Steps Editor */}
      {showPostDeliveryEditor && (
        <div className="space-y-2 border-t border-border/70 pt-4">
          {postDeliverySlot}
        </div>
      )}
    </div>
  );
};
