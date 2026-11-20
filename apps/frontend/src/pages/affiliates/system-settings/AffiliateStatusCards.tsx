import React from "react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { AffiliateSettingsData } from "./types";

interface AffiliateStatusCardsProps {
  settings: AffiliateSettingsData;
  isDark: boolean;
  onToggleIsActive: (val: boolean) => void;
  onToggleAutoApprove: (val: boolean) => void;
}

export const AffiliateStatusCards: React.FC<AffiliateStatusCardsProps> = ({
  settings,
  isDark,
  onToggleIsActive,
  onToggleAutoApprove,
}) => {
  return (
    <div className="space-y-4">
      <h2
        className={`text-lg font-bold border-b pb-2 ${
          isDark
            ? "text-white border-border"
            : "text-gray-900 border-border"
        }`}
      >
        حالة النظام والتسجيل
      </h2>

      {/* Card 1: حالة نظام المسوقين */}
      <div
        className={`p-5 rounded-xl border transition-all ${
          isDark
            ? settings.isActive
              ? "border-blue-700/60 bg-primary/20"
              : "border-gray-700 bg-muted"
            : settings.isActive
              ? "border-blue-200 bg-primary/50"
              : "border-gray-200 bg-muted"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={`font-bold text-base ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                حالة نظام المسوقين (تسجيل المسوقين)
              </h3>
              {settings.isActive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success text-success dark:bg-success/80 dark:text-success border border-success dark:border-success">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  مفعل (يستقبل تسجيلات)
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground dark:bg-muted dark:text-muted-foreground border border-border dark:border-border">
                  معطل (التسجيل مغلق)
                </span>
              )}
            </div>
            <p
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              تفعيل واستقبال تسجيل مسوقين جدد عبر رابط المتجر الرسمي
            </p>
          </div>

          <label
            htmlFor="system-is-active-switch"
            className="inline-flex items-center gap-3 cursor-pointer self-start sm:self-auto select-none"
          >
            <span
              className={`text-sm font-semibold ${
                settings.isActive
                  ? "text-blue-600 dark:text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {settings.isActive ? "تشغيل" : "إيقاف"}
            </span>
            <div className="relative inline-block w-12 h-6" dir="ltr">
              <input
                id="system-is-active-switch"
                type="checkbox"
                aria-label="حالة نظام المسوقين"
                className="sr-only"
                checked={settings.isActive}
                onChange={(e) => onToggleIsActive(e.target.checked)}
              />
              <div
                className={`block w-12 h-6 rounded-full transition-colors ${
                  settings.isActive
                    ? "bg-blue-600"
                    : isDark
                      ? "bg-gray-700 border border-border"
                      : "bg-gray-300"
                }`}
              />
              <div
                className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow-md transition-transform duration-200 ${
                  settings.isActive ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </div>
          </label>
        </div>
      </div>

      {/* Card 2: الموافقة التلقائية على المسوقين الجدد */}
      <div
        className={`p-5 rounded-xl border transition-all ${
          isDark
            ? settings.autoApproveAffiliates
              ? "border-emerald-700/60 bg-success/20"
              : "border-gray-700 bg-muted"
            : settings.autoApproveAffiliates
              ? "border-emerald-200 bg-success/50"
              : "border-gray-200 bg-muted"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={`font-bold text-base ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                الموافقة التلقائية على المسوقين الجدد
              </h3>
              {settings.autoApproveAffiliates ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success text-success dark:bg-success/80 dark:text-success border border-success dark:border-success">
                  <CheckCircleIcon className="w-4 h-4 text-success dark:text-success" />
                  مفعلة تلقائياً (تفعيل فوري)
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning text-warning dark:bg-warning/80 dark:text-warning border border-warning dark:border-warning">
                  يتطلب موافقة يدوية من الإدارة
                </span>
              )}
            </div>
            <p
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              تفعيل حساب المسوق فور التسجيل مباشرة لتمكينه من بدء التسويق دون
              انتظار موافقة يدوية
            </p>
          </div>

          <label
            htmlFor="auto-approve-affiliates-switch"
            className="inline-flex items-center gap-3 cursor-pointer self-start sm:self-auto select-none"
          >
            <span
              className={`text-sm font-semibold ${
                settings.autoApproveAffiliates
                  ? "text-emerald-600 dark:text-success"
                  : "text-muted-foreground"
              }`}
            >
              {settings.autoApproveAffiliates ? "مفعل" : "معطل"}
            </span>
            <div className="relative inline-block w-12 h-6" dir="ltr">
              <input
                id="auto-approve-affiliates-switch"
                type="checkbox"
                aria-label="الموافقة التلقائية على المسوقين الجدد"
                className="sr-only"
                checked={settings.autoApproveAffiliates}
                onChange={(e) => onToggleAutoApprove(e.target.checked)}
              />
              <div
                className={`block w-12 h-6 rounded-full transition-colors ${
                  settings.autoApproveAffiliates
                    ? "bg-emerald-600 dark:bg-success"
                    : isDark
                      ? "bg-gray-700 border border-border"
                      : "bg-gray-300"
                }`}
              />
              <div
                className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow-md transition-transform duration-200 ${
                  settings.autoApproveAffiliates
                    ? "translate-x-6"
                    : "translate-x-0"
                }`}
              />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
