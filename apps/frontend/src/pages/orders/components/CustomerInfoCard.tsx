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
      <div className="bg-card border border-border/70 shadow-xs rounded-xl p-3.5 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-2.5">
          <h3 className="flex min-w-0 items-center text-base sm:text-lg font-semibold text-foreground flex-wrap gap-2">
            <span className="flex items-center gap-2">
              <UserIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
              <span>{t("orderDetails.customerInfo")}</span>
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
          </h3>

          {isBlockAdmin && hasBlockIdentifier && !isEditing && (
            customerBlock?.blocked ? (
              <button
                type="button"
                onClick={handleUnblockCustomer}
                disabled={savingBlock || checkingBlock || !customerBlock.rule?.id}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-destructive/40 bg-card px-3 py-2 min-h-9 text-xs font-semibold text-destructive dark:brightness-125 transition hover:bg-destructive hover:text-destructive-foreground hover:brightness-100 disabled:opacity-60 active:scale-97"
              >
                <CheckCircleIcon className="h-4 w-4 shrink-0" />
                <span>{savingBlock ? "جاري..." : "فك الحظر"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowBlockModal(true)}
                disabled={savingBlock || checkingBlock}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-destructive/45 bg-transparent dark:bg-destructive/10 px-3 py-2 min-h-9 text-xs font-semibold text-destructive dark:brightness-125 transition hover:bg-destructive hover:text-destructive-foreground hover:brightness-100 disabled:opacity-60 active:scale-97"
              >
                <NoSymbolIcon className="h-4 w-4 shrink-0" />
                <span>{checkingBlock ? "فحص..." : "حظر العميل"}</span>
              </button>
            )
          )}
        </div>

        {customerBlock?.blocked && (
          <div className="mb-4 rounded-xl border border-destructive/35 bg-destructive/10 p-3 text-sm text-foreground">
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

        {order.customerHistory?.stats && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("customer-order-history-card");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="w-full flex flex-wrap items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl border border-primary/25 bg-primary/10 dark:bg-primary/15 text-foreground transition hover:bg-primary/15 dark:hover:bg-primary/20 text-xs active:scale-97 cursor-pointer"
              title="الانتقال إلى سجل وتاريخ طلبات العميل السابقة"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ShoppingBagIcon className="w-4 h-4 text-primary shrink-0" />
                <span className="font-semibold text-foreground">
                  {order.customerHistory.stats.totalOrders > 1
                    ? `سجل المشتريات: ${order.customerHistory.stats.totalOrders} طلبات`
                    : "سجل المشتريات: عميل جديد (أول طلب)"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ms-auto">
                {order.customerHistory.stats.deliverySuccessRate !== null && (
                  <span className="px-1.5 py-0.5 rounded-md text-[10.5px] font-bold tabular-nums font-mono bg-card text-foreground border border-border/70">
                    {order.customerHistory.stats.deliverySuccessRate}% استلام
                  </span>
                )}
                <span className="text-[11px] text-primary dark:brightness-125 font-semibold underline underline-offset-2 whitespace-nowrap">
                  عرض السجل ↓
                </span>
              </div>
            </button>
          </div>
        )}

        <div className="space-y-3">
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
