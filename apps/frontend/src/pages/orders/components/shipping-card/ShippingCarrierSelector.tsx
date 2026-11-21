/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from "react";
import { ShippingCompany, CourierMode } from "./shippingCardTypes";
import { ShippingCarrierTabs } from "./ShippingCarrierTabs";
import { TurboDirectShipmentCard } from "./TurboDirectShipmentCard";
import { QpExpressDirectShipmentCard } from "./QpExpressDirectShipmentCard";
import { BostaDirectShipmentCard } from "./BostaDirectShipmentCard";
import { CustomCourierShipmentCard } from "./CustomCourierShipmentCard";
import { ManualCourierShipmentCard } from "./ManualCourierShipmentCard";

export interface ShippingCarrierSelectorProps {
  order: any;
  courierMode: CourierMode;
  setCourierMode: (mode: CourierMode) => void;
  setIsManualCourier: (isManual: boolean) => void;
  turboCompany?: ShippingCompany;
  qpCompany?: ShippingCompany;
  bostaCompany?: ShippingCompany;
  customCompanies?: ShippingCompany[];
  companies?: ShippingCompany[];
  qpSettings: any;
  qpNotes: string;
  setQpNotes: (notes: string) => void;
  manualTracking: string;
  setManualTracking: (tracking: string) => void;
  manualNotes: string;
  setManualNotes: (notes: string) => void;
  selectedCompanyId: string;
  setSelectedCompanyId: (id: string) => void;
  loading: boolean;
  onTurboDirectShipment: () => void;
  onQpExpressDirectShipment: () => void;
  onBostaDirectShipment: () => void;
  onCreateShipment: () => void;
}

