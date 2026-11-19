import React, { useId, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  XMarkIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import { SidebarSection, SidebarItem } from "../../../types/layout";
import { useAuth } from "../../../hooks/useAuthSimple";
import { isSidebarPathActive } from "./matchSidebarPath";
import { useSidebarNavLink } from "./useSidebarNavLink";

export interface PolarisSidebarProps {
  isCollapsed: boolean;
  mobileMode?: boolean;
  toggleSidebar: () => void;
  sections: SidebarSection[];
  collapsedSections: Record<string, boolean>;
  toggleSection: (id: string) => void;
  currentPath: string;
  t: (key: string) => string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

interface PolarisNavItemProps {
  item: SidebarItem;
  currentPath: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  isCollapsed: boolean;
  onClick?: () => void;
}

const PolarisNavItem: React.FC<PolarisNavItemProps> = ({
  item,
  currentPath,
  user,
  isCollapsed,
  onClick,
}) => {
  const { isActive, href, prefetch } = useSidebarNavLink({
    to: item.to,
    external: item.external,
    currentPath,
    user,
  });

  const content = (
    <div
      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md transition-all duration-150 text-[13px] font-medium active:scale-[0.98] ${
        isActive
          ? "bg-primary/10 text-primary font-semibold"
          : "text-foreground/80 hover:bg-muted"
      }`}
      title={isCollapsed ? item.label : undefined}
      onMouseEnter={() => prefetch(item.to)}
      onClick={onClick}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className={`flex-shrink-0 transition-colors ${
            isActive
              ? "text-primary"
              : "text-muted-foreground group-hover:text-foreground"
          }`}
        >
          {React.isValidElement(item.icon) &&
            React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, {
              className: "h-4 w-4",
            })}
        </span>
        {!isCollapsed && (
          <span className="truncate">{item.label}</span>
        )}
      </div>

      {!isCollapsed && item.badge && (
        <span className="ms-2 px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-muted text-muted-foreground tabular-nums">
          {item.badge}
        </span>
      )}
    </div>
  );

  if (item.external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block no-underline"
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      to={item.to}
      aria-current={isActive ? "page" : undefined}
      className="block no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--petrol,#013735)] rounded-md"
    >
      {content}
    </Link>
  );
};

export const PolarisSidebar: React.FC<PolarisSidebarProps> = ({
  isCollapsed,
  mobileMode = false,
  toggleSidebar,
  sections,
  collapsedSections,
  toggleSection,
  currentPath,
  t,
  searchQuery,
  setSearchQuery,
}) => {
  const { user } = useAuth();
  const searchInputId = useId();

  const currentCompany = useMemo(
    () => (user?.companies ?? []).find((c) => c.isCurrent) || user?.company,
    [user],
  );

  return (
    <aside
      className={`polaris-sidebar flex flex-col h-full bg-card border-inline-end border-border/70 select-none transition-all duration-200 ${
        isCollapsed ? "w-16" : "w-60"
      }`}
      aria-label={t("sidebar.navigation") || "Polaris Navigation"}
    >
      {/* Sidebar Header: Company / Store Identity */}
      <div className="flex items-center justify-between h-13 px-3.5 border-b border-border/70">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs font-mono relative flex-shrink-0 shadow-xs">
            {currentCompany?.name?.charAt(0) || "M"}
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent ring-1 ring-background" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="text-xs font-bold text-foreground truncate">
                {currentCompany?.name || "MaxP Merchant"}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono truncate">
                {currentCompany?.plan ? `${currentCompany.plan} Plan` : "Operations OS"}
              </span>
            </div>
          )}
        </div>

        {mobileMode && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1 rounded-md text-muted-foreground hover:bg-muted"
            aria-label={t("sidebar.close") || "Close"}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filter / Search Bar (Polaris Compact) */}
      {!isCollapsed && (
        <div className="p-2 border-b border-border/70">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute top-1/2 start-2.5 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              id={searchInputId}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("sidebar.search") || "تصفية القائمة..."}
              className="w-full h-7 ps-8 pe-2.5 text-xs bg-muted/30 border border-border/70 rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin">
        {sections.map((section) => {
          if (section.hidden) return null;
          const isSectionCollapsed = collapsedSections[section.id];

          return (
            <div key={section.id} className="space-y-1">
              {/* Section Header */}
              {!isCollapsed && section.title && (
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase hover:text-foreground transition-colors"
                >
                  <span className="truncate">{section.title}</span>
                  <ChevronDownIcon
                    className={`w-3 h-3 transition-transform duration-150 ${
                      isSectionCollapsed ? "-rotate-90" : ""
                    }`}
                  />
                </button>
              )}

              {/* Section Items */}
              {!isSectionCollapsed && (
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    if (item.hidden) return null;
                    return (
                      <PolarisNavItem
                        key={item.itemId || item.to}
                        item={item}
                        currentPath={currentPath}
                        user={user}
                        isCollapsed={isCollapsed}
                        onClick={mobileMode ? toggleSidebar : undefined}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pinned Bottom Navigation (Settings) */}
      <div className="p-2 border-t border-border/70 bg-card">
        <Link
          to="/settings"
          className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md transition-all duration-150 text-[13px] font-medium active:scale-[0.98] ${
            currentPath.startsWith("/settings")
              ? "bg-primary/10 text-primary font-semibold"
              : "text-foreground/80 hover:bg-muted"
          }`}
          title={isCollapsed ? t("sidebar.settings") || "الإعدادات" : undefined}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`flex-shrink-0 transition-colors ${
                currentPath.startsWith("/settings")
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-foreground"
              }`}
            >
              <Cog6ToothIcon className="h-4 w-4" />
            </span>
            {!isCollapsed && (
              <span className="truncate">{t("sidebar.settings") || "الإعدادات"}</span>
            )}
          </div>
        </Link>
      </div>
    </aside>
  );
};

export default PolarisSidebar;
