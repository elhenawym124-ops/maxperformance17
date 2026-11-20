import React from "react";

export const PreparationOrdersLoadingState: React.FC = React.memo(() => {
  return (
    <div className="space-y-0">
      {[1, 2, 3, 4, 5].map((row) => (
        <div
          key={row}
          className="flex animate-pulse items-center gap-3 border-b border-border px-4 py-3 dark:dark:border-border"
        >
          <div className="h-4 w-4 rounded bg-muted dark:dark:bg-muted" />
          <div className="h-4 w-16 rounded bg-muted dark:dark:bg-muted" />
          <div className="h-4 w-24 rounded bg-muted dark:dark:bg-muted" />
          <div className="me-auto h-4 w-20 rounded bg-muted dark:dark:bg-muted" />
        </div>
      ))}
    </div>
  );
});

PreparationOrdersLoadingState.displayName = "PreparationOrdersLoadingState";
