import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ExternalLink, PauseCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TemplateHealthBadge, JOURNEY_STAGES } from "./UnifiedStageMapCanvas";
import { UnifiedOverviewData } from "./types";

interface UnifiedEnginesListViewProps {
  overview: UnifiedOverviewData | null;
  onToggleEngine: (engineKey: string, nextEnabled: boolean) => void;
  onPauseOccasion: (occasionId: string) => void;
  togglingKey: string | null;
  pausingOccasionId: string | null;
}

export const UnifiedEnginesListView: React.FC<UnifiedEnginesListViewProps> = ({
  overview,
  onToggleEngine,
  onPauseOccasion,
  togglingKey,
  pausingOccasionId,
}) => {
  if (!overview || !Array.isArray(overview.engines)) return null;

  const { engines = [], occasions = [] } = overview;
  const scheduledOccasions = occasions.filter((o) => o.status === "scheduled");

  return (
    <div className="space-y-6">
      {/* Unified Engines Control Table — Single-Surface Chassis */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground">
        <div className="border-b border-border/70 px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            دليل محركات المراسلة والتحكم الموحد
          </h2>
        </div>

        <div className="divide-y divide-border/70">
          {engines.map((engine) => {
            const stageLabel =
              JOURNEY_STAGES.find((s) => s.key === engine.stage)?.shortLabel ||
              engine.stage;
            return (
              <div
                key={engine.key}
                className="flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {engine.title}
                    </span>
                    <Badge
                      variant="outline"
                      className="border-border/70 bg-muted/30 text-[10px] text-muted-foreground"
                    >
                      {stageLabel}
                    </Badge>
                    <TemplateHealthBadge health={engine.templateHealth} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {engine.description}
                  </p>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                  <div className="flex items-center gap-3 font-mono text-xs tabular-nums text-muted-foreground">
                    <span>مرسل: {engine.stats.sent}</span>
                    <span>واصل: {engine.stats.delivered}</span>
                    {engine.stats.failed > 0 && (
                      <span className="text-destructive">
                        فشل: {engine.stats.failed}
                      </span>
                    )}
                  </div>

                  {engine.manageHref && (
                    <Link
                      to={engine.manageHref}
                      className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-muted/30 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted/60"
                    >
                      <span>إدارة</span>
                      <ExternalLink className="size-3" />
                    </Link>
                  )}

                  {engine.canToggle ? (
                    <Switch
                      checked={engine.isEnabled}
                      disabled={togglingKey === engine.key}
                      onCheckedChange={(checked) =>
                        onToggleEngine(engine.key, checked)
                      }
                      aria-label={`تشغيل أو إيقاف ${engine.title}`}
                    />
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-border/70 bg-muted/40 text-[10px] text-muted-foreground"
                    >
                      {engine.isEnabled ? "يعمل" : "متوقف"}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scheduled Occasions Guard Table */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground">
        <div className="flex flex-col gap-2 border-b border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              المناسبات المجدولة وفحص القوالب ({occasions.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              المناسبات غير المربوطة بقالب محظورة تلقائياً من الإرسال لمنع إرسال قوالب خاطئة.
            </p>
          </div>
          {scheduledOccasions.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              disabled={togglingKey === "occasions_campaigns"}
              onClick={() => onToggleEngine("occasions_campaigns", false)}
              className="shrink-0 active:scale-[0.97]"
            >
              <PauseCircle className="size-3.5" />
              <span>إيقاف جميع المجدول ({scheduledOccasions.length})</span>
            </Button>
          )}
        </div>

        {occasions.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            لا توجد مناسبات مسجلة لهذا الحساب.
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            {occasions.map((occ) => {
              const isScheduled = occ.status === "scheduled";
              const missingTemplate = !occ.templateId;
              return (
                <div
                  key={occ.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {occ.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          isScheduled
                            ? "border-primary/20 bg-primary/10 text-[10px] text-primary"
                            : "border-border/70 bg-muted/40 text-[10px] text-muted-foreground"
                        }
                      >
                        {isScheduled ? "مجدولة" : occ.status}
                      </Badge>
                      {missingTemplate && (
                        <Badge
                          variant="outline"
                          className="gap-1 border-amber-500/20 bg-amber-500/10 text-[10px] text-amber-600 dark:text-amber-400"
                        >
                          <AlertTriangle className="size-3" />
                          <span>بدون قالب مربوط</span>
                        </Badge>
                      )}
                    </div>
                    <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
                      الموعد:{" "}
                      {new Date(
                        occ.nextRunAt || occ.scheduledAt,
                      ).toLocaleDateString("en-CA")}{" "}
                      · التكرار: {occ.recurrence} · المرسل: {occ.totalSent}
                    </p>
                  </div>

                  {isScheduled && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pausingOccasionId === occ.id}
                      onClick={() => onPauseOccasion(occ.id)}
                      className="shrink-0 active:scale-[0.97]"
                    >
                      <PauseCircle className="size-3.5" />
                      <span>إيقاف الجدولة</span>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
