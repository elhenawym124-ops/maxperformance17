import React from "react";
import {
  Sparkles,
  Flame,
  Users,
  Compass,
  Store,
  Upload,
  Image as ImageIcon,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CREATIVE_STUDIO_PRESETS } from "../CreativeStudioPresets";
import type { CreativePreset, CreativeModality } from "../types";

interface CreativePresetsTabProps {
  referenceImageUrl: string | null;
  selectedPresetId: string;
  selectedModality: "ALL" | CreativeModality;
  onSetReferenceImageUrl: (url: string | null) => void;
  onSelectModality: (modality: "ALL" | CreativeModality) => void;
  onSelectPreset: (preset: CreativePreset) => void;
  refFileInputRef: React.RefObject<HTMLInputElement | null>;
  onRefImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CreativePresetsTab: React.FC<CreativePresetsTabProps> = ({
  referenceImageUrl,
  selectedPresetId,
  selectedModality,
  onSetReferenceImageUrl,
  onSelectModality,
  onSelectPreset,
  refFileInputRef,
  onRefImageUpload,
}) => {
  const filteredPresets = CREATIVE_STUDIO_PRESETS.filter((preset) =>
    selectedModality === "ALL" ? true : preset.category === selectedModality
  );

  return (
    <div className="space-y-3">
      {/* Reference Image Uploader Card */}
      <div className="p-3 rounded-xl border border-primary/80 dark:border-primary/60 bg-primary/30 dark:bg-primary/20">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-primary" />
            <h4 className="text-xs font-black text-foreground dark:text-white">
              صورة مرجعية للأسلوب (Style Reference)
            </h4>
          </div>
          {referenceImageUrl && (
            <button
              type="button"
              onClick={() => onSetReferenceImageUrl(null)}
              className="text-[10px] text-destructive hover:text-destructive flex items-center gap-0.5 cursor-pointer font-bold"
            >
              <X className="w-3 h-3" />
              <span>إلغاء المرجع</span>
            </button>
          )}
        </div>

        <input
          ref={refFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onRefImageUpload}
        />

        {referenceImageUrl ? (
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-muted border border-primary dark:border-primary">
            <img
              src={referenceImageUrl}
              alt="Style Reference"
              className="w-10 h-10 rounded-md object-cover border"
            />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-success dark:text-success flex items-center gap-1">
                <Check className="w-3 h-3" />
                مرجع الأسلوب نشط
              </span>
              <p className="text-[10px] text-muted-foreground truncate">
                سيقتبس الذكاء الاصطناعي الأسلوب والإضاءة
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refFileInputRef.current?.click()}
              className="h-7 text-[10px] px-2"
            >
              تغيير
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => refFileInputRef.current?.click()}
            className="w-full py-2 px-3 rounded-lg border border-dashed border-primary dark:border-primary hover:bg-white dark:hover:bg-muted text-primary text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>انقر لرفع صورة مرجعية للأسلوب (Pinterest / Competitor Ad)</span>
          </button>
        )}
      </div>

      {/* Modality Filter Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
        {(
          [
            { id: "ALL", label: "الكل", icon: Sparkles },
            { id: "lifestyle", label: "سياق الحياة", icon: Flame },
            { id: "on_model", label: "العارض البشري", icon: Users },
            { id: "direct_response", label: "إعلان تحويل", icon: Compass },
            { id: "packshot", label: "الكتالوج النقي", icon: Store },
          ] as const
        ).map((mod) => {
          const Icon = mod.icon;
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => onSelectModality(mod.id)}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg transition whitespace-nowrap cursor-pointer ${
                selectedModality === mod.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-muted text-foreground dark:text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{mod.label}</span>
            </button>
          );
        })}
      </div>

      {/* Presets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {filteredPresets.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          return (
            <div
              key={preset.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectPreset(preset)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectPreset(preset);
                }
              }}
              className={`text-right p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "border-indigo-600 dark:border-primary bg-primary/60 dark:bg-primary/40 shadow-xs ring-1 ring-primary"
                  : "border-slate-200 dark:border-border bg-white dark:bg-muted hover:border-border dark:hover:border-border"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      preset.badgeColor || "bg-slate-100 text-foreground border-border"
                    }`}
                  >
                    {preset.category}
                  </span>
                  <h4 className="text-xs font-bold text-foreground dark:text-white truncate">
                    {preset.labelAr}
                  </h4>
                </div>
                <p className="text-[10px] text-muted-foreground dark:text-muted-foreground line-clamp-2 leading-relaxed">
                  {preset.descriptionAr}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
