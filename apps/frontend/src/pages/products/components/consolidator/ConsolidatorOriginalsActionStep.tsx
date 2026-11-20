import React from "react";
import { ORIGINALS_ACTIONS } from "./types";

interface ConsolidatorOriginalsActionStepProps {
  originalsAction: string;
  onSetOriginalsAction: (action: string) => void;
}

export const ConsolidatorOriginalsActionStep: React.FC<ConsolidatorOriginalsActionStepProps> = ({
  originalsAction,
  onSetOriginalsAction,
}) => {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-foreground mb-2">
        5. ماذا يحدث للمنتجات الأصلية؟
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {ORIGINALS_ACTIONS.map((action) => (
          <button
            key={action.value}
            type="button"
            onClick={() => onSetOriginalsAction(action.value)}
            className={`border rounded-lg p-3 text-right transition-colors cursor-pointer ${
              originalsAction === action.value
                ? "border-indigo-500 bg-primary/10 dark:bg-primary/20"
                : "border-gray-200 dark:border-border bg-card hover:border-border"
            }`}
          >
            <p className="text-sm font-medium text-foreground">
              {action.label}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {action.hint}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
