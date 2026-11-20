import React from "react";
import { useProductConsolidatorController } from "./components/consolidator/useProductConsolidatorController";
import { ConsolidatorGroupStep } from "./components/consolidator/ConsolidatorGroupStep";
import { ConsolidatorItemsSelectStep } from "./components/consolidator/ConsolidatorItemsSelectStep";
import { ConsolidatorNewProductStep } from "./components/consolidator/ConsolidatorNewProductStep";
import { ConsolidatorVariantsStep } from "./components/consolidator/ConsolidatorVariantsStep";
import { ConsolidatorOriginalsActionStep } from "./components/consolidator/ConsolidatorOriginalsActionStep";

export const ProductConsolidatorPage: React.FC = () => {
  const {
    groups,
    loading,
    error,
    selectedGroup,
    setSelectedGroup,
    selectedItems,
    setSelectedItems,
    newName,
    setNewName,
    newDescription,
    setNewDescription,
    newSlug,
    setNewSlug,
    originalsAction,
    setOriginalsAction,
    variantEdits,
    setVariantEdits,
    executing,
    result,
    activeGroup,
    selectedItemsList,
    canExecute,
    loadGroups,
    selectAllInGroup,
    toggleItem,
    setVariantEdit,
    handleExecute,
  } = useProductConsolidatorController();

  return (
    <div className="min-h-screen bg-muted dark:bg-muted py-6 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <div className="bg-white dark:bg-muted rounded-xl shadow-lg border border-border dark:border-border p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 bg-primary dark:bg-primary/30 text-primary dark:text-primary text-xs font-medium px-3 py-1 rounded-full">
                  أداة دمج المنتجات
                </span>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                دمج المنتجات المكررة
              </h1>
              <p className="text-muted-foreground text-sm">
                ادمج منتجات متعددة في منتج واحد جديد مع الاحتفاظ بـ SKU لكل منتج كمتغير مستقل
              </p>
            </div>
            <button
              type="button"
              onClick={loadGroups}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary disabled:opacity-50 cursor-pointer"
              disabled={loading}
            >
              تحديث القائمة
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-destructive/10 dark:bg-destructive/20 border-r-4 border-destructive p-3 rounded-l-md text-sm text-destructive dark:text-destructive">
              {error}
            </div>
          )}

          {result && (
            <div className="mb-4 bg-success/10 dark:bg-success/20 border-r-4 border-success p-3 rounded-l-md text-sm text-success dark:text-success">
              {result.message}
              {result.productId && (
                <a href={`/products/${result.productId}/edit`} className="underline ms-2">
                  عرض المنتج الجديد
                </a>
              )}
            </div>
          )}

          {/* Step 1: Group selection */}
          <ConsolidatorGroupStep
            groups={groups}
            selectedGroup={selectedGroup}
            onSelectGroup={(groupName) => {
              setSelectedGroup(groupName);
              setSelectedItems({});
              setVariantEdits({});
            }}
          />

          {/* Step 2: Select products */}
          {activeGroup && (
            <ConsolidatorItemsSelectStep
              activeGroup={activeGroup}
              selectedCount={selectedItemsList.length}
              selectedItems={selectedItems}
              onSelectAll={selectAllInGroup}
              onToggleItem={toggleItem}
            />
          )}

          {/* Step 3: New product details */}
          {activeGroup && (
            <ConsolidatorNewProductStep
              newName={newName}
              onNewNameChange={setNewName}
              newSlug={newSlug}
              onNewSlugChange={setNewSlug}
              newDescription={newDescription}
              onNewDescriptionChange={setNewDescription}
            />
          )}

          {/* Step 4: Variant details */}
          <ConsolidatorVariantsStep
            selectedItemsList={selectedItemsList}
            variantEdits={variantEdits}
            onSetVariantEdit={setVariantEdit}
          />

          {/* Step 5: Originals action */}
          {activeGroup && (
            <ConsolidatorOriginalsActionStep
              originalsAction={originalsAction}
              onSetOriginalsAction={setOriginalsAction}
            />
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-border">
            <button
              type="button"
              onClick={handleExecute}
              disabled={!canExecute || executing}
              className="px-6 py-2.5 bg-gradient-to-l from-primary to-primary text-white font-semibold rounded-lg hover:from-primary hover:to-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {executing ? "جاري الدمج..." : "تنفيذ الدمج"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductConsolidatorPage;
