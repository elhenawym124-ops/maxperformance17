import React from "react";
import { MapPin } from "lucide-react";
import { type CustomerLoyaltyTier, EGYPT_GOVERNORATES } from "./types";
import { TierCard } from "./TierCard";

interface TierGridProps {
  tiers: CustomerLoyaltyTier[];
  selectedGovFilter: string;
  setSelectedGovFilter: (filter: string) => void;
  onEdit: (tier: CustomerLoyaltyTier) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export const TierGrid: React.FC<TierGridProps> = ({
  tiers,
  selectedGovFilter,
  setSelectedGovFilter,
  onEdit,
  onDelete,
}) => {
  const displayedTiers = tiers.filter((t) => {
    if (selectedGovFilter === "ALL") return true;
    if (selectedGovFilter === "GLOBAL")
      return !t.targetGovernorates || t.targetGovernorates.length === 0;
    return (
      Array.isArray(t.targetGovernorates) &&
      t.targetGovernorates.includes(selectedGovFilter)
    );
  });

  return (
    <div className="space-y-6">
      {/* 🌍 شريط تصفية المستويات حسب المحافظات */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border dark:border-border shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground dark:text-muted-foreground">
          <MapPin className="w-4 h-4 text-primary dark:text-primary" />
          <span>تصفية المستويات حسب النطاق الجغرافي:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedGovFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedGovFilter === "ALL"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-muted text-foreground hover:bg-muted dark:hover:bg-muted"
            }`}
          >
            الكل ({tiers.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedGovFilter("GLOBAL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedGovFilter === "GLOBAL"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-muted text-foreground hover:bg-muted dark:hover:bg-muted"
            }`}
          >
            🌐 عام لكافة المحافظات (
            {
              tiers.filter(
                (t) =>
                  !t.targetGovernorates || t.targetGovernorates.length === 0
              ).length
            }
            )
          </button>
          <select
            value={
              selectedGovFilter === "ALL" || selectedGovFilter === "GLOBAL"
                ? ""
                : selectedGovFilter
            }
            onChange={(e) => setSelectedGovFilter(e.target.value || "ALL")}
            className="px-3 py-1.5 rounded-lg border border-border dark:border-border bg-white dark:bg-muted text-xs font-medium text-foreground dark:text-muted-foreground"
          >
            <option value="">اختر محافظة معينة...</option>
            {EGYPT_GOVERNORATES.map((gov) => {
              const count = tiers.filter(
                (t) =>
                  t.targetGovernorates && t.targetGovernorates.includes(gov)
              ).length;
              return (
                <option key={gov} value={gov}>
                  {gov} {count > 0 ? `(${count})` : ""}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {displayedTiers.length === 0 ? (
        <div className="text-center py-10 bg-card rounded-xl border border-border dark:border-border">
          <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">
            لا توجد مستويات مطابقة لهذا النطاق الجغرافي
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedTiers.map((tier) => (
            <TierCard
              key={tier.id}
              tier={tier}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
