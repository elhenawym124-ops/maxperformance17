import React from "react";
import { ClockIcon, UserIcon } from "@heroicons/react/24/outline";
import { formatDate, TicketLog } from "./types";

interface TicketLogsCardProps {
  logs: TicketLog[];
}

export const TicketLogsCard: React.FC<TicketLogsCardProps> = ({ logs }) => {
  if (!logs || logs.length === 0) return null;

  return (
    <div className="mt-6 rounded-lg bg-white p-6 shadow dark:bg-muted dark:shadow-black/20">
      <div className="flex items-center gap-3 mb-6">
        <ClockIcon className="w-6 h-6 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          سجل التذكرة
        </h2>
        <span className="text-sm text-muted-foreground font-mono tabular-nums">
          ({logs.length} سجل)
        </span>
      </div>

      <div className="space-y-3">
        {logs.map((log, index) => {
          const desc =
            typeof log.description === "object"
              ? log.description?.ar || "لا يوجد وصف"
              : log.description || "لا يوجد وصف";

          return (
            <div
              key={log.id || index}
              className="rounded-lg border-r-4 border-primary bg-muted p-4 dark:bg-muted"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="mb-2 text-sm text-foreground">
                    {desc}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <UserIcon className="w-3 h-3" />
                    <span>{log.user?.full_name || "مستخدم"}</span>
                    <span>•</span>
                    <span className="font-mono tabular-nums">{formatDate(log.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
