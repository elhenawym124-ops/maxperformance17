import React from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export interface TelegramUserbotInitStepProps {
  newUserbotLabel: string;
  setNewUserbotLabel: (val: string) => void;
  newUserbotApiId: string;
  setNewUserbotApiId: (val: string) => void;
  newUserbotApiHash: string;
  setNewUserbotApiHash: (val: string) => void;
  newUserbotPhone: string;
  setNewUserbotPhone: (val: string) => void;
  showApiHash: boolean;
  setShowApiHash: (val: boolean) => void;
  isLoading: boolean;
  onStartConnection: () => void;
  onResetForm: () => void;
  derivedTheme: string;
}

export function TelegramUserbotInitStep({
  newUserbotLabel,
  setNewUserbotLabel,
  newUserbotApiId,
  setNewUserbotApiId,
  newUserbotApiHash,
  setNewUserbotApiHash,
  newUserbotPhone,
  setNewUserbotPhone,
  showApiHash,
  setShowApiHash,
  isLoading,
  onStartConnection,
  onResetForm,
  derivedTheme,
}: TelegramUserbotInitStepProps) {
  return (
    <>
      <div>
        <label
          className={`block text-xs font-semibold ${
            derivedTheme === "dark" ? "text-slate-300" : "text-slate-700"
          } mb-1`}
        >
          Label (Optional)
        </label>
        <input
          type="text"
          value={newUserbotLabel}
          onChange={(e) => setNewUserbotLabel(e.target.value)}
          placeholder="e.g. Personal Account, Sales Account"
          className={`w-full rounded-xl border p-3 text-xs outline-none transition focus:border-success focus:ring-1 focus:ring-success ${
            derivedTheme === "dark"
              ? "border-slate-700 bg-muted text-white placeholder-muted"
              : "border-slate-300 bg-white text-foreground placeholder-muted"
          }`}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label
            className={`block text-xs font-semibold ${
              derivedTheme === "dark" ? "text-slate-300" : "text-slate-700"
            } mb-1`}
          >
            API ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={newUserbotApiId}
            onChange={(e) => setNewUserbotApiId(e.target.value)}
            placeholder="12345678"
            className={`w-full rounded-xl border p-3 font-mono text-xs outline-none transition focus:border-success focus:ring-1 focus:ring-success ${
              derivedTheme === "dark"
                ? "border-slate-700 bg-muted text-white placeholder-muted"
                : "border-slate-300 bg-white text-foreground placeholder-muted"
            }`}
          />
        </div>
        <div>
          <label
            className={`block text-xs font-semibold ${
              derivedTheme === "dark" ? "text-slate-300" : "text-slate-700"
            } mb-1`}
          >
            API Hash <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showApiHash ? "text" : "password"}
              value={newUserbotApiHash}
              onChange={(e) => setNewUserbotApiHash(e.target.value)}
              placeholder="API Hash"
              className={`w-full rounded-xl border p-3 font-mono text-xs pe-12 outline-none transition focus:border-success focus:ring-1 focus:ring-success ${
                derivedTheme === "dark"
                  ? "border-slate-700 bg-muted text-white placeholder-muted"
                  : "border-slate-300 bg-white text-foreground placeholder-muted"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowApiHash(!showApiHash)}
              aria-label={showApiHash ? "Hide API Hash" : "Show API Hash"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground"
            >
              {showApiHash ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
      <p className="-mt-1 text-[11px] text-muted-foreground">
        Get API credentials from{" "}
        <a
          href="https://my.telegram.org/apps"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-success underline dark:text-success"
        >
          my.telegram.org/apps
        </a>
      </p>

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
          disabled={isLoading || !newUserbotApiId || !newUserbotApiHash || !newUserbotPhone}
          className={`flex-1 rounded-xl py-2.5 text-xs font-semibold text-white transition-all ${
            isLoading || !newUserbotApiId || !newUserbotApiHash || !newUserbotPhone
              ? "cursor-not-allowed bg-success dark:bg-success/50"
              : "bg-emerald-600 hover:bg-success shadow-xs"
          }`}
        >
          {isLoading ? "Sending Code..." : "Next & Send Code"}
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