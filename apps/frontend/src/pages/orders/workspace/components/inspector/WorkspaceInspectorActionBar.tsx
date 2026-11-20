import React from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { OrderAction, WorkspaceOrder } from '../../types';

interface WorkspaceInspectorActionBarProps {
  order: WorkspaceOrder;
  busyAction: OrderAction | undefined;
  isReadOnly: boolean;
  onConfirm: (order: WorkspaceOrder) => void;
  onCancel: (order: WorkspaceOrder) => void;
  onOpenFollowUp: (order: WorkspaceOrder) => void;
  onConvertIncomplete?: (cartId: string) => Promise<void>;
  isArabic: boolean;
  t: (key: string) => string;
}

export const WorkspaceInspectorActionBar: React.FC<WorkspaceInspectorActionBarProps> = ({
  order,
  busyAction,
  isReadOnly,
  onConfirm,
  onCancel,
  onOpenFollowUp,
  onConvertIncomplete,
  isArabic,
  t,
}) => {
  const isConfirmed = order.status === 'CONFIRMED';
  const isCancelled = order.status === 'CANCELLED';
  const isBusy = Boolean(busyAction);

  return (
    <section className="sticky bottom-0 z-10 -mx-4 border-t border-border/30 bg-card px-4 pb-3 pt-2 dark:dark:border-border dark:dark:bg-muted">
      {order.isIncomplete ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => {
              if (onConvertIncomplete) {
                void onConvertIncomplete(order.cartId || order.id);
              } else {
                onConfirm(order);
              }
            }}
            disabled={isBusy}
            className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-md bg-warning px-3 py-1.5 text-xs font-bold text-white transition-all active:scale-[0.98] hover:bg-warning disabled:opacity-50 dark:bg-warning dark:hover:bg-warning"
          >
            <BoltIcon className="h-4 w-4" />
            <span>
              {busyAction === 'confirm'
                ? isArabic
                  ? 'جارٍ الاعتماد…'
                  : 'Confirming…'
                : isArabic
                ? 'اعتماد وتأكيد الطلب'
                : 'Confirm Order'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onOpenFollowUp(order)}
            disabled={isReadOnly || isBusy}
            className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-all active:scale-[0.98] hover:bg-primary/20 disabled:opacity-50 dark:border-primary/50 dark:bg-primary/40 dark:text-primary"
          >
            <CalendarIcon className="h-4 w-4" />
            <span>{t('orders.scheduleFollowUp')}</span>
          </button>

          <button
            type="button"
            onClick={() => onCancel(order)}
            disabled={isCancelled || isBusy}
            className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive transition-all active:scale-[0.98] hover:bg-destructive/20 disabled:opacity-50 dark:border-destructive/50 dark:bg-destructive/40 dark:text-destructive"
          >
            <XCircleIcon className="h-4 w-4" />
            <span>{t('orders.cancelOrder')}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => onConfirm(order)}
            disabled={isConfirmed || isCancelled || isBusy}
            className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-all active:scale-[0.98] hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircleIcon className="h-4 w-4" />
            <span>
              {busyAction === 'confirm'
                ? isArabic
                  ? 'جارٍ التأكيد…'
                  : 'Confirming…'
                : t('orders.confirmOrder')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onOpenFollowUp(order)}
            disabled={isReadOnly || isBusy}
            className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-md border border-border/60 bg-background px-3 py-1.5 text-xs font-bold text-foreground transition-all active:scale-[0.98] hover:bg-muted/40 disabled:opacity-50 dark:dark:border-border dark:dark:bg-muted dark:dark:text-muted-foreground dark:hover:dark:hover:bg-muted"
          >
            <CalendarIcon className="h-4 w-4" />
            <span>{t('orders.scheduleFollowUp')}</span>
          </button>

          <button
            type="button"
            onClick={() => onCancel(order)}
            disabled={isCancelled || isBusy}
            className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive transition-all active:scale-[0.98] hover:bg-destructive/20 disabled:opacity-50 dark:border-destructive/50 dark:bg-destructive/40 dark:text-destructive"
          >
            <XCircleIcon className="h-4 w-4" />
            <span>{t('orders.cancelOrder')}</span>
          </button>
        </div>
      )}
    </section>
  );
};
