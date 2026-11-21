import React from "react";
import { AlertTriangle, XCircle } from "lucide-react";

import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { DashboardData } from "./types";

interface SuperAdminAlertsPanelProps {
  alerts: DashboardData["alerts"];
}

const ALERT_CATEGORY_TRANSLATIONS: Record<string, string> = {
  AUTH: "دخول",
  AUTHENTICATION: "دخول",
  LOGIN: "تسجيل دخول",
  SECURITY: "أمان",
  SYSTEM: "النظام",
  DATABASE: "قاعدة البيانات",
  USER: "المستخدم",
  COMPANY: "الشركات",
  API: "واجهة البرمجة",
  ORDER: "الطلبات",
  PAYMENT: "المدفوعات",
  QUOTA: "الكوتا",
  GENERAL: "عام",
};

export const formatAlertCategory = (category?: string): string => {
  if (!category) return "تنبيه";
  const key = category.toUpperCase().trim();
  return ALERT_CATEGORY_TRANSLATIONS[key] || category;
};

export const cleanAlertMessage = (msg?: string): string => {
  if (!msg) return "";
  return msg.replace(/\s*[-–—]?\s*السبب:\s*0+\b/g, "").trim();
};

export const SuperAdminAlertsPanel: React.FC<SuperAdminAlertsPanelProps> = ({
  alerts,
}) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/80 bg-card/40 p-4 shadow-xs">
      <div className="mb-3.5 flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg border border-border/80 bg-muted/30 flex items-center justify-center text-warning">
            <AlertTriangle className="size-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-foreground">
              تنبيهات المنظومة
            </h3>
            <p className="text-[10px] text-muted-foreground">
              أحدث الأحداث الأمنية والتشغيلية
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono">
          {alerts.length} تنبيه
        </Badge>
      </div>
      <div className="space-y-2">
        {alerts.map((a) => (
          <div
            key={a.id}
            className={cn(
              "flex items-start gap-2.5 rounded-lg border p-2.5 text-xs transition-colors",
              a.type === "error"
                ? "border-rose-500/20 bg-destructive/5"
                : "border-amber-500/20 bg-warning/5",
            )}
          >
            {a.type === "error" ? (
              <XCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
            ) : (
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">
                {cleanAlertMessage(a.message)}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground mt-0.5 tabular-nums">
                {formatAlertCategory(a.category)} ·{" "}
                {new Date(a.timestamp).toLocaleDateString("ar-EG", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
