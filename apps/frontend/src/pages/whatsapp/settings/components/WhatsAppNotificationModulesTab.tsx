import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Building2,
  CheckSquare,
  ExternalLink,
  Megaphone,
  RefreshCw,
  Save,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { apiClient, type ApiRequestConfig } from "@/services/apiClient";
import { WhatsAppSurfaceCard } from "../../components/WhatsAppPageShell";

interface ModuleSettingsState {
  productNotificationsEnabled: boolean;
  backInStockEnabled: boolean;
  priceDropEnabled: boolean;
  newProductEnabled: boolean;
  marketingNotificationsEnabled: boolean;
  promotionalEnabled: boolean;
  couponEnabled: boolean;
  birthdayEnabled: boolean;
  loyaltyEnabled: boolean;
  hrNotificationsEnabled: boolean;
  attendanceReminderEnabled: boolean;
  attendanceConfirmedEnabled: boolean;
  checkoutConfirmedEnabled: boolean;
  leaveApprovalEnabled: boolean;
  permissionApprovalEnabled: boolean;
  payrollEnabled: boolean;
  birthdayWishEnabled: boolean;
  warningNotificationEnabled: boolean;
  taskNotificationsEnabled: boolean;
  taskCreatedEnabled: boolean;
  taskStatusChangedEnabled: boolean;
  taskCommentedEnabled: boolean;
  taskDeadlineReminderEnabled: boolean;
  taskOverdueEnabled: boolean;
  taskWatcherAddedEnabled: boolean;
  taskAttachmentAddedEnabled: boolean;
  companyLifecycleNotificationsEnabled: boolean;
  newSignupWelcomeEnabled: boolean;
  newSignupAdminAlertEnabled: boolean;
  companyLifecycleAdminPhones: string | null;
  subscriptionCreatedEnabled: boolean;
  subscriptionRenewedEnabled: boolean;
  subscriptionCancelledEnabled: boolean;
}

type BooleanSettingKey = Exclude<keyof ModuleSettingsState, "companyLifecycleAdminPhones">;

interface SectionConfig {
  id: string;
  title: string;
  masterKey: BooleanSettingKey;
  icon: React.ComponentType<{ className?: string }>;
  items: { key: BooleanSettingKey; label: string }[];
  superAdminOnly?: boolean;
}

const SECTIONS: SectionConfig[] = [
  {
    id: "products",
    title: "تنبيهات المنتجات والمخزون",
    masterKey: "productNotificationsEnabled",
    icon: ShoppingBag,
    items: [
      { key: "backInStockEnabled", label: "توفر المنتج بعد النفاد" },
      { key: "priceDropEnabled", label: "انخفاض سعر المنتج" },
      { key: "newProductEnabled", label: "إطلاق منتجات جديدة" },
    ],
  },
  {
    id: "marketing",
    title: "الإشعارات التسويقية والولاء",
    masterKey: "marketingNotificationsEnabled",
    icon: Megaphone,
    items: [
      { key: "promotionalEnabled", label: "العروض والرسائل الترويجية" },
      { key: "couponEnabled", label: "كوبونات الخصم والمكافآت" },
      { key: "birthdayEnabled", label: "تهنئة أعياد الميلاد" },
      { key: "loyaltyEnabled", label: "تنبيهات برنامج الولاء" },
    ],
  },
  {
    id: "hr",
    title: "الموارد البشرية وشؤون الموظفين",
    masterKey: "hrNotificationsEnabled",
    icon: Briefcase,
    items: [
      { key: "attendanceReminderEnabled", label: "تذكير الحضور الصباحي" },
      { key: "attendanceConfirmedEnabled", label: "تأكيد تسجيل الحضور" },
      { key: "checkoutConfirmedEnabled", label: "تأكيد تسجيل الانصراف" },
      { key: "leaveApprovalEnabled", label: "قرارات طلبات الإجازات" },
      { key: "permissionApprovalEnabled", label: "قرارات طلبات الأذونات" },
      { key: "payrollEnabled", label: "إشعار إصدار الراتب الشهري" },
      { key: "birthdayWishEnabled", label: "تهنئة يوم ميلاد الموظف" },
      { key: "warningNotificationEnabled", label: "تنبيهات الحضور ولفت النظر" },
    ],
  },
  {
    id: "tasks",
    title: "المهام وإدارة المشاريع",
    masterKey: "taskNotificationsEnabled",
    icon: CheckSquare,
    items: [
      { key: "taskCreatedEnabled", label: "إنشاء مهمة جديدة للمنفذ" },
      { key: "taskStatusChangedEnabled", label: "تغيير حالة المهمة" },
      { key: "taskCommentedEnabled", label: "تعليق جديد على المهمة" },
      { key: "taskDeadlineReminderEnabled", label: "تذكير باقتراب موعد التسليم" },
      { key: "taskOverdueEnabled", label: "تنبيه تأخر المهمة" },
      { key: "taskWatcherAddedEnabled", label: "إضافة مراقب للمهمة" },
      { key: "taskAttachmentAddedEnabled", label: "إضافة ملف أو مرفق" },
    ],
  },
  {
    id: "company",
    title: "دورة حياة الحسابات والاشتراكات",
    masterKey: "companyLifecycleNotificationsEnabled",
    icon: Building2,
    superAdminOnly: true,
    items: [
      { key: "newSignupWelcomeEnabled", label: "رسالة الترحيب بعد التسجيل" },
      { key: "newSignupAdminAlertEnabled", label: "تنبيه الإدارة بتسجيل جديد" },
      { key: "subscriptionCreatedEnabled", label: "تأكيد إنشاء الاشتراك" },
      { key: "subscriptionRenewedEnabled", label: "تنبيه تجديد الاشتراك" },
      { key: "subscriptionCancelledEnabled", label: "تنبيه إلغاء الاشتراك" },
    ],
  },
];

