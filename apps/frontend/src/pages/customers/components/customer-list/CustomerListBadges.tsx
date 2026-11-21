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

  const dotClasses: Record<string, string> = {
    yellow: "bg-warning",
    green: "bg-success",
    gray: "bg-muted-foreground/50",
    purple: "bg-primary",
    red: "bg-destructive",
  };

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">
      <span className={`h-2 w-2 rounded-full shrink-0 ${dotClasses[statusOption.color] || "bg-muted-foreground/50"}`} />
      {statusOption.label}
    </span>
  );
};

export const getRatingBadge = (rating: string | undefined, deliveryRate?: number | null) => {
  if (!rating || rating === "UNKNOWN") return null;
  const r = rating.toLowerCase();
  const ratingMap: Record<string, { label: string; dot: string }> = {
    excellent: { label: "عميل ممتاز", dot: "bg-success" },
    good: { label: "عميل جيد", dot: "bg-info" },
    average: { label: "عميل متوسط", dot: "bg-warning" },
    poor: { label: "عميل ضعيف", dot: "bg-destructive" },
    bad: { label: "عميل ضعيف", dot: "bg-destructive" },
  };
  const cfg = ratingMap[r];
  if (!cfg) return null;
  return (
    <span className="ms-2 inline-flex items-center gap-1.5 text-xs bg-muted text-foreground px-2 py-0.5 rounded-full font-medium">
      <span className={`h-2 w-2 rounded-full shrink-0 ${cfg.dot}`} />
      <span>{cfg.label}</span>
      {deliveryRate !== undefined && deliveryRate !== null && deliveryRate > 0 && (
        <span className="opacity-80 text-[10px] font-mono tabular-nums">({Math.round(deliveryRate)}%)</span>
      )}
    </span>
  );
};
export const getAutoDiscountBadge = (status: string | null | undefined) => {
  if (!status) return null;
  if (status === "AVAILABLE") {
    return (
      <span
        className="me-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground"
        title="عند العميل كوبون خصم فعّال على أوردره الجاي"
      >
        <span className="h-2 w-2 rounded-full shrink-0 bg-success" />
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
