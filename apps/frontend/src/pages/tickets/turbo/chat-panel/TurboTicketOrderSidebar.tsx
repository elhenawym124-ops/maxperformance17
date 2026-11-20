import React from "react";
import {
  ArrowTopRightOnSquareIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PhoneIcon,
  ShoppingBagIcon,
  TruckIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export interface TurboTicketOrderSidebarProps {
  activeOrder: any;
  showOrderSidebar: boolean;
  onClose: () => void;
  orderSearchQuery: string;
  setOrderSearchQuery: (val: string) => void;
  searchingOrder: boolean;
  onSearchOrder: (e: React.FormEvent) => void;
  onCopyCode: (code: string) => void;
}

export const TurboTicketOrderSidebar: React.FC<TurboTicketOrderSidebarProps> = ({
  activeOrder,
  showOrderSidebar,
  onClose,
  orderSearchQuery,
  setOrderSearchQuery,
  searchingOrder,
  onSearchOrder,
  onCopyCode,
}) => {
  if (!showOrderSidebar) return null;

  return (
    <aside className="w-80 sm:w-88 md:w-96 border-r border-border dark:border-border bg-white dark:bg-muted flex flex-col h-full min-h-0 overflow-hidden shrink-0 absolute inset-y-0 right-0 z-30 md:static md:z-auto shadow-2xl md:shadow-none animate-in slide-in-from-right duration-200">
      {/* Sidebar Header */}
      <div className="p-3 border-b border-border dark:border-border flex items-center justify-between bg-muted dark:bg-muted shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <ShoppingBagIcon className="h-4 w-4 text-foreground dark:text-muted-foreground shrink-0" />
          <h3 className="text-xs font-bold text-foreground dark:text-muted-foreground truncate">
            {activeOrder
              ? `تفاصيل طلب #${activeOrder.orderNumber}`
              : "تفاصيل الأوردر المرتبط"}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground rounded-lg hover:bg-muted dark:hover:bg-muted transition"
          title="إغلاق القائمة الجانبية"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Sidebar Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 text-xs">
        {activeOrder ? (
          <>
            {/* Statuses & Tracking */}
            <div className="p-3 rounded-xl bg-muted dark:bg-muted border border-border dark:border-border space-y-2">
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <span className="text-[11px] text-muted-foreground">حالة الطلب بالمتجر:</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-muted dark:bg-muted text-foreground dark:text-muted-foreground">
                  {activeOrder.status}
                </span>
              </div>
              {activeOrder.turboStatus && (
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <span className="text-[11px] text-muted-foreground">حالة شحن تربو:</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-warning/10 text-warning dark:text-warning border border-warning/20">
                    {activeOrder.turboStatus}
                  </span>
                </div>
              )}
              {(activeOrder.turboTrackingNumber || activeOrder.turboShipmentId) && (
                <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-border dark:border-border">
                  <span className="text-[11px] text-muted-foreground">رقم البوليصة / الشحنة:</span>
                  <button
                    type="button"
                    onClick={() =>
                      onCopyCode(
                        String(activeOrder.turboTrackingNumber || activeOrder.turboShipmentId)
                      )
                    }
                    className="font-mono text-[11px] font-bold text-foreground dark:text-muted-foreground hover:text-primary transition flex items-center gap-1"
                  >
                    <span>{activeOrder.turboTrackingNumber || activeOrder.turboShipmentId}</span>
                    <ClipboardDocumentIcon className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>

            {/* Customer Details Card */}
            <div className="p-3 rounded-xl bg-muted dark:bg-muted border border-border dark:border-border space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground dark:text-muted-foreground flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>بيانات العميل</span>
                </span>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-foreground dark:text-muted-foreground">
                  {activeOrder.customer?.name || "عميل بدون اسم"}
                </p>
                {activeOrder.customer?.phone && (
                  <div className="flex items-center justify-between pt-1 flex-wrap gap-1">
                    <span className="font-mono text-foreground dark:text-muted-foreground tabular-nums text-[11px]">
                      {activeOrder.customer.phone}
                    </span>
                    <div className="flex items-center gap-1">
                      <a
                        href={`tel:${activeOrder.customer.phone}`}
                        className="p-1 px-1.5 rounded bg-muted dark:bg-muted text-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted transition flex items-center gap-1 text-[10px]"
                        title="اتصال بالعميل"
                      >
                        <PhoneIcon className="h-3 w-3" />
                        <span>اتصال</span>
                      </a>
                      {(() => {
                        const cleanP = String(activeOrder.customer.phone).replace(/\D/g, "");
                        const waNumber = cleanP.startsWith("0") ? `2${cleanP}` : cleanP;
                        return (
                          <a
                            href={`https://wa.me/${waNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 px-1.5 rounded bg-success text-white hover:bg-success transition flex items-center gap-1 text-[10px] font-semibold"
                            title="محادثة واتساب"
                          >
                            <ChatBubbleLeftRightIcon className="h-3 w-3" />
                            <span>واتساب</span>
                          </a>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Address */}
              {(activeOrder.customer?.governorate ||
                activeOrder.customer?.city ||
                activeOrder.customer?.address) && (
                <div className="pt-2 border-t border-border dark:border-border space-y-1">
                  <div className="flex items-start gap-1.5 text-foreground dark:text-muted-foreground text-[11px]">
                    <MapPinIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      {(activeOrder.customer.governorate || activeOrder.customer.city) && (
                        <p className="font-medium text-foreground dark:text-muted-foreground">
                          {[activeOrder.customer.governorate, activeOrder.customer.city]
                            .filter(Boolean)
                            .join(" - ")}
                        </p>
                      )}
                      {activeOrder.customer.address && (
                        <p className="text-zinc-500 dark:text-muted-foreground leading-snug">
                          {activeOrder.customer.address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Products List */}
            {activeOrder.items && activeOrder.items.length > 0 && (
              <div className="p-3 rounded-xl bg-muted dark:bg-muted border border-border dark:border-border space-y-2">
                <span className="font-bold text-foreground dark:text-muted-foreground block">
                  المنتجات المطلوبة ({activeOrder.items.length})
                </span>
                <div className="space-y-1.5 divide-y divide-border dark:divide-border">
                  {activeOrder.items.map((item: any, iIdx: number) => (
                    <div
                      key={item.id || iIdx}
                      className="pt-1.5 first:pt-0 flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-foreground dark:text-muted-foreground truncate">
                          {item.productName}
                        </p>
                        {item.variantName && (
                          <p className="text-[10px] text-muted-foreground">
                            {item.variantName}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground font-mono tabular-nums">
                          {item.quantity} × {item.unitPrice} ج.م
                        </p>
                      </div>
                      <span className="font-bold font-mono text-foreground dark:text-muted-foreground tabular-nums text-xs">
                        {item.total} ج.م
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Breakdown */}
            {activeOrder.financials && (
              <div className="p-3 rounded-xl bg-muted dark:bg-muted border border-border dark:border-border space-y-1.5">
                <span className="font-bold text-foreground dark:text-muted-foreground block mb-1">
                  الحسابات المالية
                </span>
                <div className="flex items-center justify-between text-foreground dark:text-muted-foreground text-[11px]">
                  <span>قيمة المنتجات:</span>
                  <span className="font-mono tabular-nums font-medium">
                    {activeOrder.financials.subtotal} ج.م
                  </span>
                </div>
                <div className="flex items-center justify-between text-foreground dark:text-muted-foreground text-[11px]">
                  <span>مصاريف الشحن:</span>
                  <span className="font-mono tabular-nums font-medium">
                    {activeOrder.financials.shippingFee} ج.م
                  </span>
                </div>
                {activeOrder.financials.discount > 0 && (
                  <div className="flex items-center justify-between text-success text-[11px]">
                    <span>الخصم:</span>
                    <span className="font-mono tabular-nums font-medium">
                      -{activeOrder.financials.discount} ج.م
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1.5 border-t border-border dark:border-border text-xs font-bold text-foreground dark:text-muted-foreground">
                  <span>المطلوب تحصيله:</span>
                  <span className="font-mono tabular-nums text-sm text-success dark:text-success">
                    {activeOrder.financials.total} ج.م
                  </span>
                </div>
              </div>
            )}

            {/* Turbo Captain info if assigned */}
            {(activeOrder.turboCaptainName || activeOrder.turboCaptainPhone) && (
              <div className="p-3 rounded-xl bg-warning/10 border border-warning/20 space-y-1">
                <span className="text-[11px] font-bold text-warning dark:text-warning flex items-center gap-1">
                  <TruckIcon className="h-3.5 w-3.5" />
                  <span>مندوب / كابتن تربو</span>
                </span>
                <p className="font-semibold text-foreground dark:text-muted-foreground">
                  {activeOrder.turboCaptainName || "كابتن تربو"}
                </p>
                {activeOrder.turboCaptainPhone && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-mono text-foreground dark:text-muted-foreground tabular-nums text-[11px]">
                      {activeOrder.turboCaptainPhone}
                    </span>
                    <a
                      href={`tel:${activeOrder.turboCaptainPhone}`}
                      className="p-1 px-2 rounded bg-warning text-white hover:bg-warning transition text-[10px] font-semibold"
                    >
                      اتصال
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Direct Link to Store Order */}
            <a
              href={`/orders?search=${encodeURIComponent(activeOrder.orderNumber)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 rounded-xl bg-muted hover:bg-muted dark:bg-muted dark:hover:bg-white text-white dark:text-foreground font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-97 shadow-xs"
            >
              <span>عرض الأوردر بالكامل في المتجر</span>
              <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
            </a>
          </>
        ) : (
          <div className="space-y-3 py-4">
            <div className="text-center space-y-1">
              <ShoppingBagIcon className="h-8 w-8 text-muted-foreground dark:text-foreground mx-auto" />
              <p className="font-bold text-foreground dark:text-muted-foreground">
                لا يوجد أوردر مرتبط تلقائياً
              </p>
              <p className="text-[11px] text-muted-foreground">
                يمكنك البحث برقم الأوردر أو كود الشحنة لعرض كافة تفاصيل الطلب هنا.
              </p>
            </div>

            <form onSubmit={onSearchOrder} className="space-y-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="رقم الأوردر (مثال: 1042)..."
                  className="w-full pe-8 ps-3 py-1.5 text-xs rounded-lg border border-border dark:border-border bg-muted dark:bg-muted text-foreground dark:text-muted-foreground placeholder-muted focus:outline-hidden focus:border-border transition"
                />
              </div>
              <button
                type="submit"
                disabled={searchingOrder || !orderSearchQuery.trim()}
                className="w-full py-2 rounded-lg bg-muted hover:bg-muted dark:bg-muted dark:hover:bg-white text-white dark:text-foreground font-semibold text-xs transition disabled:opacity-40"
              >
                {searchingOrder ? "جاري البحث..." : "بحث عن الأوردر"}
              </button>
            </form>
          </div>
        )}
      </div>
    </aside>
  );
};
