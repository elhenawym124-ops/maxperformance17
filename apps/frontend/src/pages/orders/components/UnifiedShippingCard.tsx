/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { TruckIcon } from "@heroicons/react/24/outline";
import { UnifiedShippingCardProps } from "./shipping-card/shippingCardTypes";
import { useShippingCardData } from "./shipping-card/useShippingCardData";
import { ShippingErrorBanner } from "./shipping-card/ShippingErrorBanner";
import { ShippingTrackingView } from "./shipping-card/ShippingTrackingView";
import { ShippingCarrierSelector } from "./shipping-card/ShippingCarrierSelector";
import { ShippingCancelModal } from "./shipping-card/ShippingCancelModal";

export type { UnifiedShippingCardProps };

const UnifiedShippingCard: React.FC<UnifiedShippingCardProps> = ({
  order,
  onOrderUpdated,
  canManageShipments = true,
  onOpenTicket,
}) => {
  const {
    companies,
    loadingCompanies,
    selectedCompanyId,
    setSelectedCompanyId,
    courierMode,
    setCourierMode,
    setIsManualCourier,
    manualTracking,
    setManualTracking,
    manualNotes,
    setManualNotes,
    qpNotes,
    setQpNotes,
    loading,
    syncing,
    cancelling,
    resending,
    showCancelModal,
    setShowCancelModal,
    cancelReason,
    setCancelReason,
    shipment,
    existingTracking,
    shipmentMeta,
    liveStatus,
    shippingAutoError,
    isQpExpress,
    isBosta,
    isTurbo,
    existingCarrierName,
    qpCompany,
    bostaCompany,
    turboCompany,
    customCompanies,
    qpSettings,
    shipmentStatus,
    copyTracking,
    handleTurboDirectShipment,
    handleQpExpressDirectShipment,
    handleBostaDirectShipment,
    handlePrintBostaAWB,
    handlePrintQpWaybill,
    handleCreateShipment,
    handleSyncStatus,
    handleCancelShipment,
    handleResendShipment,
  } = useShippingCardData({
    order,
    onOrderUpdated,
    canManageShipments,
  });

  return (
    <div className="bg-white dark:dark:bg-muted rounded-xl border border-border dark:dark:border-border shadow-xs p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border dark:dark:border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/50 text-primary">
            <TruckIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-foreground dark:text-white">
              إدارة الشحن والتوصيل
            </h3>
            <p className="text-xs text-muted-foreground dark:dark:text-muted-foreground">
              ربط ومتابعة شحنة الطلب مع أي شركة شحن أو مندوب
            </p>
          </div>
        </div>

        {existingTracking && (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              String(shipmentStatus).toLowerCase().includes("return") ||
              String(shipmentStatus).includes("مرتجع") ||
              order?.turboShipmentStatus === "returned_to_company" ||
              order?.turboShipmentStatus === "5"
                ? "bg-destructive/10 text-destructive border-destructive dark:bg-destructive/40 dark:text-destructive dark:border-destructive"
                : String(shipmentStatus).toLowerCase().includes("deliver") ||
                  String(shipmentStatus).includes("تسليم")
                ? "bg-success/10 text-success border-success dark:bg-success/40 dark:text-success dark:border-success"
                : "bg-primary/10 text-primary border-primary dark:bg-primary/40 dark:text-primary dark:border-primary"
            }`}
          >
            {shipmentStatus}
          </span>
        )}
      </div>

      {/* Case 1: Order already has a shipment */}
      {existingTracking ? (
        <ShippingTrackingView
          order={order}
          shipment={shipment}
          existingTracking={existingTracking}
          existingCarrierName={existingCarrierName}
          isQpExpress={isQpExpress}
          isBosta={isBosta}
          isTurbo={isTurbo}
          shipmentMeta={shipmentMeta}
          liveStatus={liveStatus}
          resending={resending}
          syncing={syncing}
          onResendShipment={handleResendShipment}
          onSyncStatus={handleSyncStatus}
          onOpenTicket={onOpenTicket}
          onPrintBostaAWB={handlePrintBostaAWB}
          onPrintQpWaybill={handlePrintQpWaybill}
          onShowCancelModal={() => setShowCancelModal(true)}
          onCopyTracking={copyTracking}
        />
      ) : (
        /* Case 2: Order NOT shipped yet - Select courier and dispatch */
        <div className="space-y-4">
          <ShippingErrorBanner
            shippingAutoError={shippingAutoError}
            companiesCount={companies.length}
            loadingCompanies={loadingCompanies}
          />

          <ShippingCarrierSelector
            order={order}
            courierMode={courierMode}
            setCourierMode={setCourierMode}
            setIsManualCourier={setIsManualCourier}
            turboCompany={turboCompany}
            qpCompany={qpCompany}
            bostaCompany={bostaCompany}
            customCompanies={customCompanies}
            qpSettings={qpSettings}
            qpNotes={qpNotes}
            setQpNotes={setQpNotes}
            manualTracking={manualTracking}
            setManualTracking={setManualTracking}
            manualNotes={manualNotes}
            setManualNotes={setManualNotes}
            selectedCompanyId={selectedCompanyId}
            setSelectedCompanyId={setSelectedCompanyId}
            loading={loading}
            onTurboDirectShipment={handleTurboDirectShipment}
            onQpExpressDirectShipment={handleQpExpressDirectShipment}
            onBostaDirectShipment={handleBostaDirectShipment}
            onCreateShipment={handleCreateShipment}
          />
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <ShippingCancelModal
        showCancelModal={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        cancelling={cancelling}
        onConfirmCancel={handleCancelShipment}
      />
    </div>
  );
};

export default UnifiedShippingCard;
