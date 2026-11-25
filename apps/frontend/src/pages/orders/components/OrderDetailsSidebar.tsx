import React from "react";
import { ChevronDown } from "lucide-react";
import CustomerInfoCard from "./CustomerInfoCard";
import CustomerOrderHistoryCard from "./CustomerOrderHistoryCard";
import OrderPaymentCard from "./OrderPaymentCard";
import OrderSessionDetailsCard from "./OrderSessionDetailsCard";
import OrderSourceCard from "./OrderSourceCard";
import OrderAttributionCard from "./OrderAttributionCard";
import OrderReturnCollectionFeeCard from "./OrderReturnCollectionFeeCard";
import WalletPaymentProofCard from "./WalletPaymentProofCard";
import OrderCancellationReturnBanner from "./OrderCancellationReturnBanner";
import OrderConfirmationDistributionCard from "./OrderConfirmationDistributionCard";
import OrderActivityLog from "./OrderActivityLog";
import OrderScheduledDeliveryCard from "./OrderScheduledDeliveryCard";
import { OrderDetailsType } from "../types";

export interface OrderDetailsSidebarProps {
  order: OrderDetailsType;
  canEditOrderDetails: boolean;
  isEditing: boolean;
  editForm: any;
  setEditForm: React.Dispatch<React.SetStateAction<any>>;
  governments: any[];
  areas: any[];
  loadingGovernments: boolean;
  loadingAreas: boolean;
  selectedGovernmentId: string;
  setSelectedGovernmentId: (id: string) => void;
  handleGovernmentChange: (id: string) => void;
  invoiceSettings: any;
  fetchOrderDetails: () => Promise<void>;
  setOrder: React.Dispatch<React.SetStateAction<OrderDetailsType | null>>;
  canUpdatePaymentStatus: boolean;
  setShowPaymentModal: (show: boolean) => void;
  showOrderSourceCard: boolean;
  showOrderAttributionCard: boolean;
  verifyWalletProof: (status: "APPROVED" | "REJECTED") => Promise<void>;
  effectiveStatus: string;
  latestCancellationReason: string;
  returnDetails: any;
  showConfirmationDistributionCard: boolean;
  formatOptionalDate: (value?: string | null) => string;
  orderNotes: any[];
  addNote: (note: string) => Promise<boolean>;
  updateNote: (id: string, note: string) => Promise<boolean>;
  deleteNote: (id: string) => Promise<boolean>;
  updatingNote: boolean;
  deletingNote: boolean;
  isMerchant: boolean;
  currentUserId?: string;
  statusNameMap: Record<string, string>;
  isCancellationStatus: (status?: string | null) => boolean;
}

interface MobileCollapsibleCardProps {
  id?: string;
  title: string;
  expandEventName?: string;
  children: React.ReactNode;
}

const MobileCollapsibleCard: React.FC<MobileCollapsibleCardProps> = ({
  id,
  title,
  expandEventName,
  children,
}) => {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!expandEventName) return;
    const handler = () => setOpen(true);
    window.addEventListener(expandEventName, handler);
    return () => window.removeEventListener(expandEventName, handler);
  }, [expandEventName]);

  return (
    <div id={id}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="lg:hidden w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border/70 bg-card text-xs font-semibold text-foreground hover:bg-muted/60 transition"
      >
        <span>{title}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div className={open ? "block mt-2" : "hidden lg:block"}>{children}</div>
    </div>
  );
};

