import React from "react";
import { Clock, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const map: Record<string, string> = {
    scheduled: "bg-fuchsia-100 text-primary dark:bg-primary/40 dark:text-primary",
    sent: "bg-emerald-100 text-success dark:bg-success/40 dark:text-success",
    failed: "bg-red-100 text-destructive dark:bg-destructive/40 dark:text-destructive",
    inactive: "bg-gray-100 text-muted-foreground dark:bg-muted dark:text-muted-foreground",
    unknown: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  };
  const icons: Record<string, React.ReactNode> = {
    scheduled: <Clock className="h-3 w-3" />,
    sent: <CheckCircle2 className="h-3 w-3" />,
    failed: <AlertTriangle className="h-3 w-3" />,
    inactive: <HelpCircle className="h-3 w-3" />,
    unknown: <HelpCircle className="h-3 w-3" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${map[status] || map["unknown"]}`}
    >
      {icons[status] || icons["unknown"]}
      {status === "scheduled" ? "مجدولة" : status === "sent" ? "اتبعتت" : status === "failed" ? "فشلت" : status === "inactive" ? "غير مفعّلة" : "غير محدد"}
    </span>
  );
};
