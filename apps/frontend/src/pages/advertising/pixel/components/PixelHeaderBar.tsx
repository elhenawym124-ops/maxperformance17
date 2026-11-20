import React from "react";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  CheckIcon,
  ShieldCheckIcon,
  SignalIcon,
} from "@heroicons/react/24/outline";

interface PixelHeaderBarProps {
  isPixelActive: boolean;
  isCapiActive: boolean;
  isSaving: boolean;
  isDirty: boolean;
  onSave: () => void;
  onRefreshDiagnostics: () => void;
  isRefreshing: boolean;
}

export const PixelHeaderBar: React.FC<PixelHeaderBarProps> = ({
  isPixelActive,
  isCapiActive,
  isSaving,
  isDirty,
  onSave,
  onRefreshDiagnostics,
  isRefreshing,
}) => {
  return (
    <header className="sticky top-0 z-20 w-full border-b border-border dark:border-border bg-white/90 dark:bg-muted backdrop-blur-md px-3.5 sm:px-6 py-2.5 sm:py-3 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left / Start: Title and telemetry badges */}
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <SignalIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight leading-tight">
                Facebook Pixel & Conversions API
              </h1>
              <p className="text-[11px] text-muted-foreground font-mono hidden sm:block">
                Meta Graph API v26.0 • Client & Server Hybrid Attribution
              </p>
            </div>
          </div>

          {/* Telemetry Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                isPixelActive
                  ? "bg-emerald-50 text-success dark:bg-success/40 dark:text-success border-success/60 dark:border-success/60"
                  : "bg-gray-100 text-foreground dark:bg-muted dark:text-muted-foreground border-border dark:border-border"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isPixelActive ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                }`}
              />
              <span className="font-mono text-[11px]">Browser:</span>
              <span>{isPixelActive ? "نشط" : "معطل"}</span>
            </span>

            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                isCapiActive
                  ? "bg-emerald-50 text-success dark:bg-success/40 dark:text-success border-success/60 dark:border-success/60"
                  : "bg-amber-50 text-warning dark:bg-warning/40 dark:text-warning border-warning/60 dark:border-warning/60"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isCapiActive ? "bg-emerald-500" : "bg-amber-400"
                }`}
              />
              <span className="font-mono text-[11px]">CAPI:</span>
              <span>{isCapiActive ? "متصل" : "بحاجة لتوكن"}</span>
            </span>

            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted dark:bg-muted text-foreground dark:text-muted-foreground border border-border dark:border-border">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono">Deduplication & SHA-256</span>
            </span>
          </div>
        </div>

        {/* Right / End: Actions */}
        <div className="flex items-center gap-2 me-auto sm:me-0">
          <button
            type="button"
            onClick={onRefreshDiagnostics}
            disabled={isRefreshing}
            className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-foreground bg-muted hover:bg-muted dark:bg-muted dark:hover:bg-muted rounded-lg border border-border dark:border-border transition-all active:scale-[0.97] flex items-center gap-1.5 min-h-[38px]"
            title="تحديث مؤشرات الاتصال والتشخيص"
            aria-label="تحديث التشخيص"
          >
            <ArrowPathIcon
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-primary" : ""}`}
            />
            <span className="hidden sm:inline">فحص الاتصال</span>
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className={`px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all active:scale-[0.97] flex items-center gap-2 min-h-[38px] shadow-sm ${
              isDirty
                ? "bg-primary hover:bg-primary/90 text-white ring-2 ring-primary/30"
                : "bg-gray-900 dark:bg-white text-white dark:text-foreground hover:opacity-90"
            }`}
          >
            {isSaving ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                <span>جاري الحفظ…</span>
              </>
            ) : (
              <>
                <CheckIcon className="w-4 h-4" />
                <span>حفظ التعديلات</span>
                {isDirty && (
                  <span className="w-2 h-2 rounded-full bg-warning animate-ping" />
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
