import React from "react";
import {
  CheckIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  ServerStackIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { FacebookPixelSettings } from "../types";

interface TrackingEventDefinition {
  id: string;
  name: string;
  code: string;
  pixelKey: keyof FacebookPixelSettings;
  capiKey?: keyof FacebookPixelSettings;
  description: string;
  isHighValue?: boolean;
}

const TRACKING_EVENTS: TrackingEventDefinition[] = [
  {
    id: "purchase",
    name: "إتمام الشراء",
    code: "Purchase",
    pixelKey: "pixelTrackPurchase",
    capiKey: "capiTrackPurchase",
    description: "أهم حدث في الحملات لتحسين الـ ROAS وتحديد العائد الإعلاني",
    isHighValue: true,
  },
  {
    id: "initiateCheckout",
    name: "بدء إنهاء الطلب",
    code: "InitiateCheckout",
    pixelKey: "pixelTrackInitiateCheckout",
    capiKey: "capiTrackInitiateCheckout",
    description: "عند انتقال العميل إلى صفحة الدفع أو إدخال بيانات التوصيل",
    isHighValue: true,
  },
  {
    id: "addToCart",
    name: "إضافة إلى السلة",
    code: "AddToCart",
    pixelKey: "pixelTrackAddToCart",
    capiKey: "capiTrackAddToCart",
    description: "عند نقر العميل على زر أضف للسلة في المتجر أو صفحات الهبوط",
    isHighValue: true,
  },
  {
    id: "viewContent",
    name: "عرض المنتج",
    code: "ViewContent",
    pixelKey: "pixelTrackViewContent",
    capiKey: "capiTrackViewContent",
    description: "تتبع زيارة صفحات تفاصيل المنتجات للاستهداف الديناميكي (DPA)",
  },
  {
    id: "pageView",
    name: "عرض الصفحات",
    code: "PageView",
    pixelKey: "pixelTrackPageView",
    capiKey: "capiTrackPageView",
    description: "تتبع عام لجميع زيارات الصفحات والمتجر",
  },
  {
    id: "search",
    name: "عمليات البحث",
    code: "Search",
    pixelKey: "pixelTrackSearch",
    capiKey: "capiTrackSearch",
    description: "تتبع الكلمات المفتاحية التي يبحث عنها العملاء داخل المتجر",
  },
  {
    id: "addToWishlist",
    name: "قائمة الرغبات",
    code: "AddToWishlist",
    pixelKey: "pixelTrackAddToWishlist",
    description: "حفظ المنتجات في المفضلة للشراء لاحقاً (Web Browser)",
  },
];

interface TrackingMatrixTableProps {
  settings: Partial<FacebookPixelSettings>;
  onChange: (updated: Partial<FacebookPixelSettings>) => void;
}

export const TrackingMatrixTable: React.FC<TrackingMatrixTableProps> = ({
  settings,
  onChange,
}) => {
  const handleEnableAll = () => {
    onChange({
      pixelTrackPageView: true,
      pixelTrackViewContent: true,
      pixelTrackAddToCart: true,
      pixelTrackInitiateCheckout: true,
      pixelTrackPurchase: true,
      pixelTrackSearch: true,
      pixelTrackAddToWishlist: true,
      capiTrackPageView: true,
      capiTrackViewContent: true,
      capiTrackAddToCart: true,
      capiTrackInitiateCheckout: true,
      capiTrackPurchase: true,
      capiTrackSearch: true,
    });
  };

  return (
    <section className="border border-border dark:border-border bg-white dark:bg-muted rounded-xl overflow-hidden shadow-xs">
      {/* Table Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-border dark:border-border bg-muted dark:bg-muted">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-foreground">
            مصفوفة تتبع الأحداث الهجينة (Hybrid Tracking Matrix)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            التحكم المتزامن بأحداث المتصفح والسيرفر مع ضمان منع التكرار (Deduplication)
          </p>
        </div>

        <button
          type="button"
          onClick={handleEnableAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary dark:text-primary bg-primary/10 dark:bg-primary/40 hover:bg-primary dark:hover:bg-primary/50 border border-primary/60 dark:border-primary/60 transition-all active:scale-[0.97]"
        >
          <SparklesIcon className="w-3.5 h-3.5" />
          <span>تفعيل الإعدادات الموصى بها</span>
        </button>
      </div>

      {/* Desktop & Tablet Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-border dark:border-border bg-muted dark:bg-muted text-foreground dark:text-muted-foreground font-semibold">
              <th className="px-4 sm:px-6 py-3">الحدث والمعيار</th>
              <th className="px-4 sm:px-6 py-3 text-center">
                <div className="inline-flex items-center gap-1.5">
                  <GlobeAltIcon className="w-4 h-4 text-primary" />
                  <span>متصفح الويب (Browser)</span>
                </div>
              </th>
              <th className="px-4 sm:px-6 py-3 text-center">
                <div className="inline-flex items-center gap-1.5">
                  <ServerStackIcon className="w-4 h-4 text-success" />
                  <span>السيرفر (CAPI)</span>
                </div>
              </th>
              <th className="px-4 sm:px-6 py-3 text-center hidden md:table-cell">
                فك الازدواجية
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-border">
            {TRACKING_EVENTS.map((event) => {
              const isPixelOn = Boolean(settings[event.pixelKey]);
              const isCapiOn = event.capiKey ? Boolean(settings[event.capiKey]) : false;
              const isDeduplicated = isPixelOn && isCapiOn && Boolean(settings.eventDeduplicationEnabled);

              return (
                <tr
                  key={event.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-muted transition-colors"
                >
                  {/* Event Name & Spec */}
                  <td className="px-4 sm:px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-xs sm:text-sm">
                        {event.name}
                      </span>
                      <code
                        dir="ltr"
                        className="px-2 py-0.5 rounded bg-muted dark:bg-muted text-foreground font-mono text-[11px] border border-border dark:border-border"
                      >
                        {event.code}
                      </code>
                      {event.isHighValue && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 dark:bg-warning/40 text-warning dark:text-warning border border-warning/60 dark:border-warning/60 font-semibold">
                          أولوية قصوى
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {event.description}
                    </p>
                  </td>

                  {/* Browser Pixel Switch */}
                  <td className="px-4 sm:px-6 py-3.5 text-center">
                    <label className="inline-flex items-center cursor-pointer justify-center">
                      <input
                        type="checkbox"
                        checked={isPixelOn}
                        onChange={(e) =>
                          onChange({ [event.pixelKey]: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer dark:bg-muted peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-border peer-checked:bg-indigo-600 relative" />
                    </label>
                  </td>

                  {/* Server CAPI Switch */}
                  <td className="px-4 sm:px-6 py-3.5 text-center">
                    {event.capiKey ? (
                      <label className="inline-flex items-center cursor-pointer justify-center">
                        <input
                          type="checkbox"
                          checked={isCapiOn}
                          onChange={(e) =>
                            onChange({ [event.capiKey!]: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer dark:bg-muted peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-border peer-checked:bg-emerald-600 relative" />
                      </label>
                    ) : (
                      <span className="text-gray-400 text-[11px]">—</span>
                    )}
                  </td>

                  {/* Deduplication Status */}
                  <td className="px-4 sm:px-6 py-3.5 text-center hidden md:table-cell">
                    {isDeduplicated ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-success dark:text-success font-medium font-mono">
                        <ShieldCheckIcon className="w-4 h-4" />
                        <span>event_id active</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {isPixelOn || isCapiOn ? "أحادي القناة" : "معطل"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
