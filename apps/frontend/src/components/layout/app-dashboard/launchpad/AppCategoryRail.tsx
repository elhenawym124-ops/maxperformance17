import React from 'react';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { APP_CATEGORIES, type AppCategory } from '../../../../config/appRegistry';
import { cn } from '@/lib/utils';

export type CategoryFilterValue = AppCategory | 'all' | 'favorites';

interface AppCategoryRailProps {
  categories: AppCategory[];
  selected: CategoryFilterValue;
  counts: Record<string, number>;
  favoritesCount: number;
  total: number;
  onSelect: (value: CategoryFilterValue) => void;
}

/**
 * Sticky category rail: a fixed number of pills no matter how many apps a
 * tenant installs. Each pill carries its live count so the rail itself is
 * scannable before anything is clicked.
 */
export const AppCategoryRail: React.FC<AppCategoryRailProps> = ({
  categories,
  selected,
  counts,
  favoritesCount,
  total,
  onSelect,
}) => {
  const { t } = useTranslation();

  const items: Array<{ value: CategoryFilterValue; label: string; count: number }> = [
    { value: 'all', label: String(t('appDashboard.category.all')), count: total },
    ...(favoritesCount > 0
      ? [{ value: 'favorites' as CategoryFilterValue, label: String(t('appDashboard.category.favorites')), count: favoritesCount }]
      : []),
    ...categories.map((cat) => ({
      value: cat as CategoryFilterValue,
      label: String(t(APP_CATEGORIES[cat].nameKey)),
      count: counts[cat] ?? 0,
    })),
  ];

  return (
    <nav
      aria-label={String(t('appDashboard.categoryFilterLabel'))}
      className="sticky top-0 z-20 -mx-2.5 sm:-mx-6 lg:-mx-8 mb-3 border-b border-gray-200/70 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
    >
      <div
        role="tablist"
        className="flex items-center gap-1.5 overflow-x-auto scrollbar-none px-2.5 sm:px-6 lg:px-8 py-2"
      >
        {items.map((item) => {
          const isActive = selected === item.value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(item.value)}
              className={cn(
                'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-white dark:text-gray-300 dark:hover:bg-gray-800',
              )}
            >
              {item.value === 'favorites' && (
                <Star className={cn('size-3', isActive ? 'fill-white' : 'fill-amber-500 text-amber-500')} />
              )}
              <span className="whitespace-nowrap">{item.label}</span>
              <span className={cn('text-[11px] tabular-nums', isActive ? 'text-white/80' : 'text-gray-400')}>
                {item.count}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default AppCategoryRail;
