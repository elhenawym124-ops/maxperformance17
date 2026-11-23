import React from 'react';
import { useTranslation } from 'react-i18next';
import { COMPETITOR_STATUSES, type CompetitorStatus } from './CompetitorStatusBar';
import i18n from '../../i18n';

export type StatusFilter = CompetitorStatus | 'ALL';

interface StatusCounts {
  total: number;
  NEW: number;
  FOLLOWING: number;
  COMPLETED: number;
}

interface GlobalCompetitorStatusBarProps {
  selectedFilter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
  counts: StatusCounts;
  isLoading?: boolean;
}

const filterItems: StatusFilter[] = ['ALL', ...COMPETITOR_STATUSES];

function GlobalCompetitorStatusBar({
  selectedFilter,
  onFilterChange,
  counts,
  isLoading = false,
}: GlobalCompetitorStatusBarProps) {
  const { t } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  const getCount = (filter: StatusFilter): number => {
    if (filter === 'ALL') return counts.total;
    return counts[filter] || 0;
  };

  const getLabelKey = (filter: StatusFilter): string => {
    if (filter === 'ALL') return 'competitors.statusFilterAll';
    return `competitors.statuses.${filter}`;
  };

  return (
    <div
      className="flex w-full shrink-0 items-center gap-0.5 overflow-x-auto rounded-xl bg-muted/60 p-1 sm:w-auto"
      dir={isRtl ? 'rtl' : 'ltr'}
      role="group"
      aria-label={t('competitors.filterByStatus')}
    >
      {filterItems.map((filter) => {
        const isActive = filter === selectedFilter;
        const count = getCount(filter);

        return (
          <button
            key={filter}
            type="button"
            onClick={() => onFilterChange(filter)}
            disabled={isLoading}
            aria-pressed={isActive}
            className={`
              inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3
              text-[13px] font-medium max-sm:h-11
              transition-colors duration-150 ease-out
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-card
              ${isActive
                ? 'bg-card text-foreground shadow-2xs ring-1 ring-border/70'
                : 'text-muted-foreground hover:text-foreground'
              }
              ${isLoading ? 'cursor-wait opacity-60' : 'cursor-pointer'}
            `}
          >
            <span className="whitespace-nowrap">{t(getLabelKey(filter))}</span>
            <span
              className={`text-[11px] font-semibold tabular-nums ${
                isActive ? 'text-foreground/60' : 'text-muted-foreground/70'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default GlobalCompetitorStatusBar;
