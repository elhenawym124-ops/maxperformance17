import React from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export interface TelegramUserbot2faStepProps {
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  isLoading: boolean;
  onVerifyCode: () => void;
  onResetForm: () => void;
  derivedTheme: string;
}

export function TelegramUserbot2faStep({
  password,
  setPassword,
  showPassword,
  setShowPassword,
  isLoading,
  onVerifyCode,
  onResetForm,
  derivedTheme,
}: TelegramUserbot2faStepProps) {
  return (
    <>
      <div className="rounded-xl border border-destructive bg-destructive/10 p-4 dark:border-destructive/60 dark:bg-destructive/20">
        <p className="text-xs text-destructive dark:text-destructive leading-relaxed">
          Two-Step Verification is enabled on this account. Please enter your cloud password.
        </p>
      </div>
      <div>
        <label
          className={`block text-xs font-semibold ${
            derivedTheme === "dark" ? "text-slate-300" : "text-slate-700"
          } mb-1`}
        >
          Cloud Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your 2FA Password"
            className={`w-full rounded-xl border p-3 text-xs pe-12 outline-none transition focus:border-success focus:ring-1 focus:ring-success ${
              derivedTheme === "dark"
                ? "border-slate-700 bg-muted text-white placeholder-muted"
                : "border-slate-300 bg-white text-foreground placeholder-muted"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground"
          >
            {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onVerifyCode}
          disabled={isLoading || !password}
          className={`flex-1 rounded-xl py-2.5 text-xs font-semibold text-white transition-all ${
            isLoading || !password
              ? "cursor-not-allowed bg-success dark:bg-success/50"
              : "bg-emerald-600 hover:bg-success shadow-xs"
          }`}
        >
          {isLoading ? "Verifying..." : "Complete Login"}
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