import React from 'react';
import { FeaturedCollectionsProps } from './featured-collections/types';
import { useFeaturedCollectionsController } from './featured-collections/useFeaturedCollectionsController';
import { ButcherCutMapVariant } from './featured-collections/variants/ButcherCutMapVariant';
import { EasyOrdersCirclesVariant } from './featured-collections/variants/EasyOrdersCirclesVariant';
import { FeaturedCollectionsLayout } from './featured-collections/variants/FeaturedCollectionsLayout';
import { MarketplaceCategoryTiles } from './featured-collections/variants/MarketplaceCategoryTiles';
import { GlazierTracksSection } from './glazier/GlazierTracksSection';

export * from './featured-collections';

const StandardFeaturedCollections: React.FC<FeaturedCollectionsProps> = ({
  section,
  settings,
}) => {
  const ctrl = useFeaturedCollectionsController(section, settings);

  if (ctrl.variant === 'butcher-cut-map') {
    return <ButcherCutMapVariant ctrl={ctrl} />;
  }

  if (ctrl.variant === 'easyorders-circles') {
    return <EasyOrdersCirclesVariant ctrl={ctrl} />;
  }

  if (ctrl.variant === 'marketplace-tiles') {
    return <MarketplaceCategoryTiles ctrl={ctrl} settings={settings as Record<string, unknown>} />;
  }

  return <FeaturedCollectionsLayout ctrl={ctrl} />;
};

export const FeaturedCollections: React.FC<FeaturedCollectionsProps> = ({
  section,
  settings,
}) => {
  const rawVariant = String(section?.variant || settings?.variant || '')
    .trim()
    .toLowerCase();

  if (rawVariant === 'glazier-tracks') {
    return <GlazierTracksSection section={section} settings={settings} />;
  }

  return <StandardFeaturedCollections section={section} settings={settings} />;
};

export default FeaturedCollections;
