import React, { useState } from "react";
import { Plus, Search, BarChart3, Target, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ShopifyPageHeader } from "@/components/layout/ShopifyPageHeader";
import {
  GoalsStatsGrid,
  GoalsGridPanel,
} from "./goals/index";
import { GoalType, ProjectOption } from "./goals/types";

export interface PolarisGoalsViewProps {
  stats: any;
  projects: ProjectOption[];
  goalType: "ALL" | GoalType;
  onGoalTypeChange: (value: "ALL" | GoalType) => void;
  status: string;
  onStatusChange: (value: string) => void;
  projectId: string;
  onProjectIdChange: (value: string) => void;
  includeDaily: boolean;
  onIncludeDailyChange: (checked: boolean) => void;
  search: string;
  onSearchChange: (value: string) => void;
  filteredGoals: any[];
  dailyGoalsCount: number;
  goToNewGoal: () => void;
  goToGoalDetails: (id: string) => void;
}

export const PolarisGoalsView: React.FC<PolarisGoalsViewProps> = ({
  stats,
  projects,
  goalType,
  onGoalTypeChange,
  status,
  onStatusChange,
  projectId,
  onProjectIdChange,
  includeDaily,
  onIncludeDailyChange,
  search,
  onSearchChange,
  filteredGoals,
  dailyGoalsCount,
  goToNewGoal,
  goToGoalDetails,
}) => {
  const [showStats, setShowStats] = useState(false);

  const tabs = [
    { key: "ALL", label: "الكل", count: filteredGoals.length },
    { key: "IN_PROGRESS", label: "قيد التنفيذ" },
    { key: "COMPLETED", label: "مكتمل" },
    { key: "OVERDUE", label: "متأخر" },
    { key: "PLANNED", label: "مخطط" },
  ];

  return (
    <div
      data-polaris-goals-view="true"
      className="polaris-goals-container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4"
      dir="rtl"
    >
      {/* 1. Authentic Shopify Polaris Page Header */}
      <ShopifyPageHeader
        title="إدارة الأهداف والنتائج الرئيسية (OKRs)"
        subtitle="ربط استراتيجية المؤسسة بأهداف المشاريع ومتابعة مؤشرات الإنجاز الدورية"
        badges={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground tabular-nums">
            {filteredGoals.length} هدف
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowStats(!showStats)}
              className={`gap-1.5 h-8 text-xs font-semibold rounded-lg border-border/80 transition-all active:scale-95 shadow-2xs ${
                showStats ? "bg-primary/10 border-primary text-primary" : "bg-card text-foreground"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>الإحصائيات</span>
            </Button>

            <Button
              size="sm"
              onClick={goToNewGoal}
              className="gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-[var(--p-action-primary,#008060)] hover:bg-[#006e52] text-white transition-all active:scale-95 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>هدف جديد</span>
            </Button>
          </div>
        }
      />

      {/* Collapsible Stats Section */}
      {showStats && stats && (
        <div className="motion-safe:animate-fade-in">
          <GoalsStatsGrid stats={stats} dailyGoalsCount={dailyGoalsCount} />
        </div>
      )}

      {/* 2. Single Polaris Card Chassis */}
      <div className="bg-card rounded-xl border border-border/70 shadow-xs overflow-hidden flex flex-col">
        {/* Segmented Status Tabs */}
        <div className="flex items-center justify-between border-b border-border/70 px-3 overflow-x-auto scrollbar-none bg-card">
          <div className="flex items-center">
            {tabs.map((tab) => {
              const isActive = status === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onStatusChange(tab.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "border-[var(--petrol,#013735)] dark:border-[#3ec8b7] text-foreground font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
                  }`}
                >
                  <span>{tab.label}</span>
                  {typeof tab.count === "number" && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-muted text-muted-foreground font-mono tabular-nums">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Daily Goals Switch */}
          <div className="flex items-center gap-2 py-1.5 hidden sm:flex">
            <span className="text-xs text-muted-foreground">تضمين الأهداف اليومية</span>
            <Switch
              checked={includeDaily}
              onCheckedChange={onIncludeDailyChange}
            />
          </div>
        </div>

        {/* Integrated Filter Bar */}
        <div className="p-2.5 sm:p-3 border-b border-border/70 bg-muted/15 flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ابحث بعنوان الهدف، المسؤول، أو مؤشر القياس..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pe-9 h-8 text-xs bg-background border-border/70 rounded-lg shadow-none focus-visible:ring-1"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select
              value={goalType}
              onValueChange={(val: any) => onGoalTypeChange(val || "ALL")}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs bg-background border-border/70 rounded-lg">
                <SelectValue placeholder="نوع الهدف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">كل المستويات</SelectItem>
                <SelectItem value="COMPANY">استراتيجي عام</SelectItem>
                <SelectItem value="DEPARTMENT">على مستوى القسم</SelectItem>
                <SelectItem value="INDIVIDUAL">فردي للموظف</SelectItem>
              </SelectContent>
            </Select>

            {projects && projects.length > 0 && (
              <Select
                value={projectId}
                onValueChange={(val) => onProjectIdChange(val || "ALL")}
              >
                <SelectTrigger className="w-[140px] h-8 text-xs bg-background border-border/70 rounded-lg">
                  <SelectValue placeholder="المشروع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">كل المشاريع</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* 3. Goals Grid */}
        <div className="p-4">
          <GoalsGridPanel
            filteredGoals={filteredGoals}
            onOpenGoal={goToGoalDetails}
          />
        </div>
      </div>
    </div>
  );
};

export default PolarisGoalsView;
