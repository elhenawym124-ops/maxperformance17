import React from 'react';
import {
  PhoneIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { WorkspaceOrder } from '../../types';
import { isOrderOverdue } from '../../workspaceHelpers';

interface WorkspaceOrderQueueItemProps {
  order: WorkspaceOrder;
  isSelected: boolean;
  onSelectOrder: (orderId: string) => void;
  formatPrice: (amount: number) => string;
  isArabic: boolean;
  rowRef: (el: HTMLElement | null) => void;
  onSuppressFocus: () => void;
}

export const WorkspaceOrderQueueItem: React.FC<WorkspaceOrderQueueItemProps> = ({
  order,
  isSelected,
  onSelectOrder,
  formatPrice,
  isArabic,
  rowRef,
  onSuppressFocus,
}) => {
  const overdue = isOrderOverdue(order);
  const location = [order.governorate, order.city].filter(Boolean).join('، ') || '—';
  const followUpDue = order.followUpDate ? new Date(order.followUpDate).getTime() <= Date.now() : false;

  const formatTimeAgo = (dateStr: string) => {
    const diffMinutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60));
    if (diffMinutes < 1) return isArabic ? 'الآن' : 'Just now';
    if (diffMinutes < 60) return isArabic ? `منذ ${diffMinutes} د` : `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return isArabic ? `منذ ${diffHours} س` : `${diffHours}h ago`;
    const days = Math.floor(diffHours / 24);
    return isArabic ? `منذ ${days} ي` : `${days}d ago`;
  };

  const exactTimestamp = (dateStr: string) =>
    new Date(dateStr).toLocaleString(isArabic ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const handleClick = () => {
    onSuppressFocus();
    onSelectOrder(order.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSuppressFocus();
      onSelectOrder(order.id);
    }
  };

  return (
    <article
      ref={rowRef}
      tabIndex={0}
      role="button"
      aria-current={isSelected ? 'true' : undefined}
      aria-label={`${isArabic ? 'طلب' : 'Order'} #${order.orderNumber} — ${order.customerName || ''} ${formatPrice(order.total)}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`group relative cursor-pointer p-3 outline-none transition-colors border-b border-border/20 dark:dark:border-border focus-visible:bg-accent/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
        isSelected
          ? 'bg-accent/40 text-accent-foreground dark:dark:bg-muted dark:dark:text-muted-foreground'
          : 'hover:bg-muted/40 dark:hover:dark:hover:bg-muted text-foreground dark:dark:text-muted-foreground'
      }`}
    >
      {/* Active selection bar */}
      {isSelected && (
        <div
          className="absolute inset-y-0 start-0 w-1 bg-primary"
          aria-hidden="true"
        />
      )}

      {/* Header row: Order number, SLA urgency badge, Time */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="font-mono text-xs font-black text-primary dark:text-primary"
            dir="ltr"
          >
            #{order.orderNumber}
          </span>
          {order.isIncomplete ? (
            <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold text-warning dark:bg-warning/60 dark:border dark:border-warning/60 dark:text-warning">
              {isArabic ? 'سلة متروكة' : 'Abandoned Cart'}
            </span>
          ) : order.type === 'GUEST' ? (
            <span className="rounded bg-muted px-1 py-0.5 text-[10px] font-semibold text-muted-foreground dark:dark:bg-muted dark:dark:text-muted-foreground">
              {isArabic ? 'زائر' : 'Guest'}
            </span>
          ) : null}
          {overdue && (
            <span className="inline-flex items-center gap-1 rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-bold text-destructive dark:bg-destructive/60 dark:border dark:border-destructive/60 dark:text-destructive">
              <ExclamationTriangleIcon className="h-3 w-3" />
              {isArabic ? 'عاجل' : 'Urgent'}
            </span>
          )}
          {order.riskData && order.riskData.level !== 'low' && (
            <span
              title={
                order.riskData.reasons?.length
                  ? order.riskData.reasons.map((r) => r.label).join(' · ')
                  : undefined
              }
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums font-mono ${
                order.riskData.level === 'high'
                  ? 'bg-destructive/15 text-destructive dark:bg-destructive/60 dark:border dark:border-destructive/60 dark:text-destructive'
                  : 'bg-warning/15 text-warning dark:bg-warning/60 dark:border dark:border-warning/60 dark:text-warning'
              }`}
              dir="ltr"
            >
              <ExclamationTriangleIcon className="h-2.5 w-2.5 shrink-0" />
              <span>{order.riskData.score}</span>
            </span>
          )}
        </div>
        <span
          className="text-[11px] font-mono text-muted-foreground dark:dark:text-muted-foreground"
          title={exactTimestamp(order.createdAt)}
        >
          {formatTimeAgo(order.createdAt)}
        </span>
      </div>

      {/* Customer info & location */}
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <p className="truncate text-xs font-bold text-foreground dark:dark:text-muted-foreground">
          {order.customerName || '—'}
        </p>
        <span className="shrink-0 font-mono text-xs font-black tabular-nums text-foreground dark:dark:text-muted-foreground">
          {formatPrice(order.total)}
        </span>
      </div>

      {/* Sub-row: Location & Follow-up & Call attempts badge */}
      <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground dark:dark:text-muted-foreground">
        <span className="truncate">{location}</span>
        <span className="flex shrink-0 items-center gap-1.5">
          {order.followUpDate && (
            <span
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                followUpDue
                  ? 'bg-destructive/15 text-destructive dark:bg-destructive/60 dark:text-destructive'
                  : 'bg-primary/10 text-primary dark:bg-primary/60 dark:border dark:border-primary/60 dark:text-primary'
              }`}
            >
              {followUpDue
                ? isArabic ? 'مستحق الآن' : 'Due now'
                : new Date(order.followUpDate).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1 font-mono font-bold tabular-nums ${
              order.callAttempts >= 3
                ? 'text-warning dark:text-warning'
                : 'text-muted-foreground dark:dark:text-muted-foreground'
            }`}
          >
            <PhoneIcon className="h-3 w-3" />
            {order.callAttempts} / 5
          </span>
        </span>
      </div>
    </article>
  );
};
