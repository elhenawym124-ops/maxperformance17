import React from "react";
import { Plus, Search, MessageSquare, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShopifyPageHeader } from "@/components/layout/ShopifyPageHeader";
import { MyFeedbackListSection } from "./my-feedback/index";

export interface PolarisMyFeedbackViewProps {
  t: (key: string) => string;
  loading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredFeedback: any[];
  stats: any;
  onOpenPreview: (item: any) => void;
  onNewMessage: () => void;
}

export const PolarisMyFeedbackView: React.FC<PolarisMyFeedbackViewProps> = ({
  t,
  loading,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  filteredFeedback,
  stats,
  onOpenPreview,
  onNewMessage,
}) => {
  const tabs = [
    { key: "all", label: "كل الرسائل", count: stats?.total || filteredFeedback.length },
    { key: "replied", label: "تم الرد عليها", count: stats?.replied || 0 },
    { key: "pending", label: "قيد الانتظار", count: stats?.pending || 0 },
  ];

  return (
    <div
      data-polaris-my-feedback-view="true"
      className="polaris-my-feedback-container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4"
      dir="rtl"
    >
      {/* 1. Authentic Shopify Polaris Page Header */}
      <ShopifyPageHeader
        title={t("myFeedback.title") || "صندوق الملاحظات والاقتراحات"}
        subtitle="متابعة مقترحاتك، استفساراتك الموجهة للإدارة والردود الواردة عليها"
        badges={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground tabular-nums">
            {stats?.total || filteredFeedback.length} رسالة
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onNewMessage}
              className="gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-[var(--p-action-primary,#008060)] hover:bg-[#006e52] text-white transition-all active:scale-95 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t("myFeedback.newFeedback") || "رسالة جديدة"}</span>
            </Button>
          </div>
        }
      />

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
                  {typeof tab.count === "number" && tab.count > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-muted text-muted-foreground font-mono tabular-nums">
                      {tab.count}
                    </span>
                  )}
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
              placeholder={t("myFeedback.searchPlaceholder") || "ابحث في موضوع أو نص الرسالة..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pe-9 h-8 text-xs bg-background border-border/70 rounded-lg shadow-none focus-visible:ring-1"
            />
          </div>
        </div>

        {/* 3. Feedback List */}
        <div className="p-4 [&>div.rounded-xl]:border-0 [&>div.rounded-xl]:shadow-none [&>div.rounded-xl]:rounded-none">
          <MyFeedbackListSection
            t={t}
            loading={loading}
            activeTab={activeTab}
            onActiveTabChange={setActiveTab}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            filteredFeedback={filteredFeedback}
            onOpenPreview={onOpenPreview}
            onNewMessage={onNewMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default PolarisMyFeedbackView;
