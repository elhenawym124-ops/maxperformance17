import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Sparkles, Image as ImageIcon, FileText, Layers, Save, Upload, Download } from 'lucide-react';
import { MarketplaceHubLayout } from './components/MarketplaceHubLayout';
import {
  MarketplacePlatform,
  StudioDraft,
  marketplaceHubService,
} from '../../services/marketplaceHubService';

type StudioTab = 'studio' | 'alpha' | 'leo';

const IMAGE_STYLES = ['Product Photo', 'Lifestyle', 'Infographic', 'White Background'] as const;
const IMAGE_ACTIONS = [
  { id: 'image_to_image', label: 'صورة لصورة (3 Cr)' },
  { id: 'text_to_image', label: 'نص لصورة (3 Cr)' },
  { id: 'remove_bg', label: 'إزالة الخلفية' },
  { id: 'remove_text', label: 'إزالة النصوص (3 Cr)' },
  { id: 'enhance', label: 'تحسين الجودة (3 Cr)' },
  { id: 'pack5', label: '5 زوايا متكاملة (15 Cr)' },
] as const;

export const MarketplaceStudioPage: React.FC = () => {
  const [tab, setTab] = useState<StudioTab>('studio');
  const [drafts, setDrafts] = useState<StudioDraft[]>([]);

  // Studio 4-step wizard state
  const [workflow, setWorkflow] = useState<'AI_COMPLETE' | 'OWN_CONTENT' | 'OPTIMIZE'>('AI_COMPLETE');
  const [studioTitle, setStudioTitle] = useState('');
  const [studioNotes, setStudioNotes] = useState('');
  const [selectedMarkets, setSelectedMarkets] = useState<MarketplacePlatform[]>(['amazon', 'noon']);
  const [prefillResult, setPrefillResult] = useState<Record<string, unknown> | null>(null);
  const [studioBusy, setStudioBusy] = useState(false);

  // Alpha state
  const [alphaAction, setAlphaAction] = useState<'image_to_image' | 'text_to_image' | 'remove_text' | 'remove_bg' | 'enhance' | 'pack5'>('image_to_image');
  const [alphaStyle, setAlphaStyle] = useState<string>('Product Photo');
  const [alphaPrompt, setAlphaPrompt] = useState<string>('');
  const [removalMode, setRemovalMode] = useState<'standard' | 'ai_premium'>('standard');
  const [alphaResult, setAlphaResult] = useState<{
    enhancedPrompt: string;
    lightingSetup: string;
    angles: string[];
    complianceChecklist: string[];
  } | null>(null);
  const [alphaBusy, setAlphaBusy] = useState(false);
  const [uploadedImageDataUrl, setUploadedImageDataUrl] = useState<string>('');
  const [processedImageUrl, setProcessedImageUrl] = useState<string>('');

  // Leo state
  const [leoMode, setLeoMode] = useState<'text' | 'image'>('text');
  const [leoLang, setLeoLang] = useState<'ar' | 'en'>('ar');
  const [leoInfo, setLeoInfo] = useState('');
  const [leoResult, setLeoResult] = useState<{
    title: string;
    bulletPoints: string[];
    description: string;
    searchKeywords: string[];
  } | null>(null);
  const [leoBusy, setLeoBusy] = useState(false);

  useEffect(() => {
    marketplaceHubService
      .listDrafts()
      .then(setDrafts)
      .catch(() => {
        // Non-blocking draft history load
      });
  }, []);

  const extractErr = (err: unknown, fallback: string) =>
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

  const toggleMarket = (m: MarketplacePlatform) => {
    setSelectedMarkets((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };

  const handleRunPrefillAndSave = async () => {
    if (!studioTitle.trim()) {
      toast.error('أدخل اسم المنتج أولاً');
      return;
    }
    setStudioBusy(true);
    try {
      const res = await marketplaceHubService.generatePrefill({
        title: studioTitle,
        description: studioNotes,
        marketplaces: selectedMarkets.length > 0 ? selectedMarkets : ['amazon'],
      });
      setPrefillResult(res.payloads);
      const saved = await marketplaceHubService.saveDraft({
        workflow,
        title: studioTitle,
        seoContent: leoResult,
        marketplacePayloads: res.payloads,
      });
      setDrafts((prev) => [saved, ...prev]);
      toast.success('تم تجهيز خصائص الإدراج وحفظ المسودة');
    } catch (err) {
      toast.error(extractErr(err, 'تعذر تشغيل المعالج'));
    } finally {
      setStudioBusy(false);
    }
  };

  const handleSaveManualDraft = async () => {
    if (!studioTitle.trim()) {
      toast.error('أدخل اسم المنتج أولاً');
      return;
    }
    try {
      const saved = await marketplaceHubService.saveDraft({
        workflow,
        title: studioTitle,
        seoContent: { notes: studioNotes },
      });
      setDrafts((prev) => [saved, ...prev]);
      toast.success('تم حفظ المسودة في سجل الاستوديو');
    } catch (err) {
      toast.error(extractErr(err, 'تعذر حفظ المسودة'));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('الحد الأقصى لحجم الصورة 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setUploadedImageDataUrl(dataUrl);
      setProcessedImageUrl('');
    };
    reader.readAsDataURL(file);
  };

  const processLocalCanvas = (dataUrl: string, enhance: boolean) => {
    if (!dataUrl) return;
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = 'rgb(255, 255, 255)';
      ctx.fillRect(0, 0, 800, 800);
      if (enhance) ctx.filter = 'brightness(1.06) contrast(1.08) saturate(1.06)';
      const scale = Math.min(680 / img.width, 680 / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (800 - w) / 2, (800 - h) / 2, w, h);
      setProcessedImageUrl(canvas.toDataURL('image/png'));
    };
    img.src = dataUrl;
  };

  const handleAlphaRun = async () => {
    setAlphaBusy(true);
    if (uploadedImageDataUrl) {
      processLocalCanvas(uploadedImageDataUrl, alphaAction === 'enhance' || alphaStyle === 'Product Photo');
    }
    try {
      const res = await marketplaceHubService.generateImageBrief({
        action: alphaAction,
        style: alphaStyle,
        prompt: alphaPrompt,
        removalMode,
        imageDataUrl: uploadedImageDataUrl || undefined,
      });
      setAlphaResult(res.artDirection);
      toast.success(`تم التجهيز (الخصم: ${res.creditsUsed} Cr)`);
    } catch (err) {
      toast.error(extractErr(err, 'تعذر تشغيل استوديو الصور'));
    } finally {
      setAlphaBusy(false);
    }
  };

  const handleLeoRun = async () => {
    if (!leoInfo.trim() && !(leoMode === 'image' && uploadedImageDataUrl)) {
      toast.error('أدخل معلومات المنتج أو ارفع صورة أولاً');
      return;
    }
    setLeoBusy(true);
    try {
      const res = await marketplaceHubService.generateCopy({
        mode: leoMode,
        productInfo: leoInfo,
        imageDataUrl: leoMode === 'image' ? uploadedImageDataUrl || undefined : undefined,
        language: leoLang,
      });
      setLeoResult(res.copy);
      toast.success('تم توليد المحتوى التسويقي (2 Cr)');
    } catch (err) {
      toast.error(extractErr(err, 'تعذر توليد المحتوى'));
    } finally {
      setLeoBusy(false);
    }
  };

  return (
    <MarketplaceHubLayout title="استوديو تجهيز المنتجات بالـ AI">
      {/* Sub-tabs */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setTab('studio')}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold ${
            tab === 'studio' ? 'bg-primary text-primary-foreground' : 'border border-border/70 bg-background text-muted-foreground'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>معالج الإدراج (Studio)</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('alpha')}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold ${
            tab === 'alpha' ? 'bg-primary text-primary-foreground' : 'border border-border/70 bg-background text-muted-foreground'
          }`}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          <span>استوديو الصور (Alpha)</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('leo')}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold ${
            tab === 'leo' ? 'bg-primary text-primary-foreground' : 'border border-border/70 bg-background text-muted-foreground'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>كاتب المحتوى (Leo)</span>
        </button>
      </div>

      {tab === 'studio' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="space-y-4 border-t border-border/70 pt-4 lg:col-span-7 lg:rounded-md lg:border lg:bg-background lg:p-5">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { id: 'AI_COMPLETE', label: 'توليد كامل بالـ AI' },
                { id: 'OWN_CONTENT', label: 'بالمحتوى والصور الخاصة' },
                { id: 'OPTIMIZE', label: 'تحسين منتج قائم' },
              ].map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setWorkflow(w.id as 'AI_COMPLETE' | 'OWN_CONTENT' | 'OPTIMIZE')}
                  className={`rounded-md border px-3 py-2 text-xs font-medium ${
                    workflow === w.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/70 bg-card text-muted-foreground'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">اسم المنتج *</label>
              <input
                type="text"
                value={studioTitle}
                onChange={(e) => setStudioTitle(e.target.value)}
                placeholder="مثال: ماكينة قهوة اسبريسو ستانلس ستيل"
                className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-sm text-foreground"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">المواصفات والخامات</label>
              <textarea
                rows={3}
                value={studioNotes}
                onChange={(e) => setStudioNotes(e.target.value)}
                placeholder="القوة الكهربائية، السعة، الألوان المتاحة، الضمان..."
                className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-xs text-foreground"
              />
            </div>

            <div>
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">المنصات المستهدفة (3 Cr / منصة)</div>
              <div className="flex flex-wrap gap-2">
                {(['amazon', 'noon', 'jumia', 'trendyol'] as MarketplacePlatform[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMarket(m)}
                    className={`rounded border px-3 py-1 text-xs font-medium uppercase ${
                      selectedMarkets.includes(m)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border/70 bg-card text-muted-foreground'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={studioBusy}
                onClick={() => void handleRunPrefillAndSave()}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>تعبئة حقول المنصات بالـ AI</span>
              </button>
              <button
                type="button"
                onClick={() => void handleSaveManualDraft()}
                className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-card px-3 py-2 text-xs font-medium"
              >
                <Save className="h-3.5 w-3.5" />
                <span>حفظ كمسودة</span>
              </button>
            </div>

            {prefillResult && (
              <pre className="max-h-64 overflow-auto rounded-md border border-border/70 bg-card p-3 font-mono text-[11px] text-foreground" dir="ltr">
                {JSON.stringify(prefillResult, null, 2)}
              </pre>
            )}
          </div>

          {/* Studio History */}
          <div className="border-t border-border/70 pt-4 lg:col-span-5 lg:rounded-md lg:border lg:bg-muted/20 lg:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">سجل مسودات الاستوديو</h2>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">{drafts.length}</span>
            </div>
            {drafts.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">
                لا توجد مسودات محفوظة بعد.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {drafts.map((d) => (
                  <div key={d.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div>
                      <div className="font-medium text-foreground">{d.title}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{d.workflow}</div>
                    </div>
                    <span className="rounded border border-border/70 bg-card px-2 py-0.5 font-mono text-[10px]">
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'alpha' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="space-y-4 border-t border-border/70 pt-4 lg:col-span-6 lg:rounded-md lg:border lg:bg-background lg:p-5">
            <div className="flex flex-wrap gap-1.5">
              {IMAGE_ACTIONS.map((act) => (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => setAlphaAction(act.id)}
                  className={`rounded border px-2.5 py-1 text-xs font-medium ${
                    alphaAction === act.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border/70 bg-card text-muted-foreground'
                  }`}
                >
                  {act.label}
                </button>
              ))}
            </div>

            {alphaAction === 'remove_bg' && (
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setRemovalMode('standard')}
                  className={`rounded border px-3 py-1.5 ${
                    removalMode === 'standard' ? 'border-primary bg-primary/10 text-primary' : 'border-border/70'
                  }`}
                >
                  Standard (مجاني 0 Cr)
                </button>
                <button
                  type="button"
                  onClick={() => setRemovalMode('ai_premium')}
                  className={`rounded border px-3 py-1.5 ${
                    removalMode === 'ai_premium' ? 'border-primary bg-primary/10 text-primary' : 'border-border/70'
                  }`}
                >
                  AI Premium (3 Cr)
                </button>
              </div>
            )}

            <div>
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">النمط المطلوب</div>
              <div className="grid grid-cols-2 gap-2">
                {IMAGE_STYLES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setAlphaStyle(st)}
                    className={`rounded border px-3 py-2 text-xs font-medium ${
                      alphaStyle === st ? 'border-primary bg-primary/10 text-primary' : 'border-border/70 bg-card'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">رفع صورة المنتج (اختياري · حتى 10MB)</label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border/70 bg-card px-3 py-3 text-xs text-muted-foreground hover:border-primary/60">
                <Upload className="h-4 w-4" />
                <span>{uploadedImageDataUrl ? 'تغيير الصورة المرفوعة' : 'اختر صورة المنتج للتجهيز أو خلفية بيضاء 800×800'}</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">وصف المشهد أو التعديل</label>
              <textarea
                rows={3}
                value={alphaPrompt}
                onChange={(e) => setAlphaPrompt(e.target.value)}
                placeholder="مثال: خلفية بيضاء نقية لإدراج أمازون مع إضاءة ناعمة..."
                className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-xs"
              />
            </div>

            <button
              type="button"
              disabled={alphaBusy}
              onClick={() => void handleAlphaRun()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
            >
              <ImageIcon className="h-4 w-4" />
              <span>توليد التوجيه الفني والصور</span>
            </button>
          </div>

          <div className="space-y-4 border-t border-border/70 pt-4 lg:col-span-6 lg:rounded-md lg:border lg:bg-muted/20 lg:p-5">
            {processedImageUrl && (
              <div className="space-y-2 rounded-md border border-border/70 bg-card p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">صورة جاهزة لأمازون (800×800)</span>
                  <a
                    href={processedImageUrl}
                    download={`marketplace-product-${Date.now()}.png`}
                    className="inline-flex items-center gap-1 rounded bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground"
                  >
                    <Download className="h-3 w-3" />
                    <span>تنزيل PNG</span>
                  </a>
                </div>
                <img src={processedImageUrl} alt="Processed product" className="mx-auto max-h-56 rounded border border-border/50 object-contain" />
              </div>
            )}

            {alphaResult ? (
              <div className="space-y-3 text-xs">
                <div>
                  <div className="font-semibold text-foreground">توجيه التصوير (Prompt)</div>
                  <p className="mt-1 rounded border border-border/70 bg-card p-3 leading-relaxed text-muted-foreground">
                    {alphaResult.enhancedPrompt}
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-foreground">توزيع الإضاءة</div>
                  <p className="mt-1 text-muted-foreground">{alphaResult.lightingSetup}</p>
                </div>
                <div>
                  <div className="font-semibold text-foreground">الزوايا المقترحة</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {alphaResult.angles.map((a) => (
                      <span key={a} className="rounded border border-border/70 bg-card px-2 py-0.5 text-[11px]">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground">
                ستظهر خطة التوليد وإرشادات مطابقة شروط أمازون ونون هنا (تقرأ المفاتيح من public.ai_keys).
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'leo' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="space-y-4 border-t border-border/70 pt-4 lg:col-span-6 lg:rounded-md lg:border lg:bg-background lg:p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setLeoMode('text')}
                  className={`rounded border px-3 py-1 text-xs ${
                    leoMode === 'text' ? 'border-primary bg-primary text-primary-foreground' : 'border-border/70'
                  }`}
                >
                  من نص
                </button>
                <button
                  type="button"
                  onClick={() => setLeoMode('image')}
                  className={`rounded border px-3 py-1 text-xs ${
                    leoMode === 'image' ? 'border-primary bg-primary text-primary-foreground' : 'border-border/70'
                  }`}
                >
                  من سياق صورة
                </button>
              </div>
              <select
                value={leoLang}
                onChange={(e) => setLeoLang(e.target.value as 'ar' | 'en')}
                className="rounded border border-border/70 bg-card px-2.5 py-1 text-xs"
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>

            {leoMode === 'image' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">صورة المنتج للتحليل بالذكاء الاصطناعي (Vision)</label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border/70 bg-card px-3 py-2.5 text-xs text-muted-foreground hover:border-primary/60">
                  <Upload className="h-4 w-4" />
                  <span>{uploadedImageDataUrl ? 'تم إرفاق الصورة — اضغط للتغيير' : 'اختر صورة المنتج'}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">معلومات ومميزات المنتج *</label>
              <textarea
                rows={5}
                value={leoInfo}
                onChange={(e) => setLeoInfo(e.target.value)}
                placeholder="اسم المنتج، الخامة، المميزات الأساسية، الفئة المستهدفة..."
                className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-xs"
              />
            </div>

            <button
              type="button"
              disabled={leoBusy}
              onClick={() => void handleLeoRun()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
            >
              <FileText className="h-4 w-4" />
              <span>توليد عنوان ووصف SEO (2 Cr)</span>
            </button>
          </div>

          <div className="border-t border-border/70 pt-4 lg:col-span-6 lg:rounded-md lg:border lg:bg-muted/20 lg:p-5">
            {leoResult ? (
              <div className="space-y-3 text-xs">
                <div>
                  <div className="font-semibold text-foreground">العنوان المقترح</div>
                  <div className="mt-1 rounded border border-border/70 bg-card p-2.5 font-medium">{leoResult.title}</div>
                </div>
                <div>
                  <div className="font-semibold text-foreground">النقاط البيعية</div>
                  <ul className="mt-1 list-disc space-y-1 ps-5 text-muted-foreground">
                    {leoResult.bulletPoints.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-foreground">الوصف الكامل</div>
                  <p className="mt-1 rounded border border-border/70 bg-card p-2.5 leading-relaxed text-muted-foreground">
                    {leoResult.description}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground">
                سيظهر العنوان والنقاط البيعية والوصف والكلمات المفتاحية هنا.
              </div>
            )}
          </div>
        </div>
      )}
    </MarketplaceHubLayout>
  );
};

export default MarketplaceStudioPage;
