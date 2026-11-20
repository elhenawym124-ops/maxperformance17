import React, { useState } from "react";
import {
  Heart,
  RefreshCw,
  Plus,
  BarChart3,
  Gift,
  Users,
  Star,
  Trophy,
  Crown,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { ShopifyPageHeader } from "@/components/layout/ShopifyPageHeader";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import type { LoyaltyTabKey } from "./customer-loyalty/types";
import {
  LoyaltyProgramsTab,
  LoyaltyCustomersTab,
  LoyaltyTiersTab,
  LoyaltyAnalyticsTab,
  LoyaltyCashbackTab,
} from "./customer-loyalty/index";
import type {
  CustomerLoyaltyProgram,
  CustomerLoyaltyRecord,
  CustomerLoyaltyTier,
  CashbackSettings,
  CashbackSettingsDraft,
  WalletStats,
} from "./customer-loyalty/types";

interface PolarisCustomerLoyaltyViewProps {
  activeTab: LoyaltyTabKey;
  setActiveTab: (tab: LoyaltyTabKey) => void;
  programs: CustomerLoyaltyProgram[];
  customers: CustomerLoyaltyRecord[];
  rawCustomersCount: number;
  tiers: CustomerLoyaltyTier[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setShowCreateForm: (show: boolean) => void;
  cashbackSettings: CashbackSettings | null;
  cashbackDraft: CashbackSettingsDraft;
  isSavingCashback: boolean;
  walletStats: WalletStats | null;
  fetchLoyaltyData: () => void;
  saveCashbackSettings: () => void;
  updateCashbackField: (key: any, value: any) => void;
  updateTierOverride: (tierId: string, val: string) => void;
}

export const PolarisCustomerLoyaltyView: React.FC<PolarisCustomerLoyaltyViewProps> = ({
  activeTab,
  setActiveTab,
  programs,
  customers,
  rawCustomersCount,
  tiers,
  searchQuery,
  setSearchQuery,
  setShowCreateForm,
  cashbackSettings,
  cashbackDraft,
  isSavingCashback,
  walletStats,
  fetchLoyaltyData,
  saveCashbackSettings,
  updateCashbackField,
  updateTierOverride,
}) => {
  const [showStats, setShowStats] = useState(true);

  const activeProgramsCount = programs.filter((p) => p.status === "ACTIVE").length;
  const activeCustomersCount = customers.filter((c) => c.status === "ACTIVE").length;
  const totalPoints = customers.reduce((sum, c) => sum + (c.currentPoints || 0), 0);

  const tabs: { id: LoyaltyTabKey; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "programs", label: "البرامج", icon: Gift, count: programs.length },
    { id: "customers", label: "العملاء المشتركون", icon: Users, count: rawCustomersCount || customers.length },
    { id: "tiers", label: "مستويات العضوية", icon: Crown, count: tiers.length },
    { id: "analytics", label: "التحليلات والمؤشرات", icon: TrendingUp },
    { id: "cashback", label: "إعدادات الكاش باك", icon: DollarSign },
  ];

  return (
    <div className="space-y-4 w-full max-w-full" dir="rtl">
      {/* Polaris Page Header */}
      <ShopifyPageHeader
        title="برامج ولاء ومكافآت العملاء"
        subtitle="محرك نقاط المكافآت، مستويات العضوية التراكمية، واستراتيجيات الكاش باك لتعزيز الاحتفاظ بالعملاء"
        badges={[
          { label: `${activeProgramsCount} برنامج نشط`, variant: "default" },
          { label: `${activeCustomersCount} عميل مشترك`, variant: "secondary" },
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
              variant="outline"
              size="sm"
              onClick={fetchLoyaltyData}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              تحديث
            </Button>
            <Button
              size="sm"
              onClick={() => setShowCreateForm(true)}
              className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground font-medium shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              برنامج جديد
            </Button>
          </div>
        }
      />

      {/* KPI Stats Strip */}
      {showStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-medium">البرامج النشطة</span>
              <Gift className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono tabular-nums text-foreground">
                {activeProgramsCount}
              </span>
              <span className="text-[11px] text-muted-foreground">من أصل {programs.length}</span>
            </div>
          </Card>

          <Card className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-medium">العملاء المشتركون</span>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono tabular-nums text-foreground">
                {activeCustomersCount}
              </span>
              <span className="text-[11px] text-muted-foreground">نشط</span>
            </div>
          </Card>

          <Card className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-medium">إجمالي النقاط الممنوحة</span>
              <Star className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono tabular-nums text-foreground">
                {totalPoints.toLocaleString()}
              </span>
              <span className="text-[11px] text-muted-foreground">نقطة</span>
            </div>
          </Card>

          <Card className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-medium">مستويات العضوية</span>
              <Trophy className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono tabular-nums text-foreground">
                {tiers.length}
              </span>
              <span className="text-[11px] text-muted-foreground">مستوى</span>
            </div>
          </Card>
        </div>
      )}

      {/* Main Single-Surface Polaris Card Chassis */}
      <Card className="rounded-2xl border border-border/70 bg-card shadow-xs overflow-hidden">
        {/* Segmented Navigation Tabs */}
        <div className="border-b border-border/70 bg-muted/20 px-3 pt-2">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
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

        {/* Tab Body */}
        <CardContent className="p-4 sm:p-6 [&>div.rounded-2xl]:border-0 [&>div.rounded-2xl]:shadow-none [&>div.rounded-2xl]:p-0">
          {activeTab === "programs" && (
            <LoyaltyProgramsTab
              programs={programs}
              onCreateProgram={() => setShowCreateForm(true)}
            />
          )}

          {activeTab === "customers" && (
            <LoyaltyCustomersTab
              customers={customers}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              rawCustomersCount={rawCustomersCount}
            />
          )}

          {activeTab === "tiers" && <LoyaltyTiersTab tiers={tiers} />}

          {activeTab === "analytics" && (
            <LoyaltyAnalyticsTab
              programs={programs}
              walletStats={walletStats}
            />
          )}

          {activeTab === "cashback" && (
            <LoyaltyCashbackTab
              cashbackSettings={cashbackSettings}
              cashbackDraft={cashbackDraft}
              tiers={tiers}
              isSaving={isSavingCashback}
              onSave={saveCashbackSettings}
              onUpdateField={updateCashbackField}
              onUpdateTierOverride={updateTierOverride}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
