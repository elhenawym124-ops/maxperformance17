import React from "react";
import { Image, Eye, Layout, Sparkles } from "lucide-react";
import type { FormData } from "../../types";

interface CreativeFormatSelectorProps {
  formData: FormData;
  handleChange: (field: keyof FormData, value: any) => void;
  getError: (field: string) => string;
  isEn: boolean;
}

export const CreativeFormatSelector: React.FC<CreativeFormatSelectorProps> = ({
  formData,
  handleChange,
  getError,
  isEn,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-3">
        {isEn ? "Creative Format" : "نوع المحتوى"}
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => handleChange("creativeType", "SINGLE_IMAGE")}
          className={`p-4 border-2 rounded-xl text-center transition-all ${
            formData.creativeType === "SINGLE_IMAGE"
              ? "border-blue-500 bg-primary/10 dark:bg-primary/40 text-primary dark:text-primary"
              : "border-gray-200 dark:border-border hover:border-border text-foreground bg-card"
          }`}
        >
          <Image
            className={`w-8 h-8 mx-auto mb-2 ${formData.creativeType === "SINGLE_IMAGE" ? "text-blue-500" : "text-muted-foreground/80"}`}
          />
          <div className="font-medium text-sm">{isEn ? "Image" : "صورة"}</div>
        </button>

        <button
          type="button"
          onClick={() => handleChange("creativeType", "SINGLE_VIDEO")}
          className={`p-4 border-2 rounded-xl text-center transition-all ${
            formData.creativeType === "SINGLE_VIDEO"
              ? "border-blue-500 bg-primary/10 dark:bg-primary/40 text-primary dark:text-primary"
              : "border-gray-200 dark:border-border hover:border-border text-foreground bg-card"
          }`}
        >
          <Eye
            className={`w-8 h-8 mx-auto mb-2 ${formData.creativeType === "SINGLE_VIDEO" ? "text-blue-500" : "text-muted-foreground/80"}`}
          />
          <div className="font-medium text-sm">{isEn ? "Video" : "فيديو"}</div>
        </button>

        <button
          type="button"
          onClick={() => {
            handleChange("creativeType", "CAROUSEL");
            if (formData.carouselCards.length === 0) {
              handleChange("carouselCards", [
                {
                  id: "1",
                  imageUrl: "",
                  headline: "",
                  description: "",
                  linkUrl: "",
                },
                {
                  id: "2",
                  imageUrl: "",
                  headline: "",
                  description: "",
                  linkUrl: "",
                },
              ]);
            }
          }}
          className={`p-4 border-2 rounded-xl text-center transition-all ${
            formData.creativeType === "CAROUSEL"
              ? "border-blue-500 bg-primary/10 dark:bg-primary/40 text-primary dark:text-primary"
              : "border-gray-200 dark:border-border hover:border-border text-foreground bg-card"
          }`}
        >
          <Layout
            className={`w-8 h-8 mx-auto mb-2 ${formData.creativeType === "CAROUSEL" ? "text-blue-500" : "text-muted-foreground/80"}`}
          />
          <div className="font-medium text-sm">{isEn ? "Carousel" : "دوّار"}</div>
          <div className="text-xs text-muted-foreground">{isEn ? "2-10 cards" : "2-10 بطاقات"}</div>
        </button>

        <button
          type="button"
          disabled
          aria-disabled="true"
          title={isEn ? "Flexible format in progress" : "التنسيق المرن قيد التجهيز"}
          className="p-4 border-2 rounded-xl text-center transition-all border-border dark:border-border bg-muted dark:bg-muted text-muted-foreground/80 opacity-60 cursor-not-allowed"
        >
          <Sparkles
            className="w-8 h-8 mx-auto mb-2 text-muted-foreground/80"
          />
          <div className="font-medium text-sm">{isEn ? "Flexible" : "مرن"}</div>
          <div className="text-xs text-muted-foreground">{isEn ? "Soon" : "قريبًا"}</div>
        </button>
      </div>

      {getError("creativeType") && (
        <p className="mt-2 text-sm text-destructive">
          {getError("creativeType")}
        </p>
      )}
    </div>
  );
};
