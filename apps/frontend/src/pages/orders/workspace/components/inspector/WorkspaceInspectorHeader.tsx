import React from 'react';
import {
  ChatBubbleOvalLeftEllipsisIcon,
  CalendarIcon,
  ArrowTopRightOnSquareIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { AgentWorkload, WorkspaceOrder } from '../../types';
import { WorkspaceCustomerEditor } from '../../WorkspaceCustomerEditor';
import { OrderCallButton } from '../../../../../components/telephony/OrderCallButton';

interface WorkspaceInspectorHeaderProps {
  order: WorkspaceOrder;
  isReadOnly: boolean;
  onOpenDetailsModal: (order: WorkspaceOrder) => void;
  onOpenWhatsAppDrawer: () => void;
  onConfirm: (order: WorkspaceOrder) => void;
  onCancel: (order: WorkspaceOrder) => void;
  onLogCall: (order: WorkspaceOrder, result: string) => void;
  onOpenFollowUp: (order: WorkspaceOrder) => void;
  onRefreshOrder?: () => void;
  isRailOpen?: boolean;
  onToggleRail?: () => void;
  isManager?: boolean;
  agents?: AgentWorkload[];
  onAssignOrder?: (orderId: string, targetUserId: string) => Promise<void>;
  onSaveCustomer?: (
    orderId: string,
    customerData: {
      customerName?: string;
      customerPhone?: string;
      secondaryPhone?: string;
      governorate?: string;
      city?: string;
      shippingAddress?: string;
      notes?: string;
    }
  ) => Promise<void>;
  isArabic: boolean;
}

export const WorkspaceInspectorHeader: React.FC<WorkspaceInspectorHeaderProps> = ({
  order,
  isReadOnly,
  onOpenDetailsModal,
  onOpenWhatsAppDrawer,
  onConfirm,
  onCancel,
  onLogCall,
  onOpenFollowUp,
  onRefreshOrder,
  isRailOpen,
  onToggleRail,
  isManager = false,
  agents = [],
  onAssignOrder,
  onSaveCustomer,
  isArabic,
}) => {
  const followUpDue = order.followUpDate ? new Date(order.followUpDate).getTime() <= Date.now() : false;

  return (
    <section className="border-b border-border/30 pb-3 dark:dark:border-border">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-muted-foreground dark:dark:text-muted-foreground" dir="ltr">
              № {order.orderNumber}
            </span>
            {order.isIncomplete && (
              <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold text-warning dark:bg-warning/60 dark:border dark:border-warning/60 dark:text-warning">
                {isArabic ? 'سلة متروكة' : 'Abandoned Cart'}
              </span>
            )}
            <button
              type="button"
              onClick={() => onOpenDetailsModal(order)}
              className="inline-flex items-center gap-1 rounded border border-border/60 bg-muted/30 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground hover:bg-muted/60 hover:text-foreground dark:dark:border-border dark:dark:bg-muted dark:dark:text-muted-foreground dark:hover:dark:hover:bg-muted"
              title={isArabic ? 'عرض كل تفاصيل الطلب في نافذة منبثقة' : 'View full order modal'}
            >
              <span>{isArabic ? 'كامل التفاصيل' : 'Full Details'}</span>
              <ArrowTopRightOnSquareIcon className="h-3 w-3" />
            </button>
            {order.followUpDate && (
              <span
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                  followUpDue
                    ? 'bg-destructive/15 text-destructive dark:bg-destructive/60 dark:text-destructive'
                    : 'bg-primary/10 text-primary dark:bg-primary/60 dark:border dark:border-primary/60 dark:text-primary'
                }`}
              >
                <CalendarIcon className="h-3 w-3" />
                {followUpDue
                  ? isArabic ? 'متابعة مستحقة الآن' : 'Follow-up due'
                  : new Date(order.followUpDate).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
              </span>
            )}
          </div>
        </div>

        {/* Quick Communication Buttons */}
        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <button
              type="button"
              onClick={onOpenWhatsAppDrawer}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-success/30 bg-success/10 px-2.5 text-xs font-bold text-success transition-transform active:scale-[0.98] hover:bg-success/20 dark:border-success/50 dark:bg-success/50 dark:text-success"
              title={isArabic ? 'فتح واتساب المنصة (محادثة كاملة، قوالب، إرسال مباشر)' : 'Open Platform WhatsApp'}
            >
              <ChatBubbleOvalLeftEllipsisIcon className="h-4 w-4" />
              <span>{isArabic ? 'واتساب' : 'WhatsApp'}</span>
            </button>
          )}

          {!isReadOnly && (
            <OrderCallButton
              orderId={order.id}
              orderNumber={order.orderNumber}
              customerName={order.customerName}
              customerPhone={order.customerPhone}
              secondaryPhone={order.secondaryPhone}
              compact={false}
              onConfirm={() => onConfirm(order)}
              onNoAnswer={() => onLogCall(order, 'unreached')}
              onPostpone={() => onOpenFollowUp(order)}
              onCancel={() => onCancel(order)}
              onCallFinished={onRefreshOrder}
            />
          )}

          {/* Toggle Intelligence Rail on tablet / desktop */}
          {onToggleRail && (
            <button
              type="button"
              onClick={onToggleRail}
              className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-bold transition-transform active:scale-[0.98] ${
                isRailOpen
                  ? 'border-primary/40 bg-primary/10 text-primary dark:border-primary/60 dark:bg-primary/50 dark:text-primary'
                  : 'border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground dark:dark:border-border dark:dark:bg-muted dark:dark:text-muted-foreground dark:hover:dark:hover:bg-muted'
              }`}
              title={isArabic ? 'عرض/إخفاء سجل العميل والرادار' : 'Toggle customer trust dossier'}
            >
              <ShieldCheckIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{isArabic ? 'سجل العميل' : 'Dossier'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Modular Customer & Address Editor */}
      <div className="mt-2.5">
        <WorkspaceCustomerEditor
          order={order}
          isArabic={isArabic}
          isManager={isManager}
          agents={agents}
          onAssignOrder={onAssignOrder}
          onSaveCustomer={onSaveCustomer}
        />
      </div>
    </section>
  );
};
