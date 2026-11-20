import React, { useState } from "react";
import {
  ShieldCheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import { FacebookPixelSettings } from "../types";

interface AdvancedPrivacyDrawerProps {
  settings: Partial<FacebookPixelSettings>;
  onChange: (updated: Partial<FacebookPixelSettings>) => void;
}

export const AdvancedPrivacyDrawer: React.FC<AdvancedPrivacyDrawerProps> = ({
  settings,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="border border-border dark:border-border bg-white dark:bg-muted rounded-xl overflow-hidden shadow-xs">
      {/* Header with Accordion Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 bg-muted dark:bg-muted text-right hover:bg-muted dark:hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-2">
          <AdjustmentsHorizontalIcon className="w-4 h-4 text-primary" />
          <h2 className="text-sm sm:text-base font-bold text-foreground">
            الإعدادات المتقدمة وجودة المطابقة (Advanced Privacy & EMQ)
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{isOpen ? "إخفاء التفاصيل" : "عرض وتعديل"}</span>
          {isOpen ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-6 border-t border-border dark:border-border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Deduplication Switch */}
            <label className="flex items-start justify-between gap-3 p-3.5 rounded-lg border border-border dark:border-border hover:bg-muted dark:hover:bg-muted cursor-pointer transition-colors">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  منع تكرار الأحداث (Event Deduplication)
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5 block">
                  مطابقة أحداث المتصفح والسيرفر عبر معرف موحد لمنع احتساب الطلب مرتين
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.eventDeduplicationEnabled || false}
                onChange={(e) =>
                  onChange({ eventDeduplicationEnabled: e.target.checked })
                }
                className="h-4 w-4 text-primary focus:ring-primary rounded border-border dark:border-border mt-1"
              />
            </label>

            {/* SHA-256 Hashing */}
            <label className="flex items-start justify-between gap-3 p-3.5 rounded-lg border border-border dark:border-border hover:bg-muted dark:hover:bg-muted cursor-pointer transition-colors">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  تشفير وتطبيع البيانات (E.164 & SHA-256)
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5 block">
                  تطبيع أرقام الهواتف وتشفير البريد الإلكتروني محلياً قبل إرساله إلى Meta
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.hashUserData || false}
                onChange={(e) => onChange({ hashUserData: e.target.checked })}
                className="h-4 w-4 text-primary focus:ring-primary rounded border-border dark:border-border mt-1"
              />
            </label>

            {/* GDPR Compliance */}
            <label className="flex items-start justify-between gap-3 p-3.5 rounded-lg border border-border dark:border-border hover:bg-muted dark:hover:bg-muted cursor-pointer transition-colors">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  معايير الخصوصية الأوروبية (GDPR Mode)
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5 block">
                  الالتزام بقيود ملفات تعريف الارتباط وعدم تفعيل التتبع قبل موافقة المستخدم
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.gdprCompliant || false}
                onChange={(e) => onChange({ gdprCompliant: e.target.checked })}
                className="h-4 w-4 text-primary focus:ring-primary rounded border-border dark:border-border mt-1"
              />
            </label>

            {/* EMQ Target Slider */}
            <div className="p-3.5 rounded-lg border border-border dark:border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  مستوى جودة المطابقة المستهدف (EMQ Target)
                </span>
                <span className="text-xs font-mono font-bold text-primary tabular-nums">
                  {settings.eventMatchQualityTarget || 8} / 10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.eventMatchQualityTarget || 8}
                onChange={(e) =>
                  onChange({ eventMatchQualityTarget: parseInt(e.target.value) })
                }
                className="w-full h-1.5 bg-muted dark:bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <span className="text-[11px] text-muted-foreground block">
                تحديد معايير اكتمال بيانات المشترين لرفع دقة احتساب المبيعات في Ads Manager
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
