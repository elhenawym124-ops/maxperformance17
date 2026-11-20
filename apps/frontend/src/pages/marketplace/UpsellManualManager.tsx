import React from "react";
import { useNavigate } from "react-router-dom";
import { Link2, Loader2, Sparkles } from "lucide-react";
import { RelationBadge } from "./components/upsell-manual/RelationBadge";
import { BaseProductSelector } from "./components/upsell-manual/BaseProductSelector";
import { RelationImpactMap } from "./components/upsell-manual/RelationImpactMap";
import { RelationTabSelector } from "./components/upsell-manual/RelationTabSelector";
import { CandidateProductPicker } from "./components/upsell-manual/CandidateProductPicker";
import { LinkedProductsReorderList } from "./components/upsell-manual/LinkedProductsReorderList";
import { useUpsellManualManagerData } from "./hooks/useUpsellManualManagerData";
import type { UpsellManualManagerProps } from "./types/upsellManualTypes";

export default function UpsellManualManager({ active }: UpsellManualManagerProps) {
  const navigate = useNavigate();
  const {
    catalogLoading,
    catalogError,
    productQuery,
    setProductQuery,
    candidateQuery,
    setCandidateQuery,
    selectedProduct,
    relationBuckets,
    activeRelation,
    setActiveRelation,
    productLoading,
    saving,
    isDirty,
    filteredProducts,
    candidateProducts,
    currentRelationProducts,
    currentRelationConfig,
    loadProductRelations,
    resetSelectedProduct,
    addProductToRelation,
    removeProductFromRelation,
    moveProduct,
    saveRelations,
  } = useUpsellManualManagerData(active);

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-border bg-white p-6 shadow-sm dark:border-border dark:bg-muted">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primary dark:bg-primary/30 dark:text-primary">
              <Link2 size={14} />
              Manual Links
            </div>
            <h2 className="mt-3 text-2xl font-black text-foreground">
              مدير ربط المنتجات
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-foreground dark:text-muted-foreground">
              اختر المنتج الأساسي، ثم اربط له المنتجات المشابهة أو المكملة أو الأعلى قيمة
              من نفس الشاشة بدل الدخول لكل منتج يدويًا.
            </p>
          </div>

          <RelationBadge
            label={isDirty ? "Unsaved changes" : "Saved"}
            tone={isDirty ? "amber" : "green"}
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <BaseProductSelector
            productQuery={productQuery}
            setProductQuery={setProductQuery}
            catalogLoading={catalogLoading}
            catalogError={catalogError}
            selectedProduct={selectedProduct}
            filteredProducts={filteredProducts}
            relationBuckets={relationBuckets}
            loadProductRelations={loadProductRelations}
            resetSelectedProduct={resetSelectedProduct}
            onNavigateToProductEdit={(productId) => navigate(`/products/${productId}/edit`)}
          />

          <RelationImpactMap />
        </div>
      </div>

      <div className="rounded-[28px] border border-border bg-white p-6 shadow-sm dark:border-border dark:bg-muted">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-primary dark:text-primary">
              Link Builder
            </div>
            <h3 className="mt-2 text-2xl font-black text-foreground">
              اختر نوع الربط الذي تريد إدارته
            </h3>
            <p className="mt-2 text-sm leading-7 text-foreground dark:text-muted-foreground">
              كل تبويب هنا يغيّر مجموعة مختلفة من العلاقات للمنتج المحدد.
            </p>
          </div>

          {productLoading ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-semibold text-foreground dark:bg-muted dark:text-muted-foreground">
              <Loader2 size={16} className="animate-spin" />
              جارٍ تحميل المنتج...
            </div>
          ) : null}
        </div>

        <RelationTabSelector
          activeRelation={activeRelation}
          setActiveRelation={setActiveRelation}
          relationBuckets={relationBuckets}
        />

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
          <CandidateProductPicker
            selectedProduct={selectedProduct}
            candidateQuery={candidateQuery}
            setCandidateQuery={setCandidateQuery}
            candidateProducts={candidateProducts}
            activeRelation={activeRelation}
            currentRelationConfig={currentRelationConfig}
            addProductToRelation={addProductToRelation}
          />

          <LinkedProductsReorderList
            currentRelationProducts={currentRelationProducts}
            activeRelation={activeRelation}
            moveProduct={moveProduct}
            removeProductFromRelation={removeProductFromRelation}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-primary bg-primary/80 px-5 py-4 dark:border-primary/40 dark:bg-primary/20">
          <div className="text-sm leading-7 text-primary dark:text-primary">
            <span className="font-bold">مهم:</span> الحفظ هنا يحدّث
            {" `relatedProducts` و`crossSellProducts` و`upsellProducts` "}
            داخل Metadata المنتج المحدد فقط.
          </div>

          <button
            type="button"
            onClick={saveRelations}
            disabled={!selectedProduct || saving || productLoading}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {saving ? "جارٍ الحفظ..." : "حفظ روابط المنتج"}
          </button>
        </div>
      </div>
    </section>
  );
}
