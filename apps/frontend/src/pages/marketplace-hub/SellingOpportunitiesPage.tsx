import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ExternalLink, Search } from 'lucide-react';
import { MarketplaceHubLayout } from './components/MarketplaceHubLayout';
import { CountryCode, OpportunityCategory, marketplaceHubService } from '../../services/marketplaceHubService';

export const SellingOpportunitiesPage: React.FC = () => {
  const [country, setCountry] = useState<CountryCode>('EGY');
  const [search, setSearch] = useState<string>('');
  const [categories, setCategories] = useState<OpportunityCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    marketplaceHubService
      .getOpportunities(country, search)
      .then((list) => {
        if (active) setCategories(list);
      })
      .catch(() => {
        if (active) toast.error('تعذر تحميل قائمة فرص البيع');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [country, search]);

  return (
    <MarketplaceHubLayout title="دليل فرص البيع والأكثر مبيعاً">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {(['EGY', 'KSA', 'UAE'] as CountryCode[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCountry(c)}
              className={`rounded-md px-3 py-1.5 font-mono text-xs font-semibold transition-colors active:scale-[0.97] ${
                country === c
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border/70 bg-background text-muted-foreground hover:text-foreground'
              }`}
            >
              {c === 'EGY' ? 'مصر (EGY)' : c === 'KSA' ? 'السعودية (KSA)' : 'الإمارات (UAE)'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-2.5 start-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في التصنيفات..."
            className="w-full rounded-md border border-border/70 bg-background py-2 pe-3 ps-9 text-xs text-foreground"
          />
        </div>
      </div>

      <div className="overflow-x-auto border-t border-border/70 sm:rounded-md sm:border">
        <table className="w-full text-start text-xs">
          <thead className="border-b border-border/70 bg-muted/30 text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5 text-start font-medium">التصنيف</th>
              <th className="px-3 py-2.5 text-start font-medium">الاسم بالإنجليزية</th>
              <th className="px-3 py-2.5 text-end font-medium">روابط الأكثر مبيعاً</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-muted-foreground">
                  جاري التحميل...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-muted-foreground">
                  لا توجد تصنيفات مطابقة
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-muted/20">
                  <td className="px-3 py-2.5 font-medium text-foreground">{cat.nameAr}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{cat.nameEn}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <a
                        href={cat.amazonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded border border-border/70 bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-primary/60 hover:text-primary"
                      >
                        <span>Amazon Bestsellers</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <a
                        href={cat.noonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded border border-border/70 bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-primary/60 hover:text-primary"
                      >
                        <span>Noon</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      {cat.jumiaUrl && (
                        <a
                          href={cat.jumiaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded border border-border/70 bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-primary/60 hover:text-primary"
                        >
                          <span>Jumia</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </MarketplaceHubLayout>
  );
};

export default SellingOpportunitiesPage;
