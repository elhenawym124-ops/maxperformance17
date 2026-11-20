import React from "react";
import { Cloud, Smartphone, HelpCircle } from "lucide-react";
import { RoutingInfo } from "./types";
import { normalizeDigits } from "./formatters";

interface SourceBadgeProps {
  source: RoutingInfo;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ source }) => {
  const base =
    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold";
  if (source.key === "meta") {
    return (
      <span
        className={`${base} bg-info text-info dark:bg-info/40 dark:text-info`}
        title={normalizeDigits(source.desc)}
      >
        <Cloud className="h-3 w-3" />
        Meta Cloud API
      </span>
    );
  }
  if (source.key === "wa") {
    return (
      <span
        className={`${base} bg-success text-success dark:bg-success/40 dark:text-success`}
        title={normalizeDigits(source.desc)}
      >
        <Smartphone className="h-3 w-3" />
        واتساب عادي
      </span>
    );
  }
  return (
    <span
      className={`${base} bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground`}
      title={normalizeDigits(source.desc)}
    >
      <HelpCircle className="h-3 w-3" />
      غير محدد
    </span>
  );
};
