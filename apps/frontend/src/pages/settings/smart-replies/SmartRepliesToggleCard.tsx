import React from "react";
import { useTranslation } from "react-i18next";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { ALL_CHANNELS, type SmartReplyChannel } from "./types";

export interface SmartRepliesToggleCardProps {
  enabled: boolean;
  channels: SmartReplyChannel[];
  saving: boolean;
  onToggleEnable: () => void;
  onToggleChannel: (channelId: SmartReplyChannel) => void;
}

export function SmartRepliesToggleCard({
  enabled,
  channels,
  saving,
  onToggleEnable,
  onToggleChannel,
}: SmartRepliesToggleCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`rounded-xl shadow-xs border p-4 sm:p-5 transition-all duration-200 ${
        enabled
          ? "bg-emerald-50/40 dark:bg-success/20 border-success dark:border-success/60 shadow-success/5"
          : "bg-card border-border dark:border-border"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`p-2 sm:p-2.5 rounded-xl shrink-0 transition-colors ${
              enabled
                ? "bg-emerald-100 text-success dark:bg-success/60 dark:text-success"
                : "bg-gray-100 text-muted-foreground dark:bg-muted dark:text-muted-foreground"
            }`}
          >
            <SparklesIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-foreground text-sm sm:text-base truncate">
              {t("smartReplies.enableTitle") || "الردود التلقائية"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 hidden xs:block truncate">
              {enabled
                ? t("smartReplies.enableDesc") ||
                  "القوالب مفعلة وتعمل تلقائياً عند مطابقة الكلمات"
                : t("smartReplies.disabledDesc") ||
                  "الردود التلقائية متوقفة حالياً"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span
            className={`text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 sm:py-1 rounded-full flex items-center gap-1.5 transition-colors ${
              enabled
                ? "bg-emerald-100 text-success dark:bg-success/60 dark:text-success border border-success dark:border-success"
                : "bg-gray-100 text-foreground dark:bg-muted dark:text-muted-foreground border border-border"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                enabled
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-gray-400 dark:bg-muted"
              }`}
            />
            {enabled
              ? t("smartReplies.active") || "نشط"
              : t("smartReplies.inactive") || "معطل"}
          </span>

          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={onToggleEnable}
            dir="ltr"
            className={`relative inline-flex h-7 w-12 sm:w-14 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-success focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
              enabled
                ? "bg-emerald-600 dark:bg-success shadow-xs"
                : "bg-gray-300 dark:bg-muted"
            }`}
          >
            <span className="sr-only">
              {t("smartReplies.enableTitle") || "الردود التلقائية"}
            </span>
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                enabled ? "translate-x-5 sm:translate-x-7" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Global Channel Selector */}
      <div
        className={`mt-4 pt-3 border-t transition-opacity ${
          enabled
            ? "border-emerald-200/70 dark:border-success/60"
            : "border-gray-200 dark:border-border opacity-60"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground dark:text-muted-foreground">
              المنصات المدعومة للرد التلقائي:
            </span>
            <span className="text-[11px] text-muted-foreground sm:hidden">
              (اسحب للتمرير ↔)
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 sm:flex-wrap -mx-1 px-1">
            {ALL_CHANNELS.map((channel) => {
              const isChannelActive = channels.includes(channel.id);
              return (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => onToggleChannel(channel.id)}
                  disabled={saving}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 active:scale-95 ${
                    isChannelActive
                      ? channel.activeClass
                      : channel.inactiveClass
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isChannelActive
                        ? "bg-emerald-500 animate-pulse"
                        : "bg-gray-400"
                    }`}
                  />
                  <span>{channel.shortLabel}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium bg-black/5 dark:bg-white/10">
                    {isChannelActive ? "مفعل" : "معطل"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
