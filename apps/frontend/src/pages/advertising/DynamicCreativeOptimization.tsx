/**
 * 🎨 Dynamic Creative Optimization (DCO)
 *
 * صفحة تحسين الإعلانات الديناميكية - تجمع عناصر إبداعية متعددة وتختبرها تلقائياً
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { tToast } from "../../utils/i18n-toast";
import {
  Sparkles,
  Image,
  Video,
  Type,
  Link,
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
  Zap,
  BarChart3,
} from "lucide-react";
import { facebookAdsService } from "../../services/facebookAdsService";
import FacebookAdsModuleNav from "../../components/advertising/FacebookAdsModuleNav";

const DynamicCreativeOptimization: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "images" | "videos" | "titles" | "bodies" | "ctas"
  >("images");

  const [formData, setFormData] = useState({
    pageId: "",
    name: "",
    images: [""],
    videos: [""],
    titles: [""],
    bodies: [""],
    descriptions: [""],
    callToActions: ["LEARN_MORE"],
    linkUrls: [""],
  });

  const ctaOptions = [
    { value: "LEARN_MORE", label: "اعرف المزيد" },
    { value: "SHOP_NOW", label: "تسوق الآن" },
    { value: "SIGN_UP", label: "سجل الآن" },
    { value: "SUBSCRIBE", label: "اشترك" },
    { value: "CONTACT_US", label: "تواصل معنا" },
    { value: "GET_OFFER", label: "احصل على العرض" },
    { value: "GET_QUOTE", label: "احصل على عرض سعر" },
    { value: "BOOK_NOW", label: "احجز الآن" },
    { value: "DOWNLOAD", label: "تحميل" },
    { value: "WATCH_MORE", label: "شاهد المزيد" },
  ];

  const addItem = (field: keyof typeof formData) => {
    if (Array.isArray(formData[field])) {
      const arr = formData[field] as string[];
      if (arr.length < 10) {
        setFormData((prev) => ({
          ...prev,
          [field]: [...arr, ""],
        }));
      }
    }
  };

  const removeItem = (field: keyof typeof formData, index: number) => {
    if (Array.isArray(formData[field])) {
      const arr = formData[field] as string[];
      if (arr.length > 1) {
        setFormData((prev) => ({
          ...prev,
          [field]: arr.filter((_, i) => i !== index),
        }));
      }
    }
  };

  const updateItem = (
    field: keyof typeof formData,
    index: number,
    value: string,
  ) => {
    if (Array.isArray(formData[field])) {
      const arr = [...(formData[field] as string[])];
      arr[index] = value;
      setFormData((prev) => ({
        ...prev,
        [field]: arr,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.pageId) {
      tToast.error("DynamicCreativeOptimization.msg_ccda");
      return;
    }

    const filledImages = formData.images.filter((i) => i.trim());
    const filledVideos = formData.videos.filter((v) => v.trim());
    const filledTitles = formData.titles.filter((t) => t.trim());
    const filledBodies = formData.bodies.filter((b) => b.trim());

    if (filledImages.length === 0 && filledVideos.length === 0) {
      tToast.error("DynamicCreativeOptimization.please_add_c24d");
      return;
    }

    if (filledTitles.length === 0) {
      tToast.error("DynamicCreativeOptimization.please_add_ddc3");
      return;
    }

    if (filledBodies.length === 0) {
      tToast.error("DynamicCreativeOptimization.please_add_00c2");
      return;
    }

    try {
      setLoading(true);
      const dcoPayload: any = {
        pageId: formData.pageId,
        name:
          formData.name || `DCO - ${new Date().toLocaleDateString("ar-EG")}`,
        titles: filledTitles,
        bodies: filledBodies,
        descriptions: formData.descriptions.filter((d) => d.trim()),
        callToActions: formData.callToActions,
        linkUrls: formData.linkUrls.filter((l) => l.trim()),
      };
      if (filledImages.length > 0) dcoPayload.images = filledImages;
      if (filledVideos.length > 0) dcoPayload.videos = filledVideos;
      await facebookAdsService.createDynamicCreative(dcoPayload);

      tToast.success("DynamicCreativeOptimization.success_create_6a5d");
      navigate("/advertising/facebook-ads");
    } catch (error: any) {
      console.error("Error creating DCO:", error);
      toast.error(error?.response?.data?.error || "فشل في إنشاء الإعلان");
    } finally {
      setLoading(false);
    }
  };

  const getTotalCombinations = () => {
    const images = formData.images.filter((i) => i.trim()).length || 1;
    const videos = formData.videos.filter((v) => v.trim()).length || 0;
    const titles = formData.titles.filter((t) => t.trim()).length || 1;
    const bodies = formData.bodies.filter((b) => b.trim()).length || 1;
    const ctas = formData.callToActions.length || 1;

    return (images + videos) * titles * bodies * ctas;
  };

  const tabs = [
    {
      id: "images",
      label: "الصور",
      icon: Image,
      count: formData.images.filter((i) => i.trim()).length,
    },
    {
      id: "videos",
      label: "الفيديوهات",
      icon: Video,
      count: formData.videos.filter((v) => v.trim()).length,
    },
    {
      id: "titles",
      label: "العناوين",
      icon: Type,
      count: formData.titles.filter((t) => t.trim()).length,
    },
    {
      id: "bodies",
      label: "النصوص",
      icon: Type,
      count: formData.bodies.filter((b) => b.trim()).length,
    },
    {
      id: "ctas",
      label: "أزرار الإجراء",
      icon: Zap,
      count: formData.callToActions.length,
    },
  ];

  return (
    <div
      className="p-6 space-y-6 min-h-screen bg-muted dark:bg-muted"
      dir="rtl"
    >
      <FacebookAdsModuleNav />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-primary" />
            Dynamic Creative Optimization
          </h1>
          <p className="text-gray-600 dark:text-muted-foreground mt-1">
            تحسين الإعلانات الديناميكية - اختبار عناصر متعددة تلقائياً
          </p>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-gradient-to-r from-primary to-primary rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100">إجمالي التركيبات الممكنة</p>
            <p className="text-4xl font-bold mt-1">{getTotalCombinations()}</p>
            <p className="text-purple-200 text-sm mt-2">
              سيتم اختبارها تلقائياً لتحقيق أفضل أداء
            </p>
          </div>
          <BarChart3 className="w-16 h-16 text-primary" />
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-card rounded-xl shadow-sm dark:shadow-gray-900/20 border border-border dark:border-border overflow-hidden">
        {/* Basic Info */}
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            معلومات أساسية
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                معرف الصفحة *
              </label>
              <input
                type="text"
                value={formData.pageId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, pageId: e.target.value }))
                }
                placeholder="أدخل معرف صفحة Facebook"
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-card text-foreground placeholder-muted dark:placeholder-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                اسم الإعلان
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="اختياري"
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-card text-foreground placeholder-muted dark:placeholder-muted"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "text-primary border-b-2 border-primary dark:border-primary bg-primary/10 dark:bg-primary/20"
                      : "text-gray-600 dark:text-muted-foreground hover:text-foreground dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      activeTab === tab.id
                        ? "bg-indigo-100 dark:bg-primary/30 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Images Tab */}
          {activeTab === "images" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-600">أضف حتى 10 صور مختلفة للاختبار</p>
                <button
                  onClick={() => addItem("images")}
                  disabled={formData.images.length >= 10}
                  className="flex items-center gap-1 text-primary hover:text-primary disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  إضافة صورة
                </button>
              </div>
              {formData.images.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) =>
                      updateItem("images", index, e.target.value)
                    }
                    placeholder="رابط الصورة"
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                  {formData.images.length > 1 && (
                    <button
                      onClick={() => removeItem("images", index)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Videos Tab */}
          {activeTab === "videos" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  أضف حتى 10 فيديوهات مختلفة للاختبار
                </p>
                <button
                  onClick={() => addItem("videos")}
                  disabled={formData.videos.length >= 10}
                  className="flex items-center gap-1 text-primary hover:text-primary disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  إضافة فيديو
                </button>
              </div>
              {formData.videos.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) =>
                      updateItem("videos", index, e.target.value)
                    }
                    placeholder="رابط الفيديو"
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                  {formData.videos.length > 1 && (
                    <button
                      onClick={() => removeItem("videos", index)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Titles Tab */}
          {activeTab === "titles" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  أضف حتى 5 عناوين مختلفة للاختبار
                </p>
                <button
                  onClick={() => addItem("titles")}
                  disabled={formData.titles.length >= 5}
                  className="flex items-center gap-1 text-primary hover:text-primary disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  إضافة عنوان
                </button>
              </div>
              {formData.titles.map((title, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) =>
                      updateItem("titles", index, e.target.value)
                    }
                    placeholder={`العنوان ${index + 1}`}
                    maxLength={40}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-xs text-muted-foreground self-center">
                    {title.length}/40
                  </span>
                  {formData.titles.length > 1 && (
                    <button
                      onClick={() => removeItem("titles", index)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Bodies Tab */}
          {activeTab === "bodies" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-600">أضف حتى 5 نصوص مختلفة للاختبار</p>
                <button
                  onClick={() => addItem("bodies")}
                  disabled={formData.bodies.length >= 5}
                  className="flex items-center gap-1 text-primary hover:text-primary disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  إضافة نص
                </button>
              </div>
              {formData.bodies.map((body, index) => (
                <div key={index} className="flex gap-2">
                  <textarea
                    value={body}
                    onChange={(e) =>
                      updateItem("bodies", index, e.target.value)
                    }
                    placeholder={`النص الأساسي ${index + 1}`}
                    rows={3}
                    maxLength={125}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex flex-col justify-between">
                    <span className="text-xs text-muted-foreground">
                      {body.length}/125
                    </span>
                    {formData.bodies.length > 1 && (
                      <button
                        onClick={() => removeItem("bodies", index)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTAs Tab */}
          {activeTab === "ctas" && (
            <div className="space-y-4">
              <p className="text-gray-600">اختر أزرار الإجراء للاختبار</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {ctaOptions.map((cta) => {
                  const isSelected = formData.callToActions.includes(cta.value);
                  return (
                    <button
                      key={cta.value}
                      onClick={() => {
                        if (isSelected) {
                          if (formData.callToActions.length > 1) {
                            setFormData((prev) => ({
                              ...prev,
                              callToActions: prev.callToActions.filter(
                                (c) => c !== cta.value,
                              ),
                            }));
                          }
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            callToActions: [...prev.callToActions, cta.value],
                          }));
                        }
                      }}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-purple-500 bg-primary/10 text-primary"
                          : "border-gray-200 hover:border-border"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {isSelected && <CheckCircle className="w-4 h-4" />}
                        <span className="text-sm font-medium">{cta.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Link URL */}
        <div className="p-6 border-t">
          <label className="block text-sm font-medium text-foreground mb-2">
            رابط الوجهة
          </label>
          {formData.linkUrls.map((url, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <div className="flex-1 relative">
                <Link className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) =>
                    updateItem("linkUrls", index, e.target.value)
                  }
                  placeholder="https://example.com"
                  className="w-full pe-10 ps-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="p-6 border-t bg-muted flex gap-3 justify-end">
          <button
            onClick={() => navigate("/advertising/facebook-ads")}
            className="px-6 py-2 text-foreground bg-white border rounded-lg hover:bg-muted"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 text-white bg-primary rounded-lg hover:bg-primary disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري الإنشاء...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                إنشاء الإعلان الديناميكي
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DynamicCreativeOptimization;
