import React, { useMemo } from "react";
import { TruckIcon, BoltIcon, UserIcon } from "@heroicons/react/24/outline";
import { ShippingCompany, CourierMode } from "./shippingCardTypes";

export interface ShippingCarrierTabsProps {
  courierMode: CourierMode;
  setCourierMode: (mode: CourierMode) => void;
  setIsManualCourier: (isManual: boolean) => void;
  turboCompany?: ShippingCompany;
  qpCompany?: ShippingCompany;
  bostaCompany?: ShippingCompany;
  customCompanies?: ShippingCompany[];
  companies?: ShippingCompany[];
  selectedCompanyId?: string;
  setSelectedCompanyId?: (id: string) => void;
}

export const ShippingCarrierTabs: React.FC<ShippingCarrierTabsProps> = React.memo(
  ({
    courierMode,
    setCourierMode,
    setIsManualCourier,
    turboCompany,
    qpCompany,
    bostaCompany,
    customCompanies,
    companies,
    selectedCompanyId,
    setSelectedCompanyId,
  }) => {
    const activeCompanies = useMemo(() => {
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

    const getTabTitle = (company: ShippingCompany) => {
      const normKey = (company.providerKey || "").toUpperCase();
      const normSlug = (company.slug || "").toLowerCase();
      const normName = (company.name || "").toLowerCase();

      if (normKey === "TURBO" || normSlug === "turbo" || normName.includes("turbo") || normName.includes("تربو")) {
        return company.name.includes("(") ? company.name : "تربو (Turbo)";
      }
      if (normKey === "QP_EXPRESS" || normSlug === "qp" || normName.includes("qp") || normName.includes("كيو بي")) {
        return company.name.includes("(") ? company.name : "كيو بي (QP Express)";
      }
      if (normKey === "BOSTA" || normSlug === "bosta" || normName.includes("bosta") || normName.includes("بوستا")) {
        return company.name.includes("(") ? company.name : "بوستا (Bosta)";
      }
      return company.name;
    };

    const isCompanyActive = (company: ShippingCompany) => {
      if (courierMode === "manual") return false;
      if (selectedCompanyId && selectedCompanyId === company.id) return true;
      if (courierMode === company.id) return true;

      const normKey = (company.providerKey || "").toUpperCase();
      const normSlug = (company.slug || "").toLowerCase();
      const normName = (company.name || "").toLowerCase();

      if (courierMode === "turbo" && (normKey === "TURBO" || normSlug === "turbo" || normName.includes("turbo") || normName.includes("تربو"))) {
        return true;
      }
      if (courierMode === "qp" && (normKey === "QP_EXPRESS" || normSlug === "qp" || normName.includes("qp") || normName.includes("كيو بي"))) {
        return true;
      }
      if (courierMode === "bosta" && (normKey === "BOSTA" || normSlug === "bosta" || normName.includes("bosta") || normName.includes("بوستا"))) {
        return true;
      }
      return false;
    };

    const handleCompanyClick = (company: ShippingCompany) => {
      setIsManualCourier(false);
      if (setSelectedCompanyId) {
        setSelectedCompanyId(company.id);
      }
      const normKey = (company.providerKey || "").toUpperCase();
      const normSlug = (company.slug || "").toLowerCase();
      const normName = (company.name || "").toLowerCase();

      if (normKey === "TURBO" || normSlug === "turbo" || normName.includes("turbo") || normName.includes("تربو")) {
        setCourierMode("turbo");
      } else if (normKey === "QP_EXPRESS" || normSlug === "qp" || normName.includes("qp") || normName.includes("كيو بي")) {
        setCourierMode("qp");
      } else if (normKey === "BOSTA" || normSlug === "bosta" || normName.includes("bosta") || normName.includes("بوستا")) {
        setCourierMode("bosta");
      } else {
        setCourierMode(company.id);
      }
    };

    const renderCompanyIcon = (company: ShippingCompany) => {
      const normKey = (company.providerKey || "").toUpperCase();
      const normSlug = (company.slug || "").toLowerCase();
      const normName = (company.name || "").toLowerCase();

      if (normKey === "TURBO" || normSlug === "turbo" || normName.includes("turbo") || normName.includes("تربو")) {
        return <TruckIcon className="h-3.5 w-3.5 text-primary" />;
      }
      if (normKey === "QP_EXPRESS" || normSlug === "qp" || normName.includes("qp") || normName.includes("كيو بي")) {
        return <BoltIcon className="h-3.5 w-3.5 text-warning" />;
      }
      if (normKey === "BOSTA" || normSlug === "bosta" || normName.includes("bosta") || normName.includes("بوستا")) {
        return <TruckIcon className="h-3.5 w-3.5 text-warning" />;
      }
      return <TruckIcon className="h-3.5 w-3.5 text-muted-foreground" />;
    };

    return (
      <div className="flex flex-wrap gap-1.5 p-1 bg-muted dark:bg-muted rounded-lg text-xs font-medium">
        {activeCompanies.map((company) => {
          const active = isCompanyActive(company);
          return (
            <button
              key={company.id}
              type="button"
              onClick={() => handleCompanyClick(company)}
              className={`py-2 px-3.5 rounded-md transition flex items-center justify-center gap-1.5 active:scale-97 ${
                active
                  ? "bg-white dark:bg-muted text-primary dark:text-primary font-bold shadow-xs border border-border/70"
                  : "text-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-white"
              }`}
            >
              {renderCompanyIcon(company)}
              <span>{getTabTitle(company)}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => {
            setCourierMode("manual");
            setIsManualCourier(true);
          }}
          className={`py-2 px-3.5 rounded-md transition flex items-center justify-center gap-1.5 active:scale-97 ${
            courierMode === "manual"
              ? "bg-white dark:bg-muted text-primary font-bold shadow-xs border border-border/70"
              : "text-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-white"
          }`}
        >
          <UserIcon className="h-3.5 w-3.5" />
          <span>شحن يدوي / خاص</span>
        </button>
      </div>
    );
  }
);

ShippingCarrierTabs.displayName = "ShippingCarrierTabs";
