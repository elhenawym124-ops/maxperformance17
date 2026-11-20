import React from "react";

export const parseTags = (tags: any): string[] => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const getStatusBadge = (
  status: string,
  statusOptions: { value: string; label: string; color: string }[],
) => {
  const statusOption = statusOptions.find((option) => option.value === status);
  if (!statusOption) return null;

  const colorClasses: Record<string, string> = {
    yellow: "bg-yellow-100 text-warning",
    green: "bg-green-100 text-success",
    gray: "bg-gray-100 text-foreground",
    purple: "bg-purple-100 text-primary",
    red: "bg-red-100 text-destructive",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colorClasses[statusOption.color] || "bg-gray-100 text-foreground"
      }`}
    >
      {statusOption.label}
    </span>
  );
};

export const getRatingBadge = (rating: string | undefined, deliveryRate?: number | null) => {
  if (!rating || rating === "UNKNOWN") return null;
  const r = rating.toLowerCase();
  switch (r) {
    case "excellent":
      return (
        <span className="ms-2 text-xs bg-success text-success dark:bg-success/40 dark:text-success px-2 py-0.5 rounded-full ring-1 ring-success/20 font-medium inline-flex items-center gap-1">
          <span>عميل ممتاز</span>
          {deliveryRate !== undefined && deliveryRate !== null && deliveryRate > 0 && (
            <span className="opacity-80 text-[10px] font-mono tabular-nums">({Math.round(deliveryRate)}%)</span>
          )}
        </span>
      );
    case "good":
      return (
        <span className="ms-2 text-xs bg-info text-info dark:bg-info/40 dark:text-info px-2 py-0.5 rounded-full ring-1 ring-info/20 font-medium inline-flex items-center gap-1">
          <span>عميل جيد</span>
          {deliveryRate !== undefined && deliveryRate !== null && deliveryRate > 0 && (
            <span className="opacity-80 text-[10px] font-mono tabular-nums">({Math.round(deliveryRate)}%)</span>
          )}
        </span>
      );
    case "average":
      return (
        <span className="ms-2 text-xs bg-warning text-warning dark:bg-warning/40 dark:text-warning px-2 py-0.5 rounded-full ring-1 ring-warning/20 font-medium inline-flex items-center gap-1">
          <span>عميل متوسط</span>
          {deliveryRate !== undefined && deliveryRate !== null && deliveryRate > 0 && (
            <span className="opacity-80 text-[10px] font-mono tabular-nums">({Math.round(deliveryRate)}%)</span>
          )}
        </span>
      );
    case "poor":
    case "bad":
      return (
        <span className="ms-2 text-xs bg-destructive text-destructive dark:bg-destructive/40 dark:text-destructive px-2 py-0.5 rounded-full ring-1 ring-destructive/20 font-medium inline-flex items-center gap-1">
          <span>عميل ضعيف</span>
          {deliveryRate !== undefined && deliveryRate !== null && (
            <span className="opacity-80 text-[10px] font-mono tabular-nums">({Math.round(deliveryRate)}%)</span>
          )}
        </span>
      );
    default:
      return null;
  }
};

export const getAutoDiscountBadge = (status: string | null | undefined) => {
  if (!status) return null;
  if (status === "AVAILABLE") {
    return (
      <span
        className="me-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success text-success dark:bg-success/30 dark:text-success"
        title="عند العميل كوبون خصم فعّال على أوردره الجاي"
      >
        خصم متاح
      </span>
    );
  }
  if (status === "PRE_ACTIVATION") {
    return (
      <span
        className="me-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground dark:bg-muted dark:text-muted-foreground"
        title="طلب قبل تفعيل نظام الولاء — الخصم التلقائي مش بيطبق عليه"
      >
        قبل تفعيل النظام
      </span>
    );
  }
  return null;
};

export const getTierBadge = (
  tier: { name?: string; nameAr?: string; color?: string } | null | undefined,
) => {
  if (!tier) return null;
  const label = tier.nameAr || tier.name || "عميل";
  const color = tier.color || "#6366f1";
  return (
    <span
      className="me-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: color + "1A", color, border: `1px solid ${color}40` }}
      title={`مستوى الولاء: ${label}`}
    >
      {label}
    </span>
  );
};
