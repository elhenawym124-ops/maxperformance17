import React from "react";
import {
  ShieldAlert,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Check,
} from "lucide-react";
import { DiagnosedWeakness } from "./types";

export interface CampaignWeaknessesTabProps {
  isEn: boolean;
  weaknesses: DiagnosedWeakness[];
  criticalWeaknessesCount: number;
  warningWeaknessesCount: number;
}

export const CampaignWeaknessesTab: React.FC<CampaignWeaknessesTabProps> = ({
  isEn,
  weaknesses,
  criticalWeaknessesCount,
  warningWeaknessesCount,
}) => {
  return (
    <div className="space-y-4">
      {/* Weakness Audit Banner */}
      <div className="rounded-xl border border-border bg-muted p-4 dark:border-border dark:bg-muted">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-warning" />
            <div>
              <h4 className="text-xs font-black text-foreground dark:text-white">
                {isEn ? "AI Audit & Diagnostic Engine" : "فحص وتشخيص نقاط الضعف والمخاطر الإعلانية"}
              </h4>
              <p className="text-[11px] text-muted-foreground">
                {isEn
                  ? "Automated audit inspecting bleed, delivery readiness, hook strength, and audience fatigue."
                  : "فحص ذكي مباشر لكشف نزيف الميزانية، عوائق التسليم، ضعف المحتوى الإعلاني، وتشبع الجمهور."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold">
            {criticalWeaknessesCount > 0 && (
              <span className="rounded-md bg-destructive px-2 py-0.5 text-destructive dark:bg-destructive/40 dark:text-destructive">
                {criticalWeaknessesCount} {isEn ? "Critical" : "حرجة"}
              </span>
            )}
            {warningWeaknessesCount > 0 && (
              <span className="rounded-md bg-warning px-2 py-0.5 text-warning dark:bg-warning/40 dark:text-warning">
                {warningWeaknessesCount} {isEn ? "Warnings" : "تحذيرات"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Weaknesses List */}
      {weaknesses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-success bg-success/40 p-8 text-center dark:border-success/50 dark:bg-success/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success text-success dark:bg-success/40 dark:text-success">
            <Check className="h-5 w-5" />
          </div>
          <h4 className="mt-2 text-sm font-bold text-success dark:text-success">
            {isEn ? "No Critical Weaknesses Detected" : "لا توجد نقاط ضعف حرجة مكتشفة"}
          </h4>
          <p className="mt-1 max-w-md text-xs text-success dark:text-success">
            {isEn
              ? "Campaign delivery status, pacing, and basic conversion telemetry are stable and performing within healthy ranges."
              : "أداء الحملة، ومعدلات النقر، وحالة التسليم مستقرة وتعمل ضمن الحدود الطبيعية."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {weaknesses.map((w) => {
            const isCritical = w.severity === "critical";
            const isOpportunity = w.severity === "opportunity";

            return (
              <div
                key={w.id}
                className={`rounded-xl border p-4 transition-all ${
                  isCritical
                    ? "border-red-200 bg-destructive/40 dark:border-destructive/60 dark:bg-destructive/20"
                    : isOpportunity
                    ? "border-emerald-200 bg-success/40 dark:border-success/60 dark:bg-success/20"
                    : "border-amber-200 bg-warning/40 dark:border-warning/60 dark:bg-warning/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                        isCritical
                          ? "bg-red-100 text-destructive dark:bg-destructive/50 dark:text-destructive"
                          : isOpportunity
                          ? "bg-emerald-100 text-success dark:bg-success/50 dark:text-success"
                          : "bg-amber-100 text-warning dark:bg-warning/50 dark:text-warning"
                      }`}
                    >
                      {isCritical ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : isOpportunity ? (
                        <Sparkles className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h5 className="text-xs font-black text-foreground dark:text-white">
                          {isEn ? w.titleEn : w.title}
                        </h5>
                        {w.metricLabel && w.metricValue && (
                          <span className="rounded-md bg-white/80 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-foreground shadow-2xs dark:bg-muted dark:text-muted-foreground">
                            {w.metricLabel}: {w.metricValue}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-foreground dark:text-muted-foreground">
                        {isEn ? w.descriptionEn : w.description}
                      </p>
                    </div>
                  </div>

                  {/* Quick Fix Button if available */}
                  {w.action && (
                    <button
                      type="button"
                      onClick={w.action}
                      className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold shadow-2xs transition-all active:scale-[0.97] ${
                        isOpportunity
                          ? "bg-emerald-600 text-white hover:bg-success"
                          : "bg-red-600 text-white hover:bg-destructive"
                      }`}
                    >
                      {isEn ? w.actionLabelEn || "Apply" : w.actionLabel || "تطبيق"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
