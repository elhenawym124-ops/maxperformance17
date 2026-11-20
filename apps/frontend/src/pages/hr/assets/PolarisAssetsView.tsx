import React, { useState } from "react";
import {
  Monitor,
  Plus,
  RotateCcw,
  Tag,
  Users,
  ClipboardList,
  BarChart3,
  Box,
} from "lucide-react";
import { ShopifyPageHeader } from "../../orders/ShopifyPageHeader";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import AssetList from "./AssetList";
import AssetStats from "./AssetStats";
import AssetCategories from "./AssetCategories";
import AssetSuppliers from "./AssetSuppliers";
import AssetRequests from "./AssetRequests";
import MyAssetRequests from "./MyAssetRequests";

interface PolarisAssetsViewProps {
  activeTab: "list" | "categories" | "requests" | "myRequests" | "suppliers";
  setActiveTab: (tab: "list" | "categories" | "requests" | "myRequests" | "suppliers") => void;
  isHR: boolean;
  refreshTrigger: number;
  onRefresh: () => void;
  onOpenAddModal: () => void;
}

export const PolarisAssetsView: React.FC<PolarisAssetsViewProps> = ({
  activeTab,
  setActiveTab,
  isHR,
  refreshTrigger,
  onRefresh,
  onOpenAddModal,
}) => {
  const [showStats, setShowStats] = useState(true);

  const tabs: {
    id: "list" | "categories" | "requests" | "myRequests" | "suppliers";
    label: string;
    icon: React.ElementType;
    visible?: boolean;
  }[] = [
    { id: "list", label: "سجل الأصول", icon: Monitor },
    { id: "categories", label: "التصنيفات", icon: Tag },
    { id: "suppliers", label: "الموردون", icon: Users },
    { id: "requests", label: "طلبات العهدة", icon: ClipboardList, visible: isHR },
    { id: "myRequests", label: "طلباتي", icon: ClipboardList, visible: !isHR },
  ];

  return (
    <div className="space-y-4 w-full max-w-full" dir="rtl">
      {/* Polaris Page Header */}
      <ShopifyPageHeader
        title="إدارة العهد والأصول الرأسمالية"
        subtitle="تتبع أصول ومعدات الشركة، العهد المسلمة للموظفين، وحالات الصيانة والطلبات"
        badges={[
          { label: "إدارة الأصول والعهد", variant: "default" },
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
              onClick={onRefresh}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              تحديث
            </Button>
            <Button
              size="sm"
              onClick={onOpenAddModal}
              className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground font-medium shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              إضافة أصل جديد
            </Button>
          </div>
        }
      />

      {/* KPI Stats Overview */}
      {showStats && (
        <div className="[&>div]:bg-card [&>div]:border-border/70 [&>div]:rounded-2xl">
          <AssetStats refreshTrigger={refreshTrigger} />
        </div>
      )}

      {/* Main Single-Surface Polaris Card Chassis */}
      <Card className="rounded-2xl border border-border/70 bg-card shadow-xs overflow-hidden">
        {/* Segmented Navigation Tabs */}
        <div className="border-b border-border/70 bg-muted/20 px-3 pt-2">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
            {tabs
              .filter((t) => t.visible !== false)
              .map((tab) => {
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
                  </button>
                );
              })}
          </div>
        </div>

        {/* Tab Content Body */}
        <CardContent className="p-4 sm:p-6 [&>div]:border-0 [&>div]:shadow-none">
          {activeTab === "list" && <AssetList refreshTrigger={refreshTrigger} />}
          {activeTab === "categories" && <AssetCategories />}
          {activeTab === "suppliers" && <AssetSuppliers />}
          {activeTab === "requests" && isHR && <AssetRequests />}
          {activeTab === "myRequests" && !isHR && <MyAssetRequests />}
        </CardContent>
      </Card>
    </div>
  );
};
