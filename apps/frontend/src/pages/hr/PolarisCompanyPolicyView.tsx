import React, { useMemo } from "react";
import { Plus, Search, BookOpen, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShopifyPageHeader } from "@/components/layout/ShopifyPageHeader";
import { CompanyPolicyTable } from "./company-policy/index";

export interface PolarisCompanyPolicyViewProps {
  policies: any[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  onView: (policy: any) => void;
  onEdit: (policy: any) => void;
  onDelete: (id: string) => void;
  onNewPolicy: () => void;
}

export const PolarisCompanyPolicyView: React.FC<PolarisCompanyPolicyViewProps> = ({
  policies,
  loading,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  onView,
  onEdit,
  onDelete,
  onNewPolicy,
}) => {
  const tabs = [
    { key: "all", label: "كل اللوائح", count: policies.length },
    { key: "general", label: "عامة" },
    { key: "attendance", label: "الحضور والدوام" },
    { key: "conduct", label: "السلوك المهني" },
    { key: "safety", label: "الأمن والسلامة" },
    { key: "leaves", label: "الإجازات والتعويضات" },
  ];

  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const title = (p.title || "").toLowerCase();
      const content = (p.content || "").toLowerCase();
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || title.includes(q) || content.includes(q);
      const matchesCategory =
        selectedCategory === "all" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [policies, searchQuery, selectedCategory]);

  return (
    <div
      data-polaris-company-policy-view="true"
      className="polaris-policy-container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4"
      dir="rtl"
    >
      {/* 1. Authentic Shopify Polaris Page Header */}
      <ShopifyPageHeader
        title="لوائح وسياسات الشركة"
        subtitle="توثيق معايير الحوكمة، السلوك المهني، ولائحة العمل والجزاءات المعتمدة"
        badges={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground tabular-nums">
            {policies.length} لائحة
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onNewPolicy}
              className="gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-[var(--p-action-primary,#008060)] hover:bg-[#006e52] text-white transition-all active:scale-95 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>إضافة سياسة جديدة</span>
            </Button>
          </div>
        }
      />

      {/* 2. Single Polaris Card Chassis */}
      <div className="bg-card rounded-xl border border-border/70 shadow-xs overflow-hidden flex flex-col">
        {/* Segmented Category Tabs */}
        <div className="flex items-center justify-between border-b border-border/70 px-3 overflow-x-auto scrollbar-none bg-card">
          <div className="flex items-center">
            {tabs.map((tab) => {
              const isActive = selectedCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedCategory(tab.key)}
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
              placeholder="ابحث في عنوان أو نص اللائحة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pe-9 h-8 text-xs bg-background border-border/70 rounded-lg shadow-none focus-visible:ring-1"
            />
          </div>
        </div>

        {/* 3. Policies Table */}
        <div className="p-0 [&>div.rounded-xl]:border-0 [&>div.rounded-xl]:shadow-none [&>div.rounded-xl]:rounded-none">
          <CompanyPolicyTable
            policies={filteredPolicies}
            loading={loading}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  );
};

export default PolarisCompanyPolicyView;
