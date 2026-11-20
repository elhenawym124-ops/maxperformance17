import React from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, Search, Users, WifiOff, Briefcase, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShopifyPageHeader } from "@/components/layout/ShopifyPageHeader";
import { OnlineEmployee, OnlineEmployeeCard } from "./OnlineEmployeeCard";

export type FilterTab = "all" | "online" | "offline";

export interface PolarisOnlineTeamViewProps {
  loading: boolean;
  refreshing: boolean;
  search: string;
  setSearch: (val: string) => void;
  tab: FilterTab;
  setTab: (val: FilterTab) => void;
  onlineCount: number;
  totalEmployees: number;
  filteredEmployees: OnlineEmployee[];
  fetchOnlineTeam: () => void;
  currentUserId: string | null;
}

export const PolarisOnlineTeamView: React.FC<PolarisOnlineTeamViewProps> = ({
  loading,
  refreshing,
  search,
  setSearch,
  tab,
  setTab,
  onlineCount,
  totalEmployees,
  filteredEmployees,
  fetchOnlineTeam,
  currentUserId,
}) => {
  const { t } = useTranslation();
  const offlineCount = Math.max(0, totalEmployees - onlineCount);

  const tabs: Array<{ key: FilterTab; label: string; count: number; live?: boolean }> = [
    { key: "all", label: t("onlineTeam.all") || "الكل", count: totalEmployees },
    { key: "online", label: t("onlineTeam.online") || "متصل الآن", count: onlineCount, live: true },
    { key: "offline", label: t("onlineTeam.offline") || "غير متصل", count: offlineCount },
  ];

  return (
    <div
      data-polaris-online-team-view="true"
      className="polaris-online-team-container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4"
      dir="rtl"
    >
      {/* 1. Authentic Shopify Polaris Page Header */}
      <ShopifyPageHeader
        title={t("onlineTeam.pageTitle") || "فريق العمل المتصل"}
        subtitle={t("onlineTeam.pageSubtitle") || "متابعة الحضور المباشر وحالة اتصال الموظفين لحظياً"}
        badges={
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-success/10 text-success dark:text-success border border-success/20 tabular-nums">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span>{onlineCount} {t("onlineTeam.live") || "مباشر"}</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground tabular-nums">
              {totalEmployees} موظف
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchOnlineTeam}
              disabled={refreshing}
              className="gap-1.5 h-8 text-xs font-semibold rounded-lg border-border/80 bg-card hover:bg-muted text-foreground transition-all active:scale-95 shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>{t("onlineTeam.refresh") || "تحديث"}</span>
            </Button>
          </div>
        }
      />

      {/* Telemetry Summary Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl border border-border/70 bg-card shadow-xs flex items-center gap-3">
          <span className="p-2.5 rounded-lg bg-success/10 text-success dark:text-success">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-bold font-mono tabular-nums text-foreground">{onlineCount}</p>
            <p className="text-xs text-muted-foreground">{t("onlineTeam.onlineEmployees") || "الموظفون المتصلون"}</p>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-border/70 bg-card shadow-xs flex items-center gap-3">
          <span className="p-2.5 rounded-lg bg-muted text-muted-foreground">
            <WifiOff className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-bold font-mono tabular-nums text-foreground">{offlineCount}</p>
            <p className="text-xs text-muted-foreground">{t("onlineTeam.offlineEmployees") || "الموظفون غير المتصلين"}</p>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-border/70 bg-card shadow-xs flex items-center gap-3">
          <span className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <Briefcase className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-bold font-mono tabular-nums text-foreground">{totalEmployees}</p>
            <p className="text-xs text-muted-foreground">{t("onlineTeam.totalEmployees") || "إجمالي الموظفين"}</p>
          </div>
        </div>
      </div>

      {/* 2. Single Polaris Card Chassis */}
      <div className="bg-card rounded-xl border border-border/70 shadow-xs overflow-hidden flex flex-col">
        {/* Segmented View Tabs */}
        <div className="flex items-center justify-between border-b border-border/70 px-3 overflow-x-auto scrollbar-none bg-card">
          <div className="flex items-center">
            {tabs.map((tItem) => {
              const isActive = tab === tItem.key;
              return (
                <button
                  key={tItem.key}
                  type="button"
                  onClick={() => setTab(tItem.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "border-[var(--petrol,#013735)] dark:border-[#3ec8b7] text-foreground font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
                  }`}
                >
                  <span>{tItem.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                      tItem.live && tItem.count > 0
                        ? "bg-emerald-500/15 text-success dark:text-success font-bold"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tItem.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Integrated Search Bar */}
        <div className="p-2.5 sm:p-3 border-b border-border/70 bg-muted/15 flex items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("onlineTeam.searchPlaceholder") || "بحث بالاسم، القسم أو الوظيفة..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pe-9 h-8 text-xs bg-background border-border/70 rounded-lg shadow-none focus-visible:ring-1"
            />
          </div>
        </div>

        {/* 3. Employee Cards Grid */}
        <div className="p-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-xl border border-border/50 bg-muted/20 animate-pulse"
                />
              ))}
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">{t("onlineTeam.noResults") || "لا يوجد موظفون مطابقون لبحثك"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredEmployees.map((emp) => (
                <OnlineEmployeeCard
                  key={emp.userId}
                  emp={emp}
                  isCurrentUser={emp.userId === currentUserId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PolarisOnlineTeamView;
