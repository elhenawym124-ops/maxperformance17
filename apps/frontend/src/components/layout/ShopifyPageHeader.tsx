import React from "react";
import { Link } from "react-router-dom";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

export interface ShopifyBreadcrumb {
  label: string;
  to?: string;
}

export interface ShopifyBadgeItem {
  label: React.ReactNode;
  variant?: "default" | "secondary" | "destructive" | "outline" | "warning" | string;
}

export interface ShopifyPageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badges?: React.ReactNode | ShopifyBadgeItem[];
  actions?: React.ReactNode;
  breadcrumbs?: ShopifyBreadcrumb[];
  className?: string;
}

export const ShopifyPageHeader: React.FC<ShopifyPageHeaderProps> = ({
  title,
  subtitle,
  badges,
  actions,
  breadcrumbs,
  className = "",
}) => {
  return (
    <div
      className={`polaris-page-header flex flex-col gap-2 pb-4 mb-4 border-b border-[var(--p-border-subdued,#e1e3e5)] dark:border-[#1c2e2c] ${className}`}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium"
        >
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.label}>
                {idx > 0 && (
                  <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400 rtl:rotate-180" />
                )}
                {crumb.to && !isLast ? (
                  <Link
                    to={crumb.to}
                    className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? "text-gray-900 dark:text-gray-100 font-semibold" : ""}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Main Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 font-heading">
              {title}
            </h1>
            {badges && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {Array.isArray(badges)
                  ? badges.map((b, idx) => {
                      if (React.isValidElement(b)) return b;
                      if (b && typeof b === "object" && "label" in b) {
                        const variant = (b as any).variant;
                        const variantClasses =
                          variant === "destructive"
                            ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
                            : variant === "secondary"
                            ? "bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                            : variant === "warning" || variant === "amber"
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
                        return (
                          <span
                            key={idx}
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${variantClasses}`}
                          >
                            {(b as any).label}
                          </span>
                        );
                      }
                      return null;
                    })
                  : badges}
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 font-normal">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopifyPageHeader;
