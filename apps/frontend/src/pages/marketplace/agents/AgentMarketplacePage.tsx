/**
 * AgentMarketplacePage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MaxP Candidate CV Hiring Portal (/marketplace/agents) — Polaris Track (§16).
 * - Scroll-safe across Classic, Horizontal, AppDashboard, and SuperAdmin shells.
 * - Live Single-Source-of-Truth catalog from GET /api/agent-manager/catalog.
 * - Candidate CV cards, full CV drawer, side-by-side comparison (up to 3),
 *   and inline Super Admin visibility & pricing controls.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Briefcase,
  Wallet,
  Users,
  Shield,
  RefreshCw,
  AlertCircle,
  Filter,
  Eye,
  EyeOff,
  Scale,
} from "lucide-react";
import "../../../styles/polaris-track.css";
import {
  AGENT_CATEGORIES,
  AGENT_KIND_META,
  AgentKind,
  AgentListing,
  formatEgp,
} from "./agentMarketplaceData";
import {
  useAgentMarketplaceCatalog,
  HireStatusFilter,
  VisibilityFilter,
} from "./hooks/useAgentMarketplaceCatalog";
import { AgentMarketCard } from "./AgentMarketCard";
import { AgentProfileDrawer } from "./AgentProfileDrawer";
import { AgentHireModal } from "./AgentHireModal";
import { AgentAdminConfigModal } from "./components/admin/AgentAdminConfigModal";
import { AgentCompareModal } from "./components/compare/AgentCompareModal";

const KIND_TABS: Array<{ id: "all" | AgentKind; label: string }> = [
  { id: "all", label: "الكل" },
  { id: "solo", label: AGENT_KIND_META.solo.label },
  { id: "squad", label: AGENT_KIND_META.squad.label },
  { id: "vertical", label: AGENT_KIND_META.vertical.label },
];

export default function AgentMarketplacePage() {
  const navigate = useNavigate();
  const {
    filteredAgents,
    stats,
    categoryCounts,
    walletBalance,
    defaultNewAgentVisible,
    isSuperAdmin,
    adminMode,
    loading,
    error,
    updatingSlug,
    updatingSettings,
    search,
    setSearch,
    searchInputRef,
    activeCategory,
    setActiveCategory,
    kindFilter,
    setKindFilter,
    tierFilter,
    setTierFilter,
    statusFilter,
    setStatusFilter,
    visibilityFilter,
    setVisibilityFilter,
    hasActiveFilters,
    resetFilters,
    compareSlugs,
    comparedAgents,
    toggleCompareSlug,
    clearCompare,
    fetchCatalog,
    handleToggleAdminMode,
    handleToggleVisibility,
    handleUpdateAgentConfig,
    handleToggleDefaultNewVisible,
  } = useAgentMarketplaceCatalog();

  const [selectedAgent, setSelectedAgent] = useState<AgentListing | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [agentToHire, setAgentToHire] = useState<AgentListing | null>(null);
  const [hireModalOpen, setHireModalOpen] = useState(false);
  const [adminEditingAgent, setAdminEditingAgent] = useState<AgentListing | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  const featuredCandidates = useMemo(() => {
    if (hasActiveFilters || adminMode) return [];
    return filteredAgents.filter((a) => a.featured).slice(0, 4);
  }, [filteredAgents, hasActiveFilters, adminMode]);

  const handleOpenProfile = (agent: AgentListing) => {
    setSelectedAgent(agent);
    setDrawerOpen(true);
  };

  const handleOpenHire = (agent: AgentListing) => {
    setAgentToHire(agent);
    setHireModalOpen(true);
  };

  const handleManageHired = () => {
    navigate("/admin/agent-profiles");
  };

  const handleAgentHired = () => {
    fetchCatalog({ includeHidden: adminMode, silent: true });
  };

  return (
    <div
      className="polaris-track business-shell-main !m-0 p-3 sm:p-5 w-full min-h-full pb-24 sm:pb-12"
      dir="rtl"
    >
      <div className="mx-auto max-w-[1400px] space-y-4">
        {/* ── Strip 1: Executive Hiring Portal Header ── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Briefcase className="size-5 stroke-[1.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  بوابة التوظيف — مرشحو العمل
                </h1>
                {!loading && (
                  <span className="rounded-md bg-card border border-border/70 px-2 py-0.5 text-xs text-muted-foreground">
                    <span className="font-mono tabular-nums font-semibold text-foreground">
                      {stats.total}
                    </span>{" "}
                    مرشح متاح
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                استعرض السير الذاتية للمرشحين المتاحين، قارن خبراتهم وقنواتهم، واختر الأنسب لمتجرك.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {walletBalance !== null && (
              <button
                type="button"
                onClick={() => navigate("/settings/wallet")}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border/70 bg-card text-xs font-medium text-foreground hover:bg-muted active:scale-[0.97] transition-all whitespace-nowrap"
                title="رصيد محفظة الشركة"
              >
                <Wallet className="size-3.5 text-primary stroke-[1.5]" />
                <span className="font-mono tabular-nums font-semibold">
                  {formatEgp(walletBalance)}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate("/admin/agent-profiles")}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-border/70 bg-card text-xs font-semibold text-foreground hover:bg-muted active:scale-[0.97] transition-all whitespace-nowrap"
            >
              <Users className="size-3.5 text-primary stroke-[1.5]" />
              <span>فريقي</span>
              <span className="font-mono tabular-nums text-muted-foreground">
                ({stats.hiredCount})
              </span>
            </button>

            {isSuperAdmin && (
              <button
                type="button"
                onClick={handleToggleAdminMode}
                className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-semibold active:scale-[0.97] transition-all whitespace-nowrap ${
                  adminMode
                    ? "bg-primary text-primary-foreground"
                    : "border border-border/70 bg-card text-foreground hover:bg-muted"
                }`}
              >
                <Shield className="size-3.5 stroke-[1.5]" />
                <span>{adminMode ? "إنهاء وضع الإدارة" : "إدارة البوابة"}</span>
              </button>
            )}
          </div>
        </header>

        {/* ── Super Admin Controls Strip ── */}
        {isSuperAdmin && adminMode && (
          <section className="polaris-card p-3.5 sm:p-4 border-primary/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap text-xs">
                <span className="font-bold text-foreground">لوحة تحكم المرشحين (Super Admin)</span>
                <span className="text-muted-foreground">
                  إجمالي المكتشف:{" "}
                  <strong className="font-mono tabular-nums text-foreground">
                    {stats.totalDiscovered}
                  </strong>
                </span>
                <span className="text-muted-foreground">
                  ظاهر:{" "}
                  <strong className="font-mono tabular-nums text-success">
                    {stats.visibleCount}
                  </strong>
                </span>
                <span className="text-muted-foreground">
                  مخفي:{" "}
                  <strong className="font-mono tabular-nums text-muted-foreground">
                    {stats.hiddenCount}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={updatingSettings}
                  onClick={handleToggleDefaultNewVisible}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-background text-[11px] font-semibold text-foreground hover:bg-muted active:scale-[0.97] transition-all disabled:opacity-50"
                >
                  {defaultNewAgentVisible ? (
                    <Eye className="size-3.5 text-success stroke-[1.5]" />
                  ) : (
                    <EyeOff className="size-3.5 text-muted-foreground stroke-[1.5]" />
                  )}
                  <span>
                    المرشح الجديد:{" "}
                    {defaultNewAgentVisible ? "يظهر تلقائياً" : "مخفي حتى التفعيل"}
                  </span>
                </button>

                <div className="flex items-center rounded-lg border border-border/70 bg-muted/40 p-0.5 text-[11px]">
                  {(
                    [
                      { id: "all", label: "الكل" },
                      { id: "visible", label: "الظاهر" },
                      { id: "hidden", label: "المخفي" },
                    ] as Array<{ id: VisibilityFilter; label: string }>
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setVisibilityFilter(opt.id)}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        visibilityFilter === opt.id
                          ? "bg-card text-foreground font-semibold shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Strip 2: Search & Filter Controls ── */}
        <section className="polaris-card p-3 sm:p-4 space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground stroke-[1.5]" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالمسمى الوظيفي، المهارة، أو القناة…"
                className="w-full h-9 ps-9 pe-12 rounded-lg border border-border/80 bg-background text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="مسح البحث"
                  className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X className="size-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 items-center rounded border border-border/70 bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                  ⌘K
                </kbd>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5 lg:pb-0">
              <div className="flex items-center rounded-lg border border-border/70 bg-muted/40 p-0.5 text-xs shrink-0">
                {KIND_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setKindFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium transition-all ${
                      kindFilter === tab.id
                        ? "bg-card text-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                {adminMode && (
                  <button
                    type="button"
                    onClick={() => setKindFilter("internal")}
                    className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium transition-all ${
                      kindFilter === "internal"
                        ? "bg-card text-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    داخلي
                  </button>
                )}
              </div>

              <div className="flex items-center rounded-lg border border-border/70 bg-muted/40 p-0.5 text-xs shrink-0">
                {(
                  [
                    { id: "all", label: "الكل" },
                    { id: "free", label: "مجاني" },
                    { id: "pro", label: "Pro" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTierFilter(t.id)}
                    className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium transition-all ${
                      tierFilter === t.id
                        ? "bg-card text-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center rounded-lg border border-border/70 bg-muted/40 p-0.5 text-xs shrink-0">
                {(
                  [
                    { id: "all", label: "الجميع" },
                    { id: "available", label: "متاح" },
                    { id: "hired", label: "موظف" },
                  ] as Array<{ id: HireStatusFilter; label: string }>
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium transition-all ${
                      statusFilter === st.id
                        ? "bg-card text-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1 border-t border-border/50">
            {AGENT_CATEGORIES.map((cat) => {
              const count = categoryCounts[cat.id] || 0;
              if (cat.id !== "all" && count === 0 && activeCategory !== cat.id && !adminMode) {
                return null;
              }
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium active:scale-[0.97] transition-all shrink-0 ${
                    active
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "border border-border/70 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`font-mono tabular-nums text-[11px] ${
                      active ? "opacity-85" : "text-muted-foreground/80"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Main Content ── */}
        {error ? (
          <div className="polaris-card p-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertCircle className="size-5 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-foreground">تعذر تحميل قائمة المرشحين</h2>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => fetchCatalog()}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all"
            >
              <RefreshCw className="size-3.5 stroke-[1.5]" />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="polaris-card p-5 space-y-4 animate-pulse">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-xl bg-muted" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-32 rounded bg-muted" />
                      <div className="h-3 w-44 rounded bg-muted/70" />
                    </div>
                  </div>
                  <div className="h-5 w-14 rounded bg-muted" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-3 w-full rounded bg-muted/70" />
                  <div className="h-3 w-4/5 rounded bg-muted/70" />
                </div>
                <div className="flex gap-2 pt-2 border-t border-border/50">
                  <div className="h-9 flex-1 rounded-lg bg-muted/70" />
                  <div className="h-9 flex-1 rounded-lg bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="polaris-card py-14 px-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="flex size-11 items-center justify-center rounded-xl border border-border/70 bg-muted/40 text-muted-foreground">
              <Filter className="size-5 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-foreground">لا يوجد مرشحون مطابقون للبحث</h2>
              <p className="text-xs text-muted-foreground">
                جرّب تعديل كلمة البحث أو اختيار قسم آخر لعرض باقي السير الذاتية المتاحة.
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="h-9 px-4 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted active:scale-[0.97] transition-all"
              >
                إعادة تعيين الفلاتر
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {featuredCandidates.length > 0 && (
              <section className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-muted-foreground">
                    ترشيحات أساسية لتشغيل المتجر
                  </h2>
                  <span className="text-[11px] font-mono tabular-nums text-muted-foreground">
                    {featuredCandidates.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredCandidates.map((agent) => (
                    <AgentMarketCard
                      key={`feat_${agent.slug}`}
                      agent={agent}
                      adminMode={adminMode}
                      updating={updatingSlug === agent.slug}
                      isCompared={compareSlugs.includes(agent.slug)}
                      onToggleCompare={toggleCompareSlug}
                      onViewProfile={handleOpenProfile}
                      onHire={handleOpenHire}
                      onManageHired={handleManageHired}
                      onToggleVisibility={handleToggleVisibility}
                      onOpenAdminConfig={(a) => setAdminEditingAgent(a)}
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-2.5">
              {featuredCandidates.length > 0 && (
                <div className="flex items-center justify-between pt-1">
                  <h2 className="text-xs font-bold text-muted-foreground">
                    جميع المرشحين المتاحين للتوظيف
                  </h2>
                  <span className="text-[11px] font-mono tabular-nums text-muted-foreground">
                    {filteredAgents.length}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAgents.map((agent) => (
                  <AgentMarketCard
                    key={agent.slug}
                    agent={agent}
                    adminMode={adminMode}
                    updating={updatingSlug === agent.slug}
                    isCompared={compareSlugs.includes(agent.slug)}
                    onToggleCompare={toggleCompareSlug}
                    onViewProfile={handleOpenProfile}
                    onHire={handleOpenHire}
                    onManageHired={handleManageHired}
                    onToggleVisibility={handleToggleVisibility}
                    onOpenAdminConfig={(a) => setAdminEditingAgent(a)}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* ── Floating Compare Candidates Bar ── */}
      {comparedAgents.length > 0 && (
        <div className="fixed bottom-20 lg:bottom-5 inset-x-0 z-40 px-3 sm:px-6 pointer-events-none">
          <div className="mx-auto max-w-xl pointer-events-auto rounded-xl border border-border bg-card text-card-foreground shadow-xl px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Scale className="size-4 text-primary shrink-0 stroke-[1.5]" />
              <span className="text-xs font-semibold text-foreground truncate">
                تم اختيار{" "}
                <span className="font-mono tabular-nums">{comparedAgents.length}</span>{" "}
                للمقارنة
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={clearCompare}
                className="h-8 px-2.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                مسح
              </button>
              <button
                type="button"
                onClick={() => setCompareOpen(true)}
                className="h-8 px-3.5 rounded-lg bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all"
              >
                مقارنة الـ CV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Drawers & Modals ── */}
      <AgentProfileDrawer
        agent={selectedAgent}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onHire={(agent) => {
          setDrawerOpen(false);
          handleOpenHire(agent);
        }}
        onManageHired={() => {
          setDrawerOpen(false);
          handleManageHired();
        }}
        isHired={Boolean(selectedAgent?.isHired)}
      />

      <AgentHireModal
        agent={agentToHire}
        open={hireModalOpen}
        initialWalletBalance={walletBalance}
        onClose={() => setHireModalOpen(false)}
        onHired={handleAgentHired}
      />

      <AgentCompareModal
        agents={comparedAgents}
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        onHire={handleOpenHire}
        onManageHired={handleManageHired}
        onRemove={toggleCompareSlug}
      />

      <AgentAdminConfigModal
        agent={adminEditingAgent}
        open={Boolean(adminEditingAgent)}
        saving={updatingSlug === adminEditingAgent?.slug}
        onClose={() => setAdminEditingAgent(null)}
        onSave={handleUpdateAgentConfig}
      />
    </div>
  );
}
