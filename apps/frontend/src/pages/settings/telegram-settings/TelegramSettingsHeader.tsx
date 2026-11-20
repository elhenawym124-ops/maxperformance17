import React from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import type { TelegramTab } from "./types";

export interface TelegramSettingsHeaderProps {
  activeTab: TelegramTab;
  setActiveTab: (tab: TelegramTab) => void;
  botsCount: number;
  userbotsCount: number;
  derivedTheme: string;
}

export function TelegramSettingsHeader({
  activeTab,
  setActiveTab,
  botsCount,
  userbotsCount,
  derivedTheme,
}: TelegramSettingsHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10 text-info dark:bg-info/40 dark:text-info">
            <PaperAirplaneIcon className="h-6 w-6 transform -rotate-45" />
          </div>
          <div>
            <h1
              className={`text-2xl font-bold ${
                derivedTheme === "dark" ? "text-white" : "text-slate-900"
              }`}
            >
              Telegram Integration
            </h1>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground">
              Manage Telegram Bots and Userbot client sessions.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className={`flex gap-2 border-b ${
          derivedTheme === "dark" ? "border-slate-800" : "border-slate-200"
        }`}
      >
        <button
          type="button"
          onClick={() => setActiveTab("bots")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px ${
            activeTab === "bots"
              ? "border-sky-600 text-info dark:border-info dark:text-info"
              : "border-transparent text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-muted-foreground"
          }`}
        >
          <span>Telegram Bots</span>
          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] tabular-nums text-foreground dark:bg-muted dark:text-muted-foreground">
            {botsCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("userbots")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px ${
            activeTab === "userbots"
              ? "border-emerald-600 text-success dark:border-success dark:text-success"
              : "border-transparent text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-muted-foreground"
          }`}
        >
          <span>Telegram Userbots</span>
          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] tabular-nums text-foreground dark:bg-muted dark:text-muted-foreground">
            {userbotsCount}
          </span>
        </button>
      </div>
    </div>
  );
}