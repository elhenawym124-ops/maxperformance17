import React from "react";
import { UserIcon } from "@heroicons/react/24/outline";
import type { TelegramUserbot, TelegramConnectionStep } from "./types";
import { TelegramUserbotWizard } from "./TelegramUserbotWizard";

export interface TelegramUserbotsTabProps {
  userbots: TelegramUserbot[];
  isLoading: boolean;
  showAddUserbotForm: boolean;
  setShowAddUserbotForm: (show: boolean) => void;
  connectionStep: TelegramConnectionStep;
  newUserbotLabel: string;
  setNewUserbotLabel: (val: string) => void;
  newUserbotApiId: string;
  setNewUserbotApiId: (val: string) => void;
  newUserbotApiHash: string;
  setNewUserbotApiHash: (val: string) => void;
  newUserbotPhone: string;
  setNewUserbotPhone: (val: string) => void;
  verificationCode: string;
  setVerificationCode: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showApiHash: boolean;
  setShowApiHash: (val: boolean) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  onStartConnection: () => void;
  onAskReconnect: (userbot: TelegramUserbot) => void;
  onVerifyCode: () => void;
  onDeleteUserbot: (userbotId: string) => void;
  onToggleInbox: (userbot: TelegramUserbot) => void;
  onResetForm: () => void;
  derivedTheme: string;
}

export function TelegramUserbotsTab({
  userbots,
  isLoading,
  showAddUserbotForm,
  setShowAddUserbotForm,
  connectionStep,
  newUserbotLabel,
  setNewUserbotLabel,
  newUserbotApiId,
  setNewUserbotApiId,
  newUserbotApiHash,
  setNewUserbotApiHash,
  newUserbotPhone,
  setNewUserbotPhone,
  verificationCode,
  setVerificationCode,
  password,
  setPassword,
  showApiHash,
  setShowApiHash,
  showPassword,
  setShowPassword,
  onStartConnection,
  onAskReconnect,
  onVerifyCode,
  onDeleteUserbot,
  onToggleInbox,
  onResetForm,
  derivedTheme,
}: TelegramUserbotsTabProps) {
  return (
    <div className="space-y-6">
      {!showAddUserbotForm && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowAddUserbotForm(true)}
            className="flex items-center gap-2 rounded-xl bg-success px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-success"
          >
            <UserIcon className="h-4 w-4" />
            <span>+ Add New Userbot</span>
          </button>
        </div>
      )}

      {/* Helper Banner */}
      <div
        className={`rounded-xl border p-4 ${
          derivedTheme === "dark"
            ? "border-emerald-900/60 bg-success/20 text-success"
            : "border-emerald-100 bg-success/60 text-success"
        }`}
      >
        <p className="text-xs leading-relaxed">
          Connect your personal Telegram accounts to manage chats directly from the platform.
          Obtain your API credentials from{" "}
          <a
            href="https://my.telegram.org/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline transition hover:text-success"
          >
            my.telegram.org/apps
          </a>
          .
        </p>
      </div>

      {/* Userbots List */}
      <div className="space-y-3">
        {userbots.length === 0 && !showAddUserbotForm && (
          <div
            className={`rounded-xl border-2 border-dashed py-12 text-center ${
              derivedTheme === "dark"
                ? "border-slate-800 bg-muted text-muted-foreground"
                : "border-slate-200 bg-muted text-muted-foreground"
            }`}
          >
            <UserIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground dark:text-white">
              No Userbots Connected
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Add your first Telegram userbot session to handle direct conversations.
            </p>
            <button
              type="button"
              onClick={() => setShowAddUserbotForm(true)}
              className="mt-3 text-xs font-semibold text-success hover:underline dark:text-success"
            >
              Add Userbot
            </button>
          </div>
        )}

        {userbots.map((userbot) => (
          <div
            key={userbot.id}
            className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border p-4 shadow-xs transition-colors ${
              derivedTheme === "dark"
                ? "border-slate-800 bg-muted"
                : "border-slate-200/80 bg-white"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  derivedTheme === "dark"
                    ? "bg-emerald-950/50 text-success"
                    : "bg-emerald-100 text-success"
                }`}
              >
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <h3
                  className={`text-sm font-bold ${
                    derivedTheme === "dark" ? "text-white" : "text-slate-900"
                  }`}
                >
                  {userbot.label || "Telegram Userbot"}
                </h3>
                <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-muted-foreground">
                  <span className="font-mono tabular-nums">
                    API ID: {userbot.apiId ? `***${userbot.apiId.slice(-4)}` : "Not set"}
                  </span>
                  {userbot.sessionString ? (
                    <span className="rounded-full bg-success/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-success dark:bg-success/40 dark:text-success">
                      Connected
                    </span>
                  ) : (
                    <span className="rounded-full bg-warning/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-warning dark:bg-warning/40 dark:text-warning">
                      Not Connected
                    </span>
                  )}
                  {userbot.inboxEnabled && userbot.sessionString && (
                    <span className="rounded-full bg-info/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-info dark:bg-info/40 dark:text-info">
                      Inbox
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {userbot.sessionString && (
                <button
                  type="button"
                  onClick={() => onToggleInbox(userbot)}
                  className={`rounded-xl px-3 py-1.5 font-mono text-[10px] font-bold transition-colors ${
                    userbot.inboxEnabled
                      ? "border border-info bg-info/10 text-info hover:bg-info dark:border-info dark:bg-info/40 dark:text-info"
                      : "border border-border bg-muted text-foreground hover:bg-muted dark:border-border dark:bg-muted dark:text-muted-foreground"
                  }`}
                >
                  {userbot.inboxEnabled ? "Inbox ON" : "Inbox OFF"}
                </button>
              )}
              {!userbot.sessionString && (
                <button
                  type="button"
                  onClick={() => onAskReconnect(userbot)}
                  disabled={isLoading}
                  className="rounded-xl border border-info px-3.5 py-1.5 text-xs font-semibold text-info transition hover:bg-info/10 dark:border-info dark:text-info dark:hover:bg-info/30"
                >
                  Connect
                </button>
              )}
              <button
                type="button"
                onClick={() => onDeleteUserbot(userbot.id)}
                disabled={isLoading}
                className="rounded-xl border border-border px-3.5 py-1.5 text-xs font-semibold text-destructive transition hover:border-destructive hover:bg-destructive/10 dark:border-border dark:text-destructive dark:hover:bg-destructive/30"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <TelegramUserbotWizard
        showAddUserbotForm={showAddUserbotForm}
        connectionStep={connectionStep}
        newUserbotLabel={newUserbotLabel}
        setNewUserbotLabel={setNewUserbotLabel}
        newUserbotApiId={newUserbotApiId}
        setNewUserbotApiId={setNewUserbotApiId}
        newUserbotApiHash={newUserbotApiHash}
        setNewUserbotApiHash={setNewUserbotApiHash}
        newUserbotPhone={newUserbotPhone}
        setNewUserbotPhone={setNewUserbotPhone}
        verificationCode={verificationCode}
        setVerificationCode={setVerificationCode}
        password={password}
        setPassword={setPassword}
        showApiHash={showApiHash}
        setShowApiHash={setShowApiHash}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        isLoading={isLoading}
        onStartConnection={onStartConnection}
        onVerifyCode={onVerifyCode}
        onResetForm={onResetForm}
        derivedTheme={derivedTheme}
      />
    </div>
  );
}