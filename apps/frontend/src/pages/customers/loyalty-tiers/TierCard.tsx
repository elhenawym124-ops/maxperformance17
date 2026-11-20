import React from "react";
import {
  Crown,
  Medal,
  Gem,
  Trophy,
  Award,
  Trash2,
  Edit,
  MapPin,
  Globe,
  SlidersHorizontal,
  Zap,
  Truck,
  Users,
} from "lucide-react";
import { type CustomerLoyaltyTier } from "./types";

interface TierCardProps {
  tier: CustomerLoyaltyTier;
  onEdit: (tier: CustomerLoyaltyTier) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export const getTierIcon = (iconName: string) => {
  switch (iconName) {
    case "crown":
      return <Crown className="w-6 h-6" />;
    case "medal":
      return <Medal className="w-6 h-6" />;
    case "gem":
      return <Gem className="w-6 h-6" />;
    case "trophy":
      return <Trophy className="w-6 h-6" />;
    default:
      return <Award className="w-6 h-6" />;
  }
};

export const TierCard: React.FC<TierCardProps> = ({ tier, onEdit, onDelete }) => {
  return (
    <div className="relative group bg-card rounded-xl border border-border dark:border-border p-6 hover:shadow-lg transition-all duration-200">
      <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        <button
          onClick={(e) => onDelete(tier.id, e)}
          className="p-1.5 text-muted-foreground hover:text-destructive bg-card rounded-md shadow-sm border border-border transition-colors"
          title="حذف المستوى"
          aria-label="حذف المستوى"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* 📍 بادج النطاق الجغرافي والشروط */}
      <div className="flex items-center justify-between gap-2 mb-4">
        {tier.targetGovernorates && tier.targetGovernorates.length > 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-primary/10 text-primary dark:bg-primary/40 dark:text-primary border border-primary dark:border-primary">
            <MapPin className="w-3 h-3 text-primary" />
            {tier.targetGovernorates.join("، ")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-muted text-foreground dark:bg-muted dark:text-muted-foreground border border-border">
            <Globe className="w-3 h-3 text-muted-foreground" />
            جميع المحافظات
          </span>
        )}
        {tier.conditions && (tier.conditions.minOrders || tier.conditions.minSpent) ? (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning dark:bg-warning/30 dark:text-warning dark:border-warning">
            شرط مركب
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div
          className="p-4 rounded-xl shadow-sm"
          style={{
            backgroundColor: tier.color + "20",
            color: tier.color,
          }}
        >
          {getTierIcon(tier.icon)}
        </div>
        <div>
          <h3 className="font-bold text-xl text-foreground">
            {tier.nameAr || tier.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 tabular-nums">
            <Users className="w-3.5 h-3.5" />
            <span>{tier.customersCount} عميل</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-6 bg-muted dark:bg-muted p-3 rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            الحد الأدنى للنقاط:
          </span>
          <span className="font-bold text-foreground tabular-nums">
            {tier.minPoints?.toLocaleString() || 0}
          </span>
        </div>
        {tier.maxPoints ? (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              الحد الأقصى للنقاط:
            </span>
            <span className="font-bold text-foreground tabular-nums">
              {tier.maxPoints.toLocaleString()}
            </span>
          </div>
        ) : null}
      </div>

      {tier.conditions && (tier.conditions.minOrders || tier.conditions.minSpent) ? (
        <div className="mb-4 p-2.5 bg-warning/60 dark:bg-warning/30 border border-warning/80 dark:border-warning/40 rounded-lg text-xs space-y-1 text-warning dark:text-warning">
          <span className="font-bold flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-warning" />
            شروط إضافية للتأهل:
          </span>
          {tier.conditions.minOrders ? (
            <div>
              • حد أدنى: <span className="font-bold tabular-nums">{tier.conditions.minOrders}</span> طلب مكتمل
            </div>
          ) : null}
          {tier.conditions.minSpent ? (
            <div>
              • حد أدنى للإنفاق: <span className="font-bold tabular-nums">{Number(tier.conditions.minSpent).toLocaleString()}</span> ج.م
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          مميزات المستوى:
        </p>
        {Number(tier.discountPercent) > 0 || tier.freeShipping || (tier.benefits && tier.benefits.length > 0) ? (
          <div className="space-y-1.5">
            {Number(tier.discountPercent) > 0 && (
              <div className="flex items-center gap-2 text-xs font-semibold text-success dark:text-success bg-success/10 dark:bg-success/40 px-2.5 py-1.5 rounded-lg border border-success/80 dark:border-success/40">
                <Zap className="w-3.5 h-3.5 text-success dark:text-success flex-shrink-0" />
                <span>خصم <span className="tabular-nums">{tier.discountPercent}</span>% على الطلبات</span>
              </div>
            )}
            {tier.freeShipping && (
              <div className="flex items-center gap-2 text-xs font-semibold text-primary dark:text-primary bg-primary/10 dark:bg-primary/40 px-2.5 py-1.5 rounded-lg border border-primary/80 dark:border-primary/40">
                <Truck className="w-3.5 h-3.5 text-primary dark:text-primary flex-shrink-0" />
                <span>شحن مجاني على كافة الطلبات</span>
              </div>
            )}
            {tier.benefits?.filter((b: string) => !b.includes("شحن مجاني") && !b.includes("خصم")).map((benefit: string, index: number) => (
              <div
                key={index}
                className="flex items-center gap-2 text-xs text-foreground px-1 py-0.5"
              >
                <Zap className="w-3 h-3 text-warning flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            لا توجد مميزات مضافة
          </span>
        )}
      </div>

      <button
        onClick={() => onEdit(tier)}
        className="w-full mt-6 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors flex items-center justify-center gap-2"
      >
        <Edit className="w-4 h-4" />
        تعديل المستوى
      </button>
    </div>
  );
};
