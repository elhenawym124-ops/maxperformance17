import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calculator, QrCode, TrendingUp, LayoutGrid, Sparkles, Database, PlugZap, Coins } from 'lucide-react';
import { marketplaceHubService } from '../../../services/marketplaceHubService';
import { SellerCopilotDrawer } from './SellerCopilotDrawer';

interface MarketplaceHubLayoutProps {
  title: string;
  children: React.ReactNode;
}

const HUB_TABS = [
  { path: '/marketplace-hub', label: 'نظرة عامة', icon: LayoutGrid },
  { path: '/marketplace-hub/calculator', label: 'حاسبة الأرباح', icon: Calculator },
  { path: '/marketplace-hub/studio', label: 'استوديو AI', icon: Sparkles },
  { path: '/marketplace-hub/qr-barcode', label: 'QR والباركود', icon: QrCode },
  { path: '/marketplace-hub/opportunities', label: 'فرص البيع', icon: TrendingUp },
  { path: '/marketplace-hub/market-ops', label: 'الاستيراد والموردين', icon: Database },
  { path: '/marketplace-hub/channels', label: 'ربط المنصات والكريدت', icon: PlugZap },
];

export const MarketplaceHubLayout: React.FC<MarketplaceHubLayoutProps> = ({ title, children }) => {
  const { pathname } = useLocation();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    marketplaceHubService
      .getWallet()
      .then((res) => {
        if (active) setCredits(res.wallet.balance);
      })
      .catch(() => {
        // Non-blocking wallet badge
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
        <div className="rounded-lg border border-border/70 bg-card">
          {/* Top navigation header */}
          <div className="flex flex-col gap-3 border-b border-border/70 px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                {title}
              </h1>
              <Link
                to="/marketplace-hub/channels"
                className="inline-flex items-center gap-1.5 rounded border border-border/70 bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground hover:border-primary/60"
              >
                <Coins className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono tabular-nums">{credits !== null ? `${credits} Cr` : '...'}</span>
              </Link>
            </div>

            <nav
              aria-label="أقسام مركز المنصات"
              className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
            >
              {HUB_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = pathname === tab.path;
                return (
                  <Link
                    key={tab.path}
                    to={tab.path}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors active:scale-[0.97] ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border/70 bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Single-surface workspace body */}
          <div className="p-3 sm:p-6">{children}</div>
        </div>
      </div>

      <SellerCopilotDrawer onCreditsUpdated={setCredits} />
    </div>
  );
};
