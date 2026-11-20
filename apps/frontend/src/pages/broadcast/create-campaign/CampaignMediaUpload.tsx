import React from "react";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface CampaignMediaUploadProps {
  images: File[];
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
}

export const CampaignMediaUpload: React.FC<CampaignMediaUploadProps> = ({
  images,
  onImageChange,
  onRemoveImage,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        <PhotoIcon className="h-5 w-5 inline ms-1" />
        إرفاق صور (اختياري)
      </label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-md hover:border-border dark:hover:border-border transition-colors">
        <div className="space-y-1 text-center">
          <PhotoIcon className="mx-auto h-12 w-12 text-muted-foreground/80" />
          <div className="flex text-sm text-foreground dark:text-muted-foreground">
            <label
              htmlFor="images"
              className="relative cursor-pointer bg-card rounded-md font-medium text-primary hover:text-primary dark:hover:text-primary"
            >
              <span>اختر الصور</span>
              <input
                id="images"
                name="images"
                type="file"
                multiple
                accept="image/*"
                onChange={onImageChange}
                className="sr-only"
              />
            </label>
            <p className="pe-1">أو اسحب الصور هنا</p>
          </div>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, GIF حتى 10MB
          </p>
        </div>
      </div>

      {images.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-foreground mb-2">
            الصور المرفقة ({images.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`صورة ${index + 1}`}
                  className="h-20 w-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => onRemoveImage(index)}
                  aria-label={`حذف صورة ${index + 1}`}
                  className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
