import React from "react";
import { Plus, Search, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShopifyPageHeader } from "@/components/layout/ShopifyPageHeader";
import { BenefitsGrid } from "./benefits/index";

export interface PolarisBenefitsViewProps {
  benefits: any[];
  loading: boolean;
  pagination: any;
  page: number;
  setPage: (p: number) => void;
  search: string;
  setSearch: (s: string) => void;
  typeFilter: string;
  setTypeFilter: (s: string) => void;
  onSelectBenefit: (id: string) => void;
  onEditBenefit: (b: any) => void;
  onDeleteBenefit: (id: string) => void;
  onAddNew: () => void;
}

export const PolarisBenefitsView: React.FC<PolarisBenefitsViewProps> = ({
  benefits,
  loading,
  pagination,
  page,
  setPage,
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  onSelectBenefit,
  onEditBenefit,
  onDeleteBenefit,
  onAddNew,
}) => {
  const tabs = [
    { key: "all", label: "كل المزايا", count: pagination?.total || benefits.length },
    { key: "HEALTH_INSURANCE", label: "تأمين صحي" },
    { key: "LIFE_INSURANCE", label: "تأمين حياة" },
    { key: "ALLOWANCE", label: "بدلات ومساعدات" },
    { key: "RETIREMENT", label: "خطط تقاعد" },
    { key: "OTHER", label: "أخرى" },
  ];

  return (
    <div
      data-polaris-benefits-view="true"
      className="polaris-benefits-container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4"
      dir="rtl"
    >
      {/* 1. Authentic Shopify Polaris Page Header */}
      <ShopifyPageHeader
        title="المزايا والتأمينات الاجتماعية"
        subtitle="إدارة باقات المزايا الوظيفية، وثائق التأمين الصحي والاجتماعي، والبدلات"
        badges={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground tabular-nums">
            {pagination?.total || benefits.length} ميزة
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onAddNew}
              className="gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-[var(--p-action-primary,#008060)] hover:bg-[#006e52] text-white transition-all active:scale-95 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>إضافة ميزة جديدة</span>
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
              const isActive = typeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setTypeFilter(tab.key)}
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
        </div>

        {/* Integrated Search Bar */}
        <div className="p-2.5 sm:p-3 border-b border-border/70 bg-muted/15 flex items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ابحث باسم الميزة، مقدم الخدمة، أو الوصف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pe-9 h-8 text-xs bg-background border-border/70 rounded-lg shadow-none focus-visible:ring-1"
            />
          </div>
        </div>

        {/* 3. Benefits Grid */}
        <div className="p-4">
          <BenefitsGrid
            benefits={benefits}
            loading={loading}
            pagination={pagination}
            page={page}
            setPage={setPage}
            onSelectBenefit={onSelectBenefit}
            onEditBenefit={onEditBenefit}
            onDeleteBenefit={onDeleteBenefit}
            onAddNew={onAddNew}
          />
        </div>
      </div>
    </div>
  );
};

export default PolarisBenefitsView;
