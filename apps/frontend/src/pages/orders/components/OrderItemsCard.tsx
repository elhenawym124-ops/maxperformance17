import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { OrderItem } from "../types";
import { validatePrice, validateQuantity } from "../../../utils/validation";
import DeleteItemConfirmModal from "./DeleteItemConfirmModal";
import {
  OrderItemsCardProps,
  QuantityOfferGroup,
} from "./order-items/orderItemsTypes";
import { getQuantityOfferSummary } from "./order-items/orderItemsHelpers";
import { OrderItemSingleRow } from "./order-items/OrderItemSingleRow";
import { OrderItemBundleRow } from "./order-items/OrderItemBundleRow";
import { OrderItemsTotals } from "./order-items/OrderItemsTotals";

export type { OrderItemsCardProps };

const OrderItemsCard: React.FC<OrderItemsCardProps> = ({
  isEditing,
  items,
  totals,
  discountReason,
  editDiscountReason,
  onAddItem,
  onItemChange,
  onRemoveItem,
  onShippingChange,
  onTaxChange,
  onDiscountChange,
  onDiscountReasonChange,
}) => {
  const { t } = useTranslation();
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    index: number;
    itemName: string;
    itemDetails: string;
  }>({
    isOpen: false,
    index: -1,
    itemName: "",
    itemDetails: "",
  });
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

  const handleDeleteClick = (index: number, item: OrderItem) => {
    const details = [];
    if (item.productColor) details.push(`اللون: ${item.productColor}`);
    if (item.productSize) details.push(`المقاس: ${item.productSize}`);
    if (item.quantity) details.push(`الكمية: ${item.quantity}`);

    setDeleteModal({
      isOpen: true,
      index,
      itemName: item.productName,
      itemDetails: details.join(" • "),
    });
    setOpenMenuIndex(null);
  };

  const handleConfirmDelete = () => {
    onRemoveItem(deleteModal.index);
    setDeleteModal({ isOpen: false, index: -1, itemName: "", itemDetails: "" });
  };

  const handlePriceChange = (index: number, value: string) => {
    const numValue = parseFloat(value);
    const validation = validatePrice(numValue);

    if (!validation.isValid && value !== "") {
      setValidationErrors((prev) => ({
        ...prev,
        [`price_${index}`]: validation.error || "",
      }));
    } else {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`price_${index}`];
        return newErrors;
      });
    }

    onItemChange(index, "price", isNaN(numValue) ? 0 : numValue);
  };

  const handleQuantityChange = (index: number, value: number) => {
    const validation = validateQuantity(value);

    if (!validation.isValid) {
      setValidationErrors((prev) => ({
        ...prev,
        [`quantity_${index}`]: validation.error || "",
      }));
    } else {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`quantity_${index}`];
        return newErrors;
      });
    }

    onItemChange(index, "quantity", value);
  };

  const incrementQuantity = (index: number, currentQty: number) => {
    handleQuantityChange(index, currentQty + 1);
  };

  const decrementQuantity = (index: number, currentQty: number) => {
    if (currentQty > 1) {
      handleQuantityChange(index, currentQty - 1);
    }
  };

  const groupedQuantityOffers = useMemo(() => {
    const singles: Array<{ item: OrderItem; index: number }> = [];
    const groups = new Map<string, QuantityOfferGroup>();

    items.forEach((item, index) => {
      const quantityOffer = getQuantityOfferSummary(item);

      if (isEditing || !quantityOffer?.groupId) {
        singles.push({ item, index });
        return;
      }

      const existingGroup = groups.get(quantityOffer.groupId);
      const nextGroup =
        existingGroup ||
        {
          groupId: quantityOffer.groupId,
          offerLabel: quantityOffer.offerLabel,
          offerQuantity: quantityOffer.offerQuantity,
          freeShipping: quantityOffer.freeShipping,
          total: 0,
          selectedPieces: 0,
          items: [],
        };

      nextGroup.offerLabel = quantityOffer.offerLabel || nextGroup.offerLabel;
      nextGroup.offerQuantity = Math.max(
        nextGroup.offerQuantity,
        quantityOffer.offerQuantity,
      );
      nextGroup.freeShipping =
        nextGroup.freeShipping || quantityOffer.freeShipping;
      nextGroup.total += Number(item.price || 0) * Number(item.quantity || 0);
      nextGroup.selectedPieces += Math.max(0, Number(item.quantity || 0));
      nextGroup.items.push({
        item,
        index,
        slotIndex: quantityOffer.slotIndex,
      });

      if (!existingGroup) {
        groups.set(quantityOffer.groupId, nextGroup);
      }
    });

    return {
      singles,
      groups: Array.from(groups.values()).map((group) => ({
        ...group,
        total: Number(group.total.toFixed(2)),
        items: [...group.items].sort((left, right) => {
          const leftSlot = left.slotIndex ?? Number.MAX_SAFE_INTEGER;
          const rightSlot = right.slotIndex ?? Number.MAX_SAFE_INTEGER;
          return leftSlot === rightSlot ? left.index - right.index : leftSlot - rightSlot;
        }),
      })),
    };
  }, [isEditing, items]);

  const displayEntryCount = isEditing
    ? items.length
    : groupedQuantityOffers.groups.length + groupedQuantityOffers.singles.length;

  return (
    <div className="bg-card shadow-sm rounded-xl border border-border dark:dark:border-border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border dark:dark:border-border bg-muted dark:dark:bg-muted">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-foreground">
              {t("orderDetails.products")}
            </h3>
            <span className="px-2.5 py-0.5 bg-primary dark:bg-primary/30 text-primary dark:text-primary text-sm font-semibold rounded-full font-mono tabular-nums">
              {displayEntryCount}
            </span>
          </div>
          {!isEditing && groupedQuantityOffers.groups.length > 0 ? (
            <span className="text-xs font-medium text-warning dark:text-warning">
              {groupedQuantityOffers.groups.length} عروض كميات مجمعة
            </span>
          ) : null}
          {isEditing && (
            <button
              type="button"
              onClick={onAddItem}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary dark:bg-primary dark:hover:bg-primary text-white rounded-lg font-medium transition-colors shadow-sm active:scale-95"
            >
              <PlusIcon className="w-4 h-4" />
              <span>إضافة منتج</span>
            </button>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="divide-y divide-border dark:dark:divide-border">
        {items.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <PhotoIcon className="w-16 h-16 mx-auto text-muted-foreground dark:dark:text-foreground mb-3" />
            <p className="text-muted-foreground font-medium">
              لا توجد منتجات في هذا الطلب
            </p>
          </div>
        ) : (
          <>
            {groupedQuantityOffers.groups.map((group) => (
              <OrderItemBundleRow key={group.groupId} group={group} />
            ))}

            {groupedQuantityOffers.singles.map(({ item, index }) => (
              <OrderItemSingleRow
                key={`${item.id || item.productId || "item"}-${index}`}
                item={item}
                index={index}
                isEditing={isEditing}
                openMenuIndex={openMenuIndex}
                setOpenMenuIndex={setOpenMenuIndex}
                validationErrors={validationErrors}
                onItemChange={onItemChange}
                handlePriceChange={handlePriceChange}
                handleQuantityChange={handleQuantityChange}
                incrementQuantity={incrementQuantity}
                decrementQuantity={decrementQuantity}
                handleDeleteClick={handleDeleteClick}
              />
            ))}
          </>
        )}
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <OrderItemsTotals
          isEditing={isEditing}
          totals={totals}
          discountReason={discountReason}
          editDiscountReason={editDiscountReason}
          onShippingChange={onShippingChange}
          onTaxChange={onTaxChange}
          onDiscountChange={onDiscountChange}
          onDiscountReasonChange={onDiscountReasonChange}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteItemConfirmModal
        isOpen={deleteModal.isOpen}
        itemName={deleteModal.itemName}
        itemDetails={deleteModal.itemDetails}
        onConfirm={handleConfirmDelete}
        onClose={() =>
          setDeleteModal({
            isOpen: false,
            index: -1,
            itemName: "",
            itemDetails: "",
          })
        }
      />
    </div>
  );
};

export default OrderItemsCard;
