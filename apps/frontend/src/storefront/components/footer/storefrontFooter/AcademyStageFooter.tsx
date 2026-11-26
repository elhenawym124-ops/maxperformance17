import React from 'react';
import { Link } from 'react-router-dom';
import type { StorefrontFooterController } from './useStorefrontFooterController';
import { renderStorefrontSocialBrandIcon } from './FooterSocialIcons';
import '../../../styles/academy-stage.css';

interface AcademyStageFooterProps {
  controller: StorefrontFooterController;
}

/**
 * Editorial dark-canvas studio footer for academy-stage-3d.
 * Eliminates legacy store boilerplate ("أفضل المنتجات", card payment icons)
 * in favor of unified #060913 obsidian continuity and giant architectural typography.
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

  const isRtl = theme.direction === 'rtl';
  const logoUrl =
    theme.header?.logoUrl ||
    (settings?.storefront?.settings?.['logoUrl'] as string | undefined) ||
    settings?.company?.logo ||
    null;

  const safeDescription =
    footerDescriptionText && !footerDescriptionText.includes('أفضل المنتجات والخدمات')
      ? footerDescriptionText
      : theme.footer?.description ||
        'منصة ومسارات تعليمية لبناء جيل يبتكر بالكود والذكاء الاصطناعي وريادة الأعمال.';

  const renderLink = (to: string, label: string) =>
    shouldForceDocumentNavigation ? (
      <a
        href={to}
        className="inline-flex min-h-[36px] items-center text-sm text-white/65 hover:text-white transition-colors"
      >
        {label}
      </a>
    ) : (
      <Link
        to={to}
        className="inline-flex min-h-[36px] items-center text-sm text-white/65 hover:text-white transition-colors"
      >
        {label}
      </Link>
    );

  return (
    <footer
      dir={theme.direction}
      className="relative overflow-hidden border-t border-white/10 bg-[#060913] text-white"
    >
      <div className="acad-grain" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 start-1/2 -translate-x-1/2 w-[min(960px,95vw)] h-64 rounded-full blur-3xl opacity-25"
        style={{ backgroundColor: 'hsl(var(--accent))' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/10">
          {/* Brand + Summary */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              {logoUrl && (
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white p-1 overflow-hidden">
                  <img
                    src={logoUrl}
                    alt={displayStoreName}
                    className="h-full w-full object-contain rounded-full"
                  />
                </span>
              )}
              <div>
                <p className="text-xl font-bold text-white tracking-normal">
                  {displayStoreName}
                </p>
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-white/50">
                  Interactive Academy Studio
                </p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-white/70 max-w-md">
              {safeDescription}
            </p>

            {Object.values(socialIcons).some(Boolean) && (
              <div className="flex items-center gap-2.5 pt-1">
                {Object.entries(socialIcons).map(([social, url]) =>
                  url ? (
                    <a
                      key={social}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social}
                      className="acad-glass flex h-10 w-10 items-center justify-center rounded-full text-white/75 hover:text-white transition-transform hover:scale-105"
                    >
                      {renderStorefrontSocialBrandIcon(social) || social.slice(0, 2)}
                    </a>
                  ) : null,
                )}
              </div>
            )}
          </div>

          {/* Navigation Groups */}
          <div className="md:col-span-4 grid grid-cols-2 gap-6">
            {footerLinksData.slice(0, 2).map((group) => (
              <div key={group.title} className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-[0.16em] text-white/50">
                  {group.title}
                </h3>
                <ul className="space-y-1.5">
                  {group.links.map((item) => (
                    <li key={item.to + item.label}>
                      {renderLink(item.to, item.label)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Direct Contact Telemetry */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-[0.16em] text-white/50">
              {isRtl ? 'التواصل المباشر' : 'Direct Contact'}
            </h3>
            <div className="space-y-2.5 text-sm">
              {footerContactRows.length > 0 ? (
                footerContactRows.map((row) => (
                  <div key={row.label + row.value} className="space-y-0.5">
                    <div className="text-xs text-white/45">{row.label}</div>
                    {row.href ? (
                      <a
                        href={row.href}
                        className="font-mono tabular-nums text-white/85 hover:text-white transition-colors"
                      >
                        {row.value}
                      </a>
                    ) : (
                      <div className="text-white/85">{row.value}</div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-white/60 text-xs">
                  {isRtl
                    ? 'حجز حصص التقييم والمتابعة عبر البوابة الإلكترونية.'
                    : 'Book evaluation sessions online.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Copyright + Architectural Ghost Wordmark */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>{footerCopyrightText}</p>
          {legalLinks.length > 0 && (
            <div className="flex flex-wrap items-center gap-4">
              {legalLinks.map((l) => (
                <span key={l.to + l.label}>{renderLink(l.to, l.label)}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none select-none overflow-hidden text-center font-bold leading-[0.82] text-white/[0.03] whitespace-nowrap -mb-4"
        style={{ fontSize: 'clamp(56px, 14vw, 190px)' }}
      >
        {displayStoreName}
      </div>
    </footer>
  );
};
