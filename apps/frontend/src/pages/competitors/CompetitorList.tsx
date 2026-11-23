import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Compass,
  MoreHorizontal,
  Pencil,
  Plus,
  Radar,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiClient } from '../../services/apiClient';
import { ShopifyPageHeader } from '../../components/layout/ShopifyPageHeader';
import CompetitorStatusBar, { type CompetitorStatus } from './CompetitorStatusBar';
import GlobalCompetitorStatusBar, { type StatusFilter } from './GlobalCompetitorStatusBar';
import { updateCompetitorStatus, useCompetitorStatusSync } from './useCompetitorStatus';
import i18n from '../../i18n';

interface SocialProfile {
  id: string;
  platform: string;
  profileUrl: string;
}

interface Competitor {
  id: string;
  name: string;
  url: string | null;
  platform: string;
  logo: string | null;
  activityType: string | null;
  location: string | null;
  targetMarket: string | null;
  foundedYear: number | null;
  strengths: string | null;
  weaknesses: string | null;
  isActive: boolean;
  status: string;
  createdAt: string;
  socialProfiles: SocialProfile[];
  _count: { products: number; ads: number; reports: number };
}

interface StatusCounts {
  total: number;
  NEW: number;
  FOLLOWING: number;
  COMPLETED: number;
}

const EMPTY_COUNTS: StatusCounts = { total: 0, NEW: 0, FOLLOWING: 0, COMPLETED: 0 };
const SETUP_TARGET = 5;

/** Arabic counts read wrong without agreement: 1 متجر واحد, 2 متجرين, 3-10 متاجر, 11+ متجرًا. */
function storeCount(count: number): string {
  if (count === 1) return 'متجر واحد';
  if (count === 2) return 'متجرين';
  return `${count} ${count >= 11 ? 'متجرًا' : 'متاجر'}`;
}

const TRACKING_PARAMS = [
  'fbclid',
  'gclid',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'utm_id',
];

/**
 * Turns whatever ended up in `url` into something worth showing.
 * Ad-library imports carry Facebook redirect wrappers and tracking blobs, so the
 * link is unwrapped and cleaned, and a value that is not a real domain is dropped
 * instead of being printed as a dead 120-character string.
 */