export const ShippingCarrierSelector: React.FC<ShippingCarrierSelectorProps> = ({
  order,
  courierMode,
  setCourierMode,
  setIsManualCourier,
  turboCompany,
  qpCompany,
  bostaCompany,
  customCompanies = [],
  companies,
  qpSettings,
  qpNotes,
  setQpNotes,
  manualTracking,
  setManualTracking,
  manualNotes,
  setManualNotes,
  selectedCompanyId,
  setSelectedCompanyId,
  loading,
  onTurboDirectShipment,
  onQpExpressDirectShipment,
  onBostaDirectShipment,
  onCreateShipment,
}) => {
  const allActiveCompanies = useMemo(() => {
    let list: ShippingCompany[] = [];
    if (companies && companies.length > 0) {
      list = [...companies];
    } else {
      if (turboCompany) list.push(turboCompany);
      if (qpCompany) list.push(qpCompany);
      if (bostaCompany) list.push(bostaCompany);
      if (customCompanies && customCompanies.length > 0) {
        list.push(...customCompanies);
      }
    }
    const seen = new Set<string>();
    return list.filter((c) => {
      if (!c || !c.id || seen.has(c.id)) return false;
      seen.add(c.id);
      return c.isActive !== false;
    });
  }, [companies, turboCompany, qpCompany, bostaCompany, customCompanies]);

  const activeSelectedCompany = useMemo(() => {
    if (selectedCompanyId) {
      const found = allActiveCompanies.find((c) => c.id === selectedCompanyId);
      if (found) return found;
    }
    if (courierMode === "turbo") {
      return (
        turboCompany ||
        allActiveCompanies.find((c) => {
          const k = (c.providerKey || "").toUpperCase();
          const s = (c.slug || "").toLowerCase();
          const n = (c.name || "").toLowerCase();
          return k === "TURBO" || s === "turbo" || n.includes("turbo") || n.includes("تربو");
        })
      );
    }
    if (courierMode === "qp") {
      return (
        qpCompany ||
        allActiveCompanies.find((c) => {
          const k = (c.providerKey || "").toUpperCase();
          const s = (c.slug || "").toLowerCase();
          const n = (c.name || "").toLowerCase();
          return k === "QP_EXPRESS" || s === "qp" || n.includes("qp") || n.includes("كيو بي");
        })
      );
    }
    if (courierMode === "bosta") {
      return (
        bostaCompany ||
        allActiveCompanies.find((c) => {
          const k = (c.providerKey || "").toUpperCase();
          const s = (c.slug || "").toLowerCase();
          const n = (c.name || "").toLowerCase();
          return k === "BOSTA" || s === "bosta" || n.includes("bosta") || n.includes("بوستا");
        })
      );
    }
    return allActiveCompanies.find((c) => c.id === courierMode);
  }, [allActiveCompanies, selectedCompanyId, courierMode, turboCompany, qpCompany, bostaCompany]);

  const isTurboActive =
    courierMode === "turbo" ||
    (activeSelectedCompany &&
      ((activeSelectedCompany.providerKey || "").toUpperCase() === "TURBO" ||
        (activeSelectedCompany.slug || "").toLowerCase() === "turbo" ||
        (activeSelectedCompany.name || "").toLowerCase().includes("turbo") ||
        (activeSelectedCompany.name || "").includes("تربو")));

  const isQpActive =
    courierMode === "qp" ||
    (activeSelectedCompany &&
      ((activeSelectedCompany.providerKey || "").toUpperCase() === "QP_EXPRESS" ||
        (activeSelectedCompany.slug || "").toLowerCase() === "qp" ||
        (activeSelectedCompany.name || "").toLowerCase().includes("qp") ||
        (activeSelectedCompany.name || "").includes("كيو بي")));

  const isBostaActive =
    courierMode === "bosta" ||
    (activeSelectedCompany &&
      ((activeSelectedCompany.providerKey || "").toUpperCase() === "BOSTA" ||
        (activeSelectedCompany.slug || "").toLowerCase() === "bosta" ||
        (activeSelectedCompany.name || "").toLowerCase().includes("bosta") ||
        (activeSelectedCompany.name || "").includes("بوستا")));

  const isManualActive = courierMode === "manual";

  return (
    <div className="space-y-4">
      <ShippingCarrierTabs
        courierMode={courierMode}
        setCourierMode={setCourierMode}
        setIsManualCourier={setIsManualCourier}
        turboCompany={turboCompany}
        qpCompany={qpCompany}
        bostaCompany={bostaCompany}
        customCompanies={customCompanies}
        companies={companies}
        selectedCompanyId={selectedCompanyId}
        setSelectedCompanyId={setSelectedCompanyId}
      />

      {isTurboActive && (
        <TurboDirectShipmentCard
          orderTotal={order?.total || 0}
          loading={loading}
          onTurboDirectShipment={onTurboDirectShipment}
        />
      )}

      {isQpActive && (
        <QpExpressDirectShipmentCard
          qpSettings={qpSettings}
          qpNotes={qpNotes}
          setQpNotes={setQpNotes}
          loading={loading}
          onQpExpressDirectShipment={onQpExpressDirectShipment}
        />
      )}

      {isBostaActive && (
        <BostaDirectShipmentCard
          loading={loading}
          onBostaDirectShipment={onBostaDirectShipment}
        />
      )}

      {!isTurboActive && !isQpActive && !isBostaActive && !isManualActive && (
        <CustomCourierShipmentCard
          customCompanies={allActiveCompanies}
          selectedCompany={activeSelectedCompany}
          selectedCompanyId={selectedCompanyId || activeSelectedCompany?.id || ""}
          setSelectedCompanyId={setSelectedCompanyId}
          loading={loading}
          onCreateShipment={onCreateShipment}
          orderTotal={order?.total || 0}
        />
      )}

      {isManualActive && (
        <ManualCourierShipmentCard
          manualTracking={manualTracking}
          setManualTracking={setManualTracking}
          manualNotes={manualNotes}
          setManualNotes={setManualNotes}
          loading={loading}
          onCreateShipment={onCreateShipment}
        />
      )}
    </div>
  );
};

export default ShippingCarrierSelector;
