import React from "react";
import { useTranslation } from "react-i18next";
import {
  UserIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { CustomerRatingBadge } from "../../../components/orders/CustomerRatingBadge";
import { useOrderCustomFieldsConfig } from "../../../hooks/useOrderCustomFieldsConfig";
import { resolveCustomFieldsForDisplay } from "../../../utils/orderCustomFields";
import {
  CustomerInfoCardCustomFieldConfig,
  CustomerInfoCardProps,
  getBlockActionLabel,
} from "./customer-card/customerCardTypes";
import { useCustomerBlock } from "./customer-card/useCustomerBlock";
import { CustomerBlockModal } from "./customer-card/CustomerBlockModal";
import { CustomerContactSection } from "./customer-card/CustomerContactSection";
import { CustomerAddressSection } from "./customer-card/CustomerAddressSection";
import { CustomerNotesSection } from "./customer-card/CustomerNotesSection";

export type { CustomerInfoCardCustomFieldConfig, CustomerInfoCardProps };

const CustomerInfoCard: React.FC<CustomerInfoCardProps> = ({
  order,
  isEditing,
  editForm,
  setEditForm,
  governments,
  invoiceSettings,
  customFieldConfig: passedCustomFieldConfig,
  canEditRating,
  onCustomerRatingChange,
}) => {
  const { t } = useTranslation();
  const { config: customFieldConfig } = useOrderCustomFieldsConfig({
    invoiceSettings,
    overrideConfig: passedCustomFieldConfig,
  });

  const isCustomFieldEnabled = customFieldConfig.isEnabled;
  const { customFields, displayNotes } = resolveCustomFieldsForDisplay(order, {
    showCustomFields: isCustomFieldEnabled,
    defaultLabel: customFieldConfig.label,
  });

  const {
    customerBlock,
    checkingBlock,
    showBlockModal,
    setShowBlockModal,
    savingBlock,
    blockForm,
    setBlockForm,
    isBlockAdmin,
    hasBlockIdentifier,
    handleBlockCustomer,
    handleUnblockCustomer,
  } = useCustomerBlock(order);

  return (
    <>
      <div className="bg-card border border-border/70 shadow-xs rounded-xl p-3.5 sm:p-5 lg:p-4 2xl:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="flex min-w-0 items-center text-sm sm:text-base font-semibold text-foreground flex-wrap gap-1.5 sm:gap-2">
            <span className="flex items-center gap-1.5">
              <UserIcon className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
              <span className="sr-only sm:not-sr-only">{t("orderDetails.customerInfo")}</span>
            </span>
            <CustomerRatingBadge
              rating={order.customerRating || (order as any).customer?.customerRating}
              healthScore={(order as any).healthScore ?? (order as any).customer?.healthScore}
              healthDiagnosis={(order as any).healthDiagnosis}
              orderNumber={order.orderNumber}
              customerId={order.customerId || (order as any).customer?.id}
              deliveryRate={
                (order as any).deliveryRate ??
                order.customerHistory?.stats?.deliverySuccessRate ??
                (order as any).customer?.deliveryRate
              }
              totalDelivered={
                (order as any).totalDelivered ??
                order.customerHistory?.stats?.deliveredCount ??
                (order as any).customer?.totalDelivered
              }
              totalFailed={
                (order as any).totalFailed ??
                order.customerHistory?.stats?.returnedCount
              }
              totalAttempts={
                (order as any).totalAttempts ??
                (order.customerHistory?.stats
                  ? (order.customerHistory.stats.deliveredCount || 0) +
                    (order.customerHistory.stats.returnedCount || 0)
                  : undefined)
              }
              totalOrdersCount={
                (order as any).totalOrdersCount ??
                order.customerHistory?.stats?.totalOrders ??
                (order as any).customer?.totalOrdersCount
              }
              interactive={canEditRating ?? true}
              allowManualEdit={canEditRating ?? true}
              onRatingChange={onCustomerRatingChange}
              variant="badge"
              size="sm"
            />
            {order.customerHistory?.stats && (
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("expand-customer-history"));
                  window.setTimeout(() => {
                    const el = document.getElementById("customer-order-history-card");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 40);
                }}
                aria-label={
                  order.customerHistory.stats.totalOrders > 1
                    ? `سجل المشتريات: ${order.customerHistory.stats.totalOrders} طلبات`
                    : "سجل المشتريات: عميل جديد (أول طلب)"
                }
                title="الانتقال إلى سجل وتاريخ طلبات العميل السابقة"
                className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-foreground hover:bg-primary/15 transition active:scale-97 cursor-pointer"
              >
                <ShoppingBagIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="font-mono tabular-nums">
                  {order.customerHistory.stats.totalOrders}
                </span>
                <span>
                  {order.customerHistory.stats.totalOrders === 1 ? "طلب" : "طلبات"}
                </span>
                {order.customerHistory.stats.deliverySuccessRate !== null && (
                  <span className="font-mono tabular-nums text-primary dark:brightness-125">
                    · {order.customerHistory.stats.deliverySuccessRate}%
                  </span>
                )}
              </button>
            )}
          </h3>

          {isBlockAdmin && hasBlockIdentifier && !isEditing && (
            customerBlock?.blocked ? (
              <button
                type="button"
                onClick={handleUnblockCustomer}
                disabled={savingBlock || checkingBlock || !customerBlock.rule?.id}
                aria-label={savingBlock ? "جاري فك الحظر" : "فك الحظر"}
                title="فك الحظر عن العميل"
                className="inline-flex shrink-0 h-9 w-9 sm:w-auto sm:px-2.5 items-center justify-center gap-1.5 rounded-lg border border-destructive/40 bg-card text-xs font-semibold text-destructive dark:brightness-125 transition hover:bg-destructive hover:text-destructive-foreground hover:brightness-100 disabled:opacity-60 active:scale-97"
              >
                <CheckCircleIcon className="h-4 w-4 shrink-0" />
                <span className="sr-only sm:not-sr-only">{savingBlock ? "جاري..." : "فك الحظر"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowBlockModal(true)}
                disabled={savingBlock || checkingBlock}
                aria-label={checkingBlock ? "جاري الفحص" : "حظر العميل"}
                title="حظر العميل"
                className="inline-flex shrink-0 h-9 w-9 sm:w-auto sm:px-2.5 items-center justify-center gap-1.5 rounded-lg border border-destructive/45 bg-transparent dark:bg-destructive/10 text-xs font-semibold text-destructive dark:brightness-125 transition hover:bg-destructive hover:text-destructive-foreground hover:brightness-100 disabled:opacity-60 active:scale-97"
              >
                <NoSymbolIcon className="h-4 w-4 shrink-0" />
                <span className="sr-only sm:not-sr-only">{checkingBlock ? "فحص..." : "حظر العميل"}</span>
              </button>
            )
          )}
        </div>

        {customerBlock?.blocked && (
          <div className="mb-3 rounded-xl border border-destructive/35 bg-destructive/10 p-3 text-sm text-foreground">
            <div className="flex items-start gap-2">
              <NoSymbolIcon className="mt-0.5 h-4 w-4 shrink-0 text-destructive dark:brightness-125" />
              <div className="min-w-0">
                <p className="font-semibold text-destructive dark:brightness-125">العميل محظور</p>
                <p className="mt-0.5 text-muted-foreground">
                  الأكشن:{" "}
                  {getBlockActionLabel(
                    customerBlock.action || customerBlock.rule?.action,
                  )}
                  {customerBlock.rule?.reasonNote
                    ? ` - ${customerBlock.rule.reasonNote}`
                    : ""}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          <CustomerContactSection
            order={order}
            isEditing={isEditing}
            editForm={editForm}
            setEditForm={setEditForm}
          />
          <CustomerAddressSection
            order={order}
            isEditing={isEditing}
            editForm={editForm}
            setEditForm={setEditForm}
            governments={governments}
          />
          <CustomerNotesSection
            order={order}
            isEditing={isEditing}
            editForm={editForm}
            setEditForm={setEditForm}
            isCustomFieldEnabled={isCustomFieldEnabled}
            customFieldConfig={customFieldConfig}
            customFields={customFields}
            displayNotes={displayNotes}
          />
        </div>
      </div>

      <CustomerBlockModal
        show={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        savingBlock={savingBlock}
        blockForm={blockForm}
        setBlockForm={setBlockForm}
        onConfirm={handleBlockCustomer}
      />
    </>
  );
};

export default CustomerInfoCard;
