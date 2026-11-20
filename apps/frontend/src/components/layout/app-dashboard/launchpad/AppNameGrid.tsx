import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import type { AppDefinition } from '../../../../config/appRegistry';
import { useRoutePrefetch } from '../../../../hooks/useRoutePrefetch';
import { TILE_COLORS, DEFAULT_TILE_COLOR } from './AppLaunchpadTile';
import { cn } from '@/lib/utils';

interface AppNameGridProps {
  apps: AppDefinition[];
  favorites: string[];
  onToggleFavorite: (appId: string) => void;
}

/**
 * Dense name-only grid (Petrol & Persimmon): icon + app name, nothing else.
 * Twenty-plus apps stay on one screen; the category rail narrows the set
 * instead of hiding apps inside a collapsed group.
 */
export const AppNameGrid: React.FC<AppNameGridProps> = ({ apps, favorites, onToggleFavorite }) => {
  const { i18n, t } = useTranslation();
  const prefetch = useRoutePrefetch();
  const isRtl = i18n.language?.startsWith('ar') ?? false;

  return (
    <div className="grid grid-cols-2 gap-x-2 gap-y-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {apps.map((app) => {
        const appName = app.displayName ?? t(app.nameKey);
        const targetPath = app.route || `/apps/${app.id}`;
        const isFavorite = favorites.includes(app.id);
        const colors = TILE_COLORS[app.color] ?? DEFAULT_TILE_COLOR;

        const icon = React.isValidElement(app.icon)
          ? React.cloneElement(app.icon as React.ReactElement<{ className?: string; 'aria-hidden'?: boolean }>, {
              'aria-hidden': true,
              className: 'size-4',
            })
          : React.createElement(app.icon as React.ElementType<{ className?: string; 'aria-hidden'?: boolean }>, {
              'aria-hidden': true,
              className: 'size-4',
            });

        const handlePrefetch = () => {
          prefetch(targetPath);
          if (app.id) prefetch(`/${app.id}`);
        };

        return (
          <div key={app.id} className="group relative">
            <Link
              to={targetPath}
              aria-label={appName}
              title={appName}
              onMouseEnter={handlePrefetch}
              onFocus={handlePrefetch}
              className={cn(
                'flex min-h-12 items-center gap-2.5 rounded-lg border border-transparent py-1.5',
                isRtl ? 'pr-2 pl-8' : 'pl-2 pr-8',
                'transition-colors duration-150 hover:border-[var(--petrol,#013735)]/15 hover:bg-white',
                'dark:hover:border-white/10 dark:hover:bg-gray-800',
                'active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,#e2603f)]',
              )}
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                  colors.bg,
                )}
              >
                {icon}
              </span>
              <span className="line-clamp-2 text-[13px] font-medium leading-tight text-slate-800 dark:text-slate-100">
                {appName}
              </span>
            </Link>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(app.id);
              }}
              aria-pressed={isFavorite}
              aria-label={String(isFavorite ? t('appDashboard.removeFromFavorites') : t('appDashboard.addToFavorites'))}
              title={String(isFavorite ? t('appDashboard.removeFromFavorites') : t('appDashboard.addToFavorites'))}
              className={cn(
                'absolute top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full transition-opacity',
                isRtl ? 'left-1' : 'right-1',
                isFavorite
                  ? 'bg-amber-500/10 text-amber-500 opacity-100'
                  : 'text-slate-400 opacity-0 hover:text-amber-500 group-hover:opacity-100 focus-visible:opacity-100',
              )}
            >
              <Star className={cn('size-3.5', isFavorite && 'fill-amber-500')} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default AppNameGrid;
