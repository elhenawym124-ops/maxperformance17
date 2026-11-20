import React from 'react';
import { CheckIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { OrderAction, WorkspaceOrder, WorkspaceOrderItem } from '../../types';
import { WorkspaceItemsEditor } from '../../WorkspaceItemsEditor';

interface WorkspaceInspectorItemsSectionProps {
  order: WorkspaceOrder;
  isEditingItems: boolean;
  onToggleEditItems: () => void;
  onSaveItems?: (
    orderId: string,
    items: WorkspaceOrderItem[],
    financials: { shipping: number; discount: number; notes?: string }
  ) => Promise<void>;
  busyAction: OrderAction | undefined;
  formatPrice: (amount: number) => string;
  isArabic: boolean;
  t: (key: string) => string;
}

export const WorkspaceInspectorItemsSection: React.FC<WorkspaceInspectorItemsSectionProps> = ({
  order,
  isEditingItems,
  onToggleEditItems,
  onSaveItems,
  busyAction,
  formatPrice,
  isArabic,
  t,
}) => {
  return (
    <section className="border-b border-border/30 pb-3 dark:dark:border-border">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:dark:text-muted-foreground">
          {t('orders.orderItems')} ({order.items.length})
        </p>
        {onSaveItems && (
          <button
            type="button"
            onClick={onToggleEditItems}
            className="inline-flex items-center gap-1 rounded border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-bold text-muted-foreground hover:bg-muted/80 hover:text-foreground dark:dark:border-border dark:dark:bg-muted dark:dark:text-muted-foreground dark:hover:dark:hover:bg-muted"
          >
            {isEditingItems ? (
              <>
                <CheckIcon className="h-3 w-3" />
                <span>{isArabic ? 'إنهاء التعديل' : 'Done'}</span>
              </>
            ) : (
              <>
                <PencilSquareIcon className="h-3 w-3" />
                <span>{isArabic ? 'تعديل المنتجات والأسعار' : 'Edit Items'}</span>
              </>
            )}
          </button>
        )}
      </div>

      {isEditingItems && onSaveItems ? (
        <WorkspaceItemsEditor
          order={order}
          onSave={async (orderId, items, financials) => {
            await onSaveItems(orderId, items, financials);
            onToggleEditItems();
          }}
          onCancel={onToggleEditItems}
          isSaving={busyAction === 'details'}
        />
      ) : (
        <>
          <div className="space-y-1.5">
            {order.items.map((it, idx) => (
              <div
                key={it.id || idx}
                className="flex items-center justify-between rounded-md border border-border/30 bg-muted/10 p-2 dark:dark:border-border dark:dark:bg-muted"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {it.productImage && (
                    <img
                      src={it.productImage}
                      alt=""
                      className="h-8 w-8 rounded object-cover border border-border/40 shrink-0 dark:dark:border-border"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate dark:dark:text-muted-foreground">
                      {it.productName}
                    </p>
                    {(it.productColor || it.productSize) && (
                      <p className="text-[10px] text-muted-foreground truncate dark:dark:text-muted-foreground">
                        {[it.productColor, it.productSize].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-end shrink-0 ms-2">
                  <p className="font-mono tabular-nums text-foreground dark:dark:text-muted-foreground">
                    {it.quantity} × {formatPrice(it.price)}
                  </p>
                  <p className="font-mono text-[11px] font-bold tabular-nums text-primary dark:text-primary">
                    {formatPrice(it.total)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Financial Summary */}
          <div className="mt-3 space-y-1 border-t border-border/30 pt-2 text-[11px] text-muted-foreground dark:dark:border-border dark:dark:text-muted-foreground">
            <div className="flex justify-between">
              <span>{isArabic ? 'المجموع الفرعي' : 'Subtotal'}</span>
              <span className="font-mono tabular-nums text-foreground dark:dark:text-muted-foreground">
                {formatPrice(order.subtotal || order.total)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{isArabic ? 'الشحن' : 'Shipping'}</span>
              <span className="font-mono tabular-nums text-foreground dark:dark:text-muted-foreground">
                {formatPrice(order.shipping || 0)}
              </span>
            </div>
            {(order.discount || 0) > 0 && (
              <div className="flex justify-between text-success dark:text-success font-semibold">
                <span>{isArabic ? 'الخصم' : 'Discount'}</span>
                <span className="font-mono tabular-nums">-{formatPrice(order.discount || 0)}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between border-t border-border/40 pt-1 font-bold text-foreground dark:dark:border-border dark:dark:text-muted-foreground">
              <span>{isArabic ? 'الإجمالي النهائي' : 'Final Total'}</span>
              <span className="font-mono text-sm tabular-nums text-primary dark:text-primary">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
