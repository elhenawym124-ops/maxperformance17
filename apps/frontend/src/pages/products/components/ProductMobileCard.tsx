import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Product,
  getStockStatus,
  getStockStatusColor,
  getStockStatusText,
} from "./ProductsTypes";
import {
  PhotoIcon,
  EyeIcon,
  PencilIcon,
  PencilSquareIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  PaperAirplaneIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import {
  canApprove,
  canPublish,
  canReject,
  canSubmitReview,
  canUnpublish,
  getWorkflowStatusColor,
  getWorkflowStatusLabel,
} from "../utils/workflow";
import { getImageUrl } from "../../../utils/imageUrl";

type WorkflowAction =
  | "save_draft"
  | "submit_review"
  | "approve"
  | "reject"
  | "publish"
  | "unpublish";

interface ProductMobileCardProps {
  product: Product;
  selected: boolean;
  canSelect: boolean;
  onSelect: (id: string) => void;
  formatPrice: (price: number) => string;
  formatDate: (date: Date) => string;
  getStorefrontUrl: (product: Pick<Product, "id" | "slug" | "workflow"> | string) => string;
  prepareStorefrontContext: () => void;
  isEditing: boolean;
  editPrice: string;
  editStock: string;
  editSku: string;
  onEditPriceChange: (value: string) => void;
  onEditStockChange: (value: string) => void;
  onEditSkuChange: (value: string) => void;
  onSaveQuickEdit: (id: string) => void;
  onCancelQuickEdit: () => void;
  onStartQuickEdit: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  duplicatingProductId: string | null;
  workflowLoadingId: string | null;
  onWorkflowAction: (product: Product, action: WorkflowAction) => void;
  canManageWorkflow: boolean;
  canSubmitReviewWorkflow: boolean;
  canDelete: boolean;
  onDelete: (id: string) => void;
}

export const ProductMobileCard: React.FC<ProductMobileCardProps> = ({
  product,
  selected,
  canSelect,
  onSelect,
  formatPrice,
  getStorefrontUrl,
  prepareStorefrontContext,
  isEditing,
  editPrice,
  editStock,
  editSku,
  onEditPriceChange,
  onEditStockChange,
  onEditSkuChange,
  onSaveQuickEdit,
  onCancelQuickEdit,
  onStartQuickEdit,
  onDuplicate,
  duplicatingProductId,
  workflowLoadingId,
  onWorkflowAction,
  canManageWorkflow,
  canSubmitReviewWorkflow,
  canDelete,
  onDelete,
}) => {
  const { t, i18n } = useTranslation();
  const isEn = Boolean(i18n.language && i18n.language.startsWith("en"));

  const stockStatus = getStockStatus(product);
  const stockColor = getStockStatusColor(stockStatus);
  const stockText = getStockStatusText(stockStatus, isEn);
  const isWorkflowBusy = workflowLoadingId === product.id;
  const isVariableProduct = product.productType === "variable";
  const workflowLabel = getWorkflowStatusLabel(product.workflow.status, product.workflow, isEn);

  const mainImage = product.mainImage || (product.images && product.images[0]);
  const imageUrl = getImageUrl(mainImage, "thumbnail");
  const editUrl = `/products/${product.id}/edit`;

  const renderWorkflowActions = () => {
    const btnSize = "inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg transition-colors disabled:opacity-50";

    if (canSubmitReviewWorkflow && canSubmitReview(product.workflow)) {
      return (
        <button
          type="button"
          onClick={() => onWorkflowAction(product, "submit_review")}
          disabled={isWorkflowBusy}
          className={`${btnSize} text-warning hover:bg-warning/10`}
          title={isEn ? "Submit for review" : "إرسال للمراجعة"}
          aria-label={isEn ? "Submit for review" : "إرسال للمراجعة"}
        >
          <PaperAirplaneIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      );
    }

    if (canManageWorkflow && (canApprove(product.workflow) || canReject(product.workflow))) {
      return (
        <>
          <button
            type="button"
            onClick={() => onWorkflowAction(product, "approve")}
            disabled={isWorkflowBusy}
            className={`${btnSize} text-success hover:bg-success/10 dark:hover:bg-success/40`}
            title={isEn ? "Approve" : "اعتماد"}
            aria-label={isEn ? "Approve" : "اعتماد"}
          >
            <CheckCircleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
          <button
            type="button"
            onClick={() => onWorkflowAction(product, "reject")}
            disabled={isWorkflowBusy}
            className={`${btnSize} text-destructive hover:bg-destructive/10`}
            title={isEn ? "Reject" : "رفض"}
            aria-label={isEn ? "Reject" : "رفض"}
          >
            <XCircleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </>
      );
    }

    if (canManageWorkflow && canPublish(product.workflow)) {
      return (
        <button
          type="button"
          onClick={() => onWorkflowAction(product, "publish")}
          disabled={isWorkflowBusy}
          className={`${btnSize} text-success hover:bg-success/10 dark:hover:bg-success/40`}
          title={isEn ? "Publish" : "نشر"}
          aria-label={isEn ? "Publish" : "نشر"}
        >
          <CheckCircleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      );
    }

    if (canManageWorkflow && canUnpublish(product.workflow)) {
      return (
        <button
          type="button"
          onClick={() => onWorkflowAction(product, "unpublish")}
          disabled={isWorkflowBusy}
          className={`${btnSize} text-warning hover:bg-warning/10 dark:hover:bg-warning/40`}
          title={isEn ? "Unpublish" : "إلغاء النشر"}
          aria-label={isEn ? "Unpublish" : "إلغاء النشر"}
        >
          <XCircleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      );
    }

    return null;
  };

  return (
    <div
      className={`rounded-xl border p-3.5 transition-all shadow-xs ${
        selected
          ? "border-primary bg-primary/10 ring-1 ring-primary/30"
          : "border-border bg-card hover:border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        {canSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(product.id)}
            className="mt-1 h-5 w-5 rounded border-border text-primary focus:ring-primary shrink-0 cursor-pointer"
          />
        )}

        {/* Product Image - Clickable to full edit */}
        <Link
          to={editUrl}
          className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl bg-muted border border-border/70 hover:opacity-85 transition-opacity"
          title={isEn ? "Click to edit product details" : "انقر لتعديل تفاصيل المنتج"}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/80">
              <PhotoIcon className="h-6 w-6 opacity-40" />
            </div>
          )}
        </Link>

        {/* Info - Clickable Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1.5">
            <Link
              to={editUrl}
              className="truncate text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors"
              title={isEn ? "Click to edit product details" : "انقر لتعديل تفاصيل المنتج"}
            >
              {product.name}
            </Link>
            <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${stockColor}`}>
              {stockText}
            </span>
          </div>

          {/* Badges & SKU */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[10px] text-muted-foreground font-mono" dir="ltr">
              {product.sku || (isEn ? "No SKU" : "بدون SKU")}
            </span>
            {isVariableProduct && (
              <span className="rounded px-1.5 py-0.2 text-[9px] font-semibold bg-primary text-primary dark:bg-primary/40 dark:text-primary">
                {product.variantsCount} {isEn ? (product.variantsCount === 1 ? "variant" : "variants") : "متغير"}
              </span>
            )}
            {product.hasQuantityOffers && (
              <Link
                to={`/products/${product.id}/edit?tab=quantity-offers`}
                className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-semibold bg-success/10 text-success border border-success/20 hover:bg-success/20 transition-colors"
                title={isEn ? "Quantity offers available - click to edit" : "عروض الكميات متاحة - انقر للتعديل"}
              >
                <span>⚡</span>
                <span>{isEn ? "Quantity Offers" : "عروض كميات"}</span>
                {product.quantityOffersCount ? ` (${product.quantityOffersCount})` : ""}
              </Link>
            )}
            {product.isHidden && (
              <span className="inline-flex items-center rounded px-1.5 py-0.2 text-[9px] font-semibold bg-warning text-warning dark:bg-warning/40 dark:text-warning">
                <EyeSlashIcon className={`h-2.5 w-2.5 ${isEn ? "me-0.5" : "ms-0.5"}`} />
                {isEn ? "Hidden" : "مخفي"}
              </span>
            )}
            {product.workflow?.status && (product.workflow.status !== "published" || product.workflow?.unpublishedAt) && (
              <span className={`rounded px-1.5 py-0.2 text-[9px] font-semibold ${getWorkflowStatusColor(product.workflow.status, product.workflow)}`}>
                {workflowLabel}
              </span>
            )}
          </div>

          {/* Price & Stock */}
          <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/70">
            <span className="text-xs sm:text-sm font-black text-primary">
              {formatPrice(product.price)}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {isEn ? "Stock:" : "المخزون:"}{" "}
              <strong className={`font-mono ${product.stock <= 0 ? "text-destructive" : "text-foreground"}`}>
                {product.stock}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Quick Edit Mode */}
      {isEditing ? (
        <div className="mt-3 border-t border-border/70 pt-3 space-y-2.5 bg-muted/60 -mx-3.5 -mb-3.5 p-3.5 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">
              {isEn ? "Quick Edit" : "تعديل سريع"}
            </span>
            <Link
              to={editUrl}
              className="inline-flex items-center gap-1 text-[11px] text-primary font-bold hover:underline"
            >
              <span>{isEn ? "Full Details Edit" : "تعديل كامل للتفاصيل"}</span>
              <ArrowTopRightOnSquareIcon className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">
                {isEn ? "Price" : "السعر"}
              </label>
              <input
                type="number"
                value={editPrice}
                onChange={(e) => onEditPriceChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground font-mono focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">
                {isEn ? "Stock" : "المخزون"}
              </label>
              <input
                type="number"
                value={editStock}
                onChange={(e) => onEditStockChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground font-mono focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground mb-0.5">
                SKU
              </label>
              <input
                type="text"
                value={editSku}
                onChange={(e) => onEditSkuChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground font-mono focus:ring-2 focus:ring-primary"
                dir="ltr"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancelQuickEdit}
              className="min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
            >
              {isEn ? "Cancel" : "إلغاء"}
            </button>
            <button
              type="button"
              onClick={() => onSaveQuickEdit(product.id)}
              className="min-h-[36px] rounded-lg bg-primary hover:bg-primary/90 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-all active:scale-95"
            >
              {isEn ? "Save" : "حفظ"}
            </button>
          </div>
        </div>
      ) : (
        /* Action Bar */
        <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2.5 gap-1.5">
          {/* Main Edit & Storefront Actions */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <Link
              to={editUrl}
              className="inline-flex items-center gap-1 min-h-[34px] sm:min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
              title={isEn ? "Edit all product details" : "تعديل كافة تفاصيل المنتج"}
            >
              <PencilSquareIcon className="h-3.5 w-3.5" />
              <span>{isEn ? "Edit" : "تعديل"}</span>
            </Link>

            <a
              href={getStorefrontUrl(product)}
              target="_blank"
              rel="noreferrer"
              onClick={() => prepareStorefrontContext()}
              className="inline-flex items-center gap-1 min-h-[34px] sm:min-h-[36px] px-2 sm:px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted/50 text-foreground text-xs font-semibold shadow-xs transition-colors"
              title={isEn ? "View in store" : "عرض في المتجر"}
            >
              <EyeIcon className="h-3.5 w-3.5" />
              <span>{isEn ? "View" : "عرض"}</span>
            </a>
          </div>

          {/* Quick Icons: Quick Edit, Duplicate, Workflow, Delete */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => onStartQuickEdit(product)}
              className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title={isEn ? "Quick edit (price & stock)" : "تعديل سريع (سعر ومخزون)"}
              aria-label={isEn ? "Quick Edit" : "تعديل سريع"}
            >
              <PencilIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>

            <button
              type="button"
              onClick={() => onDuplicate(product)}
              disabled={duplicatingProductId === product.id}
              className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
              title={isEn ? "Duplicate product" : "نسخ المنتج"}
              aria-label={isEn ? "Duplicate product" : "نسخ المنتج"}
            >
              <DocumentDuplicateIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>

            {renderWorkflowActions()}

            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(product.id)}
                className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                title={isEn ? "Delete product" : "حذف المنتج"}
                aria-label={isEn ? "Delete product" : "حذف المنتج"}
              >
                <TrashIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductMobileCard;
