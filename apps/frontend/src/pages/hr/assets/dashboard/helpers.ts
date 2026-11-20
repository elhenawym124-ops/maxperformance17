import {
  HomeIcon,
  UserGroupIcon,
  ComputerDesktopIcon,
  ClipboardDocumentListIcon,
  TagIcon,
  PlusIcon,
  DocumentIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import {
  AssetDashboardSection,
  AssetDashboardSectionId,
  AssetReportCardConfig,
} from "./types";

export const ASSET_DASHBOARD_SECTIONS: AssetDashboardSection[] = [
  { id: "overview", title: "نظرة عامة", icon: HomeIcon, color: "indigo" },
  {
    id: "manage",
    title: "إدارة الأصول",
    icon: ComputerDesktopIcon,
    color: "teal",
  },
  { id: "categories", title: "التصنيفات", icon: TagIcon, color: "cyan" },
  {
    id: "suppliers",
    title: "الموردون",
    icon: UserGroupIcon,
    color: "emerald",
  },
  {
    id: "custody",
    title: "العهد النشطة",
    icon: ClipboardDocumentListIcon,
    color: "amber",
  },
  {
    id: "documents",
    title: "الوثائق والمرفقات",
    icon: DocumentIcon,
    color: "pink",
  },
  { id: "requests", title: "طلبات العهدة", icon: PlusIcon, color: "emerald" },
  {
    id: "maintenance",
    title: "الصيانة والضمان",
    icon: WrenchScrewdriverIcon,
    color: "rose",
  },
  {
    id: "receipts",
    title: "النماذج الرسمية",
    icon: DocumentTextIcon,
    color: "violet",
  },
  { id: "reports", title: "التقارير", icon: ChartBarIcon, color: "blue" },
];

export const ASSET_REPORT_CARDS: AssetReportCardConfig[] = [
  {
    reportType: "all-assets",
    title: "كل الأصول",
    description: "تقرير شامل بكل الأصول مع تفاصيلها الكاملة",
    icon: DocumentTextIcon,
    borderClass: "border-blue-100 dark:border-border",
    iconWrapperClass: "bg-blue-100 dark:bg-blue-900/30",
    iconClass: "text-blue-600 dark:text-blue-400",
  },
  {
    reportType: "current-custody",
    title: "العهد الحالية",
    description: "العهد الحالية لكل موظف مع التفاصيل",
    icon: UserGroupIcon,
    borderClass: "border-amber-100 dark:border-border",
    iconWrapperClass: "bg-amber-100 dark:bg-warning/30",
    iconClass: "text-amber-600 dark:text-warning",
  },
  {
    reportType: "available-assets",
    title: "الأصول المتاحة",
    description: "قائمة بالأصول المتاحة للتوزيع",
    icon: ComputerDesktopIcon,
    borderClass: "border-emerald-100 dark:border-border",
    iconWrapperClass: "bg-emerald-100 dark:bg-success/30",
    iconClass: "text-emerald-600 dark:text-success",
  },
  {
    reportType: "maintenance-assets",
    title: "في الصيانة",
    description: "الأصول الموجودة حالياً في الصيانة",
    icon: WrenchScrewdriverIcon,
    borderClass: "border-orange-100 dark:border-border",
    iconWrapperClass: "bg-orange-100 dark:bg-warning/30",
    iconClass: "text-orange-600 dark:text-warning",
  },
  {
    reportType: "lost-damaged-assets",
    title: "المفقودة/التالفة",
    description: "الأصول المفقودة أو التالفة",
    icon: DocumentIcon,
    borderClass: "border-red-100 dark:border-border",
    iconWrapperClass: "bg-red-100 dark:bg-destructive/30",
    iconClass: "text-red-600 dark:text-destructive",
  },
  {
    reportType: "total-value",
    title: "القيمة الإجمالية",
    description: "تقرير بالقيمة الإجمالية للأصول",
    icon: ChartBarIcon,
    borderClass: "border-purple-100 dark:border-border",
    iconWrapperClass: "bg-purple-100 dark:bg-primary/30",
    iconClass: "text-purple-600 dark:text-primary",
  },
];

export const getAssetSectionTitle = (
  activeSection: AssetDashboardSectionId,
): string =>
  ASSET_DASHBOARD_SECTIONS.find((s) => s.id === activeSection)?.title ||
  "نظرة عامة";

export const getAssetSectionColorClasses = (color: string) => {
  const colorStyles: Record<
    string,
    {
      bg: string;
      text: string;
      icon: string;
      hover: string;
      activeBg: string;
    }
  > = {
    indigo: {
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      icon: "text-violet-300",
      hover: "hover:bg-indigo-50",
      activeBg: "bg-gradient-to-l from-primary to-primary",
    },
    teal: {
      bg: "bg-teal-50",
      text: "text-teal-700",
      icon: "text-violet-300",
      hover: "hover:bg-teal-50",
      activeBg: "bg-gradient-to-l from-primary to-primary",
    },
    cyan: {
      bg: "bg-cyan-50",
      text: "text-cyan-700",
      icon: "text-purple-300",
      hover: "hover:bg-cyan-50",
      activeBg: "bg-gradient-to-l from-primary to-primary",
    },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      icon: "text-violet-300",
      hover: "hover:bg-emerald-50",
      activeBg: "bg-gradient-to-l from-primary to-primary",
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      icon: "text-fuchsia-300",
      hover: "hover:bg-amber-50",
      activeBg: "bg-gradient-to-l from-primary to-primary",
    },
    pink: {
      bg: "bg-pink-50",
      text: "text-pink-700",
      icon: "text-pink-300",
      hover: "hover:bg-pink-50",
      activeBg: "bg-gradient-to-l from-primary to-primary",
    },
    rose: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      icon: "text-fuchsia-300",
      hover: "hover:bg-rose-50",
      activeBg: "bg-gradient-to-l from-primary to-primary",
    },
    violet: {
      bg: "bg-violet-50",
      text: "text-violet-700",
      icon: "text-violet-300",
      hover: "hover:bg-violet-50",
      activeBg: "bg-gradient-to-l from-primary to-primary",
    },
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      icon: "text-indigo-300",
      hover: "hover:bg-blue-50",
      activeBg: "bg-gradient-to-l from-primary to-primary",
    },
  };
  return colorStyles[color] || colorStyles.indigo;
};
