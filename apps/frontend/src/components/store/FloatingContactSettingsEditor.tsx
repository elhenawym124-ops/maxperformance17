import React from "react";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import {
  resolveFloatingContactConfig,
  type FloatingContactConfig,
} from "../../storefront/components/FloatingContactWidget";

interface FloatingContactSettingsEditorProps {
  designTokens?: Record<string, unknown> | null;
  onUpdateDesignTokens: (nextTokens: Record<string, unknown>) => void;
  compact?: boolean;
}

type ChannelRowConfig = {
  key: "phone" | "messenger" | "instagram" | "telegram";
  label: string;
  placeholder: string;
  field: "number" | "url";
  mono?: boolean;
};

const EXTRA_CHANNELS: ChannelRowConfig[] = [
  {
    key: "phone",
    label: "اتصال هاتفي مباشر",
    placeholder: "+201012345678",
    field: "number",
    mono: true,
  },
  {
    key: "messenger",
    label: "فيسبوك ماسنجر",
    placeholder: "yourpage أو https://m.me/yourpage",
    field: "url",
  },
  {
    key: "instagram",
    label: "إنستجرام",
    placeholder: "@yourstore أو رابط الحساب",
    field: "url",
  },
  {
    key: "telegram",
    label: "تيليجرام",
    placeholder: "@yourstore أو https://t.me/yourstore",
    field: "url",
  },
];

export const FloatingContactSettingsEditor: React.FC<
  FloatingContactSettingsEditorProps
> = ({ designTokens, onUpdateDesignTokens, compact = false }) => {
  const tokens =
    designTokens && typeof designTokens === "object" ? designTokens : {};
  const config = resolveFloatingContactConfig(tokens);

  const commitConfig = (nextConfig: FloatingContactConfig) => {
    onUpdateDesignTokens({
      ...tokens,
      floatingContact: nextConfig,
      whatsapp: {
        enabled: Boolean(
          nextConfig.enabled && nextConfig.whatsapp?.enabled !== false,
        ),
        phoneNumber: nextConfig.whatsapp?.phoneNumber || "",
        message: nextConfig.whatsapp?.message || "",
      },
    });
  };

  const updateChannel = (
    key: keyof Omit<FloatingContactConfig, "enabled" | "position">,
    patch: Record<string, unknown>,
  ) => {
    commitConfig({
      ...config,
      [key]: {
        ...(config[key] || {}),
        ...patch,
      },
    });
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-background/50 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="font-bold text-foreground text-xs sm:text-sm">
            زر التواصل العائم (واتساب وقنوات أخرى)
          </span>
        </div>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <span className="text-[11px] text-muted-foreground">
            {config.enabled ? "مفعّل" : "معطّل"}
          </span>
          <input
            type="checkbox"
            checked={Boolean(config.enabled)}
            onChange={(e) => {
              const checked = e.target.checked;
              const hasAnyChannelEnabled =
                Boolean(config.whatsapp?.enabled) ||
                Boolean(config.phone?.enabled) ||
                Boolean(config.messenger?.enabled) ||
                Boolean(config.instagram?.enabled) ||
                Boolean(config.telegram?.enabled);
              commitConfig({
                ...config,
                enabled: checked,
                ...(checked && !hasAnyChannelEnabled
                  ? { whatsapp: { ...(config.whatsapp || {}), enabled: true } }
                  : {}),
              });
            }}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
          />
        </label>
      </div>

      {config.enabled && (
        <div className="space-y-3 pt-2 border-t border-border/60">
          {/* Position */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">
              موضع الزر العائم
            </span>
            <select
              value={config.position || "end"}
              onChange={(e) =>
                commitConfig({
                  ...config,
                  position: e.target.value === "start" ? "start" : "end",
                })
              }
              className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="end">نهاية الشاشة (افتراضي)</option>
              <option value="start">بداية الشاشة</option>
            </select>
          </div>

          {/* WhatsApp */}
          <div className="rounded-xl border border-border/60 bg-card/40 p-2.5 space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-semibold text-foreground">
                واتساب (WhatsApp)
              </span>
              <input
                type="checkbox"
                checked={Boolean(config.whatsapp?.enabled)}
                onChange={(e) =>
                  updateChannel("whatsapp", { enabled: e.target.checked })
                }
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
            </label>
            {config.whatsapp?.enabled && (
              <div
                className={
                  compact
                    ? "space-y-2"
                    : "grid grid-cols-1 sm:grid-cols-2 gap-2"
                }
              >
                <div>
                  <label className="mb-1 block text-[10px] text-muted-foreground">
                    رقم الواتساب مع كود الدولة
                  </label>
                  <input
                    type="text"
                    value={config.whatsapp?.phoneNumber || ""}
                    onChange={(e) =>
                      updateChannel("whatsapp", { phoneNumber: e.target.value })
                    }
                    placeholder="201012345678"
                    className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-muted-foreground">
                    الرسالة المبدئية
                  </label>
                  <input
                    type="text"
                    value={config.whatsapp?.message || ""}
                    onChange={(e) =>
                      updateChannel("whatsapp", { message: e.target.value })
                    }
                    placeholder="مرحباً، أود الاستفسار عن منتج..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Extra Contact Channels */}
          <div
            className={
              compact ? "space-y-2" : "grid grid-cols-1 sm:grid-cols-2 gap-2"
            }
          >
            {EXTRA_CHANNELS.map((ch) => {
              const chState = (config[ch.key] || {}) as Record<string, any>;
              const isChecked = Boolean(chState["enabled"]);
              const val = String(chState[ch.field] || "");
              return (
                <div
                  key={ch.key}
                  className="rounded-xl border border-border/60 bg-card/40 p-2.5 space-y-1.5"
                >
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-semibold text-foreground">
                      {ch.label}
                    </span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        updateChannel(ch.key, { enabled: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                  </label>
                  {isChecked && (
                    <input
                      type="text"
                      value={val}
                      onChange={(e) =>
                        updateChannel(ch.key, { [ch.field]: e.target.value })
                      }
                      placeholder={ch.placeholder}
                      className={`w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none ${
                        ch.mono ? "font-mono" : ""
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingContactSettingsEditor;
