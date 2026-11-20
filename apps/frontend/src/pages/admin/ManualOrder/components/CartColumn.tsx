import { useTranslation } from "react-i18next";
import React from "react";
import {
  TrashIcon,
  CalculatorIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { CartItem } from "../types";
import { useAuth } from "../../../../hooks/useAuthSimple";
import { buildOptimizedUploadImageUrl } from "../../../../utils/imageUrl";

interface CartColumnProps {
  items: CartItem[];
  onUpdateItem: (
    productId: string,
    updates: Partial<CartItem>,
    variantId?: string,
  ) => void;
  onRemoveItem: (productId: string, variantId?: string) => void;
}

const CartColumn: React.FC<CartColumnProps> = ({
  items,
  onUpdateItem,
  onRemoveItem,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAffiliate = user?.role === "AFFILIATE";
  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

    return (
        <div className="flex flex-col bg-white dark:bg-muted rounded-xl shadow-2xs border border-border dark:border-border overflow-hidden" style={{ height: '100%', maxHeight: '100%' }}>
            <div className="px-4 py-3 border-b border-border dark:border-border bg-muted dark:bg-muted flex justify-between items-center">
                <h2 className="text-xs sm:text-sm font-semibold tracking-tight text-foreground">{t('manualOrder.k_72')}{items.length})</h2>
                <div className="text-xs font-semibold font-mono tabular-nums text-foreground bg-muted dark:bg-muted border border-border dark:border-border px-2.5 py-1 rounded-md shadow-2xs">
                    {t('manualOrder.k_77')} {totalAmount.toLocaleString()} {t('manualOrder.k_84')}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 p-2 manual-order-scroll manual-order-column">
                {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/80">
                        <CalculatorIcon className="w-12 h-12 mb-2 opacity-50" />
                        <p>{t('manualOrder.k_57')}</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {items.map((item) => (
                            <div
                                key={`${item.productId}-${item.variantId || 'default'}`}
                                className={`flex gap-3 p-3 bg-card border rounded-lg group transition-colors ${item.quantity > item.stock ? 'border-red-300 dark:border-destructive bg-destructive/50 dark:bg-destructive/20' : 'border-gray-100 dark:border-border hover:border-primary dark:hover:border-primary'}`}
                            >
                                {/* Image */}
                                <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                                    {item.image ? (
                                        <img src={buildOptimizedUploadImageUrl(item.image, { width: 150 })} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                                    ) : (
                                        <div className="w-full h-full bg-muted dark:bg-muted" />
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-1">
                                                <h3 className="text-sm font-medium text-foreground line-clamp-1 flex-1">{item.name}</h3>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    {item.isWholesalePrice && (
                                                        <span
                                                            className="inline-flex items-center rounded-full bg-primary dark:bg-primary/40 border border-primary dark:border-primary px-1.5 py-0.5 text-[9px] font-bold text-primary dark:text-primary"
                                                            title={item.wholesalePriceListName || 'سعر جملة'}
                                                        >
                                                            سعر جملة
                                                        </span>
                                                    )}
                                                    <span className="text-xs font-bold text-primary dark:text-primary whitespace-nowrap">
                                                        {item.price.toLocaleString()} {t('manualOrder.k_75')}
                                                    </span>
                                                </div>
                                            </div>
                                            {(item.color || item.size) && (
                                                <div className="flex flex-wrap gap-1.5 mt-1">
                                                    {item.color && (
                                                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary dark:bg-primary/20 dark:text-primary">
                                                            {t('manualOrder.k_85')} {item.color}
                                                        </span>
                                                    )}
                                                    {item.size && (
                                                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground dark:bg-muted dark:text-muted-foreground">
                                                            {t('manualOrder.k_86')} {item.size}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {item.variantName &&
                                                item.variantName !== [item.color, item.size].filter(Boolean).join(" / ") && (
                                                    <div className="text-xs text-primary dark:text-primary font-medium mt-0.5 truncate">
                                                        {item.variantName}
                                                    </div>
                                                )}
                                            {/* Stock indicator */}
                                            <div className={`text-[10px] mt-0.5 ${item.quantity > item.stock ? 'text-red-600 dark:text-destructive font-medium' : 'text-muted-foreground/80'}`}>
                                                {item.quantity > item.stock ? (
                                                    <span className="flex items-center gap-1">
                                                        <ExclamationTriangleIcon className="w-3 h-3" />
                                                        {t('manualOrder.k_87')} {item.stock})
                                                    </span>
                                                ) : (
                                                    <span>{t('manualOrder.k_73')}{item.stock}</span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onRemoveItem(item.productId, item.variantId)}
                                            className="text-muted-foreground/80 hover:text-destructive dark:hover:text-destructive transition-colors flex-shrink-0 me-2"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-2 mt-2">
                                        <div className="flex items-center gap-4">
                                            {/* Quantity Control */}
                                            <div className="flex items-center border border-border rounded-md bg-muted dark:bg-muted">
                                                <button
                                                    className="px-2 py-1 hover:bg-muted dark:hover:bg-muted text-muted-foreground font-bold"
                                                    onClick={() => {
                                                        if (item.quantity > 1) onUpdateItem(item.productId, { quantity: item.quantity - 1 }, item.variantId);
                                                        else onRemoveItem(item.productId, item.variantId);
                                                    }}
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        if (val >= 0) onUpdateItem(item.productId, { quantity: val }, item.variantId);
                                                    }}
                                                    className="w-12 text-center text-sm bg-transparent dark:text-muted-foreground border-none focus:ring-0 p-1"
                                                />
                                                <button
                                                    className="px-2 py-1 hover:bg-muted dark:hover:bg-muted text-muted-foreground font-bold"
                                                    onClick={() => onUpdateItem(item.productId, { quantity: item.quantity + 1 }, item.variantId)}
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {/* Final Price for Member */}
                                            <div className="flex-1">
                                                <div className="text-xs text-muted-foreground mb-0.5">{t('manualOrder.k_74')}</div>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={item.price}
                                                        readOnly={isAffiliate}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value) || 0;
                                                            onUpdateItem(item.productId, { price: val }, item.variantId);
                                                        }}
                                                        className={`w-full text-sm border-border rounded-md focus:ring-primary focus:border-primary pe-2 ps-8 font-bold dark:bg-muted dark:text-muted-foreground ${isAffiliate ? 'bg-gray-50 dark:bg-muted' : (item.price !== item.originalPrice ? 'text-orange-600 dark:text-warning bg-warning/10 dark:bg-warning/20 border-warning dark:border-warning' : 'text-foreground')}`}
                                                    />
                                                    <span className="absolute left-2 top-1.5 text-xs text-muted-foreground/80">{t('manualOrder.k_75')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Affiliate Markup Field */}
                                        {isAffiliate && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <div className="text-[10px] text-muted-foreground mb-0.5">{t('manualOrder.k_76')}</div>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={item.markup || 0}
                                                            onChange={(e) => {
                                                                const markup = parseFloat(e.target.value) || 0;
                                                                onUpdateItem(item.productId, {
                                                                    markup: markup,
                                                                    price: item.originalPrice + markup
                                                                }, item.variantId);
                                                            }}
                                                            className="w-full text-xs border-primary dark:border-primary rounded-md focus:ring-primary focus:border-primary pe-2 ps-8 font-bold bg-primary/50 dark:bg-primary/10 text-primary dark:text-primary"
                                                            placeholder="0"
                                                        />
                                                        <span className="absolute left-2 top-1 text-[10px] text-primary dark:text-primary">{t('manualOrder.k_75')}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col justify-end items-end pb-1 pe-1">
                                                    <div className="text-[10px] text-muted-foreground/80">{t('manualOrder.k_77')}</div>
                                                    <div className="text-sm font-bold text-foreground dark:text-muted-foreground">
                                                        {(item.price * item.quantity).toLocaleString()} {t('manualOrder.k_75')}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {!isAffiliate && item.isWholesalePrice && ['OWNER', 'ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'].includes(user?.role || '') && (
                                            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center justify-between bg-primary/50 dark:bg-primary/20 px-2 py-1 rounded border border-primary dark:border-primary/40">
                                                <span>السعر العادي: {item.regularPrice || item.originalPrice} {t('manualOrder.k_75')}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const targetPrice = item.price === item.wholesalePrice
                                                            ? (item.regularPrice || item.originalPrice)
                                                            : (item.wholesalePrice || item.originalPrice);
                                                        onUpdateItem(item.productId, { price: targetPrice }, item.variantId);
                                                    }}
                                                    className="text-purple-600 dark:text-primary font-bold hover:underline"
                                                >
                                                    {item.price === item.wholesalePrice ? 'تبديل للعادي' : 'إعادة للجملة'}
                                                </button>
                                            </div>
                                        )}

                                        {!isAffiliate && item.price !== item.originalPrice && !item.isWholesalePrice && (
                                            <div className="text-[10px] text-muted-foreground/80 mt-0.5 text-right flex justify-end gap-1">
                                                <span>{t('manualOrder.k_78')}{item.originalPrice}</span>
                                                <button
                                                    className="text-blue-500 dark:text-primary hover:underline"
                                                    onClick={() => onUpdateItem(item.productId, { price: item.originalPrice }, item.variantId)}
                                                >
                                                    {t('manualOrder.k_88')}
                                                </button>
                                            </div>
                                        )}

                                        {!isAffiliate && (
                                            <div className="text-sm font-bold text-foreground dark:text-muted-foreground text-left self-end">
                                                {(item.price * item.quantity).toLocaleString()} {t('manualOrder.k_75')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer / Summary */}
            <div className="p-4 bg-muted dark:bg-muted border-t border-border dark:border-border">
                <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-gray-600 dark:text-muted-foreground">{t('manualOrder.k_79')}</span>
                    <span className="font-medium text-foreground">{items.reduce((acc, item) => acc + item.quantity, 0)}</span>
                </div>
                {isAffiliate && (
                    <div className="flex justify-between items-center text-sm mb-2 text-primary dark:text-primary">
                        <span>{t('manualOrder.k_80')}</span>
                        <span className="font-bold">{items.reduce((sum, item) => sum + (item.markup * item.quantity), 0).toLocaleString()}{t('manualOrder.k_75')}</span>
                    </div>
                )}
                <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-gray-800 dark:text-muted-foreground">{t('manualOrder.k_81')}</span>
                    <span className="text-blue-600 dark:text-primary">{totalAmount.toLocaleString()}{t('manualOrder.k_75')}</span>
                </div>
            </div>
        </div>
    );
};

export default CartColumn;
