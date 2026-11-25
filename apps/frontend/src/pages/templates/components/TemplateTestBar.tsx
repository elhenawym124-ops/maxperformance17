import React from "react";
import { Label } from "@/components/ui/label";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import type { StatusWithTemplate } from "../types";

export interface TemplateTestBarProps {
  testPhone: string;
  setTestPhone: (phone: string) => void;
  testEvent: string;
  setTestEvent: (event: string) => void;
  testing: boolean;
  onSendTest: () => void;
  statuses: StatusWithTemplate[];
}

export default function TemplateTestBar({
  testPhone,
  setTestPhone,
  testEvent,
  setTestEvent,
  testing,
  onSendTest,
  statuses,
}: TemplateTestBarProps) {
  return (
    <div className="mb-4 min-w-0 overflow-hidden rounded-xl border border-border/70 bg-card p-3.5 sm:p-4">
      <h2 className="mb-2 text-sm font-bold text-foreground">
        إرسال تجريبي
      </h2>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-full sm:basis-auto">
          <Label htmlFor="test-phone" className="text-xs text-muted-foreground">
            رقم الهاتف
          </Label>
          <input
            id="test-phone"
            type="tel"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="01000000000"
            className="mt-1 w-full min-w-0 rounded-lg border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>
        <div className="min-w-0 w-full sm:w-auto">
          <Label htmlFor="test-event" className="text-xs text-muted-foreground">
            الحدث
          </Label>
          <select
            id="test-event"
            value={testEvent}
            onChange={(e) => setTestEvent(e.target.value)}
            className="mt-1 w-full min-w-0 max-w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">اختر الحدث...</option>
            {statuses.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={onSendTest}
          disabled={testing}
          className="flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          <PaperAirplaneIcon className="h-4 w-4" />
          {testing ? "جارٍ الإرسال..." : "إرسال تجريبي"}
        </button>
      </div>
    </div>
  );
}
