import React from 'react';
import { useTranslation } from 'react-i18next';
import { FEATURES } from './constants';

export const ClarityFeaturesDetails: React.FC = () => {
  const { t } = useTranslation();

  return (
    <details className="group rounded-xl border border-border bg-white shadow-sm dark:border-border dark:bg-muted">
      <summary className="flex cursor-pointer items-center gap-2 p-4 text-sm font-semibold text-foreground dark:text-muted-foreground">
        {t('clarity.whatIsClarity', 'ماذا تقدم Clarity؟')}
      </summary>
      <div className="border-t border-border p-4 dark:border-border">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className={`flex flex-col gap-2 rounded-xl border p-4 ${feature.color}`}
            >
              <div className="flex items-center gap-2">
                {feature.icon}
                <div>
                  <h3 className="text-sm font-semibold text-foreground dark:text-muted-foreground">
                    {t(feature.titleKey, feature.title)}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {feature.subtitle}
                  </p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t(feature.descKey, feature.desc)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
};
