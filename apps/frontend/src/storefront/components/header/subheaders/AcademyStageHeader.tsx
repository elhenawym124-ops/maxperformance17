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
 * Floating liquid-glass pill header exclusive to academy-stage-3d themes.
 * Replaces white utility/cart bars with a continuous dark-canvas studio pill.
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
    ctaLink?.label || (isRtl ? "احجز حصة تقييم مجانية" : "Book Free Assessment");

  const cleanNavLinks = navLinks.slice(0, 4);

  return (
    <>
      {announcementBarElement}
      <header
        dir={theme.direction}
        className="sticky top-0 z-50 w-full -mb-[70px] pt-3 px-3 sm:px-6 pointer-events-none"
      >
        <div className="max-w-7xl mx-auto pointer-events-auto">
          <div className="acad-glass acad-glass--strong acad-in-down rounded-full px-3 sm:px-5 h-[58px] flex items-center justify-between gap-3">
            {/* Brand slot */}
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full text-white/85 hover:text-white hover:bg-white/10 transition-colors"
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" x2="20" y1="7" y2="7" />
                    <line x1="4" x2="20" y1="12" y2="12" />
                    <line x1="4" x2="20" y1="17" y2="17" />
                  </svg>
                )}
              </button>

              <StorefrontHomeLink
                {...brandHomeLinkProps}
                className="flex items-center gap-2.5 min-w-0 group"
              >
                {displayLogoUrl ? (
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white p-0.5 shadow-sm overflow-hidden">
                    <img
                      src={displayLogoUrl}
                      alt={displayStoreName}
                      className="h-full w-full object-contain rounded-full"
                    />
                  </span>
                ) : (
                  <span
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-inner"
                    style={{ backgroundColor: "hsl(var(--accent))" }}
                    aria-hidden="true"
                  >
                    {displayStoreName.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="truncate text-sm sm:text-[15px] font-bold text-white/95 group-hover:text-white transition-colors">
                  {displayStoreName}
                </span>
              </StorefrontHomeLink>
            </div>

            {/* Center links (desktop) */}
            <nav
              aria-label={isRtl ? "التنقل الرئيسي" : "Main navigation"}
              className="hidden md:flex items-center gap-1 lg:gap-2"
            >
              {cleanNavLinks.map((item) => {
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to + item.label}
                    to={item.to}
                    className={`px-3.5 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                      active
                        ? "bg-white/12 text-white"
                        : "text-white/75 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Primary Roll CTA */}
            <div className="flex items-center gap-2 shrink-0">
              <Link to={ctaHref} className="acad-btn-roll text-xs sm:text-[13px] min-h-[40px] sm:min-h-[42px]">
                <span className="acad-btn-roll__label">
                  <span className="acad-btn-roll__inner">
                    <span>{ctaLabel}</span>
                    <span aria-hidden="true">{ctaLabel}</span>
                  </span>
                </span>
                <span className="acad-btn-roll__chip" aria-hidden="true">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={isRtl ? "M19 12H5M12 19l-7-7 7-7" : "M5 12h14M12 5l7 7-7 7"} />
                  </svg>
                </span>
              </Link>
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <nav
              aria-label={isRtl ? "قائمة الجوال" : "Mobile menu"}
              className="md:hidden mt-2 acad-glass acad-glass--strong rounded-3xl p-4 space-y-1.5"
            >
              {navLinks.map((item) => (
                <Link
                  key={item.to + item.label}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between min-h-[44px] px-4 py-2.5 rounded-2xl text-sm font-medium text-white/90 hover:bg-white/10 transition-colors"
                >
                  <span>{item.label}</span>
                  <span className="text-white/40 text-xs" aria-hidden="true">
                    {isRtl ? "←" : "→"}
                  </span>
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>
    </>
  );
};
