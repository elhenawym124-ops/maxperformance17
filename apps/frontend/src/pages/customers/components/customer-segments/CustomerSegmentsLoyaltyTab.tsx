import React from "react";
import {
  Users, Star, TrendingUp, AlertTriangle, Crown, Medal, Gem, Trophy,
} from "lucide-react";
import {
  CustomerSegmentsStats,
  LoyaltyRecord,
  LoyaltyTier,
  toNumber,
} from "./types";

interface CustomerSegmentsLoyaltyTabProps {
  stats: CustomerSegmentsStats;
  loyaltyTiers: LoyaltyTier[];
  loyaltyRecords: LoyaltyRecord[];
}

export const CustomerSegmentsLoyaltyTab: React.FC<CustomerSegmentsLoyaltyTabProps> = ({
  stats,
  loyaltyTiers,
  loyaltyRecords,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border dark:border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-primary dark:bg-primary/30">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">أعضاء الولاء النشطون</p>
          <p className="text-2xl font-bold text-foreground font-mono tabular-nums">
            {stats.loyaltyMembers}
          </p>
        </div>
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border dark:border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-warning dark:bg-warning/30">
              <Star className="h-5 w-5 text-warning" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">إجمالي النقاط</p>
          <p className="text-2xl font-bold text-foreground font-mono tabular-nums">
            {stats.totalPoints.toLocaleString("ar-EG")}
          </p>
        </div>
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border dark:border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-success dark:bg-success/30">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">المستويات المحددة</p>
          <p className="text-2xl font-bold text-foreground font-mono tabular-nums">
            {loyaltyTiers.length}
          </p>
        </div>
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border dark:border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-destructive dark:bg-destructive/30">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">مهددون بانتهاء الرصيد</p>
          <p className="text-2xl font-bold text-foreground font-mono tabular-nums">
            {stats.atRiskCount}
          </p>
        </div>
      </div>

      {/* Loyalty Tiers cards */}
      {loyaltyTiers.length > 0 && (
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border dark:border-border">
          <h3 className="text-lg font-bold text-foreground mb-4">مستويات الولاء</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loyaltyTiers.map((tier) => {
              const TierIcon =
                tier.icon === "crown"
                  ? Crown
                  : tier.icon === "medal"
                  ? Medal
                  : tier.icon === "gem"
                  ? Gem
                  : tier.icon === "trophy"
                  ? Trophy
                  : Crown;
              const memberCount = loyaltyRecords.filter((r) => r.tier?.id === tier.id).length;
              const activeTiersCount = Math.max(loyaltyRecords.filter((r) => r.tier?.id).length, 1);
              return (
                <div
                  key={tier.id}
                  className="border border-border dark:border-border rounded-xl p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="p-2.5 rounded-lg"
                      style={{ backgroundColor: tier.color + "20", color: tier.color }}
                    >
                      <TierIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{tier.nameAr || tier.name}</p>
                      <p className="text-xs text-muted-foreground font-mono tabular-nums">{memberCount} عضو</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-2 font-mono tabular-nums">
                    <span>من {tier.minPoints?.toLocaleString() || 0} نقطة</span>
                    {tier.maxPoints && <span>إلى {tier.maxPoints.toLocaleString()} نقطة</span>}
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(memberCount / activeTiersCount) * 100}%`,
                        backgroundColor: tier.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loyalty Members */}
      <div className="bg-card rounded-xl p-5 shadow-sm border border-border dark:border-border">
        <h3 className="text-lg font-bold text-foreground mb-4">أعضاء الولاء</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border dark:divide-border">
            <thead className="bg-gray-50 dark:bg-muted">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">العميل</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">البرنامج</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">المستوى</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">الرصيد</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">الحالة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">آخر نشاط</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border">
              {loyaltyRecords
                .sort((a, b) => toNumber(b.currentPoints) - toNumber(a.currentPoints))
                .slice(0, 50)
                .map((r) => (
                  <tr key={r.id} className="hover:bg-muted/50/30">
                    <td className="py-3 px-4 text-sm text-foreground">
                      {r.customer.firstName} {r.customer.lastName}
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground">
                      {r.program.nameAr || r.program.name}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          r.tier
                            ? "bg-purple-100 text-primary dark:bg-primary/30 dark:text-primary"
                            : "text-gray-400"
                        }`}
                      >
                        {r.tier?.nameAr || r.tier?.name || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-foreground font-mono tabular-nums" dir="ltr">
                      {toNumber(r.currentPoints).toLocaleString("ar-EG")}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          r.status === "ACTIVE"
                            ? "bg-green-100 text-success dark:bg-success/30 dark:text-success"
                            : r.status === "INACTIVE"
                            ? "bg-gray-100 text-foreground dark:bg-muted dark:text-muted-foreground"
                            : "bg-red-100 text-destructive dark:bg-destructive/30 dark:text-destructive"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground font-mono tabular-nums">
                      {new Date(r.lastActivity).toLocaleDateString("ar-EG")}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
