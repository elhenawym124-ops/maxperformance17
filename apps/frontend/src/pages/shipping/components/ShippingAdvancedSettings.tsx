import React from "react";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { envConfig } from "../../../config/environment";
import type { ShippingCompanyFormData } from "../types";

export interface ShippingAdvancedSettingsProps {
  showAdvanced: boolean;
  setShowAdvanced: React.Dispatch<React.SetStateAction<boolean>>;
  formData: ShippingCompanyFormData;
  setFormData: React.Dispatch<React.SetStateAction<ShippingCompanyFormData>>;
  copyWebhookUrl: () => void;
}

export const ShippingAdvancedSettings: React.FC<ShippingAdvancedSettingsProps> = ({
  showAdvanced,
  setShowAdvanced,
  formData,
  setFormData,
  copyWebhookUrl,
}) => {
  return (
    <div className="border border-border dark:border-border rounded-xl overflow-hidden mt-3">
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full px-3.5 py-2 bg-muted dark:bg-muted text-[11px] font-semibold text-foreground dark:text-muted-foreground flex items-center justify-between hover:bg-muted dark:hover:bg-muted transition"
      >
        <span>خيارات متقدمة وروابط الاتصال (للمطورين)</span>
        <span className="text-[11px] text-muted-foreground font-mono">{showAdvanced ? "▲ إخفاء" : "▼ إظهار"}</span>
      </button>

      {showAdvanced && (
        <div className="p-3.5 space-y-3 bg-card border-t border-border dark:border-border text-xs">
          <div>
            <label className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
              اسم العرض المسجل
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-1.5 text-xs border border-border rounded-lg bg-white dark:bg-muted text-foreground"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                نوع الناقل البرمجي (Provider)
              </label>
              <select
                value={formData.providerKey}
                onChange={(e) => setFormData((prev) => ({
                  ...prev,
                  providerKey: e.target.value,
                  integrationMode: e.target.value === 'MAXP_NETWORK' ? 'INTERNAL' : prev.integrationMode
                }))}
                className="w-full px-3 py-1.5 text-xs border border-border rounded-lg bg-white dark:bg-muted text-foreground"
              >
                <option value="MAXP_NETWORK">شحن على MaxP (شبكة شركات MaxP)</option>
                <option value="QP_EXPRESS">كيو بي إكسبريس (QP Express)</option>
                <option value="BOSTA">بوستا (Bosta Courier)</option>
                <option value="TURBO">تربو (Turbo Courier)</option>
                <option value="HASHTAG">هاشتاج إكسبريس (Hashtag Express)</option>
                <option value="LG_EXPRESS">LG Express (Accurate Logistics)</option>
                <option value="MANUAL">أسطول يدوي / مناديب (Manual)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                وضع التكامل
              </label>
              <select
                value={formData.integrationMode}
                onChange={(e) => setFormData((prev) => ({ ...prev, integrationMode: e.target.value }))}
                className="w-full px-3 py-1.5 text-xs border border-border rounded-lg bg-white dark:bg-muted text-foreground"
              >
                <option value="INTERNAL">داخلي مباشر عبر شبكة MaxP (INTERNAL)</option>
                <option value="LIVE">مباشر حقيقي (LIVE API)</option>
                <option value="DEMO">بيئة تجريبية (Demo Sandbox)</option>
                <option value="MANUAL">يدوي بدون API (Manual)</option>
              </select>
            </div>
          </div>

          {formData.providerKey === "QP_EXPRESS" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                  رابط السيرفر الخارجي (API Base URL)
                </label>
                <input
                  type="text"
                  value={formData.apiUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, apiUrl: e.target.value }))}
                  placeholder="https://qpxpress.com:8001"
                  className="w-full px-3 py-1.5 text-xs font-mono border border-border rounded-lg bg-white dark:bg-muted text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">
                  كود العميل اليدوي (يتم استخراجه آلياً)
                </label>
                <input
                  type="text"
                  value={formData.customerId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, customerId: e.target.value }))}
                  placeholder="يكتشفه النظام تلقائياً"
                  className="w-full px-3 py-1.5 text-xs font-mono border border-border rounded-lg bg-white dark:bg-muted text-foreground"
                />
              </div>
            </div>
          )}

          {/* Webhook URL */}
          <div className="p-2.5 bg-muted dark:bg-muted rounded-lg border border-border dark:border-border space-y-1">
            <p className="text-[11px] font-semibold text-foreground">
              رابط الـ Webhook الخاص بنظامك لاستقبال التحديثات:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${envConfig.backendUrl}/api/v1/shipments/webhook`}
                className="flex-1 px-2 py-1 text-[11px] bg-card border border-border rounded font-mono text-muted-foreground"
              />
              <button
                type="button"
                onClick={copyWebhookUrl}
                className="p-1.5 bg-muted hover:bg-muted rounded text-foreground"
                title="نسخ"
              >
                <ClipboardDocumentIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
