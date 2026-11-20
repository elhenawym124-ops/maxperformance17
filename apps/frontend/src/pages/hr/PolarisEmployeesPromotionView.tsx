import React, { useState } from "react";
import {
  Award,
  Plus,
  BarChart3,
  Search,
  ArrowUpDown,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
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
import type { Promotion, PromotionStats } from "./employees-promotion/types";
import {
  EmployeesPromotionEmptyState,
  EmployeesPromotionList,
} from "./employees-promotion/index";

interface PolarisEmployeesPromotionViewProps {
  promotions: Promotion[];
  filteredPromotions: Promotion[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  stats: PromotionStats;
  onUpdateStatus: (id: string, status: string) => void;
  onDeletePromotion: (id: string) => void;
  onNewPromotion: () => void;
  onEditPromotion: (id: string) => void;
}

export const PolarisEmployeesPromotionView: React.FC<
  PolarisEmployeesPromotionViewProps
> = ({
  promotions,
  filteredPromotions,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  stats,
  onUpdateStatus,
  onDeletePromotion,
  onNewPromotion,
  onEditPromotion,
}) => {
  const [showStats, setShowStats] = useState(true);

  const tabs: { id: string; label: string; count: number; icon: React.ElementType }[] = [
    { id: "all", label: "الكل", count: stats.total, icon: Award },
    { id: "PENDING", label: "قيد المراجعة", count: stats.pending, icon: Clock },
    { id: "APPROVED", label: "موافق عليها", count: stats.approved, icon: CheckCircle },
    { id: "COMPLETED", label: "مكتملة التنفيذ", count: stats.completed, icon: Sparkles },
    { id: "REJECTED", label: "مرفوضة", count: stats.rejected, icon: XCircle },
  ];

  return (
    <div className="space-y-4 w-full max-w-full" dir="rtl">
      {/* Polaris Page Header */}
      <ShopifyPageHeader
        title="الترقيات والمسارات الوظيفية"
        subtitle="إدارة طلبات الترقية والتقدم المهني، تعديل الدرجات الوظيفية، ومتابعة دورة الاعتماد الإداري"
        badges={[
          { label: `${stats.total} ترقية إجمالية`, variant: "default" },
          ...(stats.pending > 0
            ? [{ label: `${stats.pending} بانتظار الاعتماد`, variant: "destructive" as const }]
            : []),
          { label: `${stats.approved} معتمدة`, variant: "secondary" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>{showStats ? "إخفاء المؤشرات" : "عرض المؤشرات"}</span>
            </Button>
            <Button
              size="sm"
              onClick={onNewPromotion}
              className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground font-medium shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              طلب ترقية جديدة
            </Button>
          </div>
        }
      />

      {/* KPI Stats Strip */}
      {showStats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Card className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-medium">إجمالي الطلبات</span>
              <Award className="h-4 w-4 text-primary" />
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-foreground">
              {stats.total}
            </div>
          </Card>

          <Card className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-medium">قيد المراجعة</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-amber-600">
              {stats.pending}
            </div>
          </Card>

          <Card className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-medium">موافق عليها</span>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-emerald-600">
              {stats.approved}
            </div>
          </Card>

          <Card className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-medium">مكتملة التنفيذ</span>
              <Sparkles className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-blue-600">
              {stats.completed}
            </div>
          </Card>

          <Card className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-medium">مرفوضة</span>
              <XCircle className="h-4 w-4 text-rose-500" />
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-rose-600">
              {stats.rejected}
            </div>
          </Card>
        </div>
      )}

      {/* Main Single-Surface Polaris Card Chassis */}
      <Card className="rounded-2xl border border-border/70 bg-card shadow-xs overflow-hidden">
        {/* Segmented Status Tabs */}
        <div className="border-b border-border/70 bg-muted/20 px-3 pt-2">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onStatusFilterChange(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{tab.label}</span>
                  <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
                    {tab.count}
                  </span>
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
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="البحث بالاسم، المسمى الوظيفي، أو سبب الترقية..."
              className="pr-9 h-9 text-xs rounded-xl bg-background border-border/70"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="w-48">
              <Select value={sortBy} onValueChange={onSortByChange}>
                <SelectTrigger className="h-9 text-xs rounded-xl border-border/70 bg-background">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    <SelectValue placeholder="ترتيب حسب" />
                  </div>
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="createdAt_desc">الأحدث أولاً</SelectItem>
                  <SelectItem value="createdAt_asc">الأقدم أولاً</SelectItem>
                  <SelectItem value="effectiveDate_desc">تاريخ السريان (تنازلي)</SelectItem>
                  <SelectItem value="effectiveDate_asc">تاريخ السريان (تصاعدي)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <CardContent className="p-4 sm:p-6 [&>div.space-y-4]:space-y-3">
          {filteredPromotions.length === 0 ? (
            <EmployeesPromotionEmptyState
              hasAnyPromotions={promotions.length > 0}
              onNewPromotion={onNewPromotion}
            />
          ) : (
            <EmployeesPromotionList
              promotions={filteredPromotions}
              onUpdateStatus={onUpdateStatus}
              onDeletePromotion={onDeletePromotion}
              onEditPromotion={onEditPromotion}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
