import React from 'react';
import { useTranslation } from 'react-i18next';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { ClarityLogo } from './ClarityLogo';

interface ClarityHeaderProps {
  isConnected: boolean;
}

export const ClarityHeader: React.FC<ClarityHeaderProps> = ({ isConnected }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <ClarityLogo />
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Microsoft Clarity
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('clarity.subtitle', 'افهم زبائنك من خلال خرائط الحرارة وتسجيلات الجلسات مجانًا.')}
          </p>
        </div>
      </div>

      <div
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
          isConnected
            ? 'border-green-200 bg-success/10 text-success dark:border-success/40 dark:bg-success/20 dark:text-success'
            : 'border-gray-200 bg-muted text-muted-foreground dark:border-border dark:bg-muted dark:text-muted-foreground'
        }`}
      >
        {isConnected ? (
          <>
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
            </span>
            {t('clarity.connected', 'متصل والتتبع نشط')}
          </>
        ) : (
          <>
            <XCircleIcon className="h-4 w-4" aria-hidden="true" />
            {t('clarity.disconnected', 'غير متصل')}
          </>
        )}
      </div>
    </div>
  );
};
