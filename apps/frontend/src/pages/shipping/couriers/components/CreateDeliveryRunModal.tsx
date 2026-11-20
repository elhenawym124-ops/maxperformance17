import React from 'react';
import { TruckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Courier } from '../../../../services/courierService';

interface CreateDeliveryRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCouriers: Courier[];
  selectedCourierId: string;
  setSelectedCourierId: (v: string) => void;
  readyOrders: any[];
  loadingReadyOrders: boolean;
  selectedReadyOrderNumbers: string[];
  toggleReadyOrder: (orderNum: string) => void;
  orderNumbersInput: string;
  setOrderNumbersInput: (v: string) => void;
  dispatchNotes: string;
  setDispatchNotes: (v: string) => void;
  submittingDispatch: boolean;
  onConfirm: () => void;
  formatPrice: (price: number) => string;
}

export const CreateDeliveryRunModal: React.FC<CreateDeliveryRunModalProps> = ({
  isOpen,
  onClose,
  activeCouriers,
  selectedCourierId,
  setSelectedCourierId,
  readyOrders,
  loadingReadyOrders,
  selectedReadyOrderNumbers,
  toggleReadyOrder,
  orderNumbersInput,
  setOrderNumbersInput,
  dispatchNotes,
  setDispatchNotes,
  submittingDispatch,
  onConfirm,
  formatPrice
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-muted backdrop-blur-sm">
      <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl w-full max-w-lg p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-border dark:border-border pb-3">
          <div className="flex items-center gap-2">
            <TruckIcon className="w-5 h-5 text-success" />
            <h3 className="font-bold text-base">إنشاء مأمورية توزيع وإسناد شحنات</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="p-1.5 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground rounded-lg transition"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-medium mb-1">اختر المندوب المستلم للمأمورية *</label>
            <select
              value={selectedCourierId}
              onChange={(e) => setSelectedCourierId(e.target.value)}
              className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg text-xs sm:text-sm focus:outline-none"
            >
              {activeCouriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) - {c.status === 'AVAILABLE' ? 'متاح' : 'في الميدان'}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Select from Ready Orders */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium">الطلبات الجاهزة للشحن (اختر للإسناد السريع):</label>
              {readyOrders.length > 0 && (
                <span className="text-[11px] text-muted-foreground font-mono">
                  محدد: {selectedReadyOrderNumbers.length} من {readyOrders.length}
                </span>
              )}
            </div>

            {loadingReadyOrders ? (
              <div className="py-2 text-center text-xs text-muted-foreground animate-pulse">
                جارٍ تحميل الطلبات الجاهزة...
              </div>
            ) : readyOrders.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-muted dark:bg-muted border border-border dark:border-border">
                {readyOrders.map((ord: any) => {
                  const isSelected = selectedReadyOrderNumbers.includes(ord.orderNumber);
                  return (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => toggleReadyOrder(ord.orderNumber)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition active:scale-95 ${
                        isSelected
                          ? 'bg-slate-900 text-white dark:bg-muted dark:text-foreground shadow-sm'
                          : 'bg-white dark:bg-muted border border-border dark:border-border text-foreground dark:text-muted-foreground hover:border-border'
                      }`}
                    >
                      <span className="font-mono font-semibold">{ord.orderNumber}</span>
                      <span className="text-[11px] opacity-75 truncate max-w-[100px]">{ord.customerName}</span>
                      <span className="font-bold tabular-nums font-mono text-[11px]">({formatPrice(ord.total || 0)})</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground p-2 rounded-xl bg-muted dark:bg-muted border border-border dark:border-border">
                لا توجد طلبات معلقة بحالة READY_TO_SHIP حالياً. يمكنك كتابة أرقام الطلبات يدوياً بالأسفل.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              أو كتابة / لصق أرقام طلبات يدوياً (مفصولة بفاصلة أو سطر جديد):
            </label>
            <textarea
              rows={3}
              placeholder="مثال:&#10;ORD-1001&#10;ORD-1002"
              value={orderNumbersInput}
              onChange={(e) => setOrderNumbersInput(e.target.value)}
              className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg font-mono text-xs focus:outline-none"
            />
            <span className="text-[11px] text-muted-foreground block mt-1">
              يمكنك أيضاً إسناد الطلبات مباشرة من صالة تجهيز الطلبات (Preparation Queue).
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">ملاحظات المأمورية (اختياري)</label>
            <input
              type="text"
              placeholder="مثال: خط سير شرق القاهرة، أولوية تسليم صباحي"
              value={dispatchNotes}
              onChange={(e) => setDispatchNotes(e.target.value)}
              className="w-full px-3 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg text-xs sm:text-sm focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border dark:border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={submittingDispatch}
              className="px-4 py-2 text-xs font-semibold text-white bg-muted dark:bg-muted dark:text-foreground rounded-lg hover:bg-muted transition active:scale-95 disabled:opacity-50"
            >
              {submittingDispatch ? 'جارٍ إصدار المأمورية...' : 'إصدار المأمورية وخروج الطرود'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
