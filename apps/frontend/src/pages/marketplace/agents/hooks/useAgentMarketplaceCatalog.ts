import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import { apiClient } from "../../../../services/apiClient";
import { useOptionalAuth } from "../../../../hooks/useAuthSimple";
import {
  AgentCatalogResponse,
  AgentCategory,
  AgentKind,
  AgentListing,
  AgentTier,
  CatalogStats,
} from "../agentMarketplaceData";

export type HireStatusFilter = "all" | "hired" | "available";
export type VisibilityFilter = "all" | "visible" | "hidden";

const EMPTY_STATS: CatalogStats = {
  total: 0,
  totalDiscovered: 0,
  visibleCount: 0,
  hiddenCount: 0,
  hiredCount: 0,
  freeCount: 0,
  proCount: 0,
  squadCount: 0,
  soloCount: 0,
  verticalCount: 0,
};

export function useAgentMarketplaceCatalog() {
  const auth = useOptionalAuth();
  const userIsSuperAdmin = auth?.user?.role === "SUPER_ADMIN";

  const [agents, setAgents] = useState<AgentListing[]>([]);
  const [stats, setStats] = useState<CatalogStats>(EMPTY_STATS);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [defaultNewAgentVisible, setDefaultNewAgentVisible] = useState<boolean>(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(userIsSuperAdmin);
  const [adminMode, setAdminMode] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingSlug, setUpdatingSlug] = useState<string | null>(null);
  const [updatingSettings, setUpdatingSettings] = useState<boolean>(false);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<AgentCategory>("all");
  const [kindFilter, setKindFilter] = useState<"all" | AgentKind>("all");
  const [tierFilter, setTierFilter] = useState<"all" | AgentTier>("all");
  const [statusFilter, setStatusFilter] = useState<HireStatusFilter>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const fetchCatalog = useCallback(
    async (opts?: { includeHidden?: boolean; silent?: boolean }) => {
      const wantHidden = opts?.includeHidden ?? (adminMode && (isSuperAdmin || userIsSuperAdmin));
      if (!opts?.silent) setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<AgentCatalogResponse>("/agent-manager/catalog", {
          params: wantHidden ? { includeHidden: "true" } : undefined,
        });
        if (res.data?.success) {
          setAgents(Array.isArray(res.data.agents) ? res.data.agents : []);
          setStats(res.data.stats || EMPTY_STATS);
          setWalletBalance(
            typeof res.data.walletBalance === "number" ? res.data.walletBalance : null
          );
          setDefaultNewAgentVisible(Boolean(res.data.defaultNewAgentVisible));
          if (typeof res.data.isSuperAdmin === "boolean") {
            setIsSuperAdmin(res.data.isSuperAdmin);
          }
        } else {
          setError("تعذر تحميل كتالوج الوكلاء حالياً.");
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "تعذر الاتصال بخدمة كتالوج الوكلاء."
        );
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [adminMode, isSuperAdmin, userIsSuperAdmin]
  );

  useEffect(() => {
    fetchCatalog({ includeHidden: adminMode && (isSuperAdmin || userIsSuperAdmin) });
  }, [fetchCatalog, adminMode, isSuperAdmin, userIsSuperAdmin]);

  // Keyboard shortcut: Cmd/Ctrl + K focuses search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleToggleAdminMode = () => {
    const next = !adminMode;
    setAdminMode(next);
    if (!next) {
      setVisibilityFilter("all");
      if (kindFilter === "internal") setKindFilter("all");
    }
  };

  const handleToggleVisibility = async (agent: AgentListing) => {
    setUpdatingSlug(agent.slug);
    try {
      const nextVisible = !agent.visible;
      const res = await apiClient.patch(`/agent-manager/catalog/${agent.slug}`, {
        visible: nextVisible,
      });
      if (res.data?.success) {
        toast.success(
          nextVisible
            ? `تم إظهار الوكيل «${agent.name}» في السوق.`
            : `تم إخفاء الوكيل «${agent.name}» من السوق.`
        );
        await fetchCatalog({ includeHidden: true, silent: true });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "تعذر تحديث حالة الظهور.");
    } finally {
      setUpdatingSlug(null);
    }
  };

  const handleUpdateAgentConfig = async (
    slug: string,
    patch: Partial<Pick<AgentListing, "visible" | "tier" | "priceMonthly" | "category" | "kind" | "featured" | "summary">>
  ) => {
    setUpdatingSlug(slug);
    try {
      const res = await apiClient.patch(`/agent-manager/catalog/${slug}`, patch);
      if (res.data?.success) {
        toast.success("تم حفظ إعدادات الوكيل بنجاح.");
        await fetchCatalog({ includeHidden: adminMode, silent: true });
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "تعذر حفظ تعديلات الوكيل.");
      return false;
    } finally {
      setUpdatingSlug(null);
    }
  };

  const handleToggleDefaultNewVisible = async () => {
    setUpdatingSettings(true);
    try {
      const next = !defaultNewAgentVisible;
      const res = await apiClient.patch("/agent-manager/catalog-settings", {
        defaultNewAgentVisible: next,
      });
      if (res.data?.success) {
        setDefaultNewAgentVisible(next);
        toast.success(
          next
            ? "الوكلاء الجدد سيظهرون تلقائياً في السوق."
            : "الوكلاء الجدد سينزلون مخفيين كمسودة حتى تفعيلهم."
        );
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "تعذر تحديث الإعداد الافتراضي.");
    } finally {
      setUpdatingSettings(false);
    }
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: agents.length };
    for (const a of agents) {
      counts[a.category] = (counts[a.category] || 0) + 1;
    }
    return counts;
  }, [agents]);

  const filteredAgents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return agents.filter((agent) => {
      if (activeCategory !== "all" && agent.category !== activeCategory) return false;
      if (kindFilter !== "all" && agent.kind !== kindFilter) return false;
      if (tierFilter !== "all" && agent.tier !== tierFilter) return false;
      if (statusFilter === "hired" && !agent.isHired) return false;
      if (statusFilter === "available" && agent.isHired) return false;
      if (adminMode && visibilityFilter === "visible" && !agent.visible) return false;
      if (adminMode && visibilityFilter === "hidden" && agent.visible) return false;

      if (q) {
        const hay = [
          agent.name,
          agent.slug,
          agent.position,
          agent.summary,
          ...(agent.channelLabels || []),
          ...(agent.capabilities || []),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    agents,
    activeCategory,
    kindFilter,
    tierFilter,
    statusFilter,
    visibilityFilter,
    adminMode,
    search,
  ]);

  const resetFilters = () => {
    setSearch("");
    setActiveCategory("all");
    setKindFilter("all");
    setTierFilter("all");
    setStatusFilter("all");
    setVisibilityFilter("all");
  };

  const hasActiveFilters =
    Boolean(search.trim()) ||
    activeCategory !== "all" ||
    kindFilter !== "all" ||
    tierFilter !== "all" ||
    statusFilter !== "all" ||
    visibilityFilter !== "all";

  return {
    agents,
    filteredAgents,
    stats,
    categoryCounts,
    walletBalance,
    defaultNewAgentVisible,
    isSuperAdmin: isSuperAdmin || userIsSuperAdmin,
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
    fetchCatalog,
    handleToggleAdminMode,
    handleToggleVisibility,
    handleUpdateAgentConfig,
    handleToggleDefaultNewVisible,
  };
}
