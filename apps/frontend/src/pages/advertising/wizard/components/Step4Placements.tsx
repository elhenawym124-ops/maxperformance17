import React from "react";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  Layout,
  Facebook,
  Instagram,
  MessageCircle,
  Globe,
  AlertCircle,
  Smartphone,
  Laptop,
  Monitor,
  Wifi,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import type { FormData } from "../types";
import { PLACEMENTS } from "../constants";

interface Step4PlacementsProps {
  formData: FormData;
  handleChange: (field: keyof FormData, value: any) => void;
  toggleArrayValue: (field: keyof FormData, value: string) => void;
  getError: (field: string) => string;
}

const PLATFORMS = [
  { id: "facebook", label: "Facebook", icon: <Facebook className="w-4 h-4 text-primary" /> },
  { id: "instagram", label: "Instagram", icon: <Instagram className="w-4 h-4 text-primary" /> },
  { id: "messenger", label: "Messenger", icon: <MessageCircle className="w-4 h-4 text-primary" /> },
  { id: "network", label: "Audience Network", icon: <Globe className="w-4 h-4 text-success" /> },
];

export const Step4Placements: React.FC<Step4PlacementsProps> = ({
  formData,
  handleChange,
  toggleArrayValue,
  getError,
}) => {
  const { i18n } = useTranslation();
  const isEn = Boolean(i18n.language && i18n.language.startsWith("en"));

  const currentDeviceMode =
    !formData.devicePlatforms || formData.devicePlatforms.length === 0 || formData.devicePlatforms.length === 2
      ? "all"
      : formData.devicePlatforms.includes("mobile")
        ? "mobile"
        : "desktop";

  const handleDeviceModeChange = (mode: "all" | "mobile" | "desktop") => {
    if (mode === "all") {
      handleChange("devicePlatforms", []);
    } else if (mode === "mobile") {
      handleChange("devicePlatforms", ["mobile"]);
    } else {
      handleChange("devicePlatforms", ["desktop"]);
    }
  };

  const handleTogglePlatform = (platformId: string) => {
    // Current placements for this platform
    const platformPlacements = PLACEMENTS.filter((p) => p.platform === platformId).map((p) => p.id);
    const hasAnyActive = platformPlacements.some((id) => formData.placements.includes(id));

    if (hasAnyActive) {
      // Remove all placements belonging to this platform
      handleChange(
        "placements",
        formData.placements.filter((id) => !platformPlacements.includes(id)),
      );
    } else {
      // Add all placements belonging to this platform
      const unique = Array.from(new Set([...formData.placements, ...platformPlacements]));
      handleChange("placements", unique);
    }
  };

  const isPlatformActive = (platformId: string) => {
    const platformPlacements = PLACEMENTS.filter((p) => p.platform === platformId).map((p) => p.id);
    return platformPlacements.some((id) => formData.placements.includes(id));
  };

  return (
    <div className="space-y-6">
      {/* Placement Type (Advantage+ vs Manual) */}
      <div>
        <label className="block text-sm font-semibold text-foreground dark:text-muted-foreground mb-3">
          {isEn ? "Placement Type & Ad Delivery" : "نوع المواضع وتوزيع الإعلان"}
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleChange("placementType", "AUTOMATIC")}
            className={`p-4 border-2 rounded-xl text-center transition-all ${
              formData.placementType === "AUTOMATIC"
                ? "border-blue-500 bg-primary/10 dark:bg-primary/40 shadow-xs"
                : "border-gray-200 dark:border-border hover:border-border bg-card"
            }`}
          >
            <Sparkles
              className={`w-8 h-8 mx-auto mb-2 ${formData.placementType === "AUTOMATIC" ? "text-blue-500 dark:text-primary" : "text-gray-400"}`}
            />
            <div className="font-bold text-foreground text-sm">
              {isEn
                ? "Advantage+ Placements (Automatic - Recommended)"
                : "مواضع Advantage+ (تلقائية - موصى بها)"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {isEn
                ? "Meta algorithms intelligently distribute budget across top placements to maximize ROAS"
                : "خوارزميات Meta توزع الميزانية بذكاء على أفضل المواضع لتحقيق أعلى عائد"}
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              handleChange("placementType", "MANUAL");
              if (!formData.placements || formData.placements.length === 0) {
                // Default select feeds & reels
                handleChange("placements", [
                  "FACEBOOK_FEED",
                  "INSTAGRAM_FEED",
                  "FACEBOOK_REELS",
                  "INSTAGRAM_REELS",
                  "FACEBOOK_STORIES",
                  "INSTAGRAM_STORIES",
                ]);
              }
            }}
            className={`p-4 border-2 rounded-xl text-center transition-all ${
              formData.placementType === "MANUAL"
                ? "border-blue-500 bg-primary/10 dark:bg-primary/40 shadow-xs"
                : "border-gray-200 dark:border-border hover:border-border bg-card"
            }`}
          >
            <Layout
              className={`w-8 h-8 mx-auto mb-2 ${formData.placementType === "MANUAL" ? "text-blue-500 dark:text-primary" : "text-gray-400"}`}
            />
            <div className="font-bold text-foreground text-sm">
              {isEn ? "Manual Placements" : "مواضع يدوية مخصصة"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {isEn
                ? "Full manual control over devices, platforms, and specific placements"
                : "تحكم يدوي كامل بالأجهزة، المنصات، والمواضع المحددة"}
            </div>
          </button>
        </div>
      </div>

      {formData.placementType === "MANUAL" && (
        <div className="space-y-6 pt-2">
          {/* Devices Filter */}
          <div className="p-4 bg-muted dark:bg-muted border border-border dark:border-border rounded-xl space-y-3">
            <label className="block text-xs font-bold text-foreground dark:text-muted-foreground">
              {isEn ? "Target Devices" : "الأجهزة المستهدفة (Devices)"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDeviceModeChange("all")}
                className={`py-2.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  currentDeviceMode === "all"
                    ? "border-blue-500 bg-primary/10 dark:bg-primary/40 text-primary dark:text-primary shadow-xs"
                    : "border-gray-200 dark:border-border bg-card hover:border-border text-muted-foreground"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                {isEn ? "All (Recommended)" : "الكل (موصى به)"}
              </button>
              <button
                type="button"
                onClick={() => handleDeviceModeChange("mobile")}
                className={`py-2.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  currentDeviceMode === "mobile"
                    ? "border-blue-500 bg-primary/10 dark:bg-primary/40 text-primary dark:text-primary shadow-xs"
                    : "border-gray-200 dark:border-border bg-card hover:border-border text-muted-foreground"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                {isEn ? "Mobile only" : "الهواتف فقط"}
              </button>
              <button
                type="button"
                onClick={() => handleDeviceModeChange("desktop")}
                className={`py-2.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  currentDeviceMode === "desktop"
                    ? "border-blue-500 bg-primary/10 dark:bg-primary/40 text-primary dark:text-primary shadow-xs"
                    : "border-gray-200 dark:border-border bg-card hover:border-border text-muted-foreground"
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                {isEn ? "Desktop only" : "الكمبيوتر فقط"}
              </button>
            </div>
          </div>

          {/* Platforms Filter */}
          <div className="p-4 bg-muted dark:bg-muted border border-border dark:border-border rounded-xl space-y-3">
            <label className="block text-xs font-bold text-foreground dark:text-muted-foreground">
              {isEn ? "Platforms" : "المنصات (Platforms)"}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PLATFORMS.map((platform) => {
                const active = isPlatformActive(platform.id);
                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => handleTogglePlatform(platform.id)}
                    className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-between transition-all ${
                      active
                        ? "border-blue-400 dark:border-primary bg-card shadow-xs text-foreground"
                        : "border-gray-200 dark:border-border bg-muted dark:bg-muted text-muted-foreground/80 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {platform.icon}
                      <span>{platform.label}</span>
                    </div>
                    {active && <CheckCircle2 className="w-3.5 h-3.5 text-primary dark:text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specific Placements Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-foreground dark:text-muted-foreground">
                {isEn ? "Specific Placements" : "المواضع المحددة"} <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleChange("placements", PLACEMENTS.map((p) => p.id))}
                  className="text-xs text-primary dark:text-primary hover:text-primary dark:hover:text-primary font-medium"
                >
                  {isEn ? "Select All" : "تحديد الكل"}
                </button>
                <span className="text-gray-300 dark:text-foreground">|</span>
                <button
                  type="button"
                  onClick={() => handleChange("placements", [])}
                  className="text-xs text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground"
                >
                  {isEn ? "Deselect All" : "إلغاء التحديد"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PLACEMENTS.map((placement) => {
                const isSelected = formData.placements.includes(placement.id);
                return (
                  <button
                    key={placement.id}
                    type="button"
                    onClick={() => toggleArrayValue("placements", placement.id)}
                    className={`flex items-center justify-between p-3 border rounded-xl transition-all ${isEn ? "text-left" : "text-right"} ${
                      isSelected
                        ? "border-blue-500 bg-primary/70 dark:bg-primary/40 shadow-xs"
                        : "border-gray-200 dark:border-border hover:border-border bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={
                          isSelected ? "text-blue-600 dark:text-primary" : "text-gray-400"
                        }
                      >
                        {placement.icon}
                      </div>
                      <span className="font-medium text-xs text-foreground">
                        {placement.label}
                      </span>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-primary dark:text-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {getError("placements") && (
              <p className="mt-2 text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {getError("placements")}
              </p>
            )}
          </div>

          {/* Wi-Fi Only Toggle */}
          <div className="p-3.5 bg-primary/50 dark:bg-primary/20 border border-primary/70 dark:border-primary/40 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary dark:bg-primary/60 text-primary dark:text-primary rounded-lg">
                <Wifi className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-foreground">
                  {isEn
                    ? "Show ad only when connected to Wi-Fi"
                    : "عرض الإعلان عند الاتصال بـ Wi-Fi فقط"}
                </h5>
                <p className="text-[11px] text-muted-foreground">
                  {isEn
                    ? "Useful for high-definition video campaigns to save mobile data and ensure fast loading"
                    : "مفيد لحملات الفيديو عالية الدقة لتوفير باقات الإنترنت وضمان سرعة المشاهدة"}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={Boolean(formData.onlyWifi)}
                onChange={(e) => handleChange("onlyWifi", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-muted dark:bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      )}

      {/* Brand Safety / Inventory Filter */}
      <div className="border-t border-border dark:border-border pt-5 mt-2 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-success dark:text-success" />
          <h4 className="text-sm font-bold text-foreground">
            {isEn
              ? "Brand Safety & Inventory Filter"
              : "سلامة العلامة التجارية وفلتر المخزون (Inventory Filter)"}
          </h4>
        </div>
        <p className="text-xs text-muted-foreground">
          {isEn
            ? "Control the content suitability and context of videos/pages where your ads appear, ensuring your brand stays protected."
            : "تحكم في مستوى ملاءمة المحتوى وسياق الفيديوهات والصفحات التي يظهر بجوارها إعلانك لضمان عدم ارتباط علامتك بمحتوى حساس."}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {[
            {
              id: "STANDARD",
              title: isEn ? "Standard Inventory" : "المخزون القياسي (Standard)",
              badge: isEn ? "Recommended" : "موصى به",
              badgeColor: "bg-emerald-100 dark:bg-success/60 text-success dark:text-success",
              desc: isEn
                ? "Moderate balance between brand safety and broad reach. Excludes excessively explicit or controversial content."
                : "توازن معتدل بين أمان العلامة التجارية والوصول الجماهيري الواسع. يستبعد المحتوى الصريح والجدلي للغاية.",
            },
            {
              id: "FULL",
              title: isEn ? "Expanded Inventory" : "المخزون الكامل (Expanded)",
              badge: isEn ? "Max Reach" : "أقصى وصول",
              badgeColor: "bg-blue-100 dark:bg-primary/60 text-primary dark:text-primary",
              desc: isEn
                ? "Maximum reach at the lowest possible cost. Suitable when content sensitivity is not a top concern."
                : "أعلى نسبة وصول بأقل تكلفة ممكنة، مناسب عندما لا تكون حساسية المحتوى أولوية قصوى.",
            },
            {
              id: "LIMITED",
              title: isEn ? "Limited Inventory" : "المخزون المحدود (Limited)",
              badge: isEn ? "Max Protection" : "أقصى حماية",
              badgeColor: "bg-amber-100 dark:bg-warning/60 text-warning dark:text-warning",
              desc: isEn
                ? "Highest level of protection for sensitive corporate brands. Excludes any content with strong language or sensitive topics."
                : "أعلى درجات الحماية والحذر للعلامات التجارية الكبرى. يستبعد أي محتوى يحتوي على لغة قوية أو مواضيع حساسة.",
            },
          ].map((tier) => {
            const isSelected = (formData.inventoryFilter || "STANDARD") === tier.id;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => handleChange("inventoryFilter", tier.id)}
                className={`p-3 rounded-xl border ${isEn ? "text-left" : "text-right"} transition-all flex flex-col justify-between ${
                  isSelected
                    ? "border-emerald-500 bg-success/50 dark:bg-success/30 shadow-xs"
                    : "border-gray-200 dark:border-border bg-card hover:border-border"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-foreground">{tier.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${tier.badgeColor}`}>
                      {tier.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground dark:text-muted-foreground leading-relaxed">{tier.desc}</p>
                </div>
                <div className="mt-3 flex items-center justify-end">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected ? "border-emerald-600 bg-success text-white" : "border-border"
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
