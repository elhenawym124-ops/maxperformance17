import React from "react";
import { Layers, Power, PowerOff } from "lucide-react";

import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";
import { DashboardData } from "./types";

interface SuperAdminSystemServicesProps {
  systems: DashboardData["systems"];
}

const SERVICE_NAME_TRANSLATIONS: Record<string, string> = {
  "Default Agent Template": "القالب الافتراضي للمساعد الذكي",
  "Product Embedding Auto Regeneration": "التحديث التلقائي لتضمين المنتجات",
  "Ready Agent Profiles": "الملفات الجاهزة للمساعد الذكي",
  "Kashier Platform Payment Gateway Settings": "إعدادات بوابة دفع كاشير للمنصة",
  "Platform onboarding settings": "إعدادات التهيئة والترحيب بالمنصة",
  "Platform Default Sidebar": "الشريط الجانبي الافتراضي للمنصة",
  "Support WhatsApp": "دعم واتساب الفني للمنصة",
  "Broadcast Scheduler": "جدولة حملات البث",
  "Billing Notifications": "تنبيهات الفواتير والاشتراكات",
  "Turbo Tracking": "تتبع شحن تيربو",
  "WooCommerce Sync": "مزامنة ووكومرس",
  "Central Keys System": "نظام المفاتيح المركزية",
  "Key Selection": "تحديد المفاتيح",
};

const CATEGORY_TRANSLATIONS: Record<string, string> = {
  ai: "ذكاء اصطناعي",
  platform: "المنصة",
  "platform-site": "موقع المنصة",
  support: "الدعم",
  api_keys: "مفاتيح API",
  monitoring: "مراقبة",
  general: "عام",
  security: "الأمان",
  payment: "المدفوعات",
  billing: "الفواتير",
  messaging: "المراسلة",
};

const RESOURCE_USAGE_TRANSLATIONS: Record<string, string> = {
  unknown: "غير معروف",
  low: "منخفض",
  medium: "متوسط",
  high: "مرتفع",
  none: "لا يوجد",
  healthy: "نشط",
  active: "نشط",
  inactive: "معطل",
  disabled: "معطل",
};

export const formatServiceName = (displayName?: string, systemName?: string): string => {
  if (displayName && SERVICE_NAME_TRANSLATIONS[displayName]) {
    return SERVICE_NAME_TRANSLATIONS[displayName];
  }
  const nameToMatch = (displayName || systemName || "").trim();
  const normalizedSystemName = (systemName || "").replace(/_/g, " ").trim();
  const match = Object.keys(SERVICE_NAME_TRANSLATIONS).find(
    (key) =>
      key.toLowerCase() === nameToMatch.toLowerCase() ||
      key.toLowerCase() === normalizedSystemName.toLowerCase(),
  );
  if (match) return SERVICE_NAME_TRANSLATIONS[match];
  return displayName || systemName || "خدمة النظام";
};

export const formatServiceCategory = (category?: string): string => {
  if (!category) return "عام";
  const key = category.toLowerCase().trim();
  return CATEGORY_TRANSLATIONS[key] || category;
};

export const formatResourceUsage = (usage?: string): string => {
  if (!usage) return "غير معروف";
  const key = usage.toLowerCase().trim();
  return RESOURCE_USAGE_TRANSLATIONS[key] || usage;
};

export const SuperAdminSystemServices: React.FC<SuperAdminSystemServicesProps> = ({
  systems,
}) => {
  if (!systems || systems.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/80 bg-card/40 p-4 shadow-xs">
      <div className="mb-3.5 flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg border border-border/80 bg-muted/30 flex items-center justify-center text-primary">
            <Layers className="size-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-foreground">
              خدمات النظام الأساسية
            </h3>
            <p className="text-[10px] text-muted-foreground">
              حالة تشغيل البوابات والخدمات السحابية
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono">
          {systems.length} خدمة
        </Badge>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {systems.map((s) => (
          <div
            key={s.systemName}
            className="flex items-center justify-between rounded-lg border border-border/70 bg-card/60 p-2.5 hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={cn(
                  "size-7 rounded-md border flex items-center justify-center shrink-0",
                  s.isEnabled
                    ? "border-emerald-500/30 bg-success/10 text-success dark:text-success"
                    : "border-border/80 bg-muted text-muted-foreground",
                )}
              >
                {s.isEnabled ? (
                  <Power className="size-3.5" />
                ) : (
                  <PowerOff className="size-3.5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {formatServiceName(s.displayName, s.systemName)}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground">
                  {formatServiceCategory(s.category)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono text-muted-foreground">
                {formatResourceUsage(s.resourceUsage)}
              </span>
              <div
                className={cn(
                  "size-1.5 rounded-full",
                  s.isEnabled ? "bg-emerald-500" : "bg-muted-foreground/40",
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
