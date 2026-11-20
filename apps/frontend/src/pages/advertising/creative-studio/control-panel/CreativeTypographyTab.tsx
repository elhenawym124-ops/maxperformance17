import React from "react";
import {
  Palette,
  Lock,
  Unlock,
  Bookmark,
  Upload,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CanvasOverlaySettings, BrandKitSettings } from "../types";

interface CreativeTypographyTabProps {
  overlay: CanvasOverlaySettings;
  onUpdateOverlay: (updates: Partial<CanvasOverlaySettings>) => void;
  brandKit: BrandKitSettings;
  onUpdateBrandKit: (updates: Partial<BrandKitSettings>) => void;
  logoFileInputRef: React.RefObject<HTMLInputElement | null>;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  storeLogoUrl?: string | null;
}

export const CreativeTypographyTab: React.FC<CreativeTypographyTabProps> = ({
  overlay,
  onUpdateOverlay,
  brandKit,
  onUpdateBrandKit,
  logoFileInputRef,
  onLogoUpload,
  storeLogoUrl,
}) => {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-[11px] font-bold text-foreground dark:text-muted-foreground">
          عنوان الإعلان الرئيسي (Headline)
        </Label>
        <Input
          value={overlay.headline}
          onChange={(e) => onUpdateOverlay({ headline: e.target.value })}
          className="h-8 text-xs mt-1"
          placeholder="عنوان العرض الرئيسي..."
        />
      </div>

      <div>
        <Label className="text-[11px] font-bold text-foreground dark:text-muted-foreground">
          النص التوضيحي (Subheadline)
        </Label>
        <Input
          value={overlay.subheadline}
          onChange={(e) => onUpdateOverlay({ subheadline: e.target.value })}
          className="h-8 text-xs mt-1"
          placeholder="تفاصيل العرض والشحن..."
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[11px] font-bold text-foreground dark:text-muted-foreground">
            شارة الخصم (Badge)
          </Label>
          <Input
            value={overlay.discountBadge}
            onChange={(e) => onUpdateOverlay({ discountBadge: e.target.value })}
            className="h-8 text-xs mt-1"
            placeholder="خصم خاص..."
          />
        </div>

        <div>
          <Label className="text-[11px] font-bold text-foreground dark:text-muted-foreground">
            زر الحث على الشراء (CTA)
          </Label>
          <Input
            value={overlay.callToAction}
            onChange={(e) => onUpdateOverlay({ callToAction: e.target.value })}
            className="h-8 text-xs mt-1"
            placeholder="اطلب الآن..."
          />
        </div>
      </div>

      {/* Brand Kit & Color Lock */}
      <div className="p-3 rounded-xl border border-border dark:border-border bg-white dark:bg-muted space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-primary" />
            <h4 className="text-xs font-black text-foreground dark:text-white">
              تثبيت هوية وألوان البراند (Brand Kit)
            </h4>
          </div>
          <button
            type="button"
            onClick={() => onUpdateBrandKit({ isLocked: !brandKit.isLocked })}
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
              brandKit.isLocked
                ? "bg-emerald-100 text-success dark:bg-success dark:text-success"
                : "bg-slate-100 text-foreground dark:bg-muted dark:text-muted-foreground"
            }`}
          >
            {brandKit.isLocked ? (
              <Lock className="w-3 h-3" />
            ) : (
              <Unlock className="w-3 h-3" />
            )}
            <span>{brandKit.isLocked ? "الهوية مثبتة" : "غير مثبت"}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] font-bold text-muted-foreground mb-1 block">
              اللون الأساسي
            </Label>
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={brandKit.primaryColor}
                onChange={(e) => {
                  onUpdateBrandKit({ primaryColor: e.target.value });
                  onUpdateOverlay({ primaryColor: e.target.value });
                }}
                className="w-6 h-6 rounded border cursor-pointer flex-shrink-0"
              />
              <Input
                value={brandKit.primaryColor}
                onChange={(e) => {
                  onUpdateBrandKit({ primaryColor: e.target.value });
                  onUpdateOverlay({ primaryColor: e.target.value });
                }}
                className="h-6 text-[10px] font-mono px-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-[10px] font-bold text-muted-foreground mb-1 block">
              لون التمييز (Accent)
            </Label>
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={brandKit.accentColor}
                onChange={(e) => {
                  onUpdateBrandKit({ accentColor: e.target.value });
                  onUpdateOverlay({ accentColor: e.target.value });
                }}
                className="w-6 h-6 rounded border cursor-pointer flex-shrink-0"
              />
              <Input
                value={brandKit.accentColor}
                onChange={(e) => {
                  onUpdateBrandKit({ accentColor: e.target.value });
                  onUpdateOverlay({ accentColor: e.target.value });
                }}
                className="h-6 text-[10px] font-mono px-1"
              />
            </div>
          </div>
        </div>

        <div>
          <Label className="text-[10px] font-bold text-muted-foreground mb-1 block">
            طابع الهوية البصرية
          </Label>
          <select
            value={brandKit.aestheticMood}
            onChange={(e) =>
              onUpdateBrandKit({ aestheticMood: e.target.value as any })
            }
            className="w-full h-7 px-2 text-[11px] rounded-lg border border-border dark:border-border bg-white dark:bg-muted text-foreground dark:text-white"
          >
            <option value="minimalist-luxury">
              فخامة هادئة (Minimalist Luxury)
            </option>
            <option value="bold-vibrant">
              طاقة وتباين عالي (Bold High-Energy)
            </option>
            <option value="organic-earthy">
              طبيعي وأورجانيك (Warm Organic Earthy)
            </option>
            <option value="cyber-dark">
              سايبر وتقني داكن (Cyber Dark Titanium)
            </option>
            <option value="soft-pastel">
              ناعم وباستيل (Soft Pastel Delicate)
            </option>
          </select>
        </div>
      </div>

      {/* Brand Logo Overlay */}
      <div className="p-3 rounded-xl border border-border dark:border-border bg-white dark:bg-muted space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-primary" />
            <h4 className="text-xs font-black text-foreground dark:text-white">
              لوجو العلامة التجارية (Brand Logo)
            </h4>
          </div>
          <button
            type="button"
            onClick={() =>
              onUpdateOverlay({
                logo: {
                  ...(overlay.logo || {
                    url: null,
                    position: "top-right",
                    size: "md",
                    opacity: 1,
                  }),
                  show: !overlay.logo?.show,
                },
              })
            }
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
              overlay.logo?.show
                ? "bg-indigo-100 text-primary dark:bg-primary dark:text-primary"
                : "bg-slate-100 text-muted-foreground"
            }`}
          >
            {overlay.logo?.show ? "مفعل" : "معطل"}
          </button>
        </div>

        <input
          ref={logoFileInputRef}
          type="file"
          accept="image/png, image/webp"
          className="hidden"
          onChange={onLogoUpload}
        />

        {overlay.logo?.url ? (
          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-muted dark:bg-muted border">
            <img
              src={overlay.logo.url}
              alt="Logo preview"
              className="w-8 h-8 object-contain rounded border bg-white/20"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold text-foreground dark:text-muted-foreground block truncate">
                تم تعيين الشعار
              </span>
              <p className="text-[9px] text-muted-foreground">
                يظهر فوق الكانفاس والتصدير بدقة 2K
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoFileInputRef.current?.click()}
              className="h-6 text-[10px] px-2"
            >
              تغيير
            </Button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => logoFileInputRef.current?.click()}
              className="w-full py-1.5 px-2 rounded-lg border border-dashed border-border dark:border-border hover:bg-muted text-foreground dark:text-muted-foreground text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3 h-3" />
              <span>رفع شعار المتجر (PNG مفرغ شفاف)</span>
            </button>
            {storeLogoUrl && (
              <button
                type="button"
                onClick={() =>
                  onUpdateOverlay({
                    logo: {
                      ...(overlay.logo || {
                        position: "top-right",
                        size: "md",
                        opacity: 1,
                      }),
                      url: storeLogoUrl,
                      show: true,
                    },
                  })
                }
                className="w-full py-1 px-2 rounded-lg border border-primary dark:border-primary/80 bg-primary/70 dark:bg-primary/40 text-primary dark:text-primary text-[11px] font-bold hover:bg-primary transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-primary" />
                <span>استخدام لوجو المتجر الافتراضي</span>
              </button>
            )}
          </div>
        )}

        {/* Logo Position & Size */}
        {overlay.logo?.show && (
          <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-border dark:border-border">
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                الموضع
              </Label>
              <select
                value={overlay.logo.position || "top-right"}
                onChange={(e) =>
                  onUpdateOverlay({
                    logo: {
                      ...overlay.logo!,
                      position: e.target.value as any,
                    },
                  })
                }
                className="w-full h-7 px-1.5 text-xs rounded border bg-white dark:bg-muted"
              >
                <option value="top-right">أعلى اليمين</option>
                <option value="top-left">أعلى اليسار</option>
                <option value="bottom-right">أسفل اليمين</option>
                <option value="bottom-left">أسفل اليسار</option>
              </select>
            </div>

            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                الحجم
              </Label>
              <select
                value={overlay.logo.size || "md"}
                onChange={(e) =>
                  onUpdateOverlay({
                    logo: { ...overlay.logo!, size: e.target.value as any },
                  })
                }
                className="w-full h-7 px-1.5 text-xs rounded border bg-white dark:bg-muted"
              >
                <option value="sm">صغير</option>
                <option value="md">متوسط</option>
                <option value="lg">كبير</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
