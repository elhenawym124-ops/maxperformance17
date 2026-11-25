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
      className={`polaris-page-header flex flex-col gap-2 pb-4 mb-4 border-b border-border/70 ${className}`}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium"
        >
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.label}>
                {idx > 0 && (
                  <ChevronRightIcon className="w-3.5 h-3.5 text-muted-foreground/70 rtl:rotate-180" />
                )}
                {crumb.to && !isLast ? (
                  <Link
                    to={crumb.to}
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? "text-foreground font-semibold" : ""}>
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
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-heading">
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
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : variant === "secondary"
                            ? "bg-muted text-muted-foreground border-border/70"
                            : variant === "warning" || variant === "amber"
                            ? "bg-warning/10 text-warning border-warning/20"
                            : "bg-success/10 text-success border-success/20";
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
            <p className="text-xs text-muted-foreground font-normal">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopifyPageHeader;
