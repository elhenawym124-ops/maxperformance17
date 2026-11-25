import React from 'react';
import { StorefrontThemeProvider } from './engine/ThemeProvider';
import { StudioVariablesStyle } from './studio/StudioVariablesStyle';
import { StorefrontHead } from './engine/StorefrontHead';
import ProductImageLandingPageFallback from './components/StorefrontSkeleton';
import StorefrontSkeleton from './components/StorefrontSkeleton';

const ProductImageLandingPage = React.lazy(
  () => import('./pages/ProductImageLandingPage'),
);
const FunnelCodSalesPage = React.lazy(
  () => import('./pages/FunnelCodSalesPage'),
);
import { shouldStorefrontForceDocumentNavigation } from './utils/navigationGuards';
import {
  resolveStorefrontPageLayout,
  StorefrontSectionFrame,
} from './layout/StorefrontSectionFrame';
import {
  type StorefrontShellProps,
  useStorefrontShellController,
  StorefrontLayout,
  StorefrontErrorState,
} from './shell';

import './styles/conversion-animations.css';
import './styles/storefront-layout.css';

export const shouldStorefrontHeaderForceDocumentNavigation =
  shouldStorefrontForceDocumentNavigation;
export { shouldStorefrontForceDocumentNavigation };
export { resolveStorefrontPageLayout, StorefrontSectionFrame };

export const StorefrontShell: React.FC<StorefrontShellProps> = (props) => {
  const {
    activePageKey,
    isStandaloneProductLanding,
    isStandaloneFunnel,
    settings,
    isLoading,
    error,
    previewThemeId,
    initialTheme,
    storefrontVariables,
  } = useStorefrontShellController(props);

  if (isStandaloneProductLanding) {
    return (
      <React.Suspense fallback={<ProductImageLandingPageFallback />}>
        <ProductImageLandingPage />
      </React.Suspense>
    );
  }

  if (isStandaloneFunnel) {
    return (
      <React.Suspense fallback={<StorefrontSkeleton />}>
        <FunnelCodSalesPage />
      </React.Suspense>
    );
  }

  if (isLoading) {
    return <StorefrontSkeleton />;
  }

  if (error || !settings) {
    return <StorefrontErrorState />;
  }

  return (
    <StorefrontThemeProvider
      initialTheme={initialTheme}
      blockUntilResolved
      activePageKey={activePageKey}
    >
      <StudioVariablesStyle variables={storefrontVariables} />
      <StorefrontHead settings={settings} activePageKey={activePageKey} />
      <StorefrontLayout
        previewThemeId={previewThemeId}
        activePageKey={activePageKey}
      />
    </StorefrontThemeProvider>
  );
};

export default StorefrontShell;