interface WhatsAppNotificationModulesTabProps {
  companyId?: string;
  superAdminMode?: boolean;
}

/** Manages non-order WhatsApp notification toggles (HR, Tasks, Products, Marketing, Lifecycle). */
export const WhatsAppNotificationModulesTab: React.FC<WhatsAppNotificationModulesTabProps> = ({
  companyId,
  superAdminMode = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ModuleSettingsState | null>(null);

  const reqConfig = useCallback(
    (): ApiRequestConfig => (companyId ? { _companyId: companyId } : {}),
    [companyId],
  );

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/whatsapp-notifications/settings", reqConfig());
      setSettings((res.data as { settings?: ModuleSettingsState })?.settings ?? null);
    } catch {
      toast.error("تعذر تحميل إعدادات إشعارات الأقسام");
    } finally {
      setLoading(false);
    }
  }, [reqConfig]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const updateField = <K extends keyof ModuleSettingsState>(key: K, value: ModuleSettingsState[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      await apiClient.put("/whatsapp-notifications/settings", settings, reqConfig());
      toast.success("تم حفظ إعدادات إشعارات الأقسام");
    } catch {
      toast.error("فشل حفظ إعدادات الإشعارات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!settings) {
    return (
      <WhatsAppSurfaceCard title="إشعارات الأقسام">
        <p className="text-sm text-muted-foreground">لا توجد إعدادات متاحة حالياً.</p>
      </WhatsAppSurfaceCard>
    );
  }

  const visibleSections = SECTIONS.filter((s) => !s.superAdminOnly || superAdminMode);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-4 py-3">
        <p className="text-xs text-muted-foreground">
          قوالب وتنبيهات الطلبات والسلات غير المكتملة تُدار حصرياً من مركز قوالب حالات الطلبات.
        </p>
        <Link
          to="/orders/status-templates"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
        >
          <span>فتح مركز قوالب الطلبات والسلات</span>
          <ExternalLink className="size-3.5 text-muted-foreground" />
        </Link>
      </div>

      {visibleSections.map((section) => {
        const Icon = section.icon;
        const enabled = settings[section.masterKey];
        return (
          <WhatsAppSurfaceCard key={section.id} title={section.title}>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border/70 pb-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Icon className="size-4 text-primary" />
                  <span>تفعيل القسم</span>
                </div>
                <Switch
                  checked={enabled}
                  onCheckedChange={(val) => updateField(section.masterKey, val)}
                  aria-label={section.title}
                />
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {section.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2.5"
                  >
                    <Label className="text-xs font-medium text-foreground">{item.label}</Label>
                    <Switch
                      disabled={!enabled}
                      checked={settings[item.key]}
                      onCheckedChange={(val) => updateField(item.key, val)}
                      aria-label={item.label}
                    />
                  </div>
                ))}
              </div>

              {section.id === "company" && settings.newSignupAdminAlertEnabled && (
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-medium text-foreground">أرقام الإدارة المستلمة</Label>
                  <Input
                    placeholder="2010xxxxxxxx, 2011xxxxxxxx"
                    value={settings.companyLifecycleAdminPhones || ""}
                    onChange={(e) => updateField("companyLifecycleAdminPhones", e.target.value)}
                    className="h-9 font-mono text-xs tabular-nums"
                  />
                </div>
              )}
            </div>
          </WhatsAppSurfaceCard>
        );
      })}

      <Button
        className="rounded-full bg-[color:var(--business-success)] px-5 text-white hover:brightness-90"
        onClick={() => void handleSave()}
        disabled={saving}
      >
        {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
        حفظ إعدادات الأقسام
      </Button>
    </div>
  );
};
