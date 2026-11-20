import React from "react";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { getImageUrl } from "../../../../../utils/imageUrl";
import { ProductVariant, VariantColorGroup } from "./types";

interface VariantCardImageProps {
  idx: number;
  variant: ProductVariant;
  updateVariant: (idx: number, field: keyof ProductVariant, value: any) => void;
  handleVariantImageChange: (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  group?: VariantColorGroup;
  copiedGroupToast: { idx: number; message: string } | null;
  setCopiedGroupToast: React.Dispatch<
    React.SetStateAction<{ idx: number; message: string } | null>
  >;
  applyImageToGroup: (group: VariantColorGroup, imageUrl: string) => void;
}

export const VariantCardImage: React.FC<VariantCardImageProps> = ({
  idx,
  variant,
  updateVariant,
  handleVariantImageChange,
  group,
  copiedGroupToast,
  setCopiedGroupToast,
  applyImageToGroup,
}) => {
  const availImg = group?.currentImage || group?.savedAttributeImage;
  const isCopied = copiedGroupToast?.idx === idx;

  return (
    <div className="border-b border-border pb-4">
      <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center">
        <PhotoIcon className="h-4 w-4 ms-1" />
        صورة المتغير
      </h5>
      <div className="flex items-center gap-4">
        {variant.image ? (
          <div className="relative group">
            <img
              src={getImageUrl(variant.image) || variant.image}
              alt=""
              className="h-24 w-24 object-cover rounded-lg border border-border"
            />
            <button
              type="button"
              onClick={() => updateVariant(idx, "image", undefined)}
              className="absolute -top-2 -right-2 bg-destructive dark:bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-destructive dark:hover:bg-destructive"
            >
              ×
            </button>
          </div>
        ) : (
          <label className="h-24 w-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center bg-muted dark:bg-muted cursor-pointer hover:border-primary dark:hover:border-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors">
            <PhotoIcon className="h-8 w-8 text-muted-foreground/80" />
            <span className="text-xs text-muted-foreground mt-1">
              رفع صورة
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleVariantImageChange(idx, e)}
              className="hidden"
            />
          </label>
        )}
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={variant.image || ""}
              onChange={(e) => updateVariant(idx, "image", e.target.value)}
              placeholder="أو أدخل رابط الصورة"
              className="flex-1 border-border bg-card text-foreground rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
            />
            <label className="px-3 py-2 bg-primary dark:bg-primary text-white rounded-md text-sm cursor-pointer hover:bg-primary dark:hover:bg-primary flex items-center gap-1">
              <PhotoIcon className="h-4 w-4" />
              رفع
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleVariantImageChange(idx, e)}
                className="hidden"
              />
            </label>
          </div>

          {/* Quick batch action for this specific color */}
          {group && group.items.length > 1 && (
            <>
              {!variant.image && availImg && (
                <div className="pt-1.5 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">
                    صورة لون "{group.name}" المتاحة:
                  </span>
                  <button
                    type="button"
                    onClick={() => updateVariant(idx, "image", availImg)}
                    className="inline-flex items-center gap-1 text-xs text-primary dark:text-primary bg-primary/10 dark:bg-primary/40 border border-primary dark:border-primary/60 rounded px-2 py-0.5 hover:bg-primary"
                  >
                    استخدام لهذا المقاس
                  </button>
                  <button
                    type="button"
                    onClick={() => applyImageToGroup(group, availImg)}
                    className="inline-flex items-center gap-1 text-xs text-success dark:text-success bg-success/10 dark:bg-success/40 border border-success dark:border-success/60 rounded px-2.5 py-0.5 hover:bg-success font-semibold"
                  >
                    ⚡ تطبيق على كل مقاسات "{group.name}" ({group.items.length})
                  </button>
                </div>
              )}

              {variant.image && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      applyImageToGroup(group, variant.image!);
                      setCopiedGroupToast({
                        idx,
                        message: `✓ تم تطبيق الصورة على جميع مقاسات "${group.name}" (${group.items.length})`,
                      });
                      setTimeout(() => setCopiedGroupToast(null), 3500);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-primary dark:text-primary bg-primary/10 dark:bg-primary/40 hover:bg-primary dark:hover:bg-primary/60 border border-primary dark:border-primary/60 rounded-md px-2.5 py-1.5 transition-colors shadow-sm active:scale-[0.98]"
                    title={`نسخ هذه الصورة إلى جميع مقاسات ${group.name}`}
                  >
                    <PhotoIcon className="h-3.5 w-3.5" />
                    <span>
                      {isCopied
                        ? copiedGroupToast.message
                        : `تطبيق هذه الصورة على جميع مقاسات "${group.name}" (${group.items.length} مقاسات)`}
                    </span>
                  </button>
                </div>
              )}
            </>
          )}

          <p className="text-xs text-muted-foreground">
            صورة مختلفة لهذا المتغير (اختياري)
          </p>
        </div>
      </div>
    </div>
  );
};
