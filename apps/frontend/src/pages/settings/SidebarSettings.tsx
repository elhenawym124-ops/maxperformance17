import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  RotateCcw,
  Save,
  Check,
  Sparkles,
  BarChart3,
  MessageSquare,
  Archive,
  ShoppingBag,
  Users,
  FileText,
  Box,
  TrendingUp,
  Megaphone,
  Store,
  Grid3x3,
  Bell,
  Building,
  Cog,
  Shield,
  Loader2,
  GraduationCap,
  Sliders,
  Truck,
  Package,
  Landmark,
  Tag,
  Briefcase,
  CheckCircle2,
  Calculator,
  Share2,
} from "lucide-react";
import { apiClient } from "../../services/apiClient";
import { useSidebarSettings } from "../../contexts/SidebarSettingsContext";
import { EducationSettingsTab } from "../admin/education-management";
import { SidebarLayoutPicker } from "./sidebar-settings/SidebarLayoutPicker";

export interface SidebarConfigItem {
  key: string;
  defaultLabelAr: string;
  defaultLabelEn: string;
  labelAr: string;
  labelEn: string;
  order: number;
  visible: boolean;
  locked: boolean;
  iconName: string;
}

const DEFAULT_SIDEBAR_ITEMS: SidebarConfigItem[] = [
  { key: "dashboard", defaultLabelAr: "لوحة التحكم", defaultLabelEn: "Dashboard", labelAr: "لوحة التحكم", labelEn: "Dashboard", order: 0, visible: true, locked: true, iconName: "BarChart3" },
  { key: "inbox", defaultLabelAr: "صندوق المحادثات", defaultLabelEn: "Inbox", labelAr: "صندوق المحادثات", labelEn: "Inbox", order: 1, visible: true, locked: false, iconName: "MessageSquare" },
  { key: "ai-operator", defaultLabelAr: "الذكاء الاصطناعي والإيجنت", defaultLabelEn: "AI Operator", labelAr: "الذكاء الاصطناعي والإيجنت", labelEn: "AI Operator", order: 2, visible: true, locked: false, iconName: "Sparkles" },
  { key: "facebook", defaultLabelAr: "فيسبوك", defaultLabelEn: "Facebook", labelAr: "فيسبوك", labelEn: "Facebook", order: 3, visible: true, locked: false, iconName: "Share2" },
  { key: "instagram", defaultLabelAr: "إنستغرام", defaultLabelEn: "Instagram", labelAr: "إنستغرام", labelEn: "Instagram", order: 4, visible: true, locked: false, iconName: "Share2" },
  { key: "whatsapp", defaultLabelAr: "واتساب", defaultLabelEn: "WhatsApp", labelAr: "واتساب", labelEn: "WhatsApp", order: 5, visible: true, locked: false, iconName: "MessageSquare" },
  { key: "telegram", defaultLabelAr: "تليجرام", defaultLabelEn: "Telegram", labelAr: "تليجرام", labelEn: "Telegram", order: 6, visible: true, locked: false, iconName: "MessageSquare" },
  { key: "orders", defaultLabelAr: "الطلبات", defaultLabelEn: "Orders", labelAr: "الطلبات", labelEn: "Orders", order: 7, visible: true, locked: false, iconName: "Archive" },
  { key: "internal-courier-fleet", defaultLabelAr: "أسطول المناديب", defaultLabelEn: "Internal Courier Fleet", labelAr: "أسطول المناديب", labelEn: "Internal Courier Fleet", order: 8, visible: true, locked: false, iconName: "Truck" },
  { key: "shipping-ops", defaultLabelAr: "عمليات الشحن", defaultLabelEn: "Shipping", labelAr: "عمليات الشحن", labelEn: "Shipping", order: 9, visible: true, locked: false, iconName: "Package" },
  { key: "analytics", defaultLabelAr: "التحليلات والتقارير", defaultLabelEn: "Analytics", labelAr: "التحليلات والتقارير", labelEn: "Analytics", order: 10, visible: true, locked: false, iconName: "TrendingUp" },
  { key: "products", defaultLabelAr: "المنتجات", defaultLabelEn: "Products", labelAr: "المنتجات", labelEn: "Products", order: 11, visible: true, locked: false, iconName: "ShoppingBag" },
  { key: "inventory", defaultLabelAr: "المخزون", defaultLabelEn: "Inventory", labelAr: "المخزون", labelEn: "Inventory", order: 12, visible: true, locked: false, iconName: "Box" },
  { key: "blog", defaultLabelAr: "المدونة والـ SEO", defaultLabelEn: "Blog & SEO", labelAr: "المدونة والـ SEO", labelEn: "Blog & SEO", order: 13, visible: true, locked: false, iconName: "FileText" },
  { key: "storefront", defaultLabelAr: "المتجر والتصميم", defaultLabelEn: "Storefront", labelAr: "المتجر والتصميم", labelEn: "Storefront", order: 14, visible: true, locked: false, iconName: "Store" },
  { key: "marketing", defaultLabelAr: "التسويق والإعلانات", defaultLabelEn: "Marketing", labelAr: "التسويق والإعلانات", labelEn: "Marketing", order: 15, visible: true, locked: false, iconName: "Megaphone" },
  { key: "competitors", defaultLabelAr: "تحليل المنافسين", defaultLabelEn: "Competitors", labelAr: "تحليل المنافسين", labelEn: "Competitors", order: 16, visible: true, locked: false, iconName: "TrendingUp" },
  { key: "customers", defaultLabelAr: "العملاء", defaultLabelEn: "Customers", labelAr: "العملاء", labelEn: "Customers", order: 17, visible: true, locked: false, iconName: "Users" },
  { key: "procurement", defaultLabelAr: "المشتريات", defaultLabelEn: "Procurement", labelAr: "المشتريات", labelEn: "Procurement", order: 18, visible: true, locked: false, iconName: "FileText" },
  { key: "treasury-expenses", defaultLabelAr: "الخزينة والنفقات", defaultLabelEn: "Treasury & Expenses", labelAr: "الخزينة والنفقات", labelEn: "Treasury & Expenses", order: 19, visible: true, locked: false, iconName: "Landmark" },
  { key: "wholesale", defaultLabelAr: "البيع بالجملة", defaultLabelEn: "Wholesale", labelAr: "البيع بالجملة", labelEn: "Wholesale", order: 20, visible: true, locked: false, iconName: "Tag" },
  { key: "affiliate", defaultLabelAr: "التسويق بالعمولة", defaultLabelEn: "Affiliate", labelAr: "التسويق بالعمولة", labelEn: "Affiliate", order: 21, visible: true, locked: false, iconName: "Share2" },
  { key: "hr", defaultLabelAr: "الموارد البشرية", defaultLabelEn: "Human Resources", labelAr: "الموارد البشرية", labelEn: "Human Resources", order: 22, visible: true, locked: false, iconName: "Briefcase" },
  { key: "accounting", defaultLabelAr: "المحاسبة", defaultLabelEn: "Accounting", labelAr: "المحاسبة", labelEn: "Accounting", order: 23, visible: true, locked: false, iconName: "Calculator" },
  { key: "tasks", defaultLabelAr: "المهام والمشاريع", defaultLabelEn: "Tasks & Projects", labelAr: "المهام والمشاريع", labelEn: "Tasks & Projects", order: 24, visible: true, locked: false, iconName: "CheckCircle2" },
  { key: "education", defaultLabelAr: "النظام التعليمي", defaultLabelEn: "Education System", labelAr: "النظام التعليمي", labelEn: "Education System", order: 25, visible: true, locked: false, iconName: "GraduationCap" },
  { key: "marketplace", defaultLabelAr: "متجر التطبيقات", defaultLabelEn: "App Marketplace", labelAr: "متجر التطبيقات", labelEn: "App Marketplace", order: 26, visible: true, locked: false, iconName: "Grid3x3" },
  { key: "notifications", defaultLabelAr: "الإشعارات", defaultLabelEn: "Notifications", labelAr: "الإشعارات", labelEn: "Notifications", order: 27, visible: true, locked: false, iconName: "Bell" },
  { key: "company", defaultLabelAr: "إدارة الشركة", defaultLabelEn: "Company Management", labelAr: "إدارة الشركة", labelEn: "Company Management", order: 28, visible: true, locked: false, iconName: "Building" },
  { key: "settings", defaultLabelAr: "الإعدادات", defaultLabelEn: "Settings", labelAr: "الإعدادات", labelEn: "Settings", order: 29, visible: true, locked: true, iconName: "Cog" },
];

