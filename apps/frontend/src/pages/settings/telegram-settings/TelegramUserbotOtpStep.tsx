import React from "react";

export interface TelegramUserbotOtpStepProps {
  verificationCode: string;
  setVerificationCode: (val: string) => void;
  isLoading: boolean;
  onVerifyCode: () => void;
  onResetForm: () => void;
  derivedTheme: string;
}

export function TelegramUserbotOtpStep({
  verificationCode,
  setVerificationCode,
  isLoading,
  onVerifyCode,
  onResetForm,
  derivedTheme,
}: TelegramUserbotOtpStepProps) {
  return (
    <>
      <div className="rounded-xl border border-warning bg-warning/10 p-4 dark:border-warning/60 dark:bg-warning/20">
        <p className="text-xs text-warning dark:text-warning leading-relaxed">
          We&apos;ve sent a verification code to your Telegram account (not SMS). Please check your Telegram app messages.
        </p>
      </div>
      <div>
        <label
          className={`block text-xs font-semibold ${
            derivedTheme === "dark" ? "text-slate-300" : "text-slate-700"
          } mb-1`}
        >
          Verification Code <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          placeholder="12345"
          maxLength={5}
          className={`w-full rounded-xl border p-3 text-center font-mono text-base tracking-widest outline-none transition focus:border-success focus:ring-1 focus:ring-success ${
            derivedTheme === "dark"
              ? "border-slate-700 bg-muted text-white placeholder-muted"
              : "border-slate-300 bg-white text-foreground placeholder-muted"
          }`}
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onVerifyCode}
          disabled={isLoading || !verificationCode}
          className={`flex-1 rounded-xl py-2.5 text-xs font-semibold text-white transition-all ${
            isLoading || !verificationCode
              ? "cursor-not-allowed bg-success dark:bg-success/50"
              : "bg-emerald-600 hover:bg-success shadow-xs"
          }`}
        >
          {isLoading ? "Verifying..." : "Verify Code"}
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