import React from "react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../../hooks/useCurrency";
import type { OrderSourceReport } from "./IncompleteReportsTypes";

interface IncompleteReportsSourcesProps {
  orderSources: OrderSourceReport[];
}

export const IncompleteReportsSources: React.FC<
  IncompleteReportsSourcesProps
> = ({ orderSources }) => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();

  const sourceMeta: Record<string, { label: string; color: string }> = {
    facebook: {
      label: t("orders.sourceFacebook", "فيسبوك (Facebook)"),
      color: "bg-primary",
    },
    instagram: {
      label: t("orders.sourceInstagram", "إنستغرام (Instagram)"),
      color: "bg-gradient-to-r from-primary to-primary",
    },
    tiktok: {
      label: t("orders.sourceTikTok", "تيك توك (TikTok)"),
      color: "bg-muted dark:dark:bg-muted",
    },
    snapchat: {
      label: t("orders.sourceSnapchat", "سناب شات (Snapchat)"),
      color: "bg-warning",
    },
    google: {
      label: t("orders.sourceGoogle", "إعلانات جوجل (Google)"),
      color: "bg-destructive",
    },
    direct: {
      label: t("orders.sourceDirect", "مباشر / بدون إعلان"),
      color: "bg-muted",
    },
    storefront: {
      label: t("orders.sourceStorefront", "المتجر"),
      color: "bg-primary",
    },
    ai_conversation: {
      label: t("orders.sourceAutoConversation", "محادثة ذكية"),
      color: "bg-primary",
    },
    internal_push: {
      label: t("orders.sourceInternalPush", "إدخال داخلي"),
      color: "bg-warning",
    },
    manual: {
      label: t("orders.sourceManual", "يدوي"),
      color: "bg-success",
    },
    woocommerce: {
      label: t("orders.sourceWooCommerce", "ووكومرس"),
      color: "bg-success",
    },
    api: {
      label: t("orders.sourceAPI", "API"),
      color: "bg-primary",
    },
    import: {
      label: t("orders.sourceImport", "استيراد"),
      color: "bg-primary",
    },
  };

  const unknownSourceMeta = {
    label: t("orders.sourceUnknown", "غير محدد"),
    color: "bg-muted-foreground",
  };

  const totalOrderSources = orderSources.reduce(
    (sum, s) => sum + s.count,
    0
  );

  return (
    <section className="bg-card rounded-xl p-4 sm:p-5 shadow-2xs border border-border/70 space-y-4">
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-foreground mb-1">
          {t("orders.incompleteOrderSources", "مصادر السلات غير المكتملة")}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t(
            "orders.incompleteOrderSourcesHint",
            "القنوات الإعلانية والمنصات التي دخل منها العملاء الذين تركوا سلاتهم دون إتمام"
          )}
        </p>
      </div>

      {orderSources.length ? (
        <div className="space-y-3">
          {/* Stacked bar */}
          <div
            className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted/60"
            dir="ltr"
          >
            {orderSources.map((s) => {
              if (s.count <= 0 || totalOrderSources <= 0) return null;
              const meta = sourceMeta[s.source] || unknownSourceMeta;
              return (
                <div
                  key={s.source}
                  className={`h-full ${meta.color}`}
                  style={{
                    width: `${(s.count / totalOrderSources) * 100}%`,
                  }}
                />
              );
            })}
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {orderSources.map((s) => {
              const meta = sourceMeta[s.source] || unknownSourceMeta;
              return (
                <div
                  key={s.source}
                  className="flex items-center justify-between gap-3 p-2 rounded-lg bg-muted/20 border border-border/60 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`h-2.5 w-2.5 rounded-full shrink-0 ${meta.color}`}
                    />
                    <span className="text-foreground truncate text-xs font-medium">
                      {meta.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono tabular-nums">
                    <span className="font-bold text-foreground text-xs">
                      {s.count.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatPrice(s.value)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground py-6 text-center">
          لا توجد مصادر مسجلة للسلات في هذه الفترة
        </p>
      )}
    </section>
  );
};

export default IncompleteReportsSources;
