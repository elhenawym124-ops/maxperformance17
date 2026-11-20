import React from "react";
import { ShoppingCart } from "lucide-react";
import {
  PlacementCard,
  StatusPill,
  PlacementMetric,
  PlacementPreview,
  PreviewPill,
  SelectField,
  TextField,
} from "../controls/SettingFields";
import { JsonRecord, formatRate } from "../../types/appSettingsTypes";

interface UpsellCartDrawerSectionProps {
  active: boolean;
  cartPlacementEnabled: boolean;
  modulesSettings: JsonRecord;
  uiSettings: JsonRecord;
  copySettings: JsonRecord;
  upsellCenterMetrics: {
    cartUpsellViews: number;
    cartUpsellQuickAdds: number;
  };
  updateAtPath: (path: string, value: unknown) => void;
}

export const UpsellCartDrawerSection: React.FC<UpsellCartDrawerSectionProps> = ({
  active,
  cartPlacementEnabled,
  modulesSettings,
  uiSettings,
  copySettings,
  upsellCenterMetrics,
  updateAtPath,
}) => {
  return (
    <div
      id="upsell-cart-drawer"
      className={active ? "scroll-mt-24" : "hidden"}
    >
      <PlacementCard
        icon={<ShoppingCart size={20} />}
        eyebrow="Cart Drawer"
        title="السلة"
        description="هذا الجزء يركّز على رفع قيمة السلة بسرعة من الـ cart drawer. يعتمد على نفس محرك cross-sell و bought together، لكنه يملك copy وstyle خاصين به."
        status={
          <>
            <StatusPill
              active={cartPlacementEnabled}
              activeLabel="السلة جاهزة"
              inactiveLabel="السلة غير نشطة"
            />
            <StatusPill
              active={Boolean(modulesSettings["crossSell"])}
              activeLabel="Related داخل السلة"
              inactiveLabel="Related متوقف"
            />
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <PlacementMetric
            label="Cart Views"
            value={`${upsellCenterMetrics.cartUpsellViews}`}
            hint="مرات ظهور اقتراحات الـ upsell داخل الـ cart drawer."
          />
          <PlacementMetric
            label="Quick Adds"
            value={`${upsellCenterMetrics.cartUpsellQuickAdds}`}
            hint="عدد الإضافات السريعة من داخل السلة."
          />
          <PlacementMetric
            label="Quick Add Rate"
            value={formatRate(
              upsellCenterMetrics.cartUpsellQuickAdds,
              upsellCenterMetrics.cartUpsellViews,
            )}
            hint="نسبة تحويل مشاهدات السلة إلى Quick Add."
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <PlacementPreview
            title="كيف ستظهر داخل الـ cart drawer"
            description="المستخدم يفتح السلة ليراجع الطلب، ثم يشاهد اقتراحًا واحدًا أو أكثر بخطوة شراء أسرع من صفحة المنتج."
            badge={<PreviewPill label="Cart Drawer" tone="blue" />}
          >
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-white p-4 dark:border-border dark:bg-muted">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-foreground">
                    Your cart
                  </div>
                  <PreviewPill label="Drawer" tone="neutral" />
                </div>
                <div className="mt-3 space-y-3">
                  {[1, 2].map((item) => (
                    <div
                      key={`cart-line-${item}`}
                      className="grid grid-cols-[52px_1fr_auto] items-center gap-3 rounded-xl bg-muted p-3 dark:bg-muted"
                    >
                      <div className="h-12 rounded-xl bg-gradient-to-br from-slate-200 via-slate-100 to-slate-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800" />
                      <div>
                        <div className="h-3 w-2/3 rounded-full bg-muted dark:bg-muted" />
                        <div className="mt-2 h-3 w-1/3 rounded-full bg-muted dark:bg-muted" />
                      </div>
                      <div className="h-3 w-10 rounded-full bg-muted dark:bg-muted" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-primary bg-primary/80 p-4 dark:border-primary/40 dark:bg-primary/20">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <PreviewPill
                        label={String(copySettings["cartUpsellBadge"] || "Complete the order")}
                        tone="green"
                      />
                    </div>
                    <div className="mt-2 text-sm font-bold text-foreground">
                      {String(copySettings["cartUpsellTitle"] || "Add one more item before checkout")}
                    </div>
                    <p className="mt-1 text-xs leading-6 text-foreground dark:text-muted-foreground">
                      {String(
                        copySettings["cartUpsellDescription"] ||
                          "اقتراحات سريعة بدون مغادرة السلة.",
                      )}
                    </p>
                  </div>
                  <PreviewPill
                    label={String(uiSettings["cartUpsellStyle"] || "stacked")}
                    tone="blue"
                  />
                </div>

                <div className="mt-3 rounded-xl border border-white/70 bg-white p-3 shadow-sm dark:border-border dark:bg-muted">
                  <div className="grid grid-cols-[56px_1fr_auto] items-center gap-3">
                    <div className="h-14 rounded-xl bg-gradient-to-br from-slate-200 via-white to-slate-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800" />
                    <div>
                      <div className="h-3 w-3/4 rounded-full bg-muted dark:bg-muted" />
                      <div className="mt-2 h-3 w-1/3 rounded-full bg-muted dark:bg-muted" />
                    </div>
                    <div className="rounded-full bg-primary px-3 py-1.5 text-[10px] font-bold text-white">
                      {String(copySettings["quickAddLabel"] || "Quick add")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PlacementPreview>

          <div className="rounded-[28px] border border-border bg-muted p-5 dark:border-border dark:bg-muted">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary dark:text-primary">
              User Intent
            </div>
            <h3 className="mt-2 text-xl font-black text-foreground">
              لماذا هذا الشكل مهم؟
            </h3>
            <div className="mt-4 space-y-3">
              {[
                "العميل داخل السلة أصلًا، لذلك يجب أن يكون الاقتراح أسرع وأخف من صفحة المنتج.",
                "أفضل CTA هنا هو quick add أو choose options بدون تشتيت أو شبكة منتجات كبيرة.",
                "النسخة يجب أن تكون قصيرة جدًا لأنها تظهر بجوار subtotal وقرار الدفع.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-border bg-white p-4 text-sm leading-7 text-foreground dark:border-border dark:bg-muted dark:text-muted-foreground"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-4">
            <SelectField
              label="Cart Upsell Style"
              value={String(uiSettings["cartUpsellStyle"] || "stacked")}
              options={[
                { value: "stacked", label: "Stacked" },
                { value: "compact", label: "Compact" },
                { value: "editorial", label: "Editorial" },
              ]}
              onChange={(value) => updateAtPath("ui.cartUpsellStyle", value)}
            />
            <TextField
              label="Quick Add Label"
              value={String(copySettings["quickAddLabel"] || "")}
              onChange={(value) => updateAtPath("copy.quickAddLabel", value)}
            />
            <TextField
              label="Choose Options Label"
              value={String(copySettings["chooseOptionsLabel"] || "")}
              onChange={(value) => updateAtPath("copy.chooseOptionsLabel", value)}
            />
            <div className="rounded-xl border border-dashed border-border p-4 text-sm leading-7 text-foreground dark:border-border dark:text-muted-foreground">
              السلة تستخدم أول منتج موجود حاليًا كمصدر للاقتراحات، ثم تجلب
              related و bundle بحسب التفعيل أعلى الصفحة.
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Cart Upsell Badge"
              value={String(copySettings["cartUpsellBadge"] || "")}
              onChange={(value) => updateAtPath("copy.cartUpsellBadge", value)}
            />
            <TextField
              label="Cart Upsell Title"
              value={String(copySettings["cartUpsellTitle"] || "")}
              onChange={(value) => updateAtPath("copy.cartUpsellTitle", value)}
            />
            <TextField
              label="Cart Upsell Description"
              value={String(copySettings["cartUpsellDescription"] || "")}
              onChange={(value) => updateAtPath("copy.cartUpsellDescription", value)}
            />
            <TextField
              label="Bundle Variant Hint"
              value={String(copySettings["bundleVariantHint"] || "")}
              onChange={(value) => updateAtPath("copy.bundleVariantHint", value)}
            />
          </div>
        </div>
      </PlacementCard>
    </div>
  );
};
