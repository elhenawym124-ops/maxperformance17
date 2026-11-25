import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Upload, Building2, Search } from 'lucide-react';
import { MarketplaceHubLayout } from './components/MarketplaceHubLayout';
import {
  CountryCode,
  MarketplacePlatform,
  VendorItem,
  marketplaceHubService,
} from '../../services/marketplaceHubService';

export const MarketplaceMarketOpsPage: React.FC = () => {
  const [tab, setTab] = useState<'csv' | 'vendors'>('csv');

  // CSV state
  const [csvPlatform, setCsvPlatform] = useState<MarketplacePlatform>('amazon');
  const [csvText, setCsvText] = useState<string>('sku,title,price,quantity\nMAXP-101,ماكينة قهوة محمولة,850,15\nMAXP-102,خلاط كهربائي 500 واط,1290,8');
  const [csvResult, setCsvResult] = useState<{
    totalRowsParsed: number;
    previewRows: Array<{ rowNumber: number; sku: string; title: string; price: number; stock: number }>;
  } | null>(null);

  // Vendors state
  const [country, setCountry] = useState<CountryCode>('EGY');
  const [category, setCategory] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [vendors, setVendors] = useState<VendorItem[]>([]);

  useEffect(() => {
    if (tab !== 'vendors') return;
    marketplaceHubService
      .getVendors(country, category, search)
      .then((res) => {
        setCategories(res.categories);
        setVendors(res.vendors);
      })
      .catch(() => toast.error('تعذر تحميل دليل الموردين'));
  }, [tab, country, category, search]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result || ''));
    reader.readAsText(file);
  };

  const handleParseCsv = async () => {
    try {
      const res = await marketplaceHubService.importCsv(csvPlatform, csvText);
      setCsvResult(res);
      toast.success(`تمت قراءة ${res.totalRowsParsed} صف بنجاح`);
    } catch {
      toast.error('تعذر تحليل ملف CSV');
    }
  };

  return (
    <MarketplaceHubLayout title="استيراد الملفات ودليل الموردين">
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTab('csv')}
          className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold ${
            tab === 'csv' ? 'bg-primary text-primary-foreground' : 'border border-border/70 bg-background text-muted-foreground'
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          <span>استيراد CSV (Amazon / Noon / Jumia)</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('vendors')}
          className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold ${
            tab === 'vendors' ? 'bg-primary text-primary-foreground' : 'border border-border/70 bg-background text-muted-foreground'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>دليل الموردين (Vendor Market)</span>
        </button>
      </div>

      {tab === 'csv' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">مصدر الملف</label>
              <select
                value={csvPlatform}
                onChange={(e) => setCsvPlatform(e.target.value as MarketplacePlatform)}
                className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-xs"
              >
                <option value="amazon">Amazon Report CSV</option>
                <option value="noon">Noon Partner CSV</option>
                <option value="jumia">Jumia Export CSV</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">رفع ملف CSV</label>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="w-full rounded-md border border-border/70 bg-background px-3 py-1.5 text-xs"
              />
            </div>
          </div>

          <textarea
            rows={5}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            dir="ltr"
            className="w-full rounded-md border border-border/70 bg-background p-3 font-mono text-xs text-foreground"
          />

          <button
            type="button"
            onClick={() => void handleParseCsv()}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>تحليل ومعاينة الصفوف</span>
          </button>

          {csvResult && (
            <div className="overflow-x-auto border-t border-border/70 sm:rounded-md sm:border">
              <table className="w-full text-start text-xs">
                <thead className="border-b border-border/70 bg-muted/30 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-start">#</th>
                    <th className="px-3 py-2 text-start">SKU</th>
                    <th className="px-3 py-2 text-start">المنتج</th>
                    <th className="px-3 py-2 text-end">السعر</th>
                    <th className="px-3 py-2 text-end">الكمية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {csvResult.previewRows.map((row) => (
                    <tr key={row.rowNumber}>
                      <td className="px-3 py-2 font-mono tabular-nums">{row.rowNumber}</td>
                      <td className="px-3 py-2 font-mono">{row.sku}</td>
                      <td className="px-3 py-2">{row.title}</td>
                      <td className="px-3 py-2 text-end font-mono tabular-nums">{row.price}</td>
                      <td className="px-3 py-2 text-end font-mono tabular-nums">{row.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value as CountryCode)}
              className="rounded-md border border-border/70 bg-background px-3 py-2 text-xs"
            >
              <option value="EGY">مصر (EGY)</option>
              <option value="KSA">السعودية (KSA)</option>
              <option value="UAE">الإمارات (UAE)</option>
            </select>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-md border border-border/70 bg-background px-3 py-2 text-xs"
            >
              <option value="">كل التصنيفات</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="relative">
              <Search className="pointer-events-none absolute top-2.5 start-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث عن مورد..."
                className="w-full rounded-md border border-border/70 bg-background py-2 pe-3 ps-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {vendors.map((v) => (
              <div key={v.id} className="rounded-md border border-border/70 bg-background p-4 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">{v.name}</span>
                  <span className="rounded border border-border/70 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {v.city}
                  </span>
                </div>
                <div className="mt-1 font-mono text-[11px] text-primary">{v.category}</div>
                <p className="mt-2 text-muted-foreground">{v.notes}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </MarketplaceHubLayout>
  );
};

export default MarketplaceMarketOpsPage;