export const OrderDetailsSidebar: React.FC<OrderDetailsSidebarProps> = ({
  order,
  canEditOrderDetails,
  isEditing,
  editForm,
  setEditForm,
  governments,
  areas,
  loadingGovernments,
  loadingAreas,
  selectedGovernmentId,
  setSelectedGovernmentId,
  handleGovernmentChange,
  invoiceSettings,
  fetchOrderDetails,
  setOrder,
  canUpdatePaymentStatus,
  setShowPaymentModal,
  showOrderSourceCard,
  showOrderAttributionCard,
  verifyWalletProof,
  effectiveStatus,
  latestCancellationReason,
  returnDetails,
  showConfirmationDistributionCard,
  formatOptionalDate,
  orderNotes,
  addNote,
  updateNote,
  deleteNote,
  updatingNote,
  deletingNote,
  isMerchant,
  currentUserId,
  statusNameMap,
  isCancellationStatus,
}) => {
  return (
    <div className="contents lg:block lg:col-span-1 lg:space-y-6">
      <div className="order-1 lg:order-none">
        <CustomerInfoCard
          order={order}
          isEditing={canEditOrderDetails && isEditing}
          editForm={editForm}
          setEditForm={setEditForm}
          governments={governments}
          areas={areas}
          loadingGovernments={loadingGovernments}
          loadingAreas={loadingAreas}
          selectedGovernmentId={selectedGovernmentId}
          setSelectedGovernmentId={setSelectedGovernmentId}
          handleGovernmentChange={handleGovernmentChange}
          invoiceSettings={invoiceSettings}
          onOrderUpdated={fetchOrderDetails}
          onCustomerRatingChange={(newRating) => {
            setOrder((prev) =>
              prev
                ? {
                    ...prev,
                    customerRating: newRating,
                    customer: prev.customer
                      ? { ...prev.customer, customerRating: newRating }
                      : prev.customer,
                  }
                : prev,
            );
          }}
        />
      </div>

      <div className="order-3 lg:order-none space-y-4 sm:space-y-6">
        <MobileCollapsibleCard
          id="customer-order-history-card"
          expandEventName="expand-customer-history"
          title={`سجل وتاريخ طلبات العميل${
            order.customerHistory?.stats?.totalOrders
              ? ` (${order.customerHistory.stats.totalOrders})`
              : ""
          }`}
        >
          <CustomerOrderHistoryCard
            orderNumber={order.orderNumber}
            initialHistory={order.customerHistory}
            customerPhone={order.customerPhone}
            customerEmail={order.customerEmail}
            customerId={order.customerId}
            currency={order.currency}
          />
        </MobileCollapsibleCard>

      <OrderPaymentCard
        order={order}
        canUpdatePaymentStatus={canUpdatePaymentStatus}
        onOpenPaymentModal={() => setShowPaymentModal(true)}
      />

      <MobileCollapsibleCard title="تفاصيل الجلسة والزيارة">
        <OrderSessionDetailsCard
          sessionDetails={
            order.sessionDetails || (order.metadata as any)?.sessionDetails
          }
          firstOrderInfo={order.firstOrderInfo}
          orderSource={order.orderSource}
          sourceType={order.sourceType}
          customerPhone={order.customerPhone}
          createdAt={order.createdAt}
          orderGovernorate={
            order.governorate ||
            order.shippingAddress?.governorate ||
            (order.shippingAddress as any)?.government
          }
          orderCity={order.city || order.shippingAddress?.city}
        />
      </MobileCollapsibleCard>

      {showOrderSourceCard && (
        <MobileCollapsibleCard title="مصدر الطلب">
          <OrderSourceCard order={order} />
        </MobileCollapsibleCard>
      )}
      {showOrderAttributionCard && (
        <MobileCollapsibleCard title="إسناد العمولة والتسويق">
          <OrderAttributionCard order={order} />
        </MobileCollapsibleCard>
      )}

      <OrderReturnCollectionFeeCard order={order} />

      {(order as any)?.walletPaymentProof ? (
        <WalletPaymentProofCard
          proof={(order as any).walletPaymentProof}
          onVerify={verifyWalletProof}
        />
      ) : null}

      <OrderCancellationReturnBanner
        isCancellation={Boolean(isCancellationStatus(effectiveStatus))}
        latestCancellationReason={latestCancellationReason}
        returnDetails={returnDetails}
      />

      {/* Confirmation & Assignment Info */}
      {showConfirmationDistributionCard && (
        <MobileCollapsibleCard title="توزيع التأكيد والتعيين">
          <OrderConfirmationDistributionCard
            order={order}
            effectiveStatus={effectiveStatus}
            formatOptionalDate={formatOptionalDate}
          />
        </MobileCollapsibleCard>
      )}

      {/* Order Activity Log */}
      <OrderActivityLog
        order={{
          ...order,
          statusHistory: order.statusHistory || [],
          orderNotes: orderNotes,
        }}
        onAddNote={addNote}
        onUpdateNote={updateNote}
        onDeleteNote={deleteNote}
        addingNote={false}
        updatingNote={updatingNote}
        deletingNote={deletingNote}
        canAddNote={!isMerchant}
        currentUserId={currentUserId}
        statusNameMap={statusNameMap}
      />

      {/* Scheduled Order Info */}
      {order.isScheduled && order.scheduledDeliveryDate && (
        <OrderScheduledDeliveryCard
          scheduledDeliveryDate={order.scheduledDeliveryDate}
          scheduledNotes={order.scheduledNotes}
          autoTransitionEnabled={order.autoTransitionEnabled}
        />
      )}
      </div>
    </div>
  );
};

export default OrderDetailsSidebar;
