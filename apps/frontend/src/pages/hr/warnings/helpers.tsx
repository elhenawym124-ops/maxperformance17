import React from "react";
import { Badge } from "../../../components/ui/badge";

export const getTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    VERBAL: "شفوي",
    WRITTEN: "كتابي",
    FINAL: "نهائي",
    TERMINATION: "إنهاء خدمة",
  };
  return typeMap[type] || type;
};

export const getTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    VERBAL:
      "bg-blue-100 text-primary dark:bg-primary/30 dark:text-primary",
    WRITTEN:
      "bg-yellow-100 text-warning dark:bg-warning/30 dark:text-warning",
    FINAL:
      "bg-orange-100 text-warning dark:bg-warning/30 dark:text-warning",
    TERMINATION:
      "bg-red-100 text-destructive dark:bg-destructive/30 dark:text-destructive",
  };
  return colorMap[type] || "bg-gray-100 text-foreground";
};

export const getSeverityBadge = (severity: string): React.ReactNode => {
  const styles: Record<string, string> = {
    minor:
      "bg-slate-100 text-foreground border-border dark:bg-muted dark:text-muted-foreground",
    moderate:
      "bg-orange-100 text-warning border-warning dark:bg-warning/20 dark:text-warning",
    severe:
      "bg-red-100 text-destructive border-destructive dark:bg-destructive/20 dark:text-destructive",
  };
  const labels: Record<string, string> = {
    minor: "مخالفة بسيطة",
    moderate: "مخالفة متوسطة",
    severe: "مخالفة جسيمة",
  };

  return (
    <Badge
      variant="outline"
      className={`${styles[severity] || ""} text-xs font-normal`}
    >
      {labels[severity] || severity}
    </Badge>
  );
};
