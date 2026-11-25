import React from "react";
import type { EventRow } from "../types";

export interface GroupHeaderProps {
  members: EventRow[];
  isNoTemplate: boolean;
  onExpand: () => void;
}

export const GroupHeader: React.FC<GroupHeaderProps> = ({
  members,
  isNoTemplate,
  onExpand,
}) => {
  return (
    <div
      data-testid="group-header"
      className="min-w-0 overflow-hidden rounded-lg border border-border/70 bg-card p-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {isNoTemplate
              ? `${members.length} حالة بدون قالب`
              : `${members.length} حالة بنفس القالب العام`}
          </span>
          <button
            onClick={onExpand}
            className="text-xs text-primary hover:underline font-semibold"
          >
            عرض التفاصيل
          </button>
        </div>
        <span className="max-w-full truncate rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground font-mono">
          {members.map((m) => m.code).slice(0, 5).join("، ")}
          {members.length > 5 ? "…" : ""}
        </span>
      </div>
      {!isNoTemplate && (members[0]?.template?.content || members[0]?.metaTemplate?.content) && (
        <p className="mt-2 line-clamp-1 text-xs italic text-slate-500 dark:text-slate-500">
          "{(members[0].template?.content || members[0].metaTemplate?.content || "").substring(0, 80)}…"
        </p>
      )}
    </div>
  );
};

export default GroupHeader;
