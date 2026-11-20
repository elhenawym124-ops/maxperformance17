import React, { useState } from "react";
import { Plus, Search, BarChart3, MessageSquare, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShopifyPageHeader } from "@/components/layout/ShopifyPageHeader";
import {
  FeedbackStatsGrid,
  FeedbackList,
} from "./feedback/index";

export interface PolarisFeedbackViewProps {
  feedback: any[];
  stats: any;
  loading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  ratingFilter: string;
  setRatingFilter: (rating: string) => void;
  isPrivileged: boolean;
  filteredFeedback: any[];
  onOpenReplyDialog: (item: any) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onNewFeedback: () => void;
}

export const PolarisFeedbackView: React.FC<PolarisFeedbackViewProps> = ({
  feedback,
  stats,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  ratingFilter,
  setRatingFilter,
  isPrivileged,
  filteredFeedback,
  onOpenReplyDialog,
  onEdit,
  onDelete,
  onNewFeedback,
}) => {
  const [showStats, setShowStats] = useState(false);

  const tabs = [
    { key: "all", label: "الكل", count: stats?.total || feedback.length },
    { key: "replied", label: "تم الرد" },
    { key: "pending", label: "قيد الانتظار" },
  ];

  return (
    <div
      data-polaris-feedback-view="true"
      className="polaris-feedback-container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4"
      dir="rtl"
    >
      {/* 1. Authentic Shopify Polaris Page Header */}
      <ShopifyPageHeader
        title="استطلاعات الرأي والتغذية الراجعة"
        subtitle="جمع تقييمات بيئة العمل، قياس رضا الموظفين ومتابعة الردود"
        badges={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground tabular-nums">
            {stats?.total || feedback.length} مشاركة
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
              onClick={onNewFeedback}
              className="gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-[var(--p-action-primary,#008060)] hover:bg-[#006e52] text-white transition-all active:scale-95 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>إضافة تقييم جديد</span>
            </Button>
          </div>
        }
      />

      {/* Collapsible Stats Section */}
      {showStats && stats && (
        <div className="motion-safe:animate-fade-in">
          <FeedbackStatsGrid stats={stats} feedback={feedback} />
        </div>
      )}

      {/* 2. Single Polaris Card Chassis */}
      <div className="bg-card rounded-xl border border-border/70 shadow-xs overflow-hidden flex flex-col">
        {/* Segmented Status Tabs */}
        <div className="flex items-center justify-between border-b border-border/70 px-3 overflow-x-auto scrollbar-none bg-card">
          <div className="flex items-center">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
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

          {/* Quick Rating Selector in Tab Header */}
          <div className="py-1.5 hidden sm:block">
            <Select value={ratingFilter} onValueChange={(val) => setRatingFilter(val || "all")}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-muted/40 border-border/70 rounded-lg">
                <SelectValue placeholder="التقييم" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">كل التقييمات</SelectItem>
                <SelectItem value="5">5 نجوم ★★★★★</SelectItem>
                <SelectItem value="4">4 نجوم ★★★★</SelectItem>
                <SelectItem value="3">3 نجوم ★★★</SelectItem>
                <SelectItem value="2">نجمتان ★★</SelectItem>
                <SelectItem value="1">نجمة واحدة ★</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Integrated Search Bar */}
        <div className="p-2.5 sm:p-3 border-b border-border/70 bg-muted/15 flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ابحث في نص التقييم أو اسم الموظف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pe-9 h-8 text-xs bg-background border-border/70 rounded-lg shadow-none focus-visible:ring-1"
            />
          </div>

          <div className="w-full sm:w-auto sm:hidden">
            <Select value={ratingFilter} onValueChange={(val) => setRatingFilter(val || "all")}>
              <SelectTrigger className="w-full h-8 text-xs bg-background border-border/70 rounded-lg">
                <SelectValue placeholder="التقييم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل التقييمات</SelectItem>
                <SelectItem value="5">5 نجوم ★★★★★</SelectItem>
                <SelectItem value="4">4 نجوم ★★★★</SelectItem>
                <SelectItem value="3">3 نجوم ★★★</SelectItem>
                <SelectItem value="2">نجمتان ★★</SelectItem>
                <SelectItem value="1">نجمة واحدة ★</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 3. Feedback List */}
        <div className="p-0">
          <FeedbackList
            feedback={filteredFeedback}
            isPrivileged={isPrivileged}
            onOpenReplyDialog={onOpenReplyDialog}
            onEdit={onEdit}
            onDelete={onDelete}
            onResetFilters={() => {
              setSearchQuery("");
              setRatingFilter("all");
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PolarisFeedbackView;
