import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  BuildingStorefrontIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import ThemeToggle from "../ui/theme-toggle";
import LanguageSwitcher from "../common/LanguageSwitcher";
import NotificationDropdown from "../notifications/NotificationDropdown";
import CompanySwitcher from "../common/CompanySwitcher";

export interface PolarisHeaderProps {
  isMobile: boolean;
  handleMobileToggle: () => void;
  mobileMenuLabel?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentCompany: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  isSuperAdmin: boolean;
  isExternalPortalUser: boolean;
  hasStore: boolean;
  storeUrl?: string;
  profileMenu: React.ReactNode;
}

export const PolarisHeader: React.FC<PolarisHeaderProps> = ({
  isMobile,
  handleMobileToggle,
  mobileMenuLabel = "القائمة",
  currentCompany,
  user,
  isSuperAdmin,
  isExternalPortalUser,
  hasStore,
  storeUrl,
  profileMenu,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/orders?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="polaris-top-header h-13 w-full border-b border-border/70 bg-card text-foreground px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-3 select-none flex-shrink-0 z-20">
      {/* Start: Mobile Toggle & Store Switcher */}
      <div className="flex items-center gap-2.5 min-w-0">
        {isMobile && (
          <button
            type="button"
            onClick={handleMobileToggle}
            aria-label={mobileMenuLabel}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-95"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
        )}

        {(user?.hasMultipleCompanies || isSuperAdmin) && !isExternalPortalUser ? (
          <div className="flex items-center">
            <CompanySwitcher collapsed={isMobile} />
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs uppercase shadow-xs shrink-0">
              {currentCompany?.name?.charAt(0) || "M"}
            </div>
            <span className="font-bold text-xs sm:text-sm tracking-tight text-foreground truncate max-w-[120px] sm:max-w-[180px]">
              {currentCompany?.name || "MaxP"}
            </span>
          </div>
        )}
      </div>

      {/* Center: Global Search Bar (Polaris style) */}
      <div className="flex-1 max-w-lg hidden md:block">
        <form onSubmit={handleSearchSubmit} className="relative">
          <MagnifyingGlassIcon className="absolute top-1/2 start-3 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("header.searchOrders", "بحث في المتجر، الطلبات، العملاء...")}
            className="w-full h-8 ps-9 pe-12 text-xs bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border/70 rounded-lg text-foreground placeholder-muted-foreground transition-all focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="absolute top-1/2 end-2.5 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            <kbd className="hidden lg:inline text-[9px] font-mono text-muted-foreground bg-card border border-border/70 px-1.5 py-0.5 rounded shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </form>
      </div>

      {/* End: Action Utilities & Profile */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => navigate("/super-admin/dashboard")}
            className="inline-flex items-center gap-1.5 h-7 px-2 text-[11px] font-semibold rounded-md border border-amber-300/80 dark:border-amber-700/60 bg-amber-50/90 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 shadow-2xs transition-all shrink-0"
            title="التبديل إلى إدارة المنصة المركزية"
          >
            <ShieldCheckIcon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="hidden sm:inline">إدارة المنصة</span>
          </button>
        )}

        {hasStore && (
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            title={t("header.visitStore", "زيارة المتجر")}
            aria-label={t("header.visitStore", "زيارة المتجر")}
          >
            <BuildingStorefrontIcon className="h-4 w-4" />
          </a>
        )}

        <ThemeToggle />

        <LanguageSwitcher className="shrink-0" />

        <NotificationDropdown className="shrink-0" />

        <div className="ms-1 sm:ms-2 shrink-0">{profileMenu}</div>
      </div>
    </header>
  );
};

export default PolarisHeader;
