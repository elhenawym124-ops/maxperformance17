import React, { useState } from "react";
import {
  Trophy,
  RefreshCw,
  BarChart3,
  Search,
  Filter,
  Activity,
  Award,
  ShieldAlert,
  Crown,
  Calendar,
} from "lucide-react";
import { ShopifyPageHeader } from "../orders/ShopifyPageHeader";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import type {
  LeaderboardData,
  LeaderboardEmployee,
  PeriodMode,
  PerformanceTier,
} from "./team-performance-360/types";
import {
  TeamPerformance360KPIs,
  TeamPerformance360Table,
} from "./team-performance-360/index";

interface PolarisTeamPerformance360ViewProps {
  loading: boolean;
  data: LeaderboardData | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedTier: PerformanceTier | "ALL";
  setSelectedTier: (tier: PerformanceTier | "ALL") => void;
  selectedDepartment: string;
  setSelectedDepartment: (dept: string) => void;
  selectedPeriodMode: PeriodMode;
  setSelectedPeriodMode: (mode: PeriodMode) => void;
  departments: string[];
  filteredEmployees: LeaderboardEmployee[];
  onSelectForDrilldown: (emp: LeaderboardEmployee) => void;
  onSelectForPIP: (emp: LeaderboardEmployee) => void;
  onRefresh: () => void;
}

export const PolarisTeamPerformance360View: React.FC<
  PolarisTeamPerformance360ViewProps
> = ({
  loading,
  data,
  searchQuery,
  setSearchQuery,
  selectedTier,
  setSelectedTier,
  selectedDepartment,
  setSelectedDepartment,
  selectedPeriodMode,
  setSelectedPeriodMode,
  departments,
  filteredEmployees,
  onSelectForDrilldown,
  onSelectForPIP,
  onRefresh,
}) => {
  const [showKPIs, setShowKPIs] = useState(true);

  const averageScore = data?.summary?.averageScore ?? 0;
  const eliteCount =
    (data?.summary?.tierCounts.TIER_S ?? 0) + (data?.summary?.tierCounts.TIER_A ?? 0);
  const atRiskCount = data?.summary?.atRiskCount ?? 0;

  const tierTabs: { id: PerformanceTier | "ALL"; label: string; count?: number }[] = [
    { id: "ALL", label: "كافة المستويات", count: data?.leaderboard.length ?? 0 },
    { id: "TIER_S", label: "فئة S (الاستثنائيون)", count: data?.summary?.tierCounts.TIER_S },
    { id: "TIER_A", label: "فئة A (المتميزون)", count: data?.summary?.tierCounts.TIER_A },
    { id: "TIER_B", label: "فئة B (المستقرون)", count: data?.summary?.tierCounts.TIER_B },
    { id: "TIER_C", label: "فئة C (المتأخرون)", count: data?.summary?.tierCounts.TIER_C },
    { id: "TIER_D", label: "فئة D (تحت الملاحظة)", count: data?.summary?.tierCounts.TIER_D },
  ];

  return (
    <div className="space-y-4 w-full max-w-full" dir="rtl">
      {/* Polaris Page Header */}
      <ShopifyPageHeader
        title="لوحة تقييم الفريق التلقائية 360°"
        subtitle="محرك التقييم الموضوعي الشامل لقياس إنتاجية المهام، جودة المخرجات، والانضباط الوظيفي"
        badges={[
          { label: `متوسط الأداء: ${averageScore} / 100`, variant: "default" },
          { label: `${eliteCount} في فئة النخبة`, variant: "secondary" },
          ...(atRiskCount > 0
            ? [{ label: `${atRiskCount} بحاجة لمتابعة`, variant: "destructive" as const }]
            : []),
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Period Segmented Toggle */}
            <div className="flex items-center bg-card rounded-lg border border-border/70 p-0.5">
              <button
                type="button"
                onClick={() => setSelectedPeriodMode("SLIDING_30")}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                  selectedPeriodMode === "SLIDING_30"
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                آخر 30 يوماً
              </button>
              <button
                type="button"
                onClick={() => setSelectedPeriodMode("CURRENT_MONTH")}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                  selectedPeriodMode === "CURRENT_MONTH"
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                الشهر الحالي
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowKPIs(!showKPIs)}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>{showKPIs ? "إخفاء المؤشرات" : "عرض المؤشرات"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              تحديث
            </Button>
          </div>
        }
      />

      {/* KPI Overview Cards */}
      {showKPIs && <TeamPerformance360KPIs summary={data?.summary} />}

      {/* Main Single-Surface Polaris Card Chassis */}
      <Card className="rounded-2xl border border-border/70 bg-card shadow-xs overflow-hidden">
        {/* Segmented Tier Tabs */}
        <div className="border-b border-border/70 bg-muted/20 px-3 pt-2">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
            {tierTabs.map((tab) => {
              const isActive = selectedTier === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTier(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-3 border-b border-border/70 bg-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث بالاسم أو المنصب أو القسم..."
              className="pr-9 h-9 text-xs rounded-xl bg-background border-border/70"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="w-48">
              <Select
                value={selectedDepartment}
                onValueChange={(val) => setSelectedDepartment(val || "ALL")}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl border-border/70 bg-background">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Filter className="h-3.5 w-3.5" />
                    <SelectValue placeholder="كافة الأقسام" />
                  </div>
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="ALL">كافة الأقسام</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Content Body: Leaderboard Table */}
        <CardContent className="p-0 [&>div.rounded-2xl]:border-0 [&>div.rounded-2xl]:shadow-none [&>div.rounded-2xl]:p-0">
          <TeamPerformance360Table
            employees={filteredEmployees}
            totalCount={data?.leaderboard.length ?? 0}
            onSelectForDrilldown={onSelectForDrilldown}
            onSelectForPIP={onSelectForPIP}
          />
        </CardContent>
      </Card>
    </div>
  );
};
