import { useLocation } from 'react-router-dom';
import { buildStorefrontPath } from '../../utils/paths';
import { resolveSectionVariant } from '../../variants';
import {
  HeroBannerProps,
  HeroSlide,
  HeroVariantProps,
} from './heroTypes';

export const useHeroBannerController = (
  section?: HeroBannerProps['section'],
  settings?: HeroBannerProps['settings'],
) => {
  const location = useLocation();

  const resolveScopedHref = (href: unknown, fallback = ''): string => {
    const value =
      typeof href === 'string' && href.trim()
        ? href.trim()
        : typeof fallback === 'string'
          ? fallback
          : '';

    if (!value) {
      return '';
    }

    return buildStorefrontPath(
      location.pathname,
      value.startsWith('/') ? value : `/${value}`,
      location.search,
    );
  };

  const variant = resolveSectionVariant<string>(
    'HeroBanner',
    settings?.variant || section?.variant,
    'centered',
  );

  const title = settings?.title || 'Welcome to our store';
  const subtitle = settings?.subtitle || '';

  const props: HeroVariantProps = {
    title,
    subtitle,
    ctaText: settings?.primaryCtaText || settings?.ctaText || 'تسوّق الآن',
    primaryHref: resolveScopedHref(
      settings?.primaryCtaLink || settings?.ctaLink || '/shop',
    ),
    secondaryCtaText: settings?.secondaryCtaText || '',
    secondaryHref: resolveScopedHref(settings?.secondaryCtaLink),
    backgroundImage:
      settings?.backgroundImage || settings?.imageUrl || settings?.image || '',
    eyebrow: settings?.eyebrow,
    highlights: settings?.highlights || [],
    floatingCards: settings?.floatingCards || [],
    stickers: settings?.stickers || [],
    slides: Array.isArray(settings?.slides)
      ? settings.slides.map((slide: HeroSlide) => ({
          image:
            slide?.image || slide?.imageUrl || slide?.backgroundImage || '',
          alt: slide?.alt,
          title: slide?.title,
          subtitle: slide?.subtitle,
          eyebrow: slide?.eyebrow,
          ctaText: slide?.ctaText,
          ctaLink: resolveScopedHref(slide?.ctaLink),
          secondaryCtaText: slide?.secondaryCtaText,
          secondaryCtaLink: resolveScopedHref(slide?.secondaryCtaLink),
        }))
      : [],
    compact: settings?.compact === true,
    offerCard: (settings?.offerCard as HeroVariantProps['offerCard']) || undefined,
    miniCategories: (settings?.miniCategories as HeroVariantProps['miniCategories']) || undefined,
    bestPicks: (settings?.bestPicks as HeroVariantProps['bestPicks']) || undefined,
    watermarkText: typeof settings?.watermarkText === 'string' ? settings.watermarkText : undefined,
    brandName: typeof settings?.brandName === 'string' ? settings.brandName : undefined,
    logoUrl: typeof settings?.logoUrl === 'string' ? settings.logoUrl : undefined,
    hintText: typeof settings?.hintText === 'string' ? settings.hintText : undefined,
    heroBgFrom: typeof settings?.heroBgFrom === 'string' ? settings.heroBgFrom : undefined,
    heroBgTo: typeof settings?.heroBgTo === 'string' ? settings.heroBgTo : undefined,
    videoUrl: typeof settings?.videoUrl === 'string' ? settings.videoUrl : undefined,
    titleHighlight: typeof settings?.titleHighlight === 'string' ? settings.titleHighlight : undefined,
    trustPills: Array.isArray(settings?.trustPills) ? (settings.trustPills as string[]) : undefined,
    academyCards: Array.isArray(settings?.cards)
      ? (settings.cards as HeroVariantProps['academyCards'])
      : Array.isArray(settings?.academyCards)
        ? (settings.academyCards as HeroVariantProps['academyCards'])
        : undefined,
    panel: {
      image: settings?.panelImage,
      title: settings?.panelTitle,
      subtitle: settings?.panelSubtitle,
      note: settings?.panelNote,
      eyebrow: settings?.panelEyebrow,
      metricValue: settings?.panelMetricValue,
      metricLabel: settings?.panelMetricLabel,
    },
  };

  return {
    variant,
    props,
  };
};

export type HeroBannerController = ReturnType<typeof useHeroBannerController>;
