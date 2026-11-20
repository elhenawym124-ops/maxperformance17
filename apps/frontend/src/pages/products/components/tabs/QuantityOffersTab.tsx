import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { handleInsufficientWalletBalance } from "../../../../utils/marketplaceWalletHelper";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../../../services/apiClient";
import { useAuth } from "../../../../hooks/useAuthSimple";
import {
  QuantityOffer,
  createEmptyQuantityOffer,
  getDefaultQuantityOfferBuyText,
  getQuantityOfferTotals,
} from "../../../../utils/quantityOffers";

interface QuantityOffersTabProps {
  quantityOffers: QuantityOffer[];
  setQuantityOffers: React.Dispatch<React.SetStateAction<QuantityOffer[]>>;
  baseUnitPrice: number;
  currentUnitPrice: number;
  displayCurrency: string;
  hasVariants: boolean;
  productName: string;
}

const getReferenceUnitPrice = (baseUnitPrice: number, currentUnitPrice: number) =>
  Math.max(0, Number(baseUnitPrice || currentUnitPrice || 0));

export const QuantityOffersTab: React.FC<QuantityOffersTabProps> = ({
  quantityOffers,
  setQuantityOffers,
  baseUnitPrice,
  currentUnitPrice,
  displayCurrency,
  hasVariants,
  productName,
}) => {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const referenceUnitPrice = getReferenceUnitPrice(baseUnitPrice, currentUnitPrice);

  const [appStatus, setAppStatus] = React.useState<
    "loading" | "installed" | "not_installed"
  >("loading");
  const [isActivating, setIsActivating] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    const checkAppStatus = async () => {
      try {
        const response = await apiClient.get<{
          data?: { isInstalled?: boolean };
          isInstalled?: boolean;
        }>("/marketplace/apps/quantity-offers-pro");
        if (!isMounted) return;
        const isInstalled = Boolean(
          response?.data?.data?.isInstalled ??
            (response?.data as { isInstalled?: boolean })?.isInstalled,
        );
        setAppStatus(isInstalled ? "installed" : "not_installed");
      } catch {
        // Fallback: check via /my-apps
        try {
          const myAppsRes = await apiClient.get<{
            data?: Array<{ app?: { slug?: string } }>;
          }>("/my-apps");
          if (!isMounted) return;
          const apps = Array.isArray(myAppsRes?.data?.data)
            ? myAppsRes.data.data
            : [];
          const isInstalled = apps.some(
            (entry) => entry?.app?.slug === "quantity-offers-pro",
          );
          setAppStatus(isInstalled ? "installed" : "not_installed");
        } catch {
          if (isMounted) setAppStatus("not_installed");
        }
      }
    };

    void checkAppStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleActivateApp = async () => {
    setIsActivating(true);
    try {
      await apiClient.post("/marketplace/apps/quantity-offers-pro/install", {
        pricingModel: "FREE",
      });
      toast.success("تم تفعيل تطبيق عروض الكميات بنجاح لمتجرك");
      setAppStatus("installed");
      await refreshUser?.();
    } catch (error) {
      console.error("Failed to activate quantity offers app:", error);
      if (
        handleInsufficientWalletBalance(error, navigate, {
          returnUrl: location.pathname + location.search,
          appName: "عروض الكميات المتعددة",
          itemType: "app",
        })
      ) {
        return;
      }
      toast.error("فشل تفعيل التطبيق، يرجى المحاولة من صفحة الماركت بليس");
    } finally {
      setIsActivating(false);
    }
  };

  const updateOffer = React.useCallback(
    (offerId: string, updater: (offer: QuantityOffer) => QuantityOffer) => {
      setQuantityOffers((prev) =>
        prev.map((offer) =>
          offer.id === offerId ? updater(offer) : offer,
        ),
      );
    },
    [setQuantityOffers],
  );

  const addOffer = () => {
    setQuantityOffers((prev) => {
      const lastQuantity = prev.reduce(
        (maxQuantity, offer) => Math.max(maxQuantity, offer.quantity),
        1,
      );

      return [
        ...prev,
        createEmptyQuantityOffer(lastQuantity + 1, currentUnitPrice),
      ];
    });
  };

  const removeOffer = (offerId: string) => {
    setQuantityOffers((prev) => prev.filter((offer) => offer.id !== offerId));
  };

  const markAsDefault = (offerId: string) => {
    setQuantityOffers((prev) =>
      prev.map((offer) => ({
        ...offer,
        isDefault: offer.id === offerId,
      })),
    );
  };

  return (
    <div className="space-y-6 rounded-lg bg-white p-3 shadow dark:bg-muted sm:p-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 dark:border-border lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">
            عروض الكميات
          </h3>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
            أنشئ عروض 2 أو 3 أو 4 قطع لنفس المنتج، مع سعر مخفض لكل قطعة.
            سيظهر العرض على صفحة المنتج، ويمكن للعميل اختيار اللون أو المقاس لكل قطعة من نفس البلوك.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-3 py-1 font-semibold dark:bg-muted dark:text-muted-foreground">
              المنتج: {productName || "منتج جديد"}
            </span>
            <span className="rounded-full bg-success/10 px-3 py-1 font-semibold text-success dark:bg-success/30 dark:text-success">
              السعر المرجعي: {referenceUnitPrice} {displayCurrency}
            </span>
            {hasVariants ? (
              <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary dark:bg-primary/30 dark:text-primary">
                يدعم اختيار متغيرات لكل قطعة
              </span>
            ) : (
              <span className="rounded-full bg-warning/10 px-3 py-1 font-semibold text-warning dark:bg-warning/30 dark:text-warning">
                المنتج بدون variants وسيضاف العرض بضغطة واحدة
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={addOffer}
          className="inline-flex h-11 shrink-0 items-center justify-center self-start rounded-md bg-primary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary"
        >
          إضافة عرض جديد
        </button>
      </div>

      {appStatus === "not_installed" ? (
        <div className="flex flex-col gap-3.5 rounded-xl border border-warning bg-warning/90 p-4 text-warning dark:border-warning/50 dark:bg-warning/30 dark:text-warning sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning dark:text-warning" />
            <div className="space-y-1 text-sm">
              <p className="font-bold text-warning dark:text-warning">
                تطبيق عروض الكميات (Quantity Offers Pro) غير مفعّل في متجرك حالياً
              </p>
              <p className="text-xs leading-5 text-warning dark:text-warning">
                يمكنك تجهيز العروض وحفظها هنا، ولكنها لن تظهر للعملاء في صفحة المنتج حتى يتم تفعيل التطبيق.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={handleActivateApp}
              disabled={isActivating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-warning px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-warning disabled:opacity-50"
            >
              {isActivating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  جاري التفعيل...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  تفعيل التطبيق الآن
                </>
              )}
            </button>

            <Link
              to="/marketplace/quantity-offers-pro"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-warning bg-white px-3 py-2 text-xs font-semibold text-warning transition hover:bg-warning dark:border-warning dark:bg-warning/40 dark:text-warning dark:hover:bg-warning/60"
            >
              <span>صفحة التطبيق</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      ) : appStatus === "installed" ? (
        <div className="flex items-center gap-2 rounded-xl border border-success bg-success/60 px-4 py-2.5 text-xs text-success dark:border-success/40 dark:bg-success/20 dark:text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success dark:text-success" />
          <span>تطبيق عروض الكميات مفعّل في متجرك — ستظهر العروض للعملاء في صفحة المنتج فور الحفظ.</span>
        </div>
      ) : null}

      {quantityOffers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted px-4 py-8 text-center dark:border-border dark:bg-muted sm:px-6 sm:py-10">
          <p className="text-sm font-semibold text-foreground">
            لا توجد عروض كميات لهذا المنتج حتى الآن
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            ابدأ بعرض 2 قطعة أو 3 قطع، وسيظهر للعميل كبطاقة شراء مباشرة مثل الصور التي اتفقنا عليها.
          </p>
        </div>
      ) : null}

      <div className="sm:space-y-5">
        {quantityOffers.map((offer, index) => {
          const totals = getQuantityOfferTotals(offer, referenceUnitPrice);
          const previewText =
            offer.buyText ||
            getDefaultQuantityOfferBuyText(
              offer,
              referenceUnitPrice,
              displayCurrency,
            );

          return (
            <div
              key={offer.id}
              className="border-t border-border py-4 first:border-t-0 dark:border-border sm:rounded-xl sm:border sm:border-border sm:bg-muted sm:p-5 sm:py-5 sm:first:border-t sm:dark:border-border sm:dark:bg-muted"
            >
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                      عرض {index + 1}
                    </span>
                    {offer.isDefault ? (
                      <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success dark:bg-success/30 dark:text-success">
                        العرض الافتراضي
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        offer.isActive !== false
                          ? "bg-sky-50 text-info dark:bg-info/30 dark:text-info"
                          : "bg-gray-200 text-foreground dark:bg-muted dark:text-muted-foreground"
                      }`}
                    >
                      {offer.isActive !== false ? "نشط" : "متوقف"}
                    </span>
                  </div>
                  <p className="text-sm leading-6 font-semibold text-foreground">
                    {previewText}
                  </p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    الإجمالي {totals.offerTotal} {displayCurrency} • التوفير{" "}
                    {totals.savings} {displayCurrency}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => markAsDefault(offer.id)}
                    className={`rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                      offer.isDefault
                        ? "bg-emerald-600 text-white"
                        : "bg-white text-foreground ring-1 ring-inset ring-border hover:bg-muted dark:bg-muted dark:text-muted-foreground dark:ring-border dark:hover:bg-muted"
                    }`}
                  >
                    جعله افتراضي
                  </button>
                  <button
                    type="button"
                    onClick={() => removeOffer(offer.id)}
                    className="rounded-md bg-destructive px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-destructive"
                  >
                    إزالة
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 md:gap-4">
                <label className="space-y-1">
                  <span className="block text-xs font-bold text-muted-foreground">
                    عدد القطع
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={offer.quantity}
                    onChange={(event) =>
                      updateOffer(offer.id, (current) => ({
                        ...current,
                        quantity: Math.max(1, Number(event.target.value || 1)),
                        sortOrder: Math.max(1, Number(event.target.value || 1)),
                      }))
                    }
                    className="w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-border dark:bg-muted dark:text-white"
                  />
                </label>

                <label className="space-y-1">
                  <span className="block text-xs font-bold text-muted-foreground">
                    سعر القطعة داخل العرض
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={offer.unitPrice}
                    onChange={(event) =>
                      updateOffer(offer.id, (current) => ({
                        ...current,
                        unitPrice: Math.max(0, Number(event.target.value || 0)),
                      }))
                    }
                    className="w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-border dark:bg-muted dark:text-white"
                  />
                </label>

                <label className="space-y-1">
                  <span className="block text-xs font-bold text-muted-foreground">
                    نص الشراء
                  </span>
                  <input
                    type="text"
                    value={offer.buyText}
                    onChange={(event) =>
                      updateOffer(offer.id, (current) => ({
                        ...current,
                        buyText: event.target.value,
                      }))
                    }
                    placeholder={previewText}
                    className="w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-border dark:bg-muted dark:text-white"
                  />
                </label>

                <label className="space-y-1">
                  <span className="block text-xs font-bold text-muted-foreground">
                    نص مساعد
                  </span>
                  <input
                    type="text"
                    value={offer.helperText || ""}
                    onChange={(event) =>
                      updateOffer(offer.id, (current) => ({
                        ...current,
                        helperText: event.target.value,
                      }))
                    }
                    placeholder="مثل: الأكثر توفيرًا"
                    className="w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-border dark:bg-muted dark:text-white"
                  />
                </label>

                <label className="space-y-1 md:col-span-2 xl:col-span-1">
                  <span className="block text-xs font-bold text-muted-foreground">
                    وصف مساعد
                  </span>
                  <input
                    type="text"
                    value={offer.helperDescription || ""}
                    onChange={(event) =>
                      updateOffer(offer.id, (current) => ({
                        ...current,
                        helperDescription: event.target.value,
                      }))
                    }
                    placeholder="مثل: اختر لون ومقاس كل قطعة مرة واحدة"
                    className="w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-border dark:bg-muted dark:text-white"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-2 sm:mt-5 sm:gap-3 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-xl px-0 py-2 text-sm text-foreground sm:border sm:border-border sm:bg-white sm:px-4 sm:py-3 sm:dark:border-border sm:dark:bg-muted">
                  <input
                    type="checkbox"
                    checked={Boolean(offer.hideUnitPrice)}
                    onChange={(event) =>
                      updateOffer(offer.id, (current) => ({
                        ...current,
                        hideUnitPrice: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
                  />
                  إخفاء سعر القطعة في storefront
                </label>

                <label className="flex items-center gap-3 rounded-xl px-0 py-2 text-sm text-foreground sm:border sm:border-border sm:bg-white sm:px-4 sm:py-3 sm:dark:border-border sm:dark:bg-muted">
                  <input
                    type="checkbox"
                    checked={Boolean(offer.enableFreeShipping)}
                    onChange={(event) =>
                      updateOffer(offer.id, (current) => ({
                        ...current,
                        enableFreeShipping: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
                  />
                  إظهار ميزة الشحن المجاني داخل العرض
                </label>

                <label className="flex items-center gap-3 rounded-xl px-0 py-2 text-sm text-foreground sm:border sm:border-border sm:bg-white sm:px-4 sm:py-3 sm:dark:border-border sm:dark:bg-muted">
                  <input
                    type="checkbox"
                    checked={offer.isActive !== false}
                    onChange={(event) =>
                      updateOffer(offer.id, (current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
                  />
                  تفعيل العرض في صفحة المنتج
                </label>

                <div className="rounded-xl border border-dashed border-border px-3 py-3 text-sm leading-6 text-muted-foreground dark:border-border dark:text-muted-foreground sm:px-4">
                  {hasVariants
                    ? "سيظهر داخل العرض اختيار لون/مقاس لكل قطعة، مع زر لنسخ اختيار القطعة الأولى على باقي القطع."
                    : "لأن المنتج بدون variants، سيضيف العرض العدد الكامل مباشرة إلى السلة بسعر العرض."}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuantityOffersTab;
