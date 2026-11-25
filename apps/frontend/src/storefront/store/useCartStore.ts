import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { VolumeDiscountTier } from "../utils/volumeDiscounts";
import { getCartItemPricing } from "../utils/cartQuantityOffers";
import {
  findMatchingTierVariant,
  getCartItemQuantityRange,
  type QuantityTierVariantInfo,
} from "../utils/quantityTierVariants";

export const DEFAULT_STOREFRONT_CART_STORAGE_NAME = "sf-cart-storage";
export const getStorefrontPreviewCartStorageName = (previewThemeId: string) =>
  `${DEFAULT_STOREFRONT_CART_STORAGE_NAME}:preview:${previewThemeId}`;

type ImageLike = {
  fullUrl?: string;
  url?: string;
};

type CartItemIdentityInput = {
  id?: string | null;
  productId?: string | null;
  variantId?: string | null;
  attributes?: Record<string, string> | null;
};

const normalizeCartImageUrl = (value: string | ImageLike | undefined) => {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    return value.fullUrl || value.url || "";
  }

  return "";
};

export const buildCartItemId = (item: CartItemIdentityInput): string => {
  const explicitId = String(item.id || "").trim();
  if (explicitId) {
    return explicitId;
  }

  const productId = String(item.productId || "").trim();
  const variantId = String(item.variantId || "").trim();
  const attributeHash =
    item.attributes && Object.keys(item.attributes).length > 0
      ? JSON.stringify(item.attributes)
      : "default";

  return variantId ? `${productId}-${variantId}` : `${productId}-${attributeHash}`;
};

