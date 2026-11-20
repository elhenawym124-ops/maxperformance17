import React, { useRef, useState } from "react";
import {
  PhotoIcon,
  VideoCameraIcon,
  RectangleStackIcon,
  XMarkIcon,
  PlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShoppingBagIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { AdFormData, FacebookPage } from "./types";
import { toast } from "sonner";
import { StoreProductPickerModal, SelectedStoreProduct } from "./StoreProductPickerModal";

interface AdIdentityMediaStepProps {
  formData: AdFormData;
  updateFormData: (updates: Partial<AdFormData>) => void;
  facebookPages: FacebookPage[];
  loadingPages: boolean;
  isEn?: boolean;
}

export const AdIdentityMediaStep: React.FC<AdIdentityMediaStepProps> = ({
  formData,
  updateFormData,
  facebookPages,
  loadingPages,
  isEn = false,
}) => {
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(isEn ? "Please select a valid image file" : "يرجى اختيار ملف صورة صالح");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error(isEn ? "Image size must not exceed 15MB" : "حجم الصورة يجب ألا يتجاوز 15 ميجابايت");
      return;
    }

    updateFormData({
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
      uploadedImageHash: undefined,
    });
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error(isEn ? "Please select a valid video file" : "يرجى اختيار ملف فيديو صالح");
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      toast.error(isEn ? "Video size must not exceed 500MB" : "حجم الفيديو يجب ألا يتجاوز 500 ميجابايت");
      return;
    }

    updateFormData({
      videoFile: file,
      videoPreview: URL.createObjectURL(file),
      uploadedVideoId: undefined,
    });
  };

  const removeMedia = () => {
    if (formData.imagePreview) URL.revokeObjectURL(formData.imagePreview);
    if (formData.videoPreview) URL.revokeObjectURL(formData.videoPreview);
    updateFormData({
      imageFile: null,
      videoFile: null,
      imagePreview: undefined,
      videoPreview: undefined,
      uploadedImageHash: undefined,
      uploadedVideoId: undefined,
    });
  };

  const addCarouselCard = () => {
    if (formData.carouselCardsList.length >= 10) {
      toast.error(isEn ? "Maximum 10 cards allowed" : "الحد الأقصى هو 10 بطاقات");
      return;
    }
    const newCard = {
      id: Math.random().toString(36).substring(2, 9),
      headline: "",
      description: "",
      linkUrl: formData.linkUrl || "",
    };
    updateFormData({
      carouselCardsList: [...formData.carouselCardsList, newCard],
    });
  };

  const updateCard = (id: string, updates: Partial<typeof formData.carouselCardsList[0]>) => {
    updateFormData({
      carouselCardsList: formData.carouselCardsList.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    });
  };

  const removeCard = (id: string) => {
    if (formData.carouselCardsList.length <= 2) {
      toast.error(isEn ? "Carousel requires at least 2 cards" : "إعلان الدوّار يتطلب بطاقتين على الأقل");
      return;
    }
    updateFormData({
      carouselCardsList: formData.carouselCardsList.filter((c) => c.id !== id),
    });
  };

  const handleProductSelect = (product: SelectedStoreProduct) => {
    updateFormData({
      imagePreview: product.imageUrl,
      imageUrl: product.imageUrl,
      imageFile: null,
      uploadedImageHash: undefined,
      name: formData.name || `${product.name} - حملة v26`,
      headline: formData.headline || `${product.name} - ${product.price.toLocaleString()} ج.م`,
      headlines: formData.headlines.some(Boolean)
        ? formData.headlines
        : [`${product.name} - ${product.price.toLocaleString()} ج.م`],
      linkUrl: product.landingUrl || formData.linkUrl,
      primaryText:
        formData.primaryText ||
        product.description ||
        `اطلبي الآن ${product.name} بأفضل جودة وخامات ممتازة مع شحن سريع ومعاينة قبل الاستلام!`,
      primaryTexts: formData.primaryTexts.some(Boolean)
        ? formData.primaryTexts
        : [
            product.description ||
              `اطلبي الآن ${product.name} بأفضل جودة وخامات ممتازة مع شحن سريع ومعاينة قبل الاستلام!`,
          ],
    });
    toast.success(
      isEn
        ? `Product "${product.name}" imported with image & link!`
        : `تم استيراد بيانات "${product.name}" وتعبئة الصورة والرابط بنجاح!`,
    );
  };

  return (
    <div className="space-y-6">
      {/* Ad Name & Basic Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-foreground mb-1">
            {isEn ? "Ad Name *" : "اسم الإعلان *"}
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder={isEn ? "e.g. Summer Promo - Video 1" : "مثال: عرض الصيف - فيديو رقم 1"}
            className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm font-semibold text-foreground placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Initial Ad Status */}
        <div>
          <label className="block text-xs font-bold text-foreground mb-1">
            {isEn ? "Initial Ad Status *" : "حالة الإعلان الأولية *"}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => updateFormData({ status: "ACTIVE" })}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition ${
                formData.status === "ACTIVE"
                  ? "border-emerald-600 bg-success/10 text-success ring-1 ring-success shadow-sm"
                  : "border-slate-200 bg-white text-foreground hover:border-border"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-success" />
              {isEn ? "Active (Launch Immediately)" : "نشط (نشر وتفعيل فوراً)"}
            </button>
            <button
              type="button"
              onClick={() => updateFormData({ status: "PAUSED" })}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition ${
                formData.status === "PAUSED"
                  ? "border-amber-600 bg-warning/10 text-warning ring-1 ring-warning shadow-sm"
                  : "border-slate-200 bg-white text-foreground hover:border-border"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-warning" />
              {isEn ? "Paused (Draft Review)" : "متوقف مؤقتاً (مسودة)"}
            </button>
          </div>
        </div>

        {/* Facebook Page Selection */}
        <div>
          <label className="block text-xs font-bold text-foreground mb-1">
            {isEn ? "Facebook Identity (Page) *" : "هوية الإعلان (صفحة فيسبوك) *"}
          </label>
          {loadingPages ? (
            <div className="h-10 rounded-xl bg-muted animate-pulse" />
          ) : facebookPages.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-warning bg-warning/10 p-3 text-xs text-warning">
              <ExclamationTriangleIcon className="h-4 w-4 shrink-0 text-warning" />
              <span>
                {isEn
                  ? "No connected Facebook pages found. Please connect your page in Integration settings."
                  : "لا توجد صفحات فيسبوك متصلة. يرجى ربط صفحتك أولاً في إعدادات الربط."}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {facebookPages.map((page) => (
                <button
                  key={page.pageId}
                  type="button"
                  onClick={() => updateFormData({ pageId: page.pageId })}
                  className={`flex items-center justify-between p-3 rounded-xl border text-right transition ${
                    formData.pageId === page.pageId
                      ? "border-indigo-600 bg-primary/50 text-primary font-bold"
                      : "border-slate-200 bg-white text-foreground hover:border-border"
                  }`}
                >
                  <div className="min-w-0 pe-2">
                    <p className="text-xs font-bold truncate">{page.pageName}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">ID: {page.pageId}</p>
                  </div>
                  {formData.pageId === page.pageId && (
                    <CheckCircleIcon className="h-5 w-5 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Creative Format Selection */}
      <div>
        <label className="block text-xs font-bold text-foreground mb-2">
          {isEn ? "Creative Format *" : "نوع التصميم الإعلاني (Format) *"}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              type: "SINGLE_IMAGE",
              title: isEn ? "Single Image" : "صورة واحدة",
              desc: isEn ? "High-res feed or story image" : "صورة ثابتة بنسبة 1:1 أو 4:5 أو 9:16",
              icon: PhotoIcon,
            },
            {
              type: "SINGLE_VIDEO",
              title: isEn ? "Single Video" : "فيديو واحد",
              desc: isEn ? "Reels & Feed engaging video" : "فيديو ترويجي عالي التفاعل للريلز والفيد",
              icon: VideoCameraIcon,
            },
            {
              type: "CAROUSEL",
              title: isEn ? "Carousel" : "دوّار (Carousel)",
              desc: isEn ? "2-10 scrollable product cards" : "بطاقات منتجات متعددة قابلة للتمرير",
              icon: RectangleStackIcon,
            },
          ].map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => updateFormData({ creativeType: item.type as any })}
              className={`flex flex-col items-start p-3.5 rounded-xl border text-right transition ${
                formData.creativeType === item.type
                  ? "border-indigo-600 bg-primary/50 text-primary ring-1 ring-primary font-bold"
                  : "border-slate-200 bg-white text-foreground hover:border-border"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <item.icon className="h-5 w-5 text-primary" />
                <span className="text-xs font-black">{item.title}</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Media Upload Area */}
      {formData.creativeType === "SINGLE_IMAGE" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-foreground">
              {isEn ? "Upload Ad Image *" : "صورة وتصميم الإعلان *"}
            </label>
            <button
              type="button"
              onClick={() => setIsProductModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary px-3 py-1.5 text-xs font-black text-primary hover:bg-primary hover:text-white shadow-sm transition"
            >
              <ShoppingBagIcon className="h-4 w-4" />
              <span>{isEn ? "Pick Store Product (1-Click)" : "اختيار من منتجات المتجر (تعبئة فورية)"}</span>
            </button>
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {formData.imagePreview ? (
            <div className="relative rounded-xl border border-border overflow-hidden bg-muted p-2 max-w-sm">
              <img
                src={formData.imagePreview}
                alt="Ad Preview"
                className="w-full h-56 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={removeMedia}
                className="absolute top-4 left-4 p-1.5 rounded-full bg-muted text-white hover:bg-muted transition"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
              <p className="mt-2 text-[11px] text-center text-muted-foreground font-semibold">
                {formData.imageFile?.name} ({(formData.imageFile?.size ? (formData.imageFile.size / 1024 / 1024).toFixed(2) : 0)} MB)
              </p>
            </div>
          ) : (
            <div
              onClick={() => imageInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-8 hover:border-primary hover:bg-primary/20 cursor-pointer transition"
            >
              <PhotoIcon className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-xs font-bold text-foreground">
                {isEn ? "Click or drag image here" : "اضغط لاختيار صورة أو اسحبها هنا"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {isEn ? "PNG, JPG, WEBP up to 15MB (1080x1080 or 1080x1920 recommended)" : "الأنواع المدعومة: PNG, JPG بحد أقصى 15MB (يُفضل 1080x1080)"}
              </p>
            </div>
          )}
        </div>
      )}

      {formData.creativeType === "SINGLE_VIDEO" && (
        <div>
          <label className="block text-xs font-bold text-foreground mb-2">
            {isEn ? "Upload Ad Video *" : "رفع فيديو الإعلان *"}
          </label>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoSelect}
            className="hidden"
          />

          {formData.videoPreview ? (
            <div className="relative rounded-xl border border-border overflow-hidden bg-muted p-2 max-w-sm">
              <video
                src={formData.videoPreview}
                controls
                className="w-full h-56 object-cover rounded-lg bg-black"
              />
              <button
                type="button"
                onClick={removeMedia}
                className="absolute top-4 left-4 p-1.5 rounded-full bg-muted text-white hover:bg-muted transition"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
              <p className="mt-2 text-[11px] text-center text-muted-foreground font-semibold">
                {formData.videoFile?.name} ({(formData.videoFile?.size ? (formData.videoFile.size / 1024 / 1024).toFixed(1) : 0)} MB)
              </p>
            </div>
          ) : (
            <div
              onClick={() => videoInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-8 hover:border-primary hover:bg-primary/20 cursor-pointer transition"
            >
              <VideoCameraIcon className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-xs font-bold text-foreground">
                {isEn ? "Click or drag video here" : "اضغط لاختيار فيديو أو اسحبه هنا"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {isEn ? "MP4, MOV up to 500MB (9:16 for Reels, 1:1 or 4:5 for Feed)" : "الأنواع المدعومة: MP4, MOV بحد أقصى 500MB (يُفضل 9:16 للريلز)"}
              </p>
            </div>
          )}
        </div>
      )}

      {formData.creativeType === "CAROUSEL" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-foreground">
                {isEn ? "Carousel Cards (2 to 10)" : "بطاقات الدوّار (من 2 إلى 10 بطاقات)"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {isEn ? "Each card can show a different product or feature" : "كل بطاقة تمثل منتجاً أو ميزة برابط وعنوان مستقل"}
              </p>
            </div>
            <button
              type="button"
              onClick={addCarouselCard}
              className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-bold text-white hover:bg-muted transition"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              {isEn ? "Add Card" : "إضافة بطاقة"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {formData.carouselCardsList.map((card, idx) => (
              <div
                key={card.id}
                className="rounded-xl border border-border bg-white p-3 space-y-2 relative"
              >
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-xs font-black text-foreground">
                    {isEn ? `Card #${idx + 1}` : `البطاقة رقم ${idx + 1}`}
                  </span>
                  {formData.carouselCardsList.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeCard(card.id)}
                      className="text-red-500 hover:text-destructive p-1"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    {isEn ? "Headline *" : "العنوان *"}
                  </label>
                  <input
                    type="text"
                    value={card.headline}
                    onChange={(e) => updateCard(card.id, { headline: e.target.value })}
                    placeholder={isEn ? "Product name or offer" : "اسم المنتج أو ميزة العرض"}
                    className="w-full rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">
                    {isEn ? "Destination URL *" : "رابط الوجهة *"}
                  </label>
                  <input
                    type="url"
                    value={card.linkUrl}
                    onChange={(e) => updateCard(card.id, { linkUrl: e.target.value })}
                    placeholder="https://example.com/product"
                    className="w-full rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground font-mono text-left"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Store Product Picker Modal */}
      <StoreProductPickerModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSelect={handleProductSelect}
        isEn={isEn}
      />
    </div>
  );
};
