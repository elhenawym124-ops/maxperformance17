import React from "react";
import { Eye, CheckCircle2, Clock, Truck } from "lucide-react";
import type { PostPurchaseOfferConfig } from "../../../types/postPurchaseOffer";

interface PostPurchaseOfferLivePreviewProps {
  offer: PostPurchaseOfferConfig;
  previewDevice: "mobile" | "desktop";
  calculatedOfferPrice: number;
  calculatedSavings: number;
  calculatedSavingsPercent: number;
  setPreviewDevice: (device: "mobile" | "desktop") => void;
}

export const PostPurchaseOfferLivePreview: React.FC<
  PostPurchaseOfferLivePreviewProps
> = ({
  offer,
  previewDevice,
  calculatedOfferPrice,
  calculatedSavings,
  calculatedSavingsPercent,
  setPreviewDevice,
}) => {
  return (
    <div className="lg:col-span-5 sticky top-6 space-y-3">
      {/* Preview Controls Bar */}
      <div className="flex items-center justify-between bg-card p-2.5 rounded-xl border border-border shadow-sm text-xs">
        <span className="font-bold text-foreground flex items-center gap-1.5">
          <Eye className="w-4 h-4 text-primary" />
          معاينة حية للمشتري
        </span>

        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setPreviewDevice("mobile")}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              previewDevice === "mobile"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            موبايل
          </button>
          <button
            type="button"
            onClick={() => setPreviewDevice("desktop")}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
              previewDevice === "desktop"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            كمبيوتر
          </button>
        </div>
      </div>

      {/* Device Mockup Shell */}
      <div
        className={`mx-auto transition-all duration-300 border-4 border-border dark:border-border rounded-xl overflow-hidden bg-muted dark:bg-muted shadow-2xl p-3 text-xs ${
          previewDevice === "mobile" ? "max-w-[360px]" : "w-full"
        }`}
      >
        {/* Mockup Screen Content */}
        <div className="space-y-3 scale-95 origin-top">
          {/* Step 1: Order received banner */}
          <div className="p-2.5 rounded-xl bg-success/15 border border-success text-success dark:text-success text-[11px] leading-tight flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <div>
              <p className="font-bold">تم استلام طلبك الأساسي بنجاح!</p>
              <p className="text-[10px] text-success dark:text-success">
                طلبك محفوظ ومؤكد. انتظر لحظة...
              </p>
            </div>
          </div>

          {/* Step 2: Timer */}
          <div className="p-2 rounded-lg bg-warning/15 border border-warning text-warning dark:text-warning text-[11px] font-bold flex justify-between items-center">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-warning animate-pulse" />
              ينتهي العرض خلال:
            </span>
            <span className="font-mono font-black tabular-nums bg-warning text-white px-2 py-0.5 rounded">
              0{offer.timerMinutes}:00
            </span>
          </div>

          {/* Step 3: Offer Card */}
          <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm space-y-3">
            {offer.badgeText && (
              <div className="text-center">
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-destructive/10 text-destructive border border-destructive">
                  {offer.badgeText}
                </span>
              </div>
            )}

            <div className="text-center space-y-1">
              <h4 className="font-black text-xs leading-snug text-foreground text-balance">
                {offer.title || "عنوان العرض"}
              </h4>
              <p className="text-[10px] text-muted-foreground line-clamp-2">
                {offer.subtitle}
              </p>
            </div>

            {/* Product Image */}
            <div className="aspect-square rounded-xl overflow-hidden border border-border/80 bg-muted/20 relative">
              {offer.productImage ? (
                <img
                  src={offer.productImage}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">
                  صورة المنتج المعروض
                </div>
              )}
              {calculatedSavingsPercent > 0 && (
                <div className="absolute top-2 start-2 px-2 py-0.5 rounded-md bg-destructive text-white font-bold text-[10px]">
                  وفر {calculatedSavingsPercent}%
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-center space-y-0.5">
              <div className="flex items-baseline justify-center gap-2">
                <span className="font-black text-base text-success tabular-nums">
                  {calculatedOfferPrice} ج.م
                </span>
                {offer.originalPrice > calculatedOfferPrice && (
                  <span className="line-through text-muted-foreground text-xs tabular-nums">
                    {offer.originalPrice} ج.م
                  </span>
                )}
              </div>
              {calculatedSavings > 0 && (
                <p className="text-[10px] font-bold text-success tabular-nums">
                  وفرت {calculatedSavings} ج.م!
                </p>
              )}
              {offer.freeShipping && (
                <p className="text-[9px] text-muted-foreground flex items-center justify-center gap-1 pt-1">
                  <Truck className="w-3 h-3 text-success" />
                  شحن مجاني مع نفس الطرد
                </p>
              )}
            </div>

            {/* Features */}
            {offer.features && offer.features.length > 0 && (
              <ul className="space-y-1 text-[10px] text-foreground">
                {offer.features.slice(0, 3).map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-success shrink-0" />
                    <span className="line-clamp-1">{f}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Buttons */}
            <div className="space-y-1.5 pt-2">
              <button
                type="button"
                className="w-full py-2.5 px-3 rounded-xl bg-success text-white font-black text-xs shadow-md"
              >
                {offer.acceptButtonText || "نعم! أضف هذا العرض لطلبي"}
              </button>
              <p className="text-[10px] text-muted-foreground text-center underline">
                {offer.declineButtonText || "لا شكراً، اكتفِ بطلبي الأصلي فقط"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