export interface CartItem {
  id: string; // Unique identifier for the cart item (e.g., productId + selected variant hash)
  productId: string;
  variantId?: string | null;
  name: string;
  price: number;
  basePrice?: number;
  comparePrice?: number;
  quantity: number;
  imageUrl?: string;
  companyId?: string;
  attributes?: Record<string, string>; // e.g., { Color: "Red", Size: "M" }
  productColor?: string;
  productSize?: string;
  volumeDiscounts?: VolumeDiscountTier[];
  quantityOffer?: {
    groupId: string;
    offerId: string;
    offerLabel: string;
    offerQuantity: number;
    slotIndex?: number;
    freeShipping?: boolean;
  } | null;
  minQuantity?: number;
  maxQuantity?: number;
  quantityTiers?: QuantityTierVariantInfo[];
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (
    item: Omit<CartItem, "id"> & { id?: string },
    options?: { openCart?: boolean },
  ) => void;
  removeItem: (id: string) => void;
  removeQuantityOfferGroup: (groupId: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  restoreItems: (items: Array<Omit<CartItem, "id"> & { id?: string }>) => void;
  clearCart: () => void;
  setIsOpen: (isOpen: boolean) => void;

  // Computed
  getTotalItems: () => number;
  getSubtotal: () => number;
  hasQuantityOfferFreeShipping: () => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItemInput, options) => {
        set((state) => {
          const shouldOpenCart = options?.openCart !== false;
          const itemId = buildCartItemId(newItemInput);

          const itemRange = getCartItemQuantityRange(newItemInput);
          const initialQuantity = itemRange
            ? Math.max(itemRange.min, Math.min(itemRange.max, newItemInput.quantity || 1))
            : Math.max(1, newItemInput.quantity || 1);

          const existingItemIndex = state.items.findIndex(
            (item) => item.id === itemId
          );

          if (existingItemIndex >= 0) {
            // Update quantity of existing item immutably
            const newItems = [...state.items];
            const existingItem = newItems[existingItemIndex];
            if (existingItem) {
              const combinedRange = getCartItemQuantityRange(existingItem) || itemRange;
              const combined = existingItem.quantity + initialQuantity;
              const newQuantity = combinedRange
                ? Math.max(combinedRange.min, Math.min(combinedRange.max, combined))
                : combined;

              let updatedImageUrl = existingItem.imageUrl;
              if (newItemInput.imageUrl) {
                updatedImageUrl = normalizeCartImageUrl(
                  newItemInput.imageUrl as string | ImageLike,
                );
              }

              newItems[existingItemIndex] = {
                ...existingItem,
                quantity: newQuantity,
                minQuantity: combinedRange ? combinedRange.min : existingItem.minQuantity,
                maxQuantity: combinedRange ? combinedRange.max : existingItem.maxQuantity,
                companyId: existingItem.companyId || (newItemInput as any).companyId,
                basePrice: newItemInput.basePrice ?? existingItem.basePrice ?? existingItem.price,
                volumeDiscounts:
                  Array.isArray(newItemInput.volumeDiscounts) && newItemInput.volumeDiscounts.length > 0
                    ? newItemInput.volumeDiscounts
                    : existingItem.volumeDiscounts,
                quantityOffer: newItemInput.quantityOffer || existingItem.quantityOffer,
                imageUrl: updatedImageUrl,
              };
            }
            return { items: newItems, isOpen: shouldOpenCart };
          } else {
            // Add new item
            let normalizedImageUrl = newItemInput.imageUrl || (newItemInput as any).image;
            if (normalizedImageUrl) {
              normalizedImageUrl = normalizeCartImageUrl(
                normalizedImageUrl as string | ImageLike,
              );
            }

            const rawAttrs = newItemInput.attributes || {};
            const resolvedColor =
              newItemInput.productColor ||
              (newItemInput as any).color ||
              rawAttrs.Color ||
              rawAttrs["اللون"] ||
              rawAttrs["لون"] ||
              rawAttrs["ألوان"] ||
              rawAttrs["الوان"] ||
              rawAttrs["الألوان"] ||
              rawAttrs.color ||
              undefined;
            const resolvedSize =
              newItemInput.productSize ||
              (newItemInput as any).size ||
              rawAttrs.Size ||
              rawAttrs["المقاس"] ||
              rawAttrs["مقاس"] ||
              rawAttrs["المقاسات"] ||
              rawAttrs["مقاسات"] ||
              rawAttrs["حجم"] ||
              rawAttrs["الحجم"] ||
              rawAttrs["الأحجام"] ||
              rawAttrs.size ||
              undefined;

            const newItem: CartItem = {
              ...newItemInput,
              quantity: initialQuantity,
              minQuantity: itemRange?.min ?? newItemInput.minQuantity,
              maxQuantity: itemRange?.max ?? newItemInput.maxQuantity,
              companyId: newItemInput.companyId || (newItemInput as any).companyId,
              basePrice: newItemInput.basePrice ?? newItemInput.price,
              imageUrl: normalizedImageUrl,
              ...(resolvedColor ? { productColor: resolvedColor } : {}),
              ...(resolvedSize ? { productSize: resolvedSize } : {}),
              id: itemId,
            };
            return { items: [newItem, ...state.items], isOpen: shouldOpenCart };
          }
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      removeQuantityOfferGroup: (groupId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => item.quantityOffer?.groupId !== groupId,
          ),
        }));
      },

      updateQuantity: (id, quantity) => {
        set((state) => {
          const targetItem = state.items.find((item) => item.id === id);
          if (targetItem?.quantityOffer?.groupId) {
            return state;
          }

          const range = targetItem ? getCartItemQuantityRange(targetItem) : null;
          const min = range?.min ?? 1;
          const max = range?.max ?? 99;
          const newQuantity = Math.max(min, Math.min(max, quantity));

          return {
            items: state.items.map((item) => {
              if (item.id !== id) return item;

              let updatedItem = { ...item, quantity: newQuantity };

              if (item.quantityTiers && item.quantityTiers.length > 0) {
                const match = findMatchingTierVariant(item.quantityTiers, newQuantity);
                if (match) {
                  updatedItem.price = match.price;
                  updatedItem.basePrice = match.price;
                  if (match.range?.min !== undefined) updatedItem.minQuantity = match.range.min;
                  if (match.range?.max !== undefined) updatedItem.maxQuantity = match.range.max;
                  if (match.variantId) updatedItem.variantId = match.variantId;
                  if (match.attributeKey && match.attributeVal) {
                    updatedItem.attributes = {
                      ...(updatedItem.attributes || {}),
                      [match.attributeKey]: match.attributeVal,
                    };
                  }
                }
              }

              return updatedItem;
            }),
          };
        });
      },

      restoreItems: (incomingItems) => {
        if (!Array.isArray(incomingItems) || incomingItems.length === 0) return;
        const normalized: CartItem[] = incomingItems
          .filter((item) => item && (item.productId || item.id))
          .map((item) => {
            const itemId = buildCartItemId(item);
            const img = normalizeCartImageUrl(
              (item.imageUrl || (item as any).image || (item as any).productImage) as string | ImageLike | undefined,
            );
            return {
              ...item,
              id: itemId,
              productId: String(item.productId || itemId),
              name: String(item.name || (item as any).productName || ""),
              price: Number(item.price || 0),
              basePrice: Number(item.basePrice ?? item.price ?? 0),
              quantity: Math.max(1, Number(item.quantity || 1)),
              imageUrl: img,
            };
          });
        if (normalized.length > 0) {
          set({ items: normalized });
        }
      },

      clearCart: () => {
        set({ items: [] });
      },

      setIsOpen: (isOpen) => {
        set({ isOpen });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        const items = get().items;
        const subtotal = items.reduce(
          (total, item) => total + getCartItemPricing(item, items).lineSubtotal,
          0,
        );
        return Number(subtotal.toFixed(2));
      },

      hasQuantityOfferFreeShipping: () =>
        get().items.some((item) => Boolean(item.quantityOffer?.freeShipping)),
    }),
    {
      name: DEFAULT_STOREFRONT_CART_STORAGE_NAME,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }), // Only persist items, not UI state like isOpen
    }
  )
);
