import React from "react";
import {
  Award,
  CheckCircle,
  Clock,
  DollarSign,
  Filter,
  Search,
} from "lucide-react";
import { RewardListStatistics, RewardListFilters } from "./types";

interface RewardsListStatsAndFiltersProps {
  statistics: RewardListStatistics | null;
  filters: RewardListFilters;
  showFilters: boolean;
  onToggleFilters: () => void;
  onResetFilters: () => void;
  onUpdateFilters: React.Dispatch<React.SetStateAction<RewardListFilters>>;
}

export const RewardsListStatsAndFilters: React.FC<
  RewardsListStatsAndFiltersProps
> = ({
  statistics,
  filters,
  showFilters,
  onToggleFilters,
  onResetFilters,
  onUpdateFilters,
}) => {
  return (
    <>
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground dark:text-muted-foreground">
                  إجمالي المكافآت
                </p>
                <p className="text-2xl font-bold text-foreground font-mono tabular-nums">
                  {statistics.total}
                </p>
              </div>
              <Award className="w-10 h-10 text-primary" />
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground dark:text-muted-foreground">
                  القيمة الإجمالية
                </p>
                <p className="text-2xl font-bold text-foreground">
                  <span className="font-mono tabular-nums">
                    {statistics.totalValue.toLocaleString()}
                  </span>{" "}
                  ج.م
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-success" />
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground dark:text-muted-foreground">
                  معتمد
                </p>
                <p className="text-2xl font-bold text-success font-mono tabular-nums">
                  {statistics.byStatus.find((s) => s.status === "APPROVED")
                    ?.count || 0}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground dark:text-muted-foreground">
                  قيد الانتظار
                </p>
                <p className="text-2xl font-bold text-warning font-mono tabular-nums">
                  {statistics.byStatus.find((s) => s.status === "PENDING")
                    ?.count || 0}
                </p>
              </div>
              <Clock className="w-10 h-10 text-warning" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onToggleFilters}
            className="flex items-center gap-2 text-foreground hover:text-foreground dark:hover:text-white"
          >
            <Filter className="w-5 h-5" />
            الفلاتر
          </button>
          <button
            onClick={onResetFilters}
            className="text-sm text-primary hover:text-primary"
          >
            إعادة تعيين
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                بحث
              </label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) =>
                    onUpdateFilters((prev) => ({
                      ...prev,
                      search: e.target.value,
                    }))
                  }
                  placeholder="ابحث..."
                  className="w-full pe-10 ps-3 py-2 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                الحالة
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  onUpdateFilters((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="">الكل</option>
                <option value="PENDING">قيد الانتظار</option>
                <option value="APPROVED">معتمد</option>
                <option value="APPLIED">مطبق</option>
                <option value="REJECTED">مرفوض</option>
                <option value="VOIDED">ملغي</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                التصنيف
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  onUpdateFilters((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="">الكل</option>
                <option value="ATTENDANCE">حضور</option>
                <option value="PERFORMANCE">أداء</option>
                <option value="ACHIEVEMENT">إنجاز</option>
                <option value="SEASONAL">موسمية</option>
                <option value="TEAM_BASED">فريق</option>
                <option value="COMPANY_WIDE">عامة</option>
                <option value="OTHER">أخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                السنة
              </label>
              <select
                value={filters.year}
                onChange={(e) =>
                  onUpdateFilters((prev) => ({ ...prev, year: e.target.value }))
                }
                className="w-full px-3 py-2 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary font-mono tabular-nums"
              >
                {[2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
