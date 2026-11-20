import React from 'react';
import { useTranslation } from 'react-i18next';

export const ClarityTipsSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section aria-label={t('clarity.tipsSection', 'نصائح')}>
      <div className="rounded-xl border border-primary bg-primary/10 p-4 dark:border-primary/30 dark:bg-primary/20">
        <h2 className="mb-2 text-sm font-semibold text-primary dark:text-primary">
          {t('clarity.tips', 'نصائح للاستفادة القصوى')}
        </h2>
        <ul className="space-y-1.5 text-xs leading-relaxed text-primary">
          <li>{t('clarity.tip1', 'انتظر 24 إلى 48 ساعة بعد التفعيل لتظهر أول بيانات في اللوحة.')}</li>
          <li>{t('clarity.tip2', 'ركز على صفحة المنتج والـ checkout لأنهما الأهم في رحلة الشراء.')}</li>
          <li>{t('clarity.tip3', 'راجع تقارير Rage Clicks أسبوعيًا لاكتشاف المشاكل المؤثرة على التحويل.')}</li>
          <li>{t('clarity.tip4', 'يمكنك ربط Clarity مع Google Analytics للحصول على رؤية أكمل.')}</li>
        </ul>
      </div>
    </section>
  );
};
