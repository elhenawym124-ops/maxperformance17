import React from "react";
import { BadgeCheck, Camera, Play, X } from "lucide-react";
import { MiniThumb, Stars } from "./types";

export const ExitIntentPopupPreview = ({ settings }: { settings?: Record<string, unknown> }) => {
  const copy = (settings?.["copy"] as Record<string, unknown>) || {};
  const title = String(copy["exitIntentTitle"] || "").trim() || "استنّى!";
  const coupon = String(copy["exitIntentCouponCode"] || "").trim() || "SAVE10";
  const desc = String(copy["exitIntentDescription"] || "").trim() || "سيب إيميلك وخد خصم 10% على أول طلب.";

  return (
    <div className="flex min-h-56 items-center justify-center rounded-xl bg-muted p-4">
      <div className="relative w-64 rounded-xl border border-border bg-white p-4 shadow-lg">
        <X className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-sm font-black text-foreground">{title}</p>
        <p className="mt-1 text-[11px] leading-5 text-foreground">{desc}</p>
        <div className="mt-2 flex items-center justify-between rounded-lg border border-dashed border-primary bg-primary/10 px-3 py-1.5 text-xs font-black text-primary">
          <span>كوبون: {coupon}</span>
        </div>
        <div className="mt-3 h-9 rounded-lg border border-border bg-muted px-3 text-[11px] leading-9 text-muted-foreground">
          بريدك الإلكتروني
        </div>
        <div className="mt-2 rounded-lg bg-muted py-2 text-center text-[11px] font-black text-white">
          استخدام الخصم
        </div>
      </div>
    </div>
  );
};

export const FakeSalePopupPreview = () => (
  <div className="flex min-h-32 items-end">
    <div className="flex w-72 items-center gap-2.5 rounded-xl border border-border bg-white p-3 shadow-md">
      <MiniThumb className="h-10 w-10" />
      <div className="min-w-0">
        <p className="truncate text-[11px] font-bold text-foreground">
          أحمد من الجيزة اشترى «فستان صيفي»
        </p>
        <p className="text-[10px] font-bold text-muted-foreground">قبل 4 دقايق</p>
      </div>
    </div>
  </div>
);

export const ExternalAffiliatePreview = () => (
  <div className="space-y-2 rounded-xl border border-border bg-white p-3.5 text-center">
    <p className="text-xs font-bold text-foreground">المنتج ده متاح من البائع الرسمي</p>
    <p className="text-[11px] leading-5 text-muted-foreground">
      الضغط على زر الشراء هينقلك للمنصة الخارجية لإتمام الطلب.
    </p>
    <div className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-4 py-2 text-[11px] font-black text-white">
      اشترِ من الموقع الرسمي
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      </svg>
    </div>
  </div>
);

export const PhotoReviewsPreview = () => (
  <div className="space-y-2.5 rounded-xl border border-border bg-white p-3">
    <div className="flex items-center justify-between">
      <Stars />
      <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-black text-success">
        <BadgeCheck className="h-3 w-3" />
        مشتري موثّق
      </span>
    </div>
    <p className="text-xs leading-6 text-foreground">
      المنتج زى الصور بالظبط، والتوصيل كان أسرع من المتوقع. جودة تستاهل.
    </p>
    <div className="flex gap-2">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted text-muted-foreground"
        >
          <Camera className="h-5 w-5" />
        </div>
      ))}
    </div>
    <p className="text-[11px] font-black text-muted-foreground">منى م. — منذ 3 أيام</p>
  </div>
);

export const VideoReviewsPreview = () => (
  <div className="overflow-hidden rounded-xl border border-border bg-white">
    <div className="relative flex aspect-video items-center justify-center bg-muted">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90">
        <Play className="h-5 w-5 fill-gray-900 text-foreground" />
      </span>
      <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-black text-white">
        0:42
      </span>
    </div>
    <div className="space-y-1.5 p-3">
      <Stars />
      <p className="text-xs leading-6 text-foreground">تقييم فيديو من سارة — شاهدي التجربة بنفسك.</p>
    </div>
  </div>
);

export const VerifiedBadgePreview = () => (
  <div className="space-y-2 rounded-xl border border-border bg-white p-3">
    <div className="flex items-center justify-between">
      <Stars />
      <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-black text-success">
        <BadgeCheck className="h-3 w-3" />
        مشتري موثّق
      </span>
    </div>
    <p className="text-xs leading-6 text-foreground">جودة تستاهل كل جنيه — هطلب تاني أكيد.</p>
    <p className="text-[11px] font-black text-muted-foreground">سلمى ع. — منذ يومين</p>
  </div>
);
