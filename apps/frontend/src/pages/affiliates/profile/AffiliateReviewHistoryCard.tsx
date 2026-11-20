import React from "react";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { AffiliateReviewHistoryItem } from "./types";
import { formatDate } from "./helpers";

interface AffiliateReviewHistoryCardProps {
  reviewHistory: AffiliateReviewHistoryItem[];
}

export const AffiliateReviewHistoryCard: React.FC<AffiliateReviewHistoryCardProps> = ({
  reviewHistory,
}) => {
  return (
    <section className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <ClipboardDocumentListIcon className="h-5 w-5" />
        سجل القرارات
      </h2>
      <div className="mt-4 space-y-3">
        {reviewHistory.map((log) => (
          <div
            key={log.id}
            className="rounded-xl border border-border p-3 text-sm dark:border-border"
          >
            <div className="font-semibold">{log.title}</div>
            <div className="mt-1 text-xs text-muted-foreground tabular-nums">
              {formatDate(log.createdAt)}
            </div>
            {log.note ? (
              <p className="mt-2 text-xs text-foreground dark:text-muted-foreground">
                {log.note}
              </p>
            ) : null}
          </div>
        ))}
        {reviewHistory.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            لا يوجد سجل مراجعات.
          </p>
        ) : null}
      </div>
    </section>
  );
};
