/**
 * 🛒 Advantage+ Shopping Campaign
 *
 * صفحة إنشاء حملات التسوق الذكية من Facebook
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { tToast } from "../../utils/i18n-toast";
import {
  ShoppingBag,
  Sparkles,
  Globe,
  DollarSign,
  Target,
  Zap,
  CheckCircle,
  Loader2,
  ArrowLeft,
  TrendingUp,
} from "lucide-react";
import { facebookAdsService } from "../../services/facebookAdsService";
import FacebookAdsModuleNav from "../../components/advertising/FacebookAdsModuleNav";

const AdvantagePlusShopping: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    status: "PAUSED" as "ACTIVE" | "PAUSED",
    budgetType: "DAILY" as "DAILY" | "LIFETIME",
    budgetAmount: 50,
    catalogId: "",
    pixelId: "",
    countryTargeting: ["SA", "AE", "EG"],
  });

  const countries = [
    { code: "SA", name: "السعودية", flag: "🇸🇦" },
    { code: "AE", name: "الإمارات", flag: "🇦🇪" },
    { code: "EG", name: "مصر", flag: "🇪🇬" },
    { code: "KW", name: "الكويت", flag: "🇰🇼" },
    { code: "QA", name: "قطر", flag: "🇶🇦" },
    { code: "BH", name: "البحرين", flag: "🇧🇭" },
    { code: "OM", name: "عمان", flag: "🇴🇲" },
    { code: "JO", name: "الأردن", flag: "🇯🇴" },
    { code: "LB", name: "لبنان", flag: "🇱🇧" },
    { code: "MA", name: "المغرب", flag: "🇲🇦" },
  ];

  useEffect(() => {
    loadCatalogs();
  }, []);

  const loadCatalogs = async () => {
    try {
      setLoadingCatalogs(true);
      const data = await facebookAdsService.getCatalogs();
      setCatalogs(data);
    } catch (error) {
      console.error("Error loading catalogs:", error);
    } finally {
      setLoadingCatalogs(false);
    }
  };

  const toggleCountry = (code: string) => {
    setFormData((prev) => ({
      ...prev,
      countryTargeting: prev.countryTargeting.includes(code)
        ? prev.countryTargeting.filter((c) => c !== code)
        : [...prev.countryTargeting, code],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      tToast.error("AdvantagePlusShopping.please_name_2fae");
      return;
    }

    if (!formData.pixelId.trim()) {
      tToast.error("AdvantagePlusShopping.msg_d0eb");
      return;
    }

    if (formData.budgetAmount < 1) {
      tToast.error("AdvantagePlusShopping.msg_fa84");
      return;
    }

    if (formData.countryTargeting.length === 0) {
      tToast.error("AdvantagePlusShopping.msg_9ca6");
      return;
    }

    try {
      setLoading(true);
      const campaignPayload: any = {
        name: formData.name,
        status: formData.status,
        budgetType: formData.budgetType,
        budgetAmount: formData.budgetAmount,
        pixelId: formData.pixelId,
        countryTargeting: formData.countryTargeting,
      };
      if (formData.catalogId) campaignPayload.catalogId = formData.catalogId;
      await facebookAdsService.createAdvantagePlusShoppingCampaign(
        campaignPayload,
      );

      tToast.success("AdvantagePlusShopping.success_create_aae3");
      navigate("/advertising/facebook-ads");
    } catch (error: any) {
      console.error("Error creating campaign:", error);
      toast.error(error?.response?.data?.error || "فشل في إنشاء الحملة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="p-6 space-y-6 min-h-screen bg-muted dark:bg-muted"
      dir="rtl"
    >
      <FacebookAdsModuleNav />
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/advertising/facebook-ads")}
          aria-label="العودة إلى إدارة إعلانات Facebook"
          className="p-2 hover:bg-muted dark:hover:bg-muted rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-foreground dark:text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-success dark:text-success" />
            حملة Advantage+ Shopping
          </h1>
          <p className="text-gray-600 dark:text-muted-foreground mt-1">
            حملات تسوق تعتمد تحسين Meta التلقائي لتحقيق أفضل النتائج
          </p>
        </div>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-success to-success dark:from-success/20 dark:to-success/20 rounded-xl p-4 border border-success dark:border-success">
          <Sparkles className="w-8 h-8 text-success dark:text-success mb-2" />
          <h3 className="font-semibold text-foreground">
            تحسين تلقائي
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Meta Advantage+ يحسّن الإعلانات تلقائياً
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-primary dark:from-blue-900/20 dark:to-primary/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
          <Target className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
          <h3 className="font-semibold text-foreground">
            استهداف ذكي
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            يصل للعملاء الأكثر احتمالاً للشراء
          </p>
        </div>
        <div className="bg-gradient-to-br from-primary to-primary dark:from-primary/20 dark:to-primary/20 rounded-xl p-4 border border-primary dark:border-primary">
          <TrendingUp className="w-8 h-8 text-primary dark:text-primary mb-2" />
          <h3 className="font-semibold text-foreground">
            أداء أفضل
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            تكلفة أقل لكل عملية شراء
          </p>
        </div>
        <div className="bg-gradient-to-br from-warning to-warning dark:from-warning/20 dark:to-warning/20 rounded-xl p-4 border border-warning dark:border-warning">
          <Zap className="w-8 h-8 text-warning dark:text-warning mb-2" />
          <h3 className="font-semibold text-foreground">
            إعداد سريع
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            إعداد بسيط وسريع للحملة
          </p>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-card rounded-xl shadow-sm dark:shadow-gray-900/20 border border-border dark:border-border">
        {/* Campaign Name */}
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            معلومات الحملة
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="advantage-plus-campaign-name"
                className="block text-sm font-medium text-foreground mb-1"
              >
                اسم الحملة *
              </label>
              <input
                id="advantage-plus-campaign-name"
                name="campaignName"
                type="text"
                autoComplete="off"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="مثال: حملة التسوق - رمضان 2025"
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-success bg-card text-foreground placeholder-muted dark:placeholder-muted"
              />
            </div>

            <div>
              <label
                htmlFor="advantage-plus-pixel-id"
                className="block text-sm font-medium text-foreground mb-1"
              >
                معرف Facebook Pixel *
              </label>
              <input
                id="advantage-plus-pixel-id"
                name="pixelId"
                type="text"
                autoComplete="off"
                value={formData.pixelId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, pixelId: e.target.value }))
                }
                placeholder="أدخل معرف الـ Pixel"
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-success bg-card text-foreground placeholder-muted dark:placeholder-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                مطلوب لتتبع التحويلات والمبيعات
              </p>
            </div>

            <div>
              <label
                htmlFor="advantage-plus-catalog-id"
                className="block text-sm font-medium text-foreground mb-1"
              >
                كتالوج المنتجات
              </label>
              {loadingCatalogs ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري التحميل...
                </div>
              ) : (
                <select
                  id="advantage-plus-catalog-id"
                  name="catalogId"
                  autoComplete="off"
                  value={formData.catalogId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      catalogId: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-success bg-card text-foreground"
                >
                  <option value="">بدون كتالوج (اختياري)</option>
                  {catalogs.map((catalog) => (
                    <option key={catalog.id} value={catalog.id}>
                      {catalog.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Budget */}
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-success dark:text-success" />
            الميزانية
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                نوع الميزانية
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, budgetType: "DAILY" }))
                  }
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    formData.budgetType === "DAILY"
                      ? "border-green-500 dark:border-success bg-success/10 dark:bg-success/20 text-success dark:text-success"
                      : "border-border hover:border-border dark:hover:border-border bg-card text-foreground"
                  }`}
                >
                  <div className="font-medium">يومية</div>
                  <div className="text-xs text-muted-foreground">
                    إنفاق يومي ثابت
                  </div>
                </button>
                <button
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, budgetType: "LIFETIME" }))
                  }
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    formData.budgetType === "LIFETIME"
                      ? "border-green-500 dark:border-success bg-success/10 dark:bg-success/20 text-success dark:text-success"
                      : "border-border hover:border-border dark:hover:border-border bg-card text-foreground"
                  }`}
                >
                  <div className="font-medium">إجمالية</div>
                  <div className="text-xs text-muted-foreground">
                    لكامل مدة الحملة
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="advantage-plus-budget-amount"
                className="block text-sm font-medium text-foreground mb-2"
              >
                المبلغ ({formData.budgetType === "DAILY" ? "يومياً" : "إجمالي"})
                *
              </label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/80" />
                <input
                  id="advantage-plus-budget-amount"
                  name="budgetAmount"
                  type="number"
                  autoComplete="off"
                  value={formData.budgetAmount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      budgetAmount: Number(e.target.value),
                    }))
                  }
                  min={1}
                  className="w-full pe-10 ps-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-success bg-card text-foreground"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Country Targeting */}
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-success dark:text-success" />
            الدول المستهدفة
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {countries.map((country) => {
              const isSelected = formData.countryTargeting.includes(
                country.code,
              );
              return (
                <button
                  key={country.code}
                  onClick={() => toggleCountry(country.code)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-green-500 dark:border-success bg-success/10 dark:bg-success/20"
                      : "border-border hover:border-border dark:hover:border-border bg-card"
                  }`}
                >
                  <div className="text-2xl mb-1">{country.flag}</div>
                  <div
                    className={`text-sm font-medium ${isSelected ? "text-green-700 dark:text-success" : "text-foreground"}`}
                  >
                    {country.name}
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-4 h-4 text-success dark:text-success mx-auto mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status */}
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            حالة الحملة
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() =>
                setFormData((prev) => ({ ...prev, status: "PAUSED" }))
              }
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                formData.status === "PAUSED"
                  ? "border-yellow-500 dark:border-warning bg-warning/10 dark:bg-warning/20"
                  : "border-border hover:border-border dark:hover:border-border bg-card"
              }`}
            >
              <div className="font-medium text-foreground">
                متوقفة
              </div>
              <div className="text-sm text-muted-foreground">
                ستبدأ عند التفعيل يدوياً
              </div>
            </button>
            <button
              onClick={() =>
                setFormData((prev) => ({ ...prev, status: "ACTIVE" }))
              }
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                formData.status === "ACTIVE"
                  ? "border-green-500 dark:border-success bg-success/10 dark:bg-success/20"
                  : "border-border hover:border-border dark:hover:border-border bg-card"
              }`}
            >
              <div className="font-medium text-foreground">
                نشطة
              </div>
              <div className="text-sm text-muted-foreground">
                ستبدأ فوراً بعد الإنشاء
              </div>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-muted dark:bg-muted flex gap-3 justify-end">
          <button
            onClick={() => navigate("/advertising/facebook-ads")}
            className="px-6 py-2 text-foreground bg-card border border-border rounded-lg hover:bg-muted/50"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 text-white bg-success dark:bg-success rounded-lg hover:bg-success dark:hover:bg-success disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري الإنشاء...
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                إنشاء الحملة
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvantagePlusShopping;
