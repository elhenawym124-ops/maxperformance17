import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Cog6ToothIcon,
  ClockIcon,
  BoltIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { Switch } from "@/components/ui/switch";
import type { SettingsForm, DefaultSessionInfo, DeliveryPreviewItem } from "../types";

export interface TemplateSettingsTabProps {
  settings: SettingsForm | null;
  settingsLoading: boolean;
  settingsSaving: boolean;
  settingsSessions: {
    id: string;
    name: string;
    phoneNumber?: string;
    status: string;
    provider?: string;
    inboundEnabled?: boolean;
    outboundEnabled?: boolean;
    notificationsEnabled?: boolean;
  }[];
  defaultSessionInfo: DefaultSessionInfo | null;
  deliveryPreview: Record<string, DeliveryPreviewItem>;
  syncingStatus: boolean;
  onUpdateSettings: React.Dispatch<React.SetStateAction<SettingsForm | null>>;
  onSaveSettings: () => void;
  onSyncMetaStatuses: () => void;
}

export const TemplateSettingsTab: React.FC<TemplateSettingsTabProps> = ({
  settings,
  settingsLoading,
  settingsSaving,
  settingsSessions,
  defaultSessionInfo,
  deliveryPreview,
  syncingStatus,
  onUpdateSettings,
  onSaveSettings,
  onSyncMetaStatuses,
}) => {
  const { t } = useTranslation();

  return (
    <div data-testid="settings-panel" className="rounded-xl border border-border/70 bg-card p-5">
      <h2 className="mb-4 text-base font-bold text-foreground">
        <Cog6ToothIcon className="ms-1.5 inline h-5 w-5" />
        إعدادات إشعارات واتساب للطلبات
      </h2>

      {settingsLoading ? (
        <div className="flex justify-center py-10">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      ) : !settings ? (
        <p className="text-sm text-muted-foreground">{t("orders.settingsNone", "لا توجد إعدادات")}</p>
      ) : (
        <div className="space-y-5 max-w-xl">
          {/* General toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{t("orders.settingsEnableNotifications", "تفعيل إشعارات واتساب")}</p>
              <p className="text-xs text-muted-foreground">تشغيل أو إيقاف جميع إشعارات الواتساب</p>
            </div>
            <Switch
              checked={settings.isEnabled}
              onCheckedChange={(val) => onUpdateSettings((p) => p ? { ...p, isEnabled: val } : p)}
              aria-label="تفعيل إشعارات واتساب"
            />
          </div>

          <hr className="border-border/70" />

          {/* Order notifications toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">إشعارات حالات الطلبات</p>
              <p className="text-xs text-muted-foreground">إرسال رسالة واتساب عند تغيير حالة الطلب</p>
            </div>
            <Switch
              checked={settings.orderNotificationsEnabled}
              onCheckedChange={(val) => onUpdateSettings((p) => p ? { ...p, orderNotificationsEnabled: val } : p)}
              aria-label="إشعارات حالات الطلبات"
            />
          </div>

          <hr className="border-border/70" />

          {/* Default session */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">الجلسة الأساسية</label>
            <p className="mb-2 text-xs text-muted-foreground">جلسة الواتساب التي ستُرسل منها الرسائل</p>
            <select
              value={settings.defaultSessionId || ""}
              onChange={(e) => onUpdateSettings((p) => p ? { ...p, defaultSessionId: e.target.value || null } : p)}
              className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm text-foreground cursor-pointer"
            >
              <option value="">تلقائي (أي جلسة متصلة ومفعّلة للإشعارات)</option>
              {settingsSessions.map((s) => {
                const blockedTags: string[] = [];
                if (s.outboundEnabled === false) blockedTags.push("إرسال موقوف");
                else if (s.notificationsEnabled === false) blockedTags.push("إشعارات موقوفة");
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.phoneNumber ? `(${s.phoneNumber})` : ""} - {s.status === "CONNECTED" ? "متصل" : "غير متصل"}
                    {blockedTags.length > 0 ? ` [${blockedTags.join("، ")}]` : ""}
                  </option>
                );
              })}
            </select>
            {(() => {
              const picked = settingsSessions.find((s) => s.id === settings.defaultSessionId);
              if (picked && (picked.outboundEnabled === false || picked.notificationsEnabled === false)) {
                return (
                  <div className="mt-2 flex items-start justify-between gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
                    <div className="flex items-start gap-1.5">
                      <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        هذه القناة موقوف عليها {picked.outboundEnabled === false ? "الإرسال" : "إرسال الإشعارات"} من إعدادات واتساب، ولن يتم الإرسال منها تلقائياً.
                      </span>
                    </div>
                    <Link
                      to="/whatsapp/settings"
                      className="shrink-0 font-semibold underline hover:opacity-80"
                    >
                      إعدادات القنوات
                    </Link>
                  </div>
                );
              }
              return null;
            })()}
            {defaultSessionInfo && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">طريقة الإرسال الحالية:</span>
                <span
                  className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium ${
                    defaultSessionInfo.provider === "META_CLOUD"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  }`}
                >
                  {defaultSessionInfo.provider === "META_CLOUD" ? "Meta Cloud API" : "Baileys"}
                </span>
                <span className="text-muted-foreground font-mono">{defaultSessionInfo.name}</span>
                {defaultSessionInfo.provider === "META_CLOUD" && !Object.values(deliveryPreview).some((item) => item.riskLevel === "none") && (
                  <span className="text-amber-500 dark:text-amber-400 font-medium">تحقق من حالة كل قالب</span>
                )}
              </div>
            )}
            {defaultSessionInfo?.provider === "META_CLOUD" && (
              <button
                onClick={onSyncMetaStatuses}
                disabled={syncingStatus}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card px-2.5 py-1 text-xs font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-3.5 w-3.5 ${syncingStatus ? "animate-spin" : ""}`} />
                مزامنة الحالات من ميتا
              </button>
            )}
          </div>

          <hr className="border-border/70" />

          {/* Sticky session */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{t("orders.settingsStickySession", "تثبيت الجلسة (Sticky Session)")}</p>
              <p className="text-xs text-muted-foreground">نفس العميل يستخدم نفس الجلسة دائماً</p>
            </div>
            <Switch
              checked={settings.stickySessionEnabled}
              onCheckedChange={(val) => onUpdateSettings((p) => p ? { ...p, stickySessionEnabled: val } : p)}
              aria-label="تثبيت الجلسة"
            />
          </div>

          <hr className="border-border/70" />

          {/* Quiet hours */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  <ClockIcon className="me-1 inline h-4 w-4" />
                  ساعات الهدوء
                </p>
                <p className="text-xs text-muted-foreground">عدم إرسال رسائل في هذه الفترة</p>
              </div>
              <Switch
                checked={settings.quietHoursEnabled}
                onCheckedChange={(val) => onUpdateSettings((p) => p ? { ...p, quietHoursEnabled: val } : p)}
                aria-label="ساعات الهدوء"
              />
            </div>
            {settings.quietHoursEnabled && (
              <div className="mt-2 flex items-center gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">من</label>
                  <input
                    type="time"
                    value={settings.quietHoursStart}
                    onChange={(e) => onUpdateSettings((p) => p ? { ...p, quietHoursStart: e.target.value } : p)}
                    className="mt-1 block rounded-lg border border-border/70 bg-background px-3 py-1.5 text-sm font-mono tabular-nums text-foreground"
                  />
                </div>
                <span className="mt-5 text-muted-foreground">→</span>
                <div>
                  <label className="text-xs text-muted-foreground">إلى</label>
                  <input
                    type="time"
                    value={settings.quietHoursEnd}
                    onChange={(e) => onUpdateSettings((p) => p ? { ...p, quietHoursEnd: e.target.value } : p)}
                    className="mt-1 block rounded-lg border border-border/70 bg-background px-3 py-1.5 text-sm font-mono tabular-nums text-foreground"
                  />
                </div>
              </div>
            )}
          </div>

          <hr className="border-border/70" />

          {/* Rate limit */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              <BoltIcon className="me-1 inline h-4 w-4" />
              حد الإرسال (رسالة/دقيقة)
            </label>
            <input
              type="number"
              min={1}
              max={120}
              value={settings.rateLimitPerMinute}
              onChange={(e) => onUpdateSettings((p) => p ? { ...p, rateLimitPerMinute: parseInt(e.target.value) || 30 } : p)}
              className="w-32 rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-mono tabular-nums text-foreground"
            />
          </div>

          <hr className="border-border/70" />

          <button
            onClick={onSaveSettings}
            disabled={settingsSaving}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {settingsSaving && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {t("orders.saveSettings", "حفظ الإعدادات")}
          </button>
        </div>
      )}
    </div>
  );
};

export default TemplateSettingsTab;
