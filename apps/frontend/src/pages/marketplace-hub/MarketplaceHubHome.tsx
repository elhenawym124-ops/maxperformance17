import React from 'react';
import { Link } from 'react-router-dom';
import { Calculator, QrCode, TrendingUp, ArrowUpLeft, Sparkles, Database, PlugZap, BarChart3 } from 'lucide-react';
import { MarketplaceHubLayout } from './components/MarketplaceHubLayout';

const ALL_MODULES = [
  {
    to: '/marketplace-hub/dashboard',
    title: 'لوحة تحليلات القنوات الموحدة',
    badge: 'SP-API Ready',
    icon: BarChart3,
    metrics: 'Overview+ · Sales · Payments',
  },
  {
    to: '/marketplace-hub/calculator',
    title: 'حاسبة أرباح المنصات',
    badge: 'جاهز',
    icon: Calculator,
    metrics: 'Amazon · Noon · Jumia · Trendyol',
  },
  {
    to: '/marketplace-hub/studio',
    title: 'استوديو الصور والمحتوى AI',
    badge: 'جاهز (AI Keys)',
    icon: Sparkles,
    metrics: 'Studio · Alpha · Leo',
  },
  {
    to: '/marketplace-hub/qr-barcode',
    title: 'مولد QR والباركود',
    badge: 'جاهز',
    icon: QrCode,
    metrics: 'Code 128 · EAN-13 · UPC-A · QR',
  },
  {
    to: '/marketplace-hub/opportunities',
    title: 'دليل فرص البيع',
    badge: 'جاهز',
    icon: TrendingUp,
    metrics: '18 فئة · EGY · KSA · UAE',
  },
  {
    to: '/marketplace-hub/market-ops',
    title: 'استيراد CSV ودليل الموردين',
    badge: 'جاهز',
    icon: Database,
    metrics: 'CSV Import · Vendor Market',
  },
  {
    to: '/marketplace-hub/channels',
    title: 'ربط المنصات ومحفظة الكريدت',
    badge: 'جاهز للربط',
    icon: PlugZap,
    metrics: 'SP-API · Noon · Jumia · Wallet',
  },
];

export const MarketplaceHubHome: React.FC = () => {
  return (
    <MarketplaceHubLayout title="مركز منصات البيع والأدوات">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">وحدات المنصة المتاحة</h2>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">{ALL_MODULES.length} / {ALL_MODULES.length}</span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {ALL_MODULES.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.to}
                to={tool.to}
                className="group flex flex-col justify-between rounded-md border border-border/70 bg-background p-4 transition-colors hover:border-primary/60 hover:bg-muted/30 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded border border-border/70 bg-card text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-semibold text-foreground">{tool.title}</span>
                  </div>
                  <ArrowUpLeft className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-2.5">
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    {tool.metrics}
                  </span>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    {tool.badge}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </MarketplaceHubLayout>
  );
};

export default MarketplaceHubHome;