function parseStoreLink(raw?: string | null): { href: string; label: string } | null {
  if (!raw) return null;
  let value = raw.trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  if (/(^|\.)facebook\.com$/i.test(parsed.hostname) && parsed.pathname.startsWith('/l.php')) {
    const inner = parsed.searchParams.get('u');
    if (!inner) return null;
    try {
      return parseStoreLink(decodeURIComponent(inner));
    } catch {
      return null;
    }
  }

  const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
  if (!host.includes('.') || !/^[a-z0-9.-]+$/i.test(host)) return null;

  TRACKING_PARAMS.forEach(param => parsed.searchParams.delete(param));
  parsed.search = parsed.searchParams.toString();

  const path = parsed.pathname.replace(/\/+$/, '');
  return { href: parsed.toString(), label: `${host}${path}` };
}

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export const CompetitorList: React.FC = () => {
  const navigate = useNavigate();

  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>(EMPTY_COUNTS);
  const [isLoading, setIsLoading] = useState(true);
  const [countsLoading, setCountsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [deleteTarget, setDeleteTarget] = useState<Competitor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchStatusCounts = useCallback(async () => {
    setCountsLoading(true);
    try {
      const res = await apiClient.get('/competitors/status-counts');
      if (res.data?.success) setStatusCounts(res.data.data);
    } catch {
      // the counts are a supporting strip; the list below reports the real error
    } finally {
      setCountsLoading(false);
    }
  }, []);

  const fetchCompetitors = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const params: Record<string, string> = {};
      if (appliedSearch) params.search = appliedSearch;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await apiClient.get('/competitors', { params });
      if (res.data?.success) {
        setCompetitors(res.data.data || []);
      } else {
        setLoadError(true);
      }
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [appliedSearch, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => setAppliedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    void fetchCompetitors();
  }, [fetchCompetitors]);

  useEffect(() => {
    void fetchStatusCounts();
  }, [fetchStatusCounts]);

  useCompetitorStatusSync((competitorId, status) => {
    setCompetitors(prev => prev.map(c => (c.id === competitorId ? { ...c, status } : c)));
    void fetchStatusCounts();
  });

  const handleStatusChange = async (id: string, newStatus: CompetitorStatus) => {
    const prevStatus = competitors.find(c => c.id === id)?.status;
    setCompetitors(existing => existing.map(c => (c.id === id ? { ...c, status: newStatus } : c)));
    setStatusCounts(prev => {
      const next = { ...prev };
      if (prevStatus && prevStatus in next) {
        next[prevStatus as keyof StatusCounts] = Math.max(0, next[prevStatus as keyof StatusCounts] - 1);
      }
      next[newStatus] = (next[newStatus] || 0) + 1;
      return next;
    });
    const ok = await updateCompetitorStatus(id, newStatus);
    if (!ok && prevStatus) {
      setCompetitors(existing => existing.map(c => (c.id === id ? { ...c, status: prevStatus } : c)));
      setStatusCounts(prev => {
        const next = { ...prev };
        next[newStatus] = Math.max(0, (next[newStatus] || 0) - 1);
        if (prevStatus in next) {
          next[prevStatus as keyof StatusCounts] = (next[prevStatus as keyof StatusCounts] || 0) + 1;
        }
        return next;
      });
    }
    void fetchStatusCounts();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/competitors/${deleteTarget.id}`);
      setDeleteTarget(null);
      void fetchCompetitors();
      void fetchStatusCounts();
    } catch {
      setLoadError(true);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const totals = useMemo(
    () =>
      competitors.reduce(
        (acc, competitor) => ({
          products: acc.products + (competitor._count?.products || 0),
          ads: acc.ads + (competitor._count?.ads || 0),
        }),
        { products: 0, ads: 0 }
      ),
    [competitors]
  );

  const isFiltered = Boolean(appliedSearch) || statusFilter !== 'ALL';
  const isBusy = isLoading || countsLoading;
  const setupDone = statusCounts.total >= SETUP_TARGET;
  const setupRemaining = Math.max(0, SETUP_TARGET - statusCounts.total);
  const setupProgress = Math.min(100, Math.round((statusCounts.total / SETUP_TARGET) * 100));

  const steps = [
    {
      index: '01',
      title: 'سجّل 5 متاجر منافسة',
      body: 'الاستكشاف التلقائي يقترح متاجر من نفس نشاطك، أو أضف الرابط بنفسك.',
      cta: { label: 'استكشاف ذكي', to: '/competitors/auto-discover' },
    },
    {
      index: '02',
      title: 'اربط كتالوج المنافس',
      body: 'التقارير وبطاقة المنافسة تشتغل لما يكون للمنافس منتجات وأسعار مسجلة.',
      cta: { label: 'فتح التقارير', to: '/competitors/reports' },
    },
    {
      index: '03',
      title: 'شغّل وكيل الرصد',
      body: 'زياد يراجع تغيّرات الأسعار والحملات ويبلغك بأول تحرّك.',
      cta: { label: 'مركز الوكلاء', to: '/marketplace?tab=agents' },
    },
  ];
  const currentStep = setupDone ? 1 : 0;

  return (
    <div
      className="mx-auto w-full min-w-0 max-w-7xl space-y-4 px-3 py-4 pb-24 sm:px-5 sm:pb-6 lg:px-6"
      dir={i18n.dir()}
    >
      <ShopifyPageHeader
        title="رادار المنافسين"
        subtitle="أسعار منافسينك وإعلاناتهم ومنتجاتهم الحصرية في شاشة واحدة، مقارنة بكتالوجك."
        breadcrumbs={[{ label: 'ذكاء الأعمال' }, { label: 'رادار المنافسين' }]}
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate('/competitors/auto-discover')}
              className={`inline-flex h-10 items-center gap-1.5 rounded-xl border border-border/70 bg-card px-3.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted active:scale-[0.98] ${focusRing}`}
            >
              <Compass size={16} className="text-muted-foreground" />
              <span>استكشاف تلقائي</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/competitors/add')}
              className={`inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 active:scale-[0.98] ${focusRing}`}
            >
              <Plus size={16} />
              <span>إضافة منافس</span>
            </button>
          </>
        }
      />

      {/* One toolbar surface: search, status filters, manual refresh. */}
      <div className="rounded-2xl border border-border/70 bg-card p-2.5 shadow-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="ابحث باسم المتجر أو الدومين"
              aria-label="ابحث باسم المتجر أو الدومين"
              className={`h-10 w-full rounded-xl border border-border/70 bg-background ps-10 pe-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-card max-sm:h-11 sm:text-[13px] ${focusRing}`}
            />
          </div>

          <GlobalCompetitorStatusBar
            selectedFilter={statusFilter}
            onFilterChange={setStatusFilter}
            counts={statusCounts}
            isLoading={countsLoading}
          />

          <button
            type="button"
            onClick={() => {
              void fetchCompetitors();
              void fetchStatusCounts();
            }}
            aria-label="تحديث القائمة"
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border/70 bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground max-sm:h-11 max-sm:w-11 ${focusRing}`}
          >
            <RefreshCw size={16} className={isBusy ? 'animate-spin motion-reduce:animate-none' : ''} />
          </button>
        </div>
      </div>

      {/* The next step: one line tall until it is opened. */}
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
        <button
          type="button"
          onClick={() => setGuideOpen(open => !open)}
          aria-expanded={guideOpen}
          className={`flex w-full items-center gap-3 px-3.5 py-3 text-start transition-colors hover:bg-muted/40 ${focusRing}`}
        >
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
              setupDone ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
            }`}
          >
            {setupDone ? <CheckCircle2 size={18} /> : <Sparkles size={18} />}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-foreground">
              {setupDone
                ? `الرصد جاهز على ${storeCount(statusCounts.total)}`
                : `فاضل ${storeCount(setupRemaining)} لتبدأ المقارنة`}
            </span>
            <span className="mt-0.5 block text-[12px] leading-5 text-muted-foreground">
              {setupDone
                ? 'افتح التقارير تشوف فروق الأسعار والمنتجات اللي عندهم ومش عندك.'
                : 'سجّل 5 متاجر منافسة على الأقل، وبعدها التقارير والتنبيهات تشتغل لوحدها.'}
            </span>
          </span>

          <span className="hidden shrink-0 items-center gap-2 sm:flex">
            <span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
              <span
                className={`block h-full rounded-full transition-[width] duration-300 ${
                  setupDone ? 'bg-success' : 'bg-primary'
                }`}
                style={{ width: `${setupProgress}%` }}
              />
            </span>
            <span className="text-[12px] font-semibold tabular-nums text-muted-foreground">
              {Math.min(statusCounts.total, SETUP_TARGET)}/{SETUP_TARGET}
            </span>
          </span>

          <ChevronDown
            size={16}
            className={`shrink-0 text-muted-foreground transition-transform duration-200 ${
              guideOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {guideOpen && (
          <div className="grid gap-2 border-t border-border/60 bg-muted/20 p-3 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.index}
                className={`flex flex-col rounded-xl border bg-card p-3 ${
                  index === currentStep ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold tabular-nums text-muted-foreground">
                    {step.index}
                  </span>
                  {index === currentStep && (
                    <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                      الخطوة الحالية
                    </span>
                  )}
                </div>
                <h3 className="mt-1 text-[13px] font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1 flex-1 text-[12px] leading-5 text-muted-foreground">{step.body}</p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => navigate(step.cta.to)}
                    className={`inline-flex h-8 items-center rounded-lg bg-primary/10 px-2.5 text-[12px] font-semibold text-primary transition-colors hover:bg-primary/15 ${focusRing}`}
                  >
                    {step.cta.label}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* The list heading carries what the cards add up to. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[13px] font-semibold text-foreground">المتاجر المرصودة</h2>
        {!isFiltered && !isLoading && !loadError && competitors.length > 0 && (
          <p className="flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
            <span>
              المتاجر <span className="font-semibold tabular-nums text-foreground">{competitors.length}</span>
            </span>
            <span>
              المنتجات <span className="font-semibold tabular-nums text-foreground">{totals.products}</span>
            </span>
            <span>
              الإعلانات <span className="font-semibold tabular-nums text-foreground">{totals.ads}</span>
            </span>
          </p>
        )}
        {isFiltered && !isLoading && !loadError && (
          <p className="text-[12px] text-muted-foreground">
            النتائج <span className="font-semibold tabular-nums text-foreground">{competitors.length}</span> من{' '}
            <span className="tabular-nums">{statusCounts.total}</span>
          </p>
        )}
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
          <AlertTriangle size={20} className="mx-auto text-destructive" />
          <h3 className="mt-3 text-[15px] font-semibold text-foreground">تعذّر تحميل قائمة المنافسين</h3>
          <p className="mx-auto mt-1 max-w-sm text-[13px] leading-6 text-muted-foreground">
            الخدمة ما ردّتش على الطلب. جرّب التحديث، ولو المشكلة استمرت بلّغ الدعم.
          </p>
          <button
            type="button"
            onClick={() => {
              void fetchCompetitors();
              void fetchStatusCounts();
            }}
            className={`mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl border border-border/70 bg-card px-3.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted ${focusRing}`}
          >
            <RefreshCw size={16} />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map(key => (
            <div key={key} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 animate-pulse rounded bg-muted motion-reduce:animate-none" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-muted motion-reduce:animate-none" />
                </div>
              </div>
              <div className="mt-6 h-[52px] animate-pulse rounded-xl bg-muted/70 motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      ) : competitors.length === 0 ? (
        isFiltered ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <Search size={20} />
            </span>
            <h3 className="mt-4 text-[15px] font-semibold text-foreground">مفيش نتائج مطابقة</h3>
            <p className="mx-auto mt-1 max-w-sm text-[13px] leading-6 text-muted-foreground">
              جرّب كلمة تانية، أو اعرض كل المتاجر من جديد.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
              }}
              className={`mt-4 inline-flex h-10 items-center rounded-xl border border-border/70 bg-card px-3.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted ${focusRing}`}
            >
              عرض كل المتاجر
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Radar size={22} />
            </span>
            <h3 className="mt-4 text-[15px] font-semibold text-foreground">لسه مفيش متاجر مرصودة</h3>
            <p className="mx-auto mt-1 max-w-md text-[13px] leading-6 text-muted-foreground">
              ابدأ بمنافس واحد — نسحب منتجاته وأسعاره ونقارنها بكتالوجك، والتقارير تتكوّن لوحدها.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/competitors/add')}
                className={`inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-[13px] font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 active:scale-[0.98] ${focusRing}`}
              >
                <Plus size={16} />
                <span>إضافة أول منافس</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/competitors/auto-discover')}
                className={`inline-flex h-10 items-center gap-1.5 rounded-xl border border-border/70 bg-card px-4 text-[13px] font-medium text-foreground transition-colors hover:bg-muted ${focusRing}`}
              >
                <Compass size={16} className="text-muted-foreground" />
                <span>استكشاف تلقائي</span>
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {competitors.map(competitor => {
            const storeLink = parseStoreLink(competitor.url);
            const counts = competitor._count || { products: 0, ads: 0, reports: 0 };

            return (
              <article
                key={competitor.id}
                className="group relative flex flex-col rounded-2xl border border-border/70 bg-card shadow-2xs transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-border hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none"
              >
                <div className="flex items-start gap-3 p-4 pb-3">
                  {competitor.logo ? (
                    <img
                      src={competitor.logo}
                      alt=""
                      loading="lazy"
                      className="h-10 w-10 shrink-0 rounded-xl border border-border/60 object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-[15px] font-bold text-primary"
                    >
                      {(competitor.name.match(/[\p{L}\p{N}]/u)?.[0] || '?').toUpperCase()}
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[15px] font-semibold leading-6 text-foreground">
                      <Link
                        to={`/competitors/${competitor.id}`}
                        className={`after:absolute after:inset-0 after:rounded-2xl after:content-[''] ${focusRing}`}
                      >
                        {competitor.name}
                      </Link>
                    </h3>

                    <div className="mt-1 flex min-w-0 items-center gap-2">
                      {storeLink ? (
                        <a
                          href={storeLink.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          dir="ltr"
                          className={`relative z-10 inline-flex min-w-0 items-center gap-1 text-[12px] text-muted-foreground transition-colors hover:text-primary ${focusRing}`}
                        >
                          <span className="truncate">{storeLink.label}</span>
                          <ArrowUpRight size={12} className="shrink-0" />
                        </a>
                      ) : (
                        <span className="text-[12px] text-muted-foreground/70">بلا رابط مسجّل</span>
                      )}

                      <span className="relative z-10 ms-auto shrink-0">
                        <CompetitorStatusBar
                          currentStatus={competitor.status as CompetitorStatus}
                          competitorId={competitor.id}
                          onChange={newStatus => void handleStatusChange(competitor.id, newStatus)}
                          size="sm"
                        />
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 -me-1 -mt-1 shrink-0">
                    <DropdownMenu
                      open={openMenuId === competitor.id}
                      onOpenChange={open => setOpenMenuId(open ? competitor.id : null)}
                    >
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label={`إجراءات ${competitor.name}`}
                          className={`grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${focusRing}`}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        sideOffset={4}
                        className="w-44 rounded-xl border border-border/70 bg-card p-1 shadow-xl"
                      >
                        <DropdownMenuItem
                          onClick={() => {
                            setOpenMenuId(null);
                            navigate(`/competitors/${competitor.id}`);
                          }}
                          className="cursor-pointer rounded-lg px-2.5 py-2 text-[13px]"
                        >
                          <Radar size={14} className="me-2 text-muted-foreground" />
                          فتح الملف
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setOpenMenuId(null);
                            navigate(`/competitors/${competitor.id}/edit`);
                          }}
                          className="cursor-pointer rounded-lg px-2.5 py-2 text-[13px]"
                        >
                          <Pencil size={14} className="me-2 text-muted-foreground" />
                          تعديل البيانات
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1 bg-border/60" />
                        <DropdownMenuItem
                          onClick={() => {
                            setOpenMenuId(null);
                            setDeleteTarget(competitor);
                          }}
                          className="cursor-pointer rounded-lg px-2.5 py-2 text-[13px] text-destructive focus:text-destructive"
                        >
                          <Trash2 size={14} className="me-2" />
                          حذف المتجر
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="mt-auto grid grid-cols-3 border-t border-border/60 bg-muted/30 text-center">
                  {[
                    { value: counts.products, label: 'منتجات' },
                    { value: counts.ads, label: 'إعلانات' },
                    { value: counts.reports, label: 'تقارير' },
                  ].map((metric, index) => (
                    <div key={metric.label} className={`py-2.5 ${index > 0 ? 'border-s border-border/60' : ''}`}>
                      <div
                        className={`text-[15px] font-semibold leading-5 tabular-nums ${
                          metric.value === 0 ? 'text-muted-foreground/60' : 'text-foreground'
                        }`}
                      >
                        {metric.value}
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-competitor-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-[2px]"
          onClick={() => !isDeleting && setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
                <Trash2 size={18} />
              </span>
              <div className="min-w-0">
                <h2 id="delete-competitor-title" className="text-[15px] font-semibold text-foreground">
                  حذف <bdi>{deleteTarget.name.replace(/[\u200e\u200f\u202a-\u202e]/g, '').trim()}</bdi>؟
                </h2>
                <p className="mt-1 text-[13px] leading-6 text-muted-foreground">
                  هيتحذف المتجر مع منتجاته وإعلاناته وتقاريره. الحذف نهائي ومفيش رجوع.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className={`inline-flex h-10 items-center rounded-xl border border-border/70 bg-card px-3.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60 ${focusRing}`}
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className={`inline-flex h-10 items-center rounded-xl bg-destructive px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-destructive/90 disabled:opacity-60 ${focusRing}`}
              >
                {isDeleting ? 'بيتحذف…' : 'حذف نهائي'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitorList;
