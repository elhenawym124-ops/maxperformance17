import React from "react";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import {
  Badge,
  EmptyState,
  formatInteger,
  MerchantWarehouse,
  statusTone,
} from "./types";

interface MerchantWarehousesSectionProps {
  warehouses: MerchantWarehouse[];
}

export const MerchantWarehousesSection: React.FC<MerchantWarehousesSectionProps> = ({
  warehouses,
}) => {
  return (
    <section className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
      <div className="flex items-center gap-2">
        <ClipboardDocumentListIcon className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-bold">مخازن التاجر</h2>
      </div>
      <div className="mt-4 space-y-3">
        {warehouses.map((warehouse) => (
          <div
            key={warehouse.id}
            className="rounded-xl border border-border p-3 dark:border-border"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold">{warehouse.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {warehouse.location || "بدون موقع"} ·{" "}
                  {warehouse.type || "main"}
                </p>
              </div>
              <Badge
                label={warehouse.isActive ? "نشط" : "غير نشط"}
                tone={statusTone(warehouse.isActive ? "ACTIVE" : "INACTIVE")}
              />
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              <span className="tabular-nums font-semibold">{formatInteger(warehouse._count?.inventories)}</span> سجل مخزون،{" "}
              <span className="tabular-nums font-semibold">{formatInteger(warehouse._count?.shipments)}</span> شحنة
            </div>
          </div>
        ))}
        {!warehouses.length ? (
          <EmptyState text="لا توجد مخازن مخصصة لهذا التاجر." />
        ) : null}
      </div>
    </section>
  );
};
