import React from "react";
import { Award, Plus, RotateCcw } from "lucide-react";
import { ShopifyPageHeader } from "@/components/layout/ShopifyPageHeader";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import {
  RewardsListStatsAndFilters,
  RewardsListTable,
} from "./list";
import type { RewardRecord, RewardStatistics, RewardFilters, PaginationState } from "./list/types";

interface PolarisRewardsViewProps {
  records: RewardRecord[];
  statistics: RewardStatistics | null;
  filters: RewardFilters;
  setFilters: React.Dispatch<React.SetStateAction<RewardFilters>>;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  resetFilters: () => void;
  userRole?: string;
  deleting: boolean;
  pagination: PaginationState;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
  onNavigate: (path: string) => void;
  onDeleteClick: (record: RewardRecord) => void;
  onStatusUpdate: (id: string, status: string) => void;
  onRefresh: () => void;
}

export const PolarisRewardsView: React.FC<PolarisRewardsViewProps> = ({
  records,
  statistics,
  filters,
  setFilters,
  showFilters,
  setShowFilters,
  resetFilters,
  userRole,
  deleting,
  pagination,
  setPagination,
  onNavigate,
  onDeleteClick,
  onStatusUpdate,
  onRefresh,
}) => {
  const pendingCount = statistics?.pendingCount || 0;
  const totalAmount = statistics?.totalAmount ? statistics.totalAmount.toLocaleString() : "0";

  return (
    <div className="space-y-4 w-full max-w-full" dir="rtl">
      {/* Polaris Page Header */}
      <ShopifyPageHeader
        title="المكافآت والحوافز المالية"
        subtitle="إدارة الحوافز الشهرية، مكافآت التميز، وبوانص الأداء المسندة لفرق العمل والموظفين"
        badges={[
          { label: `${statistics?.totalRecords || records.length} مكافأة مسجلة`, variant: "default" },
          { label: `${totalAmount} ج.م إجمالي المنح`, variant: "secondary" },
          ...(pendingCount > 0
            ? [{ label: `${pendingCount} بانتظار الاعتماد`, variant: "destructive" as const }]
            : []),
        ]}
        actions={
          <div className="flex items-center gap-2">
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
              onClick={() => onNavigate("/hr/rewards/create")}
              className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground font-medium shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              إضافة مكافأة جديدة
            </Button>
          </div>
        }
      />

      {/* Main Single-Surface Polaris Card Chassis */}
      <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
        <CardContent className="p-4 sm:p-6 space-y-4 [&>div.rounded-xl]:border-0 [&>div.rounded-xl]:shadow-none [&>div.rounded-xl]:p-0">
          {/* Statistics & Filters */}
          <RewardsListStatsAndFilters
            statistics={statistics}
            filters={filters}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            onResetFilters={resetFilters}
            onUpdateFilters={setFilters}
          />

          {/* Records Table */}
          <RewardsListTable
            records={records}
            userRole={userRole}
            deleting={deleting}
            pagination={pagination}
            onPageChange={(nextPage) =>
              setPagination((prev) => ({ ...prev, page: nextPage }))
            }
            onNavigate={onNavigate}
            onDeleteClick={onDeleteClick}
            onStatusUpdate={onStatusUpdate}
          />
        </CardContent>
      </Card>
    </div>
  );
};
