import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChartBarIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  FireIcon,
  FunnelIcon,
  InformationCircleIcon,
  KeyIcon,
  PlayCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { ExternalLinkIcon } from './ClarityLogo';
import { ClarityValidationErrors } from './types';
import { StorefrontSettings } from '../../../services/storefrontSettingsService';

interface ClarityCredentialsCardProps {
  settings: StorefrontSettings | null;
  clarityProjectId: string;
  isConnected: boolean;
  hasSaved: boolean;
  copied: boolean;
  saving: boolean;
  validationErrors: ClarityValidationErrors;
  clarityDashboardUrl: string;
  onProjectIdChange: (value: string) => void;
  onApiTokenChange: (value: string) => void;
  onCopyId: () => void;
  onSave: () => void;
  onDisconnect: () => void;
}

export const ClarityCredentialsCard: React.FC<ClarityCredentialsCardProps> = ({
  settings,
  clarityProjectId,
  isConnected,
  hasSaved,
  copied,
  saving,
  validationErrors,
  clarityDashboardUrl,
  onProjectIdChange,
  onApiTokenChange,
  onCopyId,
  onSave,
  onDisconnect,
}) => {
  const { t } = useTranslation();

  const helperId = 'clarityProjectIdHelp';
  const helperTokenId = 'clarityApiTokenHelp';
  const errorId = 'clarityProjectIdError';
  const errorTokenId = 'clarityApiTokenError';

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm dark:border-border dark:bg-muted">
      <div className="space-y-6 p-6">
        <div>
          <label
            htmlFor="clarityProjectId"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Clarity Project ID
          </label>
          <div className="flex overflow-hidden rounded-lg border border-border shadow-sm transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-border divide-x">
            <span className="inline-flex items-center bg-muted px-3 text-sm text-muted-foreground dark:border-border dark:bg-muted dark:text-muted-foreground">
              ID
            </span>
            <input
              type="text"
              id="clarityProjectId"
              value={clarityProjectId}
              onChange={(e) => onProjectIdChange(e.target.value)}
              className="min-w-0 flex-1 bg-white px-4 py-2.5 text-sm text-foreground outline-none placeholder-muted dark:bg-muted dark:text-white"
              placeholder={t('clarity.projectIdPlaceholder', 'مثال: k3a9mz1b')}
              dir="ltr"
              aria-describedby={validationErrors.projectId ? errorId : helperId}
              aria-invalid={Boolean(validationErrors.projectId)}
              maxLength={10}
            />
            <button
              type="button"
              onClick={onCopyId}
              aria-label={t('clarity.copyId', 'نسخ الـ ID')}
              tabIndex={clarityProjectId ? 0 : -1}
              className={`inline-flex items-center bg-muted px-3 text-muted-foreground transition-all hover:text-foreground dark:bg-muted dark:hover:text-muted-foreground ${
                clarityProjectId ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              {copied ? (
                <CheckCircleIconSolid className="h-4 w-4 text-success" aria-hidden="true" />
              ) : (
                <ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {validationErrors.projectId && (
            <p className="mt-1.5 text-xs text-destructive" id={errorId} role="alert">
              {validationErrors.projectId}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground" id={helperId}>
            {t('clarity.projectIdHelp', 'ستجد هذا الـ ID في لوحة Clarity ثم Settings ثم Overview.')}
          </p>
        </div>

        <div>
          <label
            htmlFor="clarityApiToken"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Clarity API Token
          </label>
          <div className="flex overflow-hidden rounded-lg border border-border shadow-sm transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-border divide-x">
            <span className="inline-flex items-center bg-muted px-3 text-sm text-muted-foreground dark:border-border dark:bg-muted dark:text-muted-foreground">
              <KeyIcon className="h-4 w-4" aria-hidden="true" />
            </span>
            <input
              type="text"
              id="clarityApiToken"
              value={settings?.clarityApiToken || ''}
              onChange={(e) => onApiTokenChange(e.target.value)}
              className="min-w-0 flex-1 bg-white px-4 py-2.5 text-sm text-foreground outline-none placeholder-muted dark:bg-muted dark:text-white"
              placeholder={t('clarity.apiTokenPlaceholder', 'JWT API Token')}
              dir="ltr"
              aria-describedby={validationErrors.apiToken ? errorTokenId : helperTokenId}
              aria-invalid={Boolean(validationErrors.apiToken)}
              maxLength={500}
            />
          </div>
          {validationErrors.apiToken && (
            <p className="mt-1.5 text-xs text-destructive" id={errorTokenId} role="alert">
              {validationErrors.apiToken}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground" id={helperTokenId}>
            {t(
              'clarity.apiTokenHelp',
              'من Clarity → Settings → Data Export → Generate new API token. مطلوب لعرض التحليلات في لوحة التحكم.'
            )}
          </p>
        </div>

        <div
          className={`flex items-start gap-3 rounded-lg border p-4 ${
            isConnected
              ? 'border-green-100 bg-success/10 dark:border-success/30 dark:bg-success/20'
              : 'border-yellow-100 bg-warning/10 dark:border-warning/30 dark:bg-warning/20'
          }`}
        >
          {isConnected ? (
            <>
              <CheckCircleIcon
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-success dark:text-success"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium text-success dark:text-success">
                  {t('clarity.active', 'Clarity نشط على متجرك')}
                </p>
                <p className="mt-0.5 text-xs text-success dark:text-success">
                  {t(
                    'clarity.activeDesc',
                    'يتم الآن تسجيل جلسات الزوار وخرائط الحرارة. قد تظهر البيانات خلال 24 إلى 48 ساعة.'
                  )}
                </p>
              </div>
            </>
          ) : (
            <>
              <InformationCircleIcon
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning dark:text-warning"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium text-warning dark:text-warning">
                  {t('clarity.inactive', 'Clarity غير مفعّل بعد')}
                </p>
                <p className="mt-0.5 text-xs text-warning dark:text-warning">
                  {t('clarity.inactiveDesc', 'أدخل Project ID أعلاه واحفظ للتفعيل.')}
                </p>
              </div>
            </>
          )}
        </div>

        {isConnected && hasSaved ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <a
              href={clarityDashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-primary bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary dark:border-primary/40 dark:bg-primary/20 dark:text-primary dark:hover:bg-primary/40"
            >
              <ChartBarIcon className="h-4 w-4" aria-hidden="true" />
              {t('clarity.openDashboard', 'فتح لوحة Clarity')}
              <ExternalLinkIcon />
            </a>
            <a
              href={`https://clarity.microsoft.com/projects/view/${clarityProjectId}/heatmaps`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-warning bg-warning/10 px-4 py-2.5 text-sm font-medium text-warning transition-colors hover:bg-warning dark:border-warning/40 dark:bg-warning/20 dark:text-warning dark:hover:bg-warning/40"
            >
              <FireIcon className="h-4 w-4" aria-hidden="true" />
              {t('clarity.heatmaps', 'خرائط الحرارة')}
              <ExternalLinkIcon />
            </a>
            <a
              href={`https://clarity.microsoft.com/projects/view/${clarityProjectId}/recordings`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-warning bg-warning/10 px-4 py-2.5 text-sm font-medium text-warning transition-colors hover:bg-warning dark:border-warning/40 dark:bg-warning/20 dark:text-warning dark:hover:bg-warning/40"
            >
              <PlayCircleIcon className="h-4 w-4" aria-hidden="true" />
              {t('clarity.recordings', 'تسجيلات الزوار')}
              <ExternalLinkIcon />
            </a>
            <a
              href={`https://clarity.microsoft.com/projects/view/${clarityProjectId}/funnels`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-warning bg-warning/10 px-4 py-2.5 text-sm font-medium text-warning transition-colors hover:bg-warning dark:border-warning/40 dark:bg-warning/20 dark:text-warning dark:hover:bg-warning/40"
            >
              <FunnelIcon className="h-4 w-4" aria-hidden="true" />
              {t('clarity.funnels', 'تحليل المبيعات')}
              <ExternalLinkIcon />
            </a>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-border bg-muted px-6 py-4 dark:border-border dark:bg-muted">
        <a
          href="https://clarity.microsoft.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          {t('clarity.freeService', 'الخدمة مجانية تمامًا من Microsoft')}
          <ExternalLinkIcon />
        </a>

        <div className="flex items-center gap-3">
          {isConnected ? (
            <button
              type="button"
              onClick={onDisconnect}
              disabled={saving}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-destructive bg-white px-4 py-2 text-sm font-medium text-destructive shadow-sm transition-colors hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 dark:border-destructive/40 dark:bg-transparent dark:text-destructive dark:hover:bg-destructive/20"
            >
              <XCircleIcon className="h-4 w-4" aria-hidden="true" />
              {t('clarity.disconnect', 'قطع الاتصال')}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <span
                  className="h-4 w-4 motion-safe:animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden="true"
                />
                {t('clarity.saving', 'جاري الحفظ...')}
              </>
            ) : (
              <>
                <CheckCircleIconSolid className="h-4 w-4" aria-hidden="true" />
                {t('clarity.save', 'حفظ الإعدادات')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
