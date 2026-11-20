import React from "react";
import { Sparkles } from "lucide-react";
import type { FormData } from "../../types";
import { AdPlacementPreview } from "../AdPlacementPreview";
import { MultiAdvertiserToggle } from "../MultiAdvertiserToggle";
import type { CreativeSourceType } from "./types";

interface CreativePreviewSidebarProps {
  formData: FormData;
  handleChange: (field: keyof FormData, value: any) => void;
  pageName: string;
  creativeSource: CreativeSourceType;
  isEn: boolean;
}

export const CreativePreviewSidebar: React.FC<CreativePreviewSidebarProps> = ({
  formData,
  handleChange,
  pageName,
  creativeSource,
  isEn,
}) => {
  return (
    <div className="lg:sticky lg:top-6 space-y-4">
      <AdPlacementPreview
        formData={formData}
        pageName={pageName || (isEn ? "Your Page Name" : "اسم صفحتك")}
        isExistingPost={creativeSource === "EXISTING_POST"}
      />

      {/* Advantage+ Creative */}
      <div className="bg-gradient-to-r from-success to-success dark:from-success/30 dark:to-success/30 p-4 rounded-xl border border-success dark:border-success/50 space-y-3 mt-4">
        <h4 className="font-medium text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-success" />
          Advantage+ Creative
        </h4>
        {creativeSource === "EXISTING_POST" ? (
          <div className="rounded-lg bg-white/80 dark:bg-muted p-3 text-xs text-muted-foreground border border-success dark:border-success leading-relaxed">
            {isEn
              ? "Advantage+ creative modifications (copy variations, image touchups, auto-crop) are not applicable for existing page posts because the content is already published organically on your Facebook Page."
              : "تحسينات Advantage+ الذكية (توليد النصوص، تعديل الصور، المد التلقائي) غير متاحة للمنشورات الحالية لأن المنشور منشور بالفعل على صفحة فيسبوك بهيئته الحالية."}
          </div>
        ) : (
          <>
            <p className="text-xs text-foreground dark:text-muted-foreground">
              {isEn ? "Let Facebook automatically optimize your ad for maximum performance" : "دع Facebook يحسن إعلانك تلقائياً للحصول على أفضل أداء"}
            </p>

            <label className="flex items-center justify-between p-3 bg-card border border-border dark:border-border rounded-lg">
              <div>
                <span className="text-sm font-medium text-foreground">
                  {isEn ? "Text Optimization" : "تحسين النص"}
                </span>
                <p className="text-xs text-muted-foreground">
                  {isEn ? "Generate multiple variations of ad copy" : "إنشاء نسخ متعددة من النص"}
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.textGeneration}
                onChange={(e) => {
                  handleChange("textGeneration", e.target.checked);
                  if (e.target.checked) handleChange("advantageCreative", true);
                }}
                className="w-5 h-5 text-success rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-card border border-border dark:border-border rounded-lg">
              <div>
                <span className="text-sm font-medium text-foreground">
                  {isEn ? "Image & Contrast Enhancement" : "تحسين الصورة والتباين"}
                </span>
                <p className="text-xs text-muted-foreground">
                  {isEn ? "Automatically adjust brightness and contrast" : "تعديل السطوع والتباين تلقائياً"}
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.imageEnhancement}
                onChange={(e) => {
                  handleChange("imageEnhancement", e.target.checked);
                  if (e.target.checked) handleChange("advantageCreative", true);
                }}
                className="w-5 h-5 text-success rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-card border border-border dark:border-border rounded-lg">
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-foreground">
                    {isEn ? "Smart Reel Expansion (9:16)" : "المد الذكي للريلز (9:16)"}
                  </span>
                  <span className="rounded bg-success dark:bg-success/60 px-1 py-0.5 text-[9px] font-bold text-success dark:text-success">v26</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isEn ? "Expand image dimensions to fill Stories & Reels screens automatically" : "تمديد أبعاد الصور لتملأ شاشة Stories و Reels تلقائياً"}
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(formData.expandImage)}
                onChange={(e) => {
                  handleChange("expandImage", e.target.checked);
                  if (e.target.checked) handleChange("advantageCreative", true);
                }}
                className="w-5 h-5 text-success rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-card border border-border dark:border-border rounded-lg">
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-foreground">
                    {isEn ? "Highlight Positive Comments" : "إبراز التعليقات الإيجابية"}
                  </span>
                  <span className="rounded bg-success dark:bg-success/60 px-1 py-0.5 text-[9px] font-bold text-success dark:text-success">v26</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isEn ? "Pin top customer reviews below the ad as social proof" : "تثبيت آراء العملاء الممتازة أسفل الإعلان كإثبات اجتماعي"}
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(formData.relevantComments)}
                onChange={(e) => {
                  handleChange("relevantComments", e.target.checked);
                  if (e.target.checked) handleChange("advantageCreative", true);
                }}
                className="w-5 h-5 text-success rounded"
              />
            </label>
          </>
        )}
      </div>

      {/* Multi-Advertiser Ads */}
      <div className="mt-4">
        <MultiAdvertiserToggle
          enabled={formData.multiAdvertiserAds !== false}
          onChange={(enabled) => handleChange("multiAdvertiserAds", enabled)}
        />
      </div>
    </div>
  );
};
