import type { ReactNode } from "react";
import type { ConversionToolEntry } from "../conversionToolMeta";

export type StatusFilter = "all" | "active" | "inactive";

export interface CategoryStyle {
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  label: string;
}

export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  "product-conversion": {
    iconBg: "bg-sky-50 dark:bg-info/40",
    iconColor: "text-sky-600 dark:text-info",
    badgeBg: "bg-sky-50 border-info text-info dark:bg-info/40 dark:border-info dark:text-info",
    label: "صفحة المنتج",
  },
  "offers-bundles": {
    iconBg: "bg-emerald-50 dark:bg-success/40",
    iconColor: "text-emerald-600 dark:text-success",
    badgeBg: "bg-emerald-50 border-success text-success dark:bg-success/40 dark:border-success dark:text-success",
    label: "العروض والحزم",
  },
  "growth-widgets": {
    iconBg: "bg-amber-50 dark:bg-warning/40",
    iconColor: "text-amber-600 dark:text-warning",
    badgeBg: "bg-amber-50 border-warning text-warning dark:bg-warning/40 dark:border-warning dark:text-warning",
    label: "محفزات الشراء",
  },
  "selling-modes": {
    iconBg: "bg-purple-50 dark:bg-primary/40",
    iconColor: "text-purple-600 dark:text-primary",
    badgeBg: "bg-purple-50 border-primary text-primary dark:bg-primary/40 dark:border-primary dark:text-primary",
    label: "أنماط البيع",
  },
  "reviews-social-proof": {
    iconBg: "bg-rose-50 dark:bg-destructive/40",
    iconColor: "text-rose-600 dark:text-destructive",
    badgeBg: "bg-rose-50 border-destructive text-destructive dark:bg-destructive/40 dark:border-destructive dark:text-destructive",
    label: "التقييمات والثقة",
  },
};

export interface CategoryTabItem {
  id: string;
  label: string;
  count: number;
}

export interface ToolCardProps {
  entry: ConversionToolEntry;
  toolLabel: string;
  toolBenefit: string;
  enabled: boolean;
  available: boolean;
  isSaving: boolean;
  onToggle: (nextValue: boolean) => void;
  preview: ReactNode;
}
