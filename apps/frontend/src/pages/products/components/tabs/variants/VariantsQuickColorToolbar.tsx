import React from "react";
import { PhotoIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { getImageUrl } from "../../../../../utils/imageUrl";
import { VariantColorGroup } from "../../../utils/variantColorGrouping";

interface VariantsQuickColorToolbarProps {
  colorGroups: VariantColorGroup[];
  activeQuickGroup: VariantColorGroup | null;
  selectedQuickColorId: string;
  setSelectedQuickColorId: (val: string) => void;
  quickCustomUrl: string;
  setQuickCustomUrl: (val: string) => void;
  isQuickUploading: boolean;
  setIsQuickUploading: (val: boolean) => void;
  uploadedImages?: string[];
  onOpenColorModal: () => void;
  applyImageToGroup: (group: VariantColorGroup, imageUrl: string) => void;
  onUploadImageForVariants?: (
    indices: number[],
    file: File,
  ) => Promise<string | undefined>;
}

export const VariantsQuickColorToolbar: React.FC<VariantsQuickColorToolbarProps> = ({
  colorGroups,
  activeQuickGroup,
  selectedQuickColorId,
  setSelectedQuickColorId,
  quickCustomUrl,
  setQuickCustomUrl,
  isQuickUploading,
  setIsQuickUploading,
  uploadedImages = [],
  onOpenColorModal,
  applyImageToGroup,
  onUploadImageForVariants,
}) => {
  if (colorGroups.length === 0) return null;

  return (
    <div className="bg-gray-50/80 dark:bg-muted border border-border dark:border-border rounded-xl p-3.5 sm:p-4 mb-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
            <PhotoIcon className="w-4 h-4 text-primary" />
            تعيين الصورة حسب اللون لجميع المقاسات:
          </span>
          <span className="text-xs text-muted-foreground">
            (اختر اللون وارفع أو ضع صورته لتطبيقها على كافة مقاساته فوراً)
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenColorModal}
          className="text-xs text-primary hover:text-primary dark:hover:text-primary font-semibold underline underline-offset-2"
        >
          إدارة صور جميع الألوان ({colorGroups.length} ألوان)...
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Color dropdown */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <label className="text-xs font-medium text-foreground whitespace-nowrap">
            اللون:
          </label>
          <select
            value={activeQuickGroup?.id || selectedQuickColorId || ""}
            onChange={(e) => {
              setSelectedQuickColorId(e.target.value);
              setQuickCustomUrl("");
            }}
            className="flex-1 text-xs border-border bg-card text-foreground rounded-lg py-1.5 px-2.5 font-semibold focus:ring-1 focus:ring-primary"
          >
            {colorGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.items.length} مقاسات) {g.imagesCount === g.items.length ? "✓" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Color Image Preview + Controls */}
        {activeQuickGroup && (
          <div className="flex items-center gap-2.5 flex-1 flex-wrap">
            {/* Thumbnail */}
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-border dark:border-border bg-card flex-shrink-0 flex items-center justify-center">
              {activeQuickGroup.currentImage || activeQuickGroup.savedAttributeImage ? (
                <img
                  src={
                    getImageUrl(activeQuickGroup.currentImage || activeQuickGroup.savedAttributeImage!) ||
                    (activeQuickGroup.currentImage || activeQuickGroup.savedAttributeImage)
                  }
                  alt={activeQuickGroup.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <PhotoIcon className="w-5 h-5 text-muted-foreground" />
              )}
            </div>

            {/* Upload button */}
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary active:scale-[0.98] rounded-lg cursor-pointer transition shadow-sm whitespace-nowrap">
              {isQuickUploading ? (
                <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <PhotoIcon className="w-3.5 h-3.5" />
              )}
              <span>{isQuickUploading ? "جارٍ الرفع..." : `رفع صورة لـ "${activeQuickGroup.name}"`}</span>
              <input
                type="file"
                accept="image/*"
                disabled={isQuickUploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !activeQuickGroup) return;
                  const indices = activeQuickGroup.items.map((it) => it.index);
                  setIsQuickUploading(true);
                  try {
                    if (onUploadImageForVariants) {
                      const uploadedUrl = await onUploadImageForVariants(indices, file);
                      if (uploadedUrl) {
                        applyImageToGroup(activeQuickGroup, uploadedUrl);
                      }
                    }
                  } catch (err) {
                    console.error("Error uploading image for quick group:", err);
                  } finally {
                    setIsQuickUploading(false);
                    if (e.target) e.target.value = "";
                  }
                }}
                className="hidden"
              />
            </label>

            {/* URL input */}
            <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
              <input
                type="text"
                value={quickCustomUrl}
                onChange={(e) => setQuickCustomUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && quickCustomUrl.trim()) {
                    e.preventDefault();
                    applyImageToGroup(activeQuickGroup, quickCustomUrl.trim());
                    setQuickCustomUrl("");
                  }
                }}
                placeholder={`رابط صورة لتطبيقها على كل مقاسات "${activeQuickGroup.name}"...`}
                className="flex-1 text-xs border-border bg-card rounded-lg py-1.5 px-2.5 text-foreground focus:ring-1 focus:ring-primary"
              />
              {quickCustomUrl.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    applyImageToGroup(activeQuickGroup, quickCustomUrl.trim());
                    setQuickCustomUrl("");
                  }}
                  className="px-3 py-1.5 bg-primary hover:bg-primary text-white rounded-lg text-xs font-semibold whitespace-nowrap active:scale-[0.98] transition shadow-sm"
                >
                  تطبيق ({activeQuickGroup.items.length} مقاسات)
                </button>
              )}
            </div>

            {/* Fast apply button */}
            {(activeQuickGroup.currentImage || activeQuickGroup.savedAttributeImage) &&
              activeQuickGroup.imagesCount < activeQuickGroup.items.length && (
                <button
                  type="button"
                  onClick={() => {
                    const img = activeQuickGroup.currentImage || activeQuickGroup.savedAttributeImage;
                    if (img) applyImageToGroup(activeQuickGroup, img);
                  }}
                  className="px-3 py-1.5 bg-success hover:bg-success active:scale-[0.98] text-white rounded-lg text-xs font-semibold whitespace-nowrap transition shadow-sm"
                >
                  ⚡ تطبيق هذه الصورة على كافة المقاسات ({activeQuickGroup.items.length})
                </button>
              )}
          </div>
        )}
      </div>

      {/* Quick Pick from Product Images */}
      {uploadedImages && uploadedImages.length > 0 && activeQuickGroup && (
        <div className="flex items-center gap-2 pt-1 border-t border-border dark:border-border flex-wrap">
          <span className="text-[11px] text-muted-foreground">
            أو اختر من صور المنتج لتعيينها لـ "{activeQuickGroup.name}":
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {uploadedImages.slice(0, 10).map((imgUrl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyImageToGroup(activeQuickGroup, imgUrl)}
                title={`تطبيق على جميع مقاسات ${activeQuickGroup.name}`}
                className={`w-7 h-7 rounded border overflow-hidden transition-all hover:scale-110 active:scale-95 ${
                  activeQuickGroup.currentImage === imgUrl
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
  );
};
