import React, { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, AlertTriangle, Sparkles, ShieldCheck } from 'lucide-react';
import { ListingHealthResult, marketplaceHubService } from '../../../services/marketplaceHubService';

export const ListingHealthPanel: React.FC = () => {
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [bulletsText, setBulletsText] = useState('');
  const [imageCount, setImageCount] = useState(3);
  const [altCoveragePct, setAltCoveragePct] = useState(80);
  const [attributesJson, setAttributesJson] = useState('{"color":"Black","warranty":"1 Year"}');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ListingHealthResult | null>(null);

  const runAssess = async (fixWithAi: boolean) => {
    setBusy(true);
    try {
      const bullets = bulletsText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      const data = await marketplaceHubService.assessListingHealth({
        titleAr,
        titleEn,
        brand,
        category,
        descriptionAr,
        descriptionEn,
        bulletPoints: bullets,
        imageCount,
        imageAltCoveragePct: altCoveragePct,
        attributesJson,
        fixWithAi,
      });
      setResult(data);
      toast.success(fixWithAi ? 'تم إصلاح وتحسين الإدراج بالـ AI (2 Cr)' : `نتيجة الفحص: ${data.audit.score}/100`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'تعذر فحص صحة المنتج';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <div className="space-y-3 border-t border-border/70 pt-4 lg:col-span-6 lg:rounded-md lg:border lg:bg-background lg:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">العنوان بالعربية</label>
            <input
              type="text"
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              placeholder="مثال: سماعة بلوتوث لاسلكية عازلة للضوضاء"
              className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-xs text-foreground"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Title (English)</label>
            <input
              type="text"
              dir="ltr"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="Wireless ANC Headphones Pro"
              className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-xs text-foreground"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">الماركة</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="MaxP"
              className="w-full rounded-md border border-border/70 bg-card px-3 py-1.5 text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">الفئة</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-border/70 bg-card px-3 py-1.5 text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">عدد الصور</label>
            <input
              type="number"
              min={0}
              value={imageCount}
              onChange={(e) => setImageCount(Number(e.target.value))}
              className="w-full rounded-md border border-border/70 bg-card px-3 py-1.5 font-mono text-xs tabular-nums"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">تغطية Alt %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={altCoveragePct}
              onChange={(e) => setAltCoveragePct(Number(e.target.value))}
              className="w-full rounded-md border border-border/70 bg-card px-3 py-1.5 font-mono text-xs tabular-nums"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">الوصف العربي</label>
          <textarea
            rows={2}
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
            placeholder="أدخل تفاصيل المنتج والخامات والمقاسات..."
            className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-xs"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Description (English)</label>
          <textarea
            rows={2}
            dir="ltr"
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-xs"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">النقاط البيعية (سطر لكل نقطة)</label>
            <textarea
              rows={3}
              value={bulletsText}
              onChange={(e) => setBulletsText(e.target.value)}
              className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">خصائص الفئة (JSON)</label>
            <textarea
              rows={3}
              dir="ltr"
              value={attributesJson}
              onChange={(e) => setAttributesJson(e.target.value)}
              className="w-full rounded-md border border-border/70 bg-card px-3 py-2 font-mono text-[11px]"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void runAssess(false)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border/70 bg-card px-4 py-2 text-xs font-semibold text-foreground hover:border-primary/60 disabled:opacity-60"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>فحص مجاني (0 Cr)</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void runAssess(true)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Fix with AI (2 Cr)</span>
          </button>
        </div>
      </div>

      <div className="space-y-4 border-t border-border/70 pt-4 lg:col-span-6 lg:rounded-md lg:border lg:bg-muted/20 lg:p-5">
        {result ? (
          <>
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div>
                <div className="text-xs text-muted-foreground">تقييم جاهزية الإدراج</div>
                <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-foreground">
                  {result.audit.score} / 100
                </div>
              </div>
              <span className="rounded-md border border-border/70 bg-card px-3 py-1 font-mono text-lg font-bold text-primary">
                Grade {result.audit.grade}
              </span>
            </div>

            <div className="divide-y divide-border/50 text-xs">
              {result.audit.checks.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5 py-2">
                  {c.passed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{c.label}</div>
                    {!c.passed && <div className="mt-0.5 text-[11px] text-muted-foreground">{c.hint}</div>}
                  </div>
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">+{c.points}</span>
                </div>
              ))}
            </div>

            {result.fixedListing && (
              <div className="space-y-2 rounded-md border border-primary/40 bg-card p-3 text-xs">
                <div className="font-semibold text-primary">المخرجات المُصلحة بالذكاء الاصطناعي</div>
                <div className="font-medium text-foreground">{result.fixedListing.titleAr}</div>
                <div className="font-mono text-[11px] text-muted-foreground" dir="ltr">
                  {result.fixedListing.titleEn}
                </div>
                <p className="leading-relaxed text-muted-foreground">{result.fixedListing.descriptionAr}</p>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center text-xs text-muted-foreground">
            أدخل بيانات الإعلان لاختبار الجاهزية أو إصلاح النواقص بضغطة واحدة.
          </div>
        )}
      </div>
    </div>
  );
};
