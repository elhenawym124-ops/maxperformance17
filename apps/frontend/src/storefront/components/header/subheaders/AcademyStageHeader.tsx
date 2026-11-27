import React from "react";
import { Link } from "react-router-dom";
import type { StorefrontHeaderController } from "../storefrontHeaderTypes";
import { StorefrontHomeLink } from "../storefrontHeaderHelpers";
import { buildStorefrontPath } from "../../../utils/paths";
import "../../../styles/academy-stage.css";

interface AcademyStageHeaderProps {
  controller: StorefrontHeaderController;
}

/**
 * Flush architectural Glazier steel-mullioned top rail for academy-stage-3d themes.
 */
export const AcademyStageHeader: React.FC<AcademyStageHeaderProps> = ({
  controller,
}) => {
  const {
    theme,
    location,
    mobileMenuOpen,
    setMobileMenuOpen,
    brandHomeLinkProps,
    displayLogoUrl,
    displayStoreName,
    navLinks,
    isActive,
    announcementBarElement,
  } = controller;

  const isRtl = theme.direction === "rtl";
  const ctaLink = navLinks.find(
    (item) => item.to.includes("registration") || item.label.includes("تقييم"),
  );
  const ctaHref =
    ctaLink?.to ||
    buildStorefrontPath(location.pathname, "/registration", location.search);
  const ctaLabel =
    ctaLink?.label || (isRtl ? "احجز تقييم مجاني" : "Free Assessment");

  const regularLinks = navLinks
    .filter((item) => item !== ctaLink)
    .slice(0, 4);

  return (
    <>
      {announcementBarElement}
      <header
        dir={theme.direction}
        className="glazier-scope glazier-b sticky top-0 z-40 w-full"
      >
        <div className="max-w-7xl mx-auto glazier-xl-x flex items-stretch justify-between">
          {/* Brand Partition Cell */}
          <div className="flex items-stretch min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden glazier-clear glazier-e inline-flex items-center justify-center w-12 min-h-[54px] shrink-0"
              aria-label={
                isRtl
                  ? mobileMenuOpen
                    ? "إغلاق القائمة"
                    : "فتح القائمة"
                  : mobileMenuOpen
                    ? "Close menu"
                    : "Open menu"
              }
            >
              {mobileMenuOpen ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="square"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="square"
                >
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              )}
            </button>

            <StorefrontHomeLink
              {...brandHomeLinkProps}
              className="glazier-clear glazier-md-e flex items-center gap-2 sm:gap-3 px-2.5 sm:px-5 min-h-[54px] min-w-0"
            >
              {displayLogoUrl ? (
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center border-2 border-foreground bg-background p-0.5 overflow-hidden">
                  <img
                    src={displayLogoUrl}
                    alt={displayStoreName}
                    className="h-full w-full object-contain"
                  />
                </span>
              ) : (
                <span
                  className="glazier-pane-cobalt inline-flex h-8 w-8 shrink-0 items-center justify-center text-xs font-bold font-mono"
                  aria-hidden="true"
                >
                  {displayStoreName.slice(0, 2).toUpperCase()}
                </span>
              )}
              <span className="glazier-heading truncate text-[13px] sm:text-base font-bold">
                {displayStoreName}
              </span>
            </StorefrontHomeLink>
          </div>

          {/* Center Architectural Panes */}
          <nav
            aria-label={isRtl ? "التنقل الرئيسي" : "Main navigation"}
            className="hidden md:flex items-stretch flex-1"
          >
            {regularLinks.map((item) => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to + item.label}
                  to={item.to}
                  className={`glazier-e inline-flex items-center px-5 min-h-[54px] text-sm font-medium whitespace-nowrap ${
                    active ? "glazier-pane-cobalt" : "glazier-clear"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Backlit Berry Primary Action Cell */}
          <div className="flex items-stretch shrink-0">
            <Link
              to={ctaHref}
              className="glazier-pane-berry glazier-s inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 min-h-[54px] text-xs sm:text-sm font-bold whitespace-nowrap"
            >
              <span>{ctaLabel}</span>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="square"
                aria-hidden="true"
              >
                <path
                  d={isRtl ? "M19 12H5M12 19l-7-7 7-7" : "M5 12h14M12 5l7 7-7 7"}
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Mobile Steel-Partitioned Drawer */}
        {mobileMenuOpen && (
          <nav
            aria-label={isRtl ? "قائمة الجوال" : "Mobile menu"}
            className="md:hidden glazier-t w-full"
          >
            {navLinks.map((item) => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to + item.label}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`glazier-b flex items-center justify-between min-h-[48px] px-4 text-sm font-semibold ${
                    active ? "glazier-pane-cobalt" : "glazier-clear"
                  }`}
                >
                  <span>{item.label}</span>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      d={
                        isRtl
                          ? "M19 12H5M12 19l-7-7 7-7"
                          : "M5 12h14M12 5l7 7-7 7"
                      }
                    />
                  </svg>
                </Link>
              );
            })}
          </nav>
        )}
      </header>
    </>
  );
};

export default AcademyStageHeader;
