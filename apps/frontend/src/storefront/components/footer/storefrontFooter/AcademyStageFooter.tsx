import React from "react";
import { Link } from "react-router-dom";
import type { StorefrontFooterController } from "./useStorefrontFooterController";
import { renderStorefrontSocialBrandIcon } from "./FooterSocialIcons";
import "../../../styles/academy-stage.css";

interface AcademyStageFooterProps {
  controller: StorefrontFooterController;
}

/**
 * Daylight Glazier architectural ground-floor partition footer.
 */
export const AcademyStageFooter: React.FC<AcademyStageFooterProps> = ({
  controller,
}) => {
  const {
    theme,
    settings,
    displayStoreName,
    footerDescriptionText,
    footerCopyrightText,
    footerContactRows,
    socialIcons,
    footerLinksData,
    legalLinks,
    shouldForceDocumentNavigation,
  } = controller;

  const isRtl = theme.direction === "rtl";
  const logoUrl =
    theme.header?.logoUrl ||
    (settings?.storefront?.settings?.["logoUrl"] as string | undefined) ||
    settings?.company?.logo ||
    null;

  const safeDescription =
    footerDescriptionText && !footerDescriptionText.includes("أفضل المنتجات والخدمات")
      ? footerDescriptionText
      : theme.footer?.description ||
        "مسار تعليمي متكامل من البرمجة وبناء المشاريع إلى عرض Demo Day في مجموعات صغيرة.";

  const renderLink = (to: string, label: string) =>
    shouldForceDocumentNavigation ? (
      <a
        href={to}
        className="inline-flex min-h-[40px] items-center text-sm font-medium hover:underline underline-offset-4"
      >
        {label}
      </a>
    ) : (
      <Link
        to={to}
        className="inline-flex min-h-[40px] items-center text-sm font-medium hover:underline underline-offset-4"
      >
        {label}
      </Link>
    );

  return (
    <footer dir={theme.direction} className="glazier-scope glazier-t w-full">
      <div className="max-w-7xl mx-auto glazier-xl-x">
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Brand & Identity Cell */}
          <div className="md:col-span-5 glazier-seeded p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {logoUrl && (
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center border-2 border-foreground bg-background p-1 overflow-hidden">
                    <img
                      src={logoUrl}
                      alt={displayStoreName}
                      className="h-full w-full object-contain"
                    />
                  </span>
                )}
                <p className="glazier-heading text-xl font-bold">
                  {displayStoreName}
                </p>
              </div>
              <p className="glazier-muted text-sm leading-relaxed max-w-md">
                {safeDescription}
              </p>
            </div>

            {Object.values(socialIcons).some(Boolean) && (
              <div className="flex items-center gap-2">
                {Object.entries(socialIcons).map(([social, url]) =>
                  url ? (
                    <a
                      key={social}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social}
                      className="glazier-clear glazier-frame flex h-11 w-11 items-center justify-center"
                    >
                      {renderStorefrontSocialBrandIcon(social) || social.slice(0, 2)}
                    </a>
                  ) : null,
                )}
              </div>
            )}
          </div>

          {/* Navigation Matrix Cells */}
          <div className="md:col-span-4 glazier-t glazier-md-t-0 glazier-md-s grid grid-cols-2">
            {footerLinksData.slice(0, 2).map((group, idx) => (
              <div
                key={group.title}
                className={`glazier-clear p-6 sm:p-7 ${idx === 0 ? "glazier-e" : ""}`}
              >
                <h3 className="glazier-heading text-sm font-bold mb-3">
                  {group.title}
                </h3>
                <ul className="space-y-0.5">
                  {group.links.map((item) => (
                    <li key={item.to + item.label}>
                      {renderLink(item.to, item.label)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Direct Contact Telemetry Cell */}
          <div className="md:col-span-3 glazier-t glazier-md-t-0 glazier-md-s glazier-seeded p-6 sm:p-7 space-y-4">
            <h3 className="glazier-heading text-sm font-bold">
              {isRtl ? "التواصل والحجز" : "Direct Contact"}
            </h3>
            <div className="space-y-3 text-sm">
              {footerContactRows.length > 0 ? (
                footerContactRows.map((row) => (
                  <div key={row.label + row.value} className="space-y-0.5">
                    <div className="glazier-muted text-xs">{row.label}</div>
                    {row.href ? (
                      <a
                        href={row.href}
                        className="inline-block font-mono tabular-nums text-xs sm:text-sm font-semibold hover:underline underline-offset-4"
                      >
                        {row.value}
                      </a>
                    ) : (
                      <div className="text-sm font-medium">{row.value}</div>
                    )}
                  </div>
                ))
              ) : (
                <p className="glazier-muted text-xs leading-relaxed">
                  {isRtl
                    ? "تدريب حضوري بالمقرات المعتمدة وبث مباشر أونلاين · 15 مستوى للأعمار 6–17."
                    : "Campus and live online cohorts across 15 levels for ages 6–17."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Backlit Cobalt Sill Strip */}
        <div className="glazier-t glazier-pane-cobalt px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>{footerCopyrightText}</p>
          {legalLinks.length > 0 && (
            <div className="flex flex-wrap items-center gap-4">
              {legalLinks.map((item) => (
                <span key={item.to + item.label}>
                  {renderLink(item.to, item.label)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default AcademyStageFooter;
