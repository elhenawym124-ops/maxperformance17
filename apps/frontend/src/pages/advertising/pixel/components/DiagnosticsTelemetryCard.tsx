import React from "react";
import {
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { DiagnosticsData, TokenPermissionsData } from "../types";

interface DiagnosticsTelemetryCardProps {
  diagnostics: DiagnosticsData | null;
  tokenPermissions: TokenPermissionsData | null;
  onCheckPermissions: () => Promise<void>;
  isCheckingToken: boolean;
}

export const DiagnosticsTelemetryCard: React.FC<DiagnosticsTelemetryCardProps> = ({
  diagnostics,
  tokenPermissions,
  onCheckPermissions,
  isCheckingToken,
}) => {
  if (!diagnostics && !tokenPermissions) {
    return null;
  }

  const score = diagnostics?.overall?.score ?? 0;
  const isHealthy = score >= 80;

  return (
    <section className="border border-border dark:border-border bg-white dark:bg-muted rounded-xl overflow-hidden shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-border dark:border-border bg-muted dark:bg-muted">
        <div className="flex items-center gap-2">
          <WrenchScrewdriverIcon className="w-4 h-4 text-primary" />
          <h2 className="text-sm sm:text-base font-bold text-foreground">
            تشخيص سلامة الاتصال والأذونات (Telemetry & Diagnostics)
          </h2>
        </div>

        {diagnostics?.overall && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              درجة الصحة:
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tabular-nums border ${
                isHealthy
                  ? "bg-emerald-50 text-success dark:bg-success/40 dark:text-success border-success/60"
                  : "bg-amber-50 text-warning dark:bg-warning/40 dark:text-warning border-warning/60"
              }`}
            >
              {score}/100
            </span>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Diagnostics Status Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border border-border dark:border-border flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-muted-foreground font-medium">
              تتبع المتصفح (Browser Pixel)
            </span>
            <span
              className={`font-semibold inline-flex items-center gap-1 ${
                diagnostics?.pixel?.configured
                  ? "text-emerald-600 dark:text-success"
                  : "text-gray-400"
              }`}
            >
              {diagnostics?.pixel?.configured ? (
                <>
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>مُهيّأ بنجاح</span>
                </>
              ) : (
                <span>غير مُهيّأ</span>
              )}
            </span>
          </div>

          <div className="p-3 rounded-lg border border-border dark:border-border flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-muted-foreground font-medium">
              اتصال السيرفر (Conversions API)
            </span>
            <span
              className={`font-semibold inline-flex items-center gap-1 ${
                diagnostics?.capi?.configured
                  ? "text-emerald-600 dark:text-success"
                  : "text-amber-600 dark:text-warning"
              }`}
            >
              {diagnostics?.capi?.configured ? (
                <>
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>مُهيّأ بنجاح</span>
                </>
              ) : (
                <>
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  <span>بحاجة لـ Access Token</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* CAPI Error Alert in Telemetry */}
        {diagnostics?.capi?.lastError && (
          <div className="p-3.5 rounded-lg border border-red-200 dark:border-destructive/60 bg-destructive/40 dark:bg-destructive/20 text-xs">
            <div className="flex items-center gap-2 font-bold text-destructive mb-1">
              <XCircleIcon className="w-4 h-4 text-destructive" />
              <span>
                {diagnostics.capi.lastErrorCode ? `خطأ ميتا #${diagnostics.capi.lastErrorCode}: ` : "آخر خطأ في CAPI: "}
                {diagnostics.capi.lastError}
              </span>
            </div>
            {diagnostics.capi.lastErrorAt && (
              <span className="text-[10px] text-muted-foreground">
                تاريخ تسجيل الخطأ: {new Date(diagnostics.capi.lastErrorAt).toLocaleString("ar-EG")}
              </span>
            )}
          </div>
        )}

        {/* Token Permissions Result */}
        {tokenPermissions && (
          <div
            className={`p-3.5 rounded-lg border text-xs ${
              tokenPermissions.valid
                ? "border-emerald-200 dark:border-success/60 bg-success/50 dark:bg-success/20 text-success dark:text-success"
                : "border-red-200 dark:border-destructive/60 bg-destructive/50 dark:bg-destructive/20 text-destructive dark:text-destructive"
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1.5">
              {tokenPermissions.valid ? (
                <CheckCircleIcon className="w-4 h-4 text-success" />
              ) : (
                <XCircleIcon className="w-4 h-4 text-destructive" />
              )}
              <span>
                {tokenPermissions.valid
                  ? "صلاحيات Token سليمة وصالحة لـ Meta Conversions API"
                  : "توجد مشكلة في صلاحيات الـ Token الحالي"}
              </span>
            </div>

            {tokenPermissions.permissions && tokenPermissions.permissions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tokenPermissions.permissions.map((p) => (
                  <span
                    key={p}
                    className="px-2 py-0.5 rounded bg-card border border-border dark:border-border font-mono text-[11px] text-foreground"
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Meta Checklist for Merchant Owner */}
        <div className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5 dark:bg-card">
          <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
            <ShieldCheckIcon className="w-4 h-4 text-primary" />
            <span>قائمة التحقق المطلوبة من مالك المتجر لدى Meta (Checklist):</span>
          </h3>
          <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>
              <strong>إضافة التطبيق للـ Business Portfolio:</strong> تأكد من ربط تطبيق Facebook بمحفظة الأعمال (Meta Business Suite).
            </li>
            <li>
              <strong>إنشاء System User:</strong> أنشئ مستخدم نظام بصلاحية مسؤول (Admin) داخل Business Settings.
            </li>
            <li>
              <strong>ربط أصل البيكسل (Assign Asset):</strong> عيّن البيكسل للمستخدم النظامي مع منح صلاحية Manage Pixel كاملة.
            </li>
            <li>
              <strong>توليد Token دائم:</strong> استخرج Access Token مع تحديد صلاحية <code className="text-primary font-mono font-bold">ads_management</code> و <code className="text-primary font-mono font-bold">ads_read</code>.
            </li>
            <li>
              <strong>وضع التطبيق (Live Mode / App Review):</strong> في حال ظهور خطأ <code>#270</code>، يعني أن التطبيق في وضع Development ويجب نقله لـ Live أو اعتماد صلاحية الإعلانات عبر App Review.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};
