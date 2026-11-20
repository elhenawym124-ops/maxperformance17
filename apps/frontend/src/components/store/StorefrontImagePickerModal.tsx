import React, { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { tToast } from "../../utils/i18n-toast";
import imageGalleryService, {
  GalleryImage,
} from "../../services/imageGalleryService";
import uploadService from "../../services/uploadService";

interface StorefrontImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  selectedUrl?: string;
  title?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  uploadLabel?: string;
}

const StorefrontImagePickerModal: React.FC<StorefrontImagePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  selectedUrl,
  title,
  description,
  emptyTitle,
  emptyDescription,
  uploadLabel,
}) => {
  const uploadInputId = useId();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const loadImages = async () => {
      try {
        setIsLoading(true);
        const nextImages = await imageGalleryService.listImages();
        setImages(nextImages);
      } catch (error) {
        console.error("Error loading storefront image gallery:", error);
        tToast.error("StorefrontImagePickerModal.unable_load_cffc");
      } finally {
        setIsLoading(false);
      }
    };

    void loadImages();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const validation = uploadService.validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error || "الملف غير صالح");
      return;
    }

    try {
      setIsUploading(true);
      const uploadedImage = await imageGalleryService.uploadImage(file);
      setImages((current) => [
        uploadedImage,
        ...current.filter((image) => image.id !== uploadedImage.id),
      ]);
      onSelectImage(uploadedImage.url);
      tToast.success("StorefrontImagePickerModal.msg_6895");
      onClose();
    } catch (error) {
      console.error("Error uploading storefront image:", error);
      tToast.error("StorefrontImagePickerModal.msg_6cd9");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 px-4 py-6 flex items-center justify-center">
      <div className="w-full max-w-5xl max-h-[85vh] overflow-hidden rounded-xl bg-white dark:bg-muted border border-border dark:border-border shadow-2xl">
        <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-border dark:border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {title || "اختيار صورة"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {description ||
                "اختر صورة محفوظة أو ارفع صورة جديدة لتستخدمها مباشرة في القسم."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted dark:text-muted-foreground dark:hover:bg-muted"
            aria-label="إغلاق نافذة الصور"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-border dark:border-border bg-muted dark:bg-muted">
          <div className="text-sm text-muted-foreground">
            {images.length > 0
              ? `${images.length} صورة متاحة`
              : "لا توجد صور محفوظة بعد"}
          </div>

          <div className="flex items-center gap-2">
            <input
              id={uploadInputId}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              disabled={isUploading}
            />
            <label
              htmlFor={uploadInputId}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold cursor-pointer ${
                isUploading
                  ? "bg-gray-200 text-muted-foreground dark:bg-muted dark:text-muted-foreground"
                  : "bg-indigo-600 text-white hover:bg-primary"
              }`}
            >
              {isUploading ? "جاري الرفع..." : uploadLabel || "رفع صورة جديدة"}
            </label>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(85vh-152px)] px-6 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
                <p className="text-sm text-muted-foreground">
                  جاري تحميل الصور...
                </p>
              </div>
            </div>
          ) : images.length === 0 ? (
            <div className="flex items-center justify-center h-64 rounded-xl border border-dashed border-border dark:border-border bg-muted dark:bg-muted text-center">
              <div className="space-y-2 px-6">
                <div className="text-lg font-semibold text-foreground">
                  {emptyTitle || "لا توجد صور محفوظة بعد"}
                </div>
                <p className="text-sm text-muted-foreground">
                  {emptyDescription ||
                    "استخدم زر «رفع صورة جديدة» لإضافة صورك وربطها بالقسم مباشرة."}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {images.map((image) => {
                const isSelected = selectedUrl === image.url;

                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => {
                      onSelectImage(image.url);
                      onClose();
                    }}
                    className={`overflow-hidden rounded-xl border text-right transition-all ${
                      isSelected
                        ? "border-indigo-500 ring-2 ring-primary dark:ring-primary"
                        : "border-gray-200 dark:border-border hover:border-primary dark:hover:border-primary"
                    }`}
                  >
                    <div className="aspect-[16/10] bg-muted dark:bg-muted">
                      <img
                        src={image.url}
                        alt={image.filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 space-y-1">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {image.filename}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {image.url}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StorefrontImagePickerModal;
