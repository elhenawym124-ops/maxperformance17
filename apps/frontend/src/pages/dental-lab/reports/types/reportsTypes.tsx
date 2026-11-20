import React, { type ReactNode } from "react";
import { FileText } from "lucide-react";

export type ReportView =
  | "statement"
  | "productivity"
  | "revenue"
  | "overdue"
  | "aging"
  | "remakes";

export interface ReportsKpi {
  todayReceived: number;
  overdueCount: number;
  revenue: number;
  outstanding: number;
}

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

export const monthStartISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

export const inputCls =
  "w-full border rounded-lg px-3 py-2 text-sm bg-card dark:border-border dark:text-muted-foreground";
export const dateCls =
  "border rounded-lg px-3 py-2 text-sm bg-card dark:border-border dark:text-muted-foreground max-w-[160px] font-mono";
export const tableWrap =
  "overflow-x-auto border border-border dark:border-border rounded-xl";
export const thCls =
  "text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground bg-muted dark:bg-muted";
export const tdCls = "py-2.5 px-3 text-sm";
export const chartText = { fontSize: 11, fill: "#6b7280" };

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2 py-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-10 rounded-lg bg-muted dark:bg-muted animate-pulse"
        />
      ))}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-xl bg-muted dark:bg-muted flex items-center justify-center mb-3">
        <FileText className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
