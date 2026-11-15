import React from 'react';
import TrustedBadgePanel from '../../../components/TrustedBadgePanel';

export const ConfigurableTrustBadges = ({
  title,
  subtitle,
  items,
  variant = 'strip',
  className,
}: {
  title?: string;
  subtitle?: string;
  items?: string[];
  variant?: 'strip' | 'grid' | 'minimal';
  className?: string;
}) => (
  <TrustedBadgePanel
    title={title}
    subtitle={subtitle}
    items={items}
    variant={variant}
    className={className}
  />
);

ConfigurableTrustBadges.displayName = 'ConfigurableTrustBadges';
export default ConfigurableTrustBadges;