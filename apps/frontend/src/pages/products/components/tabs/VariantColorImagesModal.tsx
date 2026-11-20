import React, { useState, useMemo } from "react";
import {
  XMarkIcon,
  PhotoIcon,
  CheckIcon,
  TrashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { ProductAttribute, ProductVariant } from "../../types";
import { getImageUrl } from "../../../../utils/imageUrl";
import {
  groupVariantsByColor,
  detectGroupingAttributes,
  VariantColorGroup,
} from "../../utils/variantColorGrouping";

interface VariantColorImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  variants: ProductVariant[];
  attributes?: ProductAttribute[];
  uploadedImages?: string[];
  onBatchUpdateVariants: (
    indices: number[],
    updates: Partial<ProductVariant> | ((v: ProductVariant) => Partial<ProductVariant>)
  ) => void;
  onUploadImageForVariants?: (
    indices: number[],
    file: File
  ) => Promise<string | undefined>;
  variantSettings?: any;
  setVariantSettings?: React.Dispatch<React.SetStateAction<any>>;
}

export const VariantColorImagesModal: React.FC<VariantColorImagesModalProps> = ({
  isOpen,
  onClose,
  variants,
  attributes = [],
  uploadedImages = [],
  onBatchUpdateVariants,
  onUploadImageForVariants,
  variantSettings,
  setVariantSettings,
}) => {
  const [selectedAttrKey, setSelectedAttrKey] = useState<string>("");
  const [uploadingGroupId, setUploadingGroupId] = useState<string | null>(null);
  const [customUrlInputs, setCustomUrlInputs] = useState<Record<string, string>>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Detect available grouping attributes (e.g. Color, Size)
  const availableAttrs = useMemo(() => {
    return detectGroupingAttributes(attributes, variants);
  }, [attributes, variants]);

  const activeAttrKey = selectedAttrKey || (availableAttrs[0]?.id ?? "");

  // Group variants by selected attribute (default: color)
  const groups = useMemo(() => {
    return groupVariantsByColor(variants, attributes, activeAttrKey, variantSettings);
  }, [variants, attributes, activeAttrKey, variantSettings]);


  const syncableSavedGroups = useMemo(() => {
    return groups.filter(
      (g) => Boolean(g.savedAttributeImage || g.currentImage) && g.imagesCount < g.items.length
    );
  }, [groups]);

  if (!isOpen) return null;

  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleApplyAllSavedImages = () => {
    let count = 0;
    syncableSavedGroups.forEach((group) => {
      const img = group.savedAttributeImage || group.currentImage;
      if (img) {
        handleApplyImageToGroup(group, img);
        count += 1;
      }
    });
    if (count > 0) {
      showToast(`✓ تم تطبيق الصور بنجاح على مقاسات ${count} ألوان`);
    }
  };

  const handleApplyImageToGroup = (group: VariantColorGroup, imageUrl: string) => {
    if (!imageUrl) return;
    const indices = group.items.map((item) => item.index);

    onBatchUpdateVariants(indices, (v) => ({
      image: imageUrl,
      images:
        v.images && v.images.length > 0
          ? [imageUrl, ...v.images.filter((img) => img !== imageUrl)]
          : [imageUrl],
    }));

    // Optionally sync with variantSettings.attributeImages if available
    if (setVariantSettings && group.attributeName) {
      setVariantSettings((prev: any) => {
        const currentAttrImages = prev?.attributeImages || {};
        const attrKey = group.attributeName || "اللون";
        return {
          ...prev,
          attributeImages: {
            ...currentAttrImages,
            [attrKey]: {
              ...(currentAttrImages[attrKey] || {}),
              [group.name]: imageUrl,
            },
          },
        };
      });
    }

    showToast(`تم تطبيق الصورة على ${indices.length} مقاس للون "${group.name}"`);
  };

  const handleRemoveImageFromGroup = (group: VariantColorGroup) => {
    const indices = group.items.map((item) => item.index);
    onBatchUpdateVariants(indices, {
      image: undefined,
      images: [],
    });

    if (setVariantSettings && group.attributeName) {
      setVariantSettings((prev: any) => {
        const currentAttrImages = { ...(prev?.attributeImages || {}) };
        const attrKey = group.attributeName || "اللون";
        if (currentAttrImages[attrKey]) {
          const updatedSub = { ...currentAttrImages[attrKey] };
          delete updatedSub[group.name];
          currentAttrImages[attrKey] = updatedSub;
        }
        return {
          ...prev,
          attributeImages: currentAttrImages,
        };
      });
    }

    showToast(`تمت إزالة الصورة من مقاسات "${group.name}"`);
  };

  const handleFileUpload = async (
    group: VariantColorGroup,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const indices = group.items.map((item) => item.index);
    setUploadingGroupId(group.id);

    try {
      if (onUploadImageForVariants) {
        const uploadedUrl = await onUploadImageForVariants(indices, file);
        if (uploadedUrl) {
          handleApplyImageToGroup(group, uploadedUrl);
        }
      }
    } catch (err) {
      console.error("Error uploading image for group:", err);
    } finally {
      setUploadingGroupId(null);
      if (e.target) e.target.value = "";
    }
  };

  const handleUrlSubmit = (group: VariantColorGroup) => {
    const url = customUrlInputs[group.id]?.trim();
    if (!url) return;
    handleApplyImageToGroup(group, url);
    setCustomUrlInputs((prev) => ({ ...prev, [group.id]: "" }));
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-card rounded-xl shadow-2xl border border-border dark:border-border w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border dark:border-border bg-muted dark:bg-muted">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/40 border border-primary/60 dark:border-primary/60 flex items-center justify-center text-primary">
              <PhotoIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                تعيين صور المتغيرات حسب اللون
              </h3>
              <p className="text-xs text-muted-foreground">
                ارفع أو اختر صورة لكل لون، وسيتم تعيينها لجميع مقاسات هذا اللون تلقائياً
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="p-1.5 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground rounded-lg hover:bg-muted/60 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Filter / Top Controls */}
        <div className="px-5 py-3 bg-muted dark:bg-muted border-b border-border dark:border-border flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium">
              التجميع حسب:
            </span>
            {availableAttrs.length > 1 ? (
              <select
                value={activeAttrKey}
                onChange={(e) => setSelectedAttrKey(e.target.value)}
                className="text-xs border-border bg-card rounded-md py-1 px-2.5 text-foreground dark:text-muted-foreground"
              >
                {availableAttrs.map((attr) => (
                  <option key={attr.id} value={attr.id}>
                    {attr.name} {attr.isColor ? "(اللون)" : ""}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-semibold text-primary bg-primary/10 dark:bg-primary/30 px-2 py-0.5 rounded">
                {availableAttrs[0]?.name || "اللون"}
              </span>
            )}
          </div>

          <div className="text-muted-foreground tabular-nums">
            تم كشف <span className="font-semibold text-foreground">{groups.length}</span> مجموعة تغطي{" "}
            <span className="font-semibold text-foreground">{variants.length}</span> متغير
          </div>
        </div>

        {/* Toast Alert */}
        {successToast && (
          <div className="mx-5 mt-3 px-3.5 py-2 bg-success/10 dark:bg-success/40 border border-success dark:border-success text-success dark:text-success text-xs rounded-lg flex items-center gap-2 animate-fade-in">
            <CheckIcon className="w-4 h-4 flex-shrink-0 text-success" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Saved Attributes Quick Sync Banner */}
        {syncableSavedGroups.length > 0 && (
          <div className="mx-5 mt-3 p-3 bg-primary/80 dark:bg-primary/40 border border-primary dark:border-primary/60 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-indigo-800 dark:text-primary font-semibold">
                ✨ تم العثور على {syncableSavedGroups.length} صور ألوان محفوظة مسبقاً في خصائص المنتج!
              </span>
            </div>
            <button
              type="button"
              onClick={handleApplyAllSavedImages}
              className="px-3 py-1.5 bg-primary hover:bg-primary/90 active:scale-[0.98] text-white rounded-lg font-semibold transition shadow-sm"
            >
              تطبيق على جميع المقاسات دفعة واحدة ({syncableSavedGroups.length} ألوان)
            </button>
          </div>
        )}


        {/* Groups List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {groups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد متغيرات قابلة للتجميع حالياً.
            </div>
          ) : (
            groups.map((group) => {
              const isUploading = uploadingGroupId === group.id;
              const hasImage = Boolean(group.currentImage);
              const customUrl = customUrlInputs[group.id] || "";

              return (
                <div
                  key={group.id}
                  className="p-4 rounded-xl border border-border dark:border-border bg-card/90 hover:border-border transition-colors shadow-sm"
                >
                  {/* Group Info Header */}
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-bold text-foreground">
                        {group.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground tabular-nums">
                        {group.items.length} مقاسات / متغيرات
                      </span>

                      {/* Pill tags for sizes */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {group.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-muted dark:bg-muted border border-border dark:border-border text-foreground dark:text-muted-foreground"
                            title={item.variant.name}
                          >
                            {item.secondaryLabel || item.variant.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs">
                      {group.imagesCount === group.items.length && hasImage ? (
                        <span className="text-emerald-700 dark:text-success bg-success/10 dark:bg-success/40 border border-success dark:border-success/50 px-2 py-0.5 rounded-md font-medium">
                          ✓ مطبقة على كل المقاسات ({group.items.length})
                        </span>
                      ) : group.imagesCount > 0 ? (
                        <span className="text-amber-700 dark:text-warning bg-warning/10 dark:bg-warning/40 border border-warning dark:border-warning/50 px-2 py-0.5 rounded-md font-medium tabular-nums">
                          مطبقة على {group.imagesCount} من {group.items.length}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/80 bg-muted/50 px-2 py-0.5 rounded-md">
                          لم يتم تعيين صورة
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Image Assignment Area */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pt-2 border-t border-border dark:border-border">
                    {/* Thumbnail Preview */}
                    <div className="relative flex-shrink-0">
                      {hasImage ? (
                        <div className="relative group/thumb w-20 h-20 rounded-lg overflow-hidden border border-border dark:border-border bg-muted dark:bg-muted">
                          <img
                            src={getImageUrl(group.currentImage!) || group.currentImage}
                            alt={group.name}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImageFromGroup(group)}
                            title="إزالة الصورة من هذا اللون"
                            className="absolute top-1 right-1 bg-destructive/90 hover:bg-destructive text-white rounded p-1 shadow transition-colors"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground/80 bg-muted dark:bg-muted">
                          <PhotoIcon className="w-6 h-6 mb-1" />
                          <span className="text-[10px]">بدون صورة</span>
                        </div>
                      )}
                    </div>

                    {/* Controls: Upload & URL */}
                    <div className="flex-1 w-full space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* File Upload Button */}
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary active:scale-[0.98] rounded-lg cursor-pointer transition shadow-sm">
                          {isUploading ? (
                            <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <PhotoIcon className="w-3.5 h-3.5" />
                          )}
                          <span>{isUploading ? "جارٍ الرفع..." : "رفع صورة للون"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploading}
                            onChange={(e) => handleFileUpload(group, e)}
                            className="hidden"
                          />
                        </label>

                        {/* URL input */}
                        <div className="flex items-center gap-1 flex-1 min-w-[200px]">
                          <input
                            type="text"
                            value={customUrl}
                            onChange={(e) =>
                              setCustomUrlInputs((prev) => ({
                                ...prev,
                                [group.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleUrlSubmit(group);
                              }
                            }}
                            placeholder="أو ضع رابط الصورة هنا..."
                            className="flex-1 text-xs border-border bg-card rounded-lg py-1.5 px-2.5 text-foreground focus:ring-1 focus:ring-primary"
                          />
                          {customUrl && (
                            <button
                              type="button"
                              onClick={() => handleUrlSubmit(group)}
                              className="px-2.5 py-1.5 bg-muted hover:bg-muted dark:bg-muted dark:hover:bg-muted text-white rounded-lg text-xs font-medium transition"
                            >
                              تطبيق
                            </button>
                          )}
                        </div>
                      </div>

                      {/* One-click apply for existing/saved image */}
                      {(group.currentImage || group.savedAttributeImage) &&
                        group.imagesCount < group.items.length && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                const img = group.currentImage || group.savedAttributeImage;
                                if (img) handleApplyImageToGroup(group, img);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-success dark:text-success bg-success/10 dark:bg-success/40 border border-success dark:border-success/60 rounded-lg hover:bg-success dark:hover:bg-success/40 transition active:scale-[0.98]"
                            >
                              ⚡ تطبيق هذه الصورة على كافة مقاسات "{group.name}" ({group.items.length} مقاسات)
                            </button>
                          </div>
                        )}


                      {/* Quick pick from product gallery images if available */}
                      {uploadedImages && uploadedImages.length > 0 && (
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <span className="text-[11px] text-muted-foreground">
                            أو اختر من صور المنتج:
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {uploadedImages.slice(0, 8).map((imgUrl, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleApplyImageToGroup(group, imgUrl)}
                                title="تطبيق هذه الصورة على مقاسات هذا اللون"
                                className={`w-8 h-8 rounded border overflow-hidden transition-all hover:scale-105 active:scale-95 ${
                                  group.currentImage === imgUrl
                                    ? "ring-2 ring-primary border-primary"
                                    : "border-gray-200 dark:border-border opacity-80 hover:opacity-100"
                                }`}
                              >
                                <img
                                  src={getImageUrl(imgUrl) || imgUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-border dark:border-border bg-muted dark:bg-muted flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            يتم حفظ التعديلات تلقائياً في مسودة المنتج عند الضغط على "حفظ التغييرات" بالصفحة.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm transition active:scale-[0.98]"
          >
            تم / إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
