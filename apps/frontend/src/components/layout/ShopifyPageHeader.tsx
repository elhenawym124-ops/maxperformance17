import React from "react";
import { Link } from "react-router-dom";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

export interface ShopifyBreadcrumb {
  label: string;
  to?: string;
}

export interface ShopifyPageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badges?: React.ReactNode;
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
            {badges && <div className="flex items-center gap-1.5">{badges}</div>}
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
