import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  TruckIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import OrderModal from "../../../../components/common/OrderModal";

export interface ActiveCarrier {
  id: string;
  name: string;
  providerKey: string;
  integrationMode?: string;
  isActive?: boolean;
}

interface DispatchCarrierModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordersCount: number;
  carriers: ActiveCarrier[];
  onConfirm: (carrier: ActiveCarrier) => void;
  loading: boolean;
  isHeldMode?: boolean;
}

export const DispatchCarrierModal: React.FC<DispatchCarrierModalProps> = ({
  isOpen,
  onClose,
  ordersCount,
  carriers,
  onConfirm,
  loading,
  isHeldMode = false,
}) => {
  const { t } = useTranslation();
  const [selectedCarrierId, setSelectedCarrierId] = useState<string>("");

  useEffect(() => {
    if (isOpen && carriers.length > 0) {
      if (!selectedCarrierId || !carriers.some((c) => c.id === selectedCarrierId)) {
        setSelectedCarrierId(carriers[0].id);
      }
    }
  }, [isOpen, carriers, selectedCarrierId]);

  const selectedCarrier = carriers.find((c) => c.id === selectedCarrierId) || carriers[0];

  const handleConfirm = () => {
    if (selectedCarrier) {
      onConfirm(selectedCarrier);
    }
  };

  return (
    <OrderModal
      open={isOpen}
      isOpen={isOpen}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      onClose={onClose}
      title="شحن وتجهيز الطلبات"
      description={`إرسال ${ordersCount} طلب إلى شركة الشحن`}
      subtitle={`إرسال ${ordersCount} طلب إلى شركة الشحن`}
      showCancel={false}
      busy={loading}
      size="md"
    >
      <div className="space-y-4 py-2">
        {carriers.length === 0 ? (
          <div className="rounded-xl border border-warning bg-warning/10 p-4 text-center dark:border-warning dark:bg-warning/40">
            <ExclamationCircleIcon className="mx-auto h-10 w-10 text-warning mb-2" />
            <p className="text-sm font-semibold text-warning dark:text-warning">
              لا توجد شركة شحن مفعلة حالياً
            </p>
            <p className="text-xs text-warning dark:text-warning mt-1 mb-3">
              لتتمكن من إرسال الشحنات مباشرة، يرجى تفعيل إحدى شركات الشحن (مثل كيو بي إكسبريس، بوسطة، أو تربو) من مركز شركات الشحن.
            </p>
            <Link
              to="/shipping-companies"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary transition shadow-sm"
            >
              <TruckIcon className="h-4 w-4" />
              <span>الانتقال إلى مركز شركات الشحن</span>
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              اختر شركة الشحن التي ترغب في توجيه وإصدار بوالص الـ ({ordersCount}) طلب المحددة من خلالها:
            </p>

            <div className="rounded-xl border border-primary bg-primary/70 p-2.5 text-xs text-primary dark:border-primary/50 dark:bg-primary/40 dark:text-primary">
              {isHeldMode ? (
                <span>
                  {t(
                    "preparation.dispatchModal.heldNotice",
                    "سيتم إصدار بوالص الشحن وفك التعليق وإرجاع الطلبات تلقائياً إلى «في انتظار التجهيز»."
                  )}
                </span>
              ) : (
                <span>
                  {t(
                    "preparation.dispatchModal.defaultNotice",
                    "سيتم إصدار بوالص الشحن وتحديث حالة الطلبات تلقائياً إلى جاهز للشحن."
                  )}
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pe-1">
              {carriers.map((carrier) => {
                const isSelected = carrier.id === selectedCarrierId;
                return (
                  <label
                    key={carrier.id}
                    onClick={() => setSelectedCarrierId(carrier.id)}
                    className={
                      isSelected
                        ? "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition border-primary bg-primary/70 dark:bg-primary/40 dark:border-primary ring-2 ring-primary/20"
                        : "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition border-border dark:dark:border-border bg-card hover:border-border"
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={
                          isSelected
                            ? "p-2 rounded-lg bg-primary text-white"
                            : "p-2 rounded-lg bg-muted text-muted-foreground"
                        }
                      >
                        <TruckIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-foreground block">
                          {carrier.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {carrier.providerKey}
                          </span>
                          {carrier.integrationMode && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                              {carrier.integrationMode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <input
                      type="radio"
                      name="dispatch_carrier"
                      checked={isSelected}
                      onChange={() => setSelectedCarrierId(carrier.id)}
                      className="h-4 w-4 text-primary border-border focus:ring-primary"
                    />
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:dark:border-border">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-xs font-medium text-foreground bg-muted dark:dark:bg-muted rounded-lg hover:hover:bg-muted transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading || !selectedCarrier}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary rounded-lg hover:bg-primary disabled:opacity-50 transition shadow-sm"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    <span>جاري إنشاء الشحنات...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>تأكيد وشحن عبر {selectedCarrier?.name || "الشركة"}</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </OrderModal>
  );
};

export default DispatchCarrierModal;
