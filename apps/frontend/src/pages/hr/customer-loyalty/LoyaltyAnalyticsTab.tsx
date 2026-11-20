import React from "react";
import { TrendingUp, Star, Target, Award, DollarSign } from "lucide-react";
import type { CustomerLoyaltyProgram, WalletStats } from "./types";
import { getProgramIcon } from "./helpers";

interface LoyaltyAnalyticsTabProps {
  programs: CustomerLoyaltyProgram[];
  walletStats: WalletStats | null;
}

export const LoyaltyAnalyticsTab: React.FC<LoyaltyAnalyticsTabProps> = ({
  programs,
  walletStats,
}) => {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gray-50 dark:bg-muted rounded-xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-success" />
            <span className="text-xs font-medium text-muted-foreground">
              معدل النمو
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground font-mono tabular-nums">
            +24%
          </p>
          <p className="text-xs text-success mt-1">من الشهر الماضي</p>
        </div>

        <div className="bg-gray-50 dark:bg-muted rounded-xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-warning fill-warning" />
            <span className="text-xs font-medium text-muted-foreground">
              متوسط النقاط
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground font-mono tabular-nums">
            1,250
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            لكل عميل
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-muted rounded-xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              معدل الاستبدال
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground font-mono tabular-nums">
            68%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            من النقاط المكتسبة
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-muted rounded-xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              قيمة المكافآت
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground font-mono tabular-nums">
            45,200 ج.م
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            هذا الشهر
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-muted rounded-xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              إجمالي الكاش باك
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground font-mono tabular-nums">
            {walletStats?.totalCashback
              ? walletStats.totalCashback.toLocaleString()
              : "0"}{" "}
            ج.م
          </p>
          <p className="text-xs text-primary mt-1">مدفوعات فعلية</p>
        </div>
      </div>

      {/* Program Performance Breakdown */}
      <div className="bg-gray-50 dark:bg-muted rounded-xl p-6 border border-border shadow-sm">
        <h3 className="text-lg font-bold text-foreground mb-4">
          أداء البرامج
        </h3>
        {programs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            لا توجد بيانات برامج لعرضها حالياً.
          </p>
        ) : (
          <div className="space-y-3">
            {programs.map((program) => (
              <div
                key={program.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card rounded-lg border border-border dark:border-border gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary">
                    {getProgramIcon(program.type)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {program.nameAr || program.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono tabular-nums">
                      {program.customersCount} عميل مشترك
                    </p>
                  </div>
                </div>
                <div className="text-right sm:text-left">
                  <p className="font-semibold text-foreground text-sm font-mono tabular-nums">
                    {program.totalPointsIssued.toLocaleString()} نقطة صادرة
                  </p>
                  <p className="text-xs text-muted-foreground font-mono tabular-nums">
                    {program.totalPointsRedeemed.toLocaleString()} مستبدلة
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
