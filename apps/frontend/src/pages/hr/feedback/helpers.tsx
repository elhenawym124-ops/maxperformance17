import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock } from "lucide-react";

export const getTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    PEER: "زميل",
    MANAGER: "مدير",
    SUBORDINATE: "مرؤوس",
    SELF: "ذاتي",
    GENERAL: "عام",
    OTHER: "آخر",
  };
  return typeMap[type] || type;
};

export const getTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    PEER: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    MANAGER:
      "bg-purple-100 text-primary border-primary dark:bg-primary/30 dark:text-primary dark:border-primary",
    SUBORDINATE:
      "bg-green-100 text-success border-success dark:bg-success/30 dark:text-success dark:border-success",
    SELF: "bg-orange-100 text-warning border-warning dark:bg-warning/30 dark:text-warning dark:border-warning",
    GENERAL:
      "bg-gray-100 text-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border",
  };
  return (
    colorMap[type] ||
    "bg-gray-100 text-foreground border-border dark:bg-muted"
  );
};

export const getStatusBadge = (status: string): React.ReactNode => {
  switch (status) {
    case "RESOLVED":
      return (
        <Badge className="bg-green-100 text-success border-success dark:bg-success/30 dark:text-success">
          <CheckCircle2 className="h-3 w-3 ms-1" />
          تم الرد
        </Badge>
      );
    default:
      return (
        <Badge className="bg-amber-100 text-warning border-warning dark:bg-warning/30 dark:text-warning">
          <Clock className="h-3 w-3 ms-1" />
          قيد الانتظار
        </Badge>
      );
  }
};
