import React from "react";
import {
  Settings,
  Clock,
  Calendar,
  DollarSign,
  Gift,
  MapPin,
  AlertOctagon,
  UserCheck,
  Briefcase,
  Laptop,
  Shield,
  Bell,
  Save,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { ShopifyPageHeader } from "@/components/layout/ShopifyPageHeader";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface PolarisHRSettingsViewProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  hasUnsavedChanges: boolean;
  errors: Record<string, string>;
  saving: boolean;
  onSave: () => void;
  onRefresh: () => void;
  children: React.ReactNode;
}

export const PolarisHRSettingsView: React.FC<PolarisHRSettingsViewProps> = ({
  activeTab,
  onTabChange,
  hasUnsavedChanges,
  errors,
  saving,
  onSave,
  onRefresh,
  children,
}) => {
  const tabs: TabItem[] = [
    { id: "working-hours", label: "ساعات العمل والدوام", icon: Clock },
    { id: "leaves", label: "سياسات الإجازات", icon: Calendar },
    { id: "payroll", label: "إعدادات الرواتب", icon: DollarSign },
    { id: "allowances", label: "البدلات والمزايا", icon: Gift },
    { id: "attendance", label: "نطاق البصمة الجغرافي", icon: MapPin },
    { id: "discipline", label: "لائحة الجزاءات", icon: AlertOctagon },
    { id: "probation", label: "فترة التجربة", icon: UserCheck },
    { id: "employment", label: "عقود التعيين", icon: Briefcase },
    { id: "remote", label: "العمل عن بُعد", icon: Laptop },
    { id: "security", label: "الأمان والصلاحيات", icon: Shield },
    { id: "notifications", label: "إشعارات WhatsApp", icon: Bell },
  ];

  const errorsCount = Object.keys(errors).length;

  return (
    <div className="space-y-4 w-full max-w-full" dir="rtl">
      {/* Polaris Page Header */}
      <ShopifyPageHeader
        title="إعدادات وسياسات الموارد البشرية"
        subtitle="الضبط الشامل للائحة العمل، ساعات الدوام، العطلات، الحساب المالي للرواتب، والموقع الجغرافي للبصمة"
        badges={[
          ...(hasUnsavedChanges
            ? [{ label: "تعديلات غير محفوظة", variant: "destructive" as const }]
            : []),
          ...(errorsCount > 0
            ? [{ label: `${errorsCount} تنبيهات ضبط`, variant: "destructive" as const }]
            : [{ label: "الإعدادات سارية ومحفوظة", variant: "default" as const }]),
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              تحديث
            </Button>
            <Button
              size="sm"
              onClick={onSave}
              disabled={saving}
              className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground font-medium shadow-xs disabled:opacity-50"
            >
              <Save className={`h-3.5 w-3.5 ${saving ? "animate-spin" : ""}`} />
              <span>{saving ? "جاري الحفظ..." : "حفظ التغييرات"}</span>
            </Button>
          </div>
        }
      />

      {/* Main Single-Surface Polaris Card Chassis */}
      <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
        {/* Segmented Horizontal Domain Tabs */}
        <div className="border-b border-border/70 bg-muted/20 px-3 pt-2">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const hasError = errors[tab.id];

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{tab.label}</span>
                  {hasError && (
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Body */}
        <CardContent className="p-4 sm:p-6 [&>div.rounded-xl]:border-0 [&>div.rounded-xl]:shadow-none [&>div.rounded-xl]:p-0">
          {children}
        </CardContent>
      </Card>
    </div>
  );
};
