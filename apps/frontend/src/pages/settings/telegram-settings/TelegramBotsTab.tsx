import React from "react";
import { CpuChipIcon } from "@heroicons/react/24/outline";
import type { TelegramBot } from "./types";
import { TelegramAddBotModal } from "./TelegramAddBotModal";

export interface TelegramBotsTabProps {
  bots: TelegramBot[];
  isLoading: boolean;
  showAddForm: boolean;
  setShowAddForm: (show: boolean) => void;
  newBotLabel: string;
  setNewBotLabel: (val: string) => void;
  newBotToken: string;
  setNewBotToken: (val: string) => void;
  onConnect: () => void;
  onDisconnect: (botId: string) => void;
  derivedTheme: string;
}

export function TelegramBotsTab({
  bots,
  isLoading,
  showAddForm,
  setShowAddForm,
  newBotLabel,
  setNewBotLabel,
  newBotToken,
  setNewBotToken,
  onConnect,
  onDisconnect,
  derivedTheme,
}: TelegramBotsTabProps) {
  return (
    <div className="space-y-6">
      {!showAddForm && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 rounded-xl bg-info px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-info"
          >
            <span>+ Add New Bot</span>
          </button>
        </div>
      )}

      {/* Helper Banner */}
      <div
        className={`rounded-xl border p-4 ${
          derivedTheme === "dark"
            ? "border-sky-900/60 bg-info/20 text-info"
            : "border-sky-100 bg-info/60 text-info"
        }`}
      >
        <p className="text-xs leading-relaxed">
          Connect your Telegram Bots to manage automated notifications, support, or order updates.
          Create bots via{" "}
          <a
            href="https://t.me/BotFather"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline transition hover:text-info"
          >
            @BotFather
          </a>
          .
        </p>
      </div>

      {/* Bots List */}
      <div className="space-y-3">
        {bots.length === 0 && !showAddForm && (
          <div
            className={`rounded-xl border-2 border-dashed py-12 text-center ${
              derivedTheme === "dark"
                ? "border-slate-800 bg-muted text-muted-foreground"
                : "border-slate-200 bg-muted text-muted-foreground"
            }`}
          >
            <CpuChipIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground dark:text-white">
              No Bots Connected
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Add your first Telegram bot to activate automated message delivery.
            </p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-3 text-xs font-semibold text-info hover:underline dark:text-info"
            >
              Connect a Bot
            </button>
          </div>
        )}

        {bots.map((bot) => (
          <div
            key={bot.id}
            className={`flex items-center justify-between rounded-xl border p-4 shadow-xs transition-colors ${
              derivedTheme === "dark"
                ? "border-slate-800 bg-muted"
                : "border-slate-200/80 bg-white"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  derivedTheme === "dark"
                    ? "bg-sky-950/50 text-info"
                    : "bg-sky-100 text-info"
                }`}
              >
                <CpuChipIcon className="h-5 w-5" />
              </div>
              <div>
                <h3
                  className={`text-sm font-bold ${
                    derivedTheme === "dark" ? "text-white" : "text-slate-900"
                  }`}
                >
                  {bot.label}
                </h3>
                <div className="flex items-center gap-2 pt-0.5 text-xs text-muted-foreground">
                  <span className="font-mono tabular-nums">@{bot.username || "unknown_bot"}</span>
                  {bot.running ? (
                    <span className="rounded-full bg-success/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-success dark:bg-success/40 dark:text-success">
                      Running
                    </span>
                  ) : (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-destructive dark:bg-destructive/40 dark:text-destructive">
                      Stopped
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onDisconnect(bot.id)}
              disabled={isLoading}
              className="rounded-xl border border-border px-3.5 py-1.5 text-xs font-semibold text-destructive transition hover:border-destructive hover:bg-destructive/10 dark:border-border dark:text-destructive dark:hover:bg-destructive/30"
            >
              Disconnect
            </button>
          </div>
        ))}
      </div>

      <TelegramAddBotModal
        showAddForm={showAddForm}
        onClose={() => setShowAddForm(false)}
        newBotLabel={newBotLabel}
        setNewBotLabel={setNewBotLabel}
        newBotToken={newBotToken}
        setNewBotToken={setNewBotToken}
        onConnect={onConnect}
        isLoading={isLoading}
        derivedTheme={derivedTheme}
      />
    </div>
  );
}