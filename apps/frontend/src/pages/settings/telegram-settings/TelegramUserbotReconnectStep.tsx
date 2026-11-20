import React from "react";

export interface TelegramUserbotReconnectStepProps {
  newUserbotLabel: string;
  newUserbotPhone: string;
  setNewUserbotPhone: (val: string) => void;
  isLoading: boolean;
  onStartConnection: () => void;
  onResetForm: () => void;
  derivedTheme: string;
}

export function TelegramUserbotReconnectStep({
  newUserbotLabel,
  newUserbotPhone,
  setNewUserbotPhone,
  isLoading,
  onStartConnection,
  onResetForm,
  derivedTheme,
}: TelegramUserbotReconnectStepProps) {
  return (
    <>
      <div className="rounded-xl border border-info bg-info/60 p-4 dark:border-info/60 dark:bg-info/20">
        <p className="text-xs text-info dark:text-info leading-relaxed">
          Enter your phone number to receive a login code for <strong>{newUserbotLabel}</strong>.
          <span className="block mt-1 text-[11px] text-muted-foreground">
            API Credentials are already safely stored.
          </span>
        </p>
      </div>
      <div>
        <label
          className={`block text-xs font-semibold ${
            derivedTheme === "dark" ? "text-slate-300" : "text-slate-700"
          } mb-1`}
        >
          Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={newUserbotPhone}
          onChange={(e) => setNewUserbotPhone(e.target.value)}
          placeholder="+1234567890"
          className={`w-full rounded-xl border p-3 font-mono text-xs outline-none transition focus:border-success focus:ring-1 focus:ring-success ${
            derivedTheme === "dark"
              ? "border-slate-700 bg-muted text-white placeholder-muted"
              : "border-slate-300 bg-white text-foreground placeholder-muted"
          }`}
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onStartConnection}
          disabled={isLoading || !newUserbotPhone}
          className={`flex-1 rounded-xl py-2.5 text-xs font-semibold text-white transition-all ${
            isLoading || !newUserbotPhone
              ? "cursor-not-allowed bg-success dark:bg-success/50"
              : "bg-emerald-600 hover:bg-success shadow-xs"
          }`}
        >
          {isLoading ? "Sending Code..." : "Send Login Code"}
        </button>
        <button
          type="button"
          onClick={onResetForm}
          disabled={isLoading}
          className="rounded-xl border border-border px-5 py-2.5 text-xs font-semibold text-foreground transition hover:bg-muted dark:border-border dark:text-muted-foreground dark:hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </>
  );
}