import React from "react";
import {
  ShoppingBag,
  Zap,
  Store,
  Route,
  Package,
  Boxes,
  BarChart3,
  MessageSquare,
  Megaphone,
  Shield,
  Truck,
  Database,
  Wrench,
  Layers,
  Wallet,
  Heart,
  Briefcase,
  Calendar,
  Headphones,
  Settings2,
  Tags,
  Image as ImageIcon,
  CreditCard,
  Building2,
  DollarSign,
  Users,
} from "lucide-react";
import type { MarketplaceManagementItem } from "../types/marketplaceAdminTypes";

export const categoryLabels: { [key: string]: string } = {
  ALL: "جميع الفئات",
  ECOMMERCE: "التجارة الإلكترونية",
  AI: "الأتمتة",
  CRM: "إدارة العملاء",
  COMMUNICATION: "التواصل",
  ANALYTICS: "التحليلات",
  MARKETING: "التسويق",
  HR: "الموارد البشرية",
  FINANCE: "المالية",
  INTEGRATION: "التكاملات",
  PRODUCTIVITY: "الإنتاجية",
  GAMIFICATION: "التحفيز",
  ORDER_OPS: "إدارة الطلبات",
  MEDICAL: "الطبية",
  WAREHOUSE: "المخازن",
  PAYMENTS: "المدفوعات",
  WHOLESALE: "الجملة",
  PROCUREMENT: "المشتريات",
  ACCOUNTING: "المحاسبة",
  SHIPPING: "الشحن",
};

export const getCategoryColor = (category: string): string => {
  const colors: { [key: string]: string } = {
    ECOMMERCE: "#3b82f6",
    AI: "#8b5cf6",
    CRM: "#10b981",
    COMMUNICATION: "#f59e0b",
    ANALYTICS: "#ef4444",
    MARKETING: "#ec4899",
    HR: "#06b6d4",
    FINANCE: "#84cc16",
    INTEGRATION: "#6366f1",
    PRODUCTIVITY: "#14b8a6",
    GAMIFICATION: "#f97316",
    ORDER_OPS: "#f97316",
    MEDICAL: "#ec4899",
    WAREHOUSE: "#a16207",
    PAYMENTS: "#10b981",
    WHOLESALE: "#6366f1",
    PROCUREMENT: "#0ea5e9",
    ACCOUNTING: "#84cc16",
    SHIPPING: "#0891b2",
  };
  return colors[category] || "#6b7280";
};

export const getAppGradient = (category?: string): string => {
  const gradients: { [key: string]: string } = {
    ECOMMERCE: "bg-gradient-to-br from-blue-500 to-primary",
    AI: "bg-gradient-to-br from-primary to-primary",
    CRM: "bg-gradient-to-br from-success to-success",
    COMMUNICATION: "bg-gradient-to-br from-warning to-warning",
    ANALYTICS: "bg-gradient-to-br from-destructive to-destructive",
    MARKETING: "bg-gradient-to-br from-primary to-destructive",
    HR: "bg-gradient-to-br from-info to-info",
    FINANCE: "bg-gradient-to-br from-success to-success",
    INTEGRATION: "bg-gradient-to-br from-primary to-blue-600",
    PRODUCTIVITY: "bg-gradient-to-br from-success to-success",
    GAMIFICATION: "bg-gradient-to-br from-warning to-warning",
    ORDER_OPS: "bg-gradient-to-br from-warning to-warning",
    MEDICAL: "bg-gradient-to-br from-primary to-primary",
    WAREHOUSE: "bg-gradient-to-br from-warning to-warning",
    PAYMENTS: "bg-gradient-to-br from-success to-success",
    WHOLESALE: "bg-gradient-to-br from-primary to-primary",
    PROCUREMENT: "bg-gradient-to-br from-info to-blue-600",
    ACCOUNTING: "bg-gradient-to-br from-success to-success",
    SHIPPING: "bg-gradient-to-br from-info to-info",
  };
  return gradients[category || ""] || "bg-gradient-to-br from-slate-500 to-slate-700";
};

export const getAppIcon = (app: MarketplaceManagementItem): React.ReactNode => {
  if (app.logo) {
    return <img src={app.logo} alt="" className="h-full w-full object-cover" />;
  }

  const knownIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    users: Users,
    sparkles: Zap,
    store: Store,
    route: Route,
    "shopping-cart": ShoppingBag,
    package: Package,
    box: Boxes,
    chart: BarChart3,
    message: MessageSquare,
    megaphone: Megaphone,
    shield: Shield,
    truck: Truck,
    database: Database,
    wrench: Wrench,
    layers: Layers,
    wallet: Wallet,
    heart: Heart,
    briefcase: Briefcase,
    calendar: Calendar,
    headphones: Headphones,
    settings: Settings2,
    tag: Tags,
    image: ImageIcon,
    credit: CreditCard,
    building: Building2,
  };

  const iconName = (app.icon || "").toLowerCase().trim();
  if (iconName && knownIcons[iconName]) {
    const Icon = knownIcons[iconName];
    return <Icon className="h-6 w-6" />;
  }

  const categoryIcon: Record<string, React.ComponentType<{ className?: string }>> = {
    "التجارة الإلكترونية": ShoppingBag,
    ECOMMERCE: ShoppingBag,
    التحليلات: BarChart3,
    ANALYTICS: BarChart3,
    التواصل: MessageSquare,
    COMMUNICATION: MessageSquare,
    التسويق: Megaphone,
    MARKETING: Megaphone,
    "إدارة العملاء": Users,
    CRM: Users,
    "إدارة الطلبات": Package,
    ORDER_OPS: Package,
    المخازن: Boxes,
    WAREHOUSE: Boxes,
    المدفوعات: CreditCard,
    PAYMENTS: CreditCard,
    "الإنتاجية": Calendar,
    PRODUCTIVITY: Calendar,
    الجملة: Briefcase,
    WHOLESALE: Briefcase,
    المشتريات: ShoppingBag,
    PROCUREMENT: ShoppingBag,
    المحاسبة: Wallet,
    ACCOUNTING: Wallet,
    الشحن: Truck,
    SHIPPING: Truck,
    التحفيز: Heart,
    GAMIFICATION: Heart,
    المالية: DollarSign,
    FINANCE: DollarSign,
    "الموارد البشرية": Users,
    HR: Users,
    الأتمتة: Zap,
    AI: Zap,
    التكاملات: Wrench,
    INTEGRATION: Wrench,
    الطبية: Shield,
    MEDICAL: Shield,
    CONTENT: ImageIcon,
  };

  const CatIcon = categoryIcon[(app.category || "").trim()];
  if (CatIcon) return <CatIcon className="h-6 w-6" />;

  return <span className="text-lg font-black">{(app.name || "؟").charAt(0)}</span>;
};