const renderItemIcon = (iconName: string) => {
  switch (iconName) {
    case "BarChart3":
      return <BarChart3 className="w-5 h-5" />;
    case "MessageSquare":
      return <MessageSquare className="w-5 h-5" />;
    case "Sparkles":
      return <Sparkles className="w-5 h-5" />;
    case "Share2":
      return <Share2 className="w-5 h-5" />;
    case "Archive":
      return <Archive className="w-5 h-5" />;
    case "Truck":
      return <Truck className="w-5 h-5" />;
    case "Package":
      return <Package className="w-5 h-5" />;
    case "ShoppingBag":
      return <ShoppingBag className="w-5 h-5" />;
    case "Users":
      return <Users className="w-5 h-5" />;
    case "FileText":
      return <FileText className="w-5 h-5" />;
    case "Box":
      return <Box className="w-5 h-5" />;
    case "TrendingUp":
      return <TrendingUp className="w-5 h-5" />;
    case "Megaphone":
      return <Megaphone className="w-5 h-5" />;
    case "Store":
      return <Store className="w-5 h-5" />;
    case "Landmark":
      return <Landmark className="w-5 h-5" />;
    case "Tag":
      return <Tag className="w-5 h-5" />;
    case "Briefcase":
      return <Briefcase className="w-5 h-5" />;
    case "Calculator":
      return <Calculator className="w-5 h-5" />;
    case "CheckCircle2":
      return <CheckCircle2 className="w-5 h-5" />;
    case "GraduationCap":
      return <GraduationCap className="w-5 h-5" />;
    case "Grid3x3":
      return <Grid3x3 className="w-5 h-5" />;
    case "Bell":
      return <Bell className="w-5 h-5" />;
    case "Building":
      return <Building className="w-5 h-5" />;
    case "Cog":
      return <Cog className="w-5 h-5" />;
    default:
      return <Grid3x3 className="w-5 h-5" />;
  }
};

const SidebarSettings: React.FC = () => {
  const { refreshSettings, userLayout, setUserLayout } = useSidebarSettings();
  const [items, setItems] = useState<SidebarConfigItem[]>(DEFAULT_SIDEBAR_ITEMS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [previewLang, setPreviewLang] = useState<"ar" | "en">("ar");
  const [activeSubTab, setActiveSubTab] = useState<"general" | "education">("general");

  // Load saved settings from backend
  const loadSidebarSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<any>("/settings/sidebar");
      let savedList: any[] = [];
      if (res.data?.success && res.data?.data) {
        const raw = res.data.data.settings !== undefined ? res.data.data.settings : res.data.data;
        if (Array.isArray(raw)) {
          savedList = raw;
        } else if (raw && typeof raw === "object" && Array.isArray(raw.items)) {
          savedList = raw.items;
        }
      }

      if (savedList && savedList.length > 0) {
        const savedMap = new Map<string, any>();
        savedList.forEach((s) => {
          if (s && s.key) savedMap.set(String(s.key).trim().toLowerCase(), s);
        });

        const merged = DEFAULT_SIDEBAR_ITEMS.map((item, idx) => {
          const saved = savedMap.get(item.key.toLowerCase());
          if (!saved) return { ...item, order: savedList.length + idx };
          return {
            ...item,
            order: typeof saved.order === "number" ? saved.order : idx,
            visible: item.locked ? true : (saved.visible !== false),
            labelAr: saved.labelAr !== undefined && saved.labelAr !== null ? saved.labelAr : item.defaultLabelAr,
            labelEn: saved.labelEn !== undefined && saved.labelEn !== null ? saved.labelEn : item.defaultLabelEn,
          };
        }).sort((a, b) => a.order - b.order)
          .map((item, idx) => ({ ...item, order: idx }));

        setItems(merged);
      } else {
        setItems(DEFAULT_SIDEBAR_ITEMS);
      }
    } catch (error) {
      console.warn("Could not load sidebar settings:", error);
      setItems(DEFAULT_SIDEBAR_ITEMS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSidebarSettings();
  }, [loadSidebarSettings]);

  // Section 1: Reorder handlers
  const moveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    // Recalculate order indices
    const updated = newItems.map((item, idx) => ({ ...item, order: idx }));
    setItems(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      return;
    }

    const newItems = [...items];
    const [dragged] = newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, dragged);

    const updated = newItems.map((item, idx) => ({ ...item, order: idx }));
    setItems(updated);
    setDraggedIndex(null);
  };

  // Section 2: Visibility handlers
  const toggleVisibility = (key: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          if (item.locked) return item; // Cannot hide locked items
          return { ...item, visible: !item.visible };
        }
        return item;
      })
    );
  };

  // Section 3: Renaming handlers
  const handleRename = (key: string, field: "labelAr" | "labelEn", value: string) => {
    if (value.length > 60) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const resetItemLabel = (key: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          return {
            ...item,
            labelAr: item.defaultLabelAr,
            labelEn: item.defaultLabelEn,
          };
        }
        return item;
      })
    );
  };

  const resetAllToDefault = () => {
    setItems(DEFAULT_SIDEBAR_ITEMS);
    toast.success("تمت استعادة الإعدادات الافتراضية للقائمة");
  };

  // Save handler
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = items.map((item, idx) => ({
        key: item.key,
        order: idx,
        visible: item.locked ? true : item.visible,
        ...(item.labelAr ? { labelAr: item.labelAr.trim() } : {}),
        ...(item.labelEn ? { labelEn: item.labelEn.trim() } : {}),
      }));

      const res = await apiClient.put<any>("/settings/sidebar", payload);
      if (res.data?.success) {
        toast.success("تم حفظ إعدادات القائمة الجانبية بنجاح");
        if (refreshSettings) {
          refreshSettings();
        }
      } else {
        toast.error(res.data?.message || "فشل حفظ إعدادات القائمة الجانبية");
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "حدث خطأ أثناء حفظ إعدادات القائمة الجانبية"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const visibleItemsCount = useMemo(() => items.filter((i) => i.visible).length, [items]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-border dark:border-border gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            إعدادات القائمة الجانبية
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            تخصيص ترتيب وظهور وأسماء عناصر القائمة الجانبية للنظام مع معاينة فورية
          </p>
        </div>

        {activeSubTab === "general" && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={resetAllToDefault}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-foreground bg-card border border-border dark:border-border rounded-lg hover:bg-muted/50 transition-colors shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              استعادة الافتراضي
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  حفظ التغييرات
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Sidebar Layout Picker */}
      <SidebarLayoutPicker userLayout={userLayout} onSelectLayout={setUserLayout} />

      {/* Navigation Switcher: General Sidebar vs Education Sections */}
      <div className="flex items-center gap-3 border-b border-border dark:border-border mt-6">
        <button
          type="button"
          onClick={() => setActiveSubTab("general")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeSubTab === "general"
              ? "border-indigo-600 text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          القائمة الرئيسية (التطبيقات العامة)
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("education")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeSubTab === "education"
              ? "border-indigo-600 text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          سكاشن النظام التعليمي (تغيير الأسماء والترتيب)
        </button>
      </div>

      {activeSubTab === "education" ? (
        <div className="mt-6">
          <EducationSettingsTab />
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">جاري تحميل إعدادات القائمة الجانبية...</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: 3 Customization Sections */}
          <div className="lg:col-span-8 space-y-8">
            {/* Section 1: الترتيب */}
            <div className="bg-card rounded-xl border border-border dark:border-border p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-border dark:border-border mb-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary dark:bg-primary/50 text-primary text-xs flex items-center justify-center font-bold">
                      1
                    </span>
                    ترتيب عناصر القائمة الجانبية
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    اسحب العناصر لتغيير ترتيبها أو استخدم أزرار التحريك لأعلى ولأسفل
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={item.key}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(index)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      draggedIndex === index
                        ? "border-indigo-500 bg-primary/50 dark:bg-primary/20 opacity-60"
                        : "border-gray-200 dark:border-border bg-muted dark:bg-muted hover:bg-muted dark:hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      <span className="w-6 h-6 rounded-md bg-muted dark:bg-muted text-xs font-semibold text-muted-foreground flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div className="text-primary">
                        {renderItemIcon(item.iconName)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                          {item.labelAr || item.defaultLabelAr}
                          {item.locked && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-warning dark:bg-warning/40 text-warning dark:text-warning">
                              <Lock className="w-3 h-3" />
                              مثبت
                            </span>
                          )}
                          {item.key === "education" && (
                            <button
                              type="button"
                              onClick={() => setActiveSubTab("education")}
                              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-primary/10 dark:bg-primary/50 text-primary border border-primary dark:border-primary/60 hover:bg-primary transition-colors"
                            >
                              <Sliders className="w-3 h-3" />
                              تخصيص أسماء السكاشن (المعلمين، الطلاب...)
                            </button>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {item.key}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="تحريك لأعلى"
                        onClick={() => moveItem(index, "up")}
                        disabled={index === 0}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-white dark:hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="تحريك لأسفل"
                        onClick={() => moveItem(index, "down")}
                        disabled={index === items.length - 1}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-white dark:hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: الإخفاء والإظهار */}
            <div className="bg-card rounded-xl border border-border dark:border-border p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-border dark:border-border mb-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary dark:bg-primary/50 text-primary text-xs flex items-center justify-center font-bold">
                      2
                    </span>
                    إخفاء وإظهار عناصر القائمة
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    حدد العناصر التي تظهر للمستخدمين. العناصر المحمية مؤمنة تلقائياً
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary">
                  {visibleItemsCount} من {items.length} ظاهر
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map((item) => (
                  <div
                    key={item.key}
                    className={`flex items-center justify-between p-3.5 rounded-lg border transition-all ${
                      item.visible
                        ? "border-gray-200 dark:border-border bg-card"
                        : "border-dashed border-border dark:border-border bg-muted dark:bg-muted opacity-70"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={item.visible ? "text-primary" : "text-gray-400"}>
                        {renderItemIcon(item.iconName)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {item.labelAr || item.defaultLabelAr}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.labelEn || item.defaultLabelEn}
                        </div>
                      </div>
                    </div>

                    <div>
                      {item.locked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-warning dark:text-warning bg-warning/10 dark:bg-warning/40 border border-warning dark:border-warning rounded-md">
                          <Lock className="w-3.5 h-3.5" />
                          محمي
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleVisibility(item.key)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                            item.visible
                              ? "bg-emerald-50 dark:bg-success/40 text-success dark:text-success border border-success dark:border-success hover:bg-success"
                              : "bg-muted text-foreground dark:text-muted-foreground border border-border hover:bg-muted"
                          }`}
                        >
                          {item.visible ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              ظاهر
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              مخفي
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: الأسماء */}
            <div className="bg-card rounded-xl border border-border dark:border-border p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-border dark:border-border mb-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary dark:bg-primary/50 text-primary text-xs flex items-center justify-center font-bold">
                      3
                    </span>
                    تخصيص الأسماء والمسميات
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    أعد تسمية العناصر بالعربية والإنجليزية لتناسب طبيعة عملك (الحد الأقصى 60 حرفاً)
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.key}
                    className="p-4 rounded-lg border border-border dark:border-border bg-muted dark:bg-muted space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-primary">
                          {renderItemIcon(item.iconName)}
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          {item.defaultLabelAr}
                        </span>
                        <span className="text-xs text-muted-foreground">({item.key})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => resetItemLabel(item.key)}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary hover:underline"
                      >
                        <RotateCcw className="w-3 h-3" />
                        استعادة الافتراضي
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">
                          الاسم بالعربية (AR)
                        </label>
                        <input
                          type="text"
                          maxLength={60}
                          value={item.labelAr}
                          placeholder={item.defaultLabelAr}
                          onChange={(e) => handleRename(item.key, "labelAr", e.target.value)}
                          className="w-full text-sm px-3 py-1.5 rounded-lg border border-border bg-white dark:bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div dir="ltr">
                        <label className="block text-xs font-medium text-foreground mb-1 text-left">
                          Name in English (EN)
                        </label>
                        <input
                          type="text"
                          maxLength={60}
                          value={item.labelEn}
                          placeholder={item.defaultLabelEn}
                          onChange={(e) => handleRename(item.key, "labelEn", e.target.value)}
                          className="w-full text-sm px-3 py-1.5 rounded-lg border border-border bg-white dark:bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-left"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: المعاينة المباشرة (Live Preview) */}
          <div className="lg:col-span-4">
            <div className="sticky top-6 bg-card rounded-xl border border-border dark:border-border p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-border dark:border-border mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                  <h3 className="text-base font-bold text-foreground">
                    المعاينة المباشرة
                  </h3>
                </div>

                <div className="flex items-center rounded-lg bg-muted p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewLang("ar")}
                    className={`px-2 py-1 rounded-md font-medium transition-colors ${
                      previewLang === "ar"
                        ? "bg-card text-primary shadow-sm"
                        : "text-gray-600 dark:text-muted-foreground"
                    }`}
                  >
                    العربية
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewLang("en")}
                    className={`px-2 py-1 rounded-md font-medium transition-colors ${
                      previewLang === "en"
                        ? "bg-card text-primary shadow-sm"
                        : "text-gray-600 dark:text-muted-foreground"
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              <div
                className="bg-gray-900 text-white rounded-lg p-3 shadow-inner space-y-1.5 max-h-[600px] overflow-y-auto"
                dir={previewLang === "ar" ? "rtl" : "ltr"}
              >
                <div className="px-3 py-2 border-b border-border flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>MaxPerformance Menu</span>
                </div>

                {items
                  .filter((item) => item.visible)
                  .map((item) => {
                    const label = previewLang === "ar" ? item.labelAr || item.defaultLabelAr : item.labelEn || item.defaultLabelEn;
                    return (
                      <div
                        key={item.key}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-md text-muted-foreground hover:text-white hover:bg-muted text-xs font-medium transition-colors cursor-default"
                      >
                        <span className="text-gray-400">
                          {renderItemIcon(item.iconName)}
                        </span>
                        <span className="truncate flex-1">{label}</span>
                        {item.locked && (
                          <Lock className="w-3 h-3 text-warning opacity-60" />
                        )}
                      </div>
                    );
                  })}
              </div>

              <div className="mt-4 pt-3 border-t border-border dark:border-border text-center">
                <p className="text-xs text-muted-foreground">
                  يظهر في القائمة {visibleItemsCount} عنصر بترتيبهم المخصص
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarSettings;
