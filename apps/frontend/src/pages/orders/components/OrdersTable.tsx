import React from "react";
import { OrdersSkeleton } from "./OrdersSkeleton";
import { OrdersEmptyState } from "./OrdersEmptyState";
import { OrdersPagination } from "./OrdersPagination";
import {
  OrdersTableHelpers,
  OrdersTableProps,
  dedupOrders,
} from "./table/ordersTableTypes";
import { OrdersTableHeader } from "./table/OrdersTableHeader";
import { OrdersTableRow } from "./table/OrdersTableRow";

export type { OrdersTableHelpers, OrdersTableProps };

export const OrdersTable: React.FC<OrdersTableProps & { embedded?: boolean }> = ({
  embedded = false,
  orders,
  loading,
  ordersLoadError,
  selectedOrders,
  canSelectOrders,
  isMerchant,
  activeFilterCount,
  search,
  columns,
  columnCount,
  density,
  page,
  totalPages,
  totalOrders,
  limit,
  helpers,
  onOpenOrder,
  onToggleSelection,
  onToggleAllSelection,
  onMarkAsViewed,
  onClearFilters,
  onPageChange,
  onLimitChange,
  onDensityChange,
}) => {
  const isCompact = density === "compact";
  const cellPadding = isCompact ? "px-2 py-2" : "px-2.5 py-2.5";
  const headerPadding = isCompact ? "px-2 py-2" : "px-2.5 py-2.5";

  return (
    <div
      data-orders-density={density}
      className={
        embedded
          ? "hidden lg:block"
          : "hidden overflow-hidden rounded-xl border border-border/70 bg-card shadow-xs lg:block"
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-start border-collapse">
          <OrdersTableHeader
            canSelectOrders={canSelectOrders}
            headerPadding={headerPadding}
            columns={columns}
            orders={orders}
            selectedOrders={selectedOrders}
            onToggleAllSelection={onToggleAllSelection}
          />
          <tbody className="divide-y divide-border/40">
            {loading ? (
              <OrdersSkeleton
                variant="table"
                rowCount={5}
                columns={columns}
                showSelect={canSelectOrders}
              />
            ) : orders.length === 0 ? (
              <tr>
                <td
                  colSpan={columnCount}
                  className="px-6 py-10 text-center text-muted-foreground"
                >
                  <OrdersEmptyState
                    variant="table"
                    error={ordersLoadError}
                    isMerchant={isMerchant}
                    hasActiveFilters={activeFilterCount > 0 || Boolean(search)}
                    onClearFilters={onClearFilters}
                  />
                </td>
              </tr>
            ) : (
              dedupOrders(orders).map((order, idx) => (
                <OrdersTableRow
                  key={order.id || order.orderNumber || idx}
                  order={order}
                  selectedOrders={selectedOrders}
                  canSelectOrders={canSelectOrders}
                  columns={columns}
                  cellPadding={cellPadding}
                  helpers={helpers}
                  onOpenOrder={onOpenOrder}
                  onToggleSelection={onToggleSelection}
                  onMarkAsViewed={onMarkAsViewed}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!loading && orders.length > 0 && (
        <OrdersPagination
          variant="desktop"
          page={page}
          totalPages={totalPages}
          totalOrders={totalOrders}
          limit={limit}
          density={density}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          onDensityChange={onDensityChange}
        />
      )}
    </div>
  );
};

export default OrdersTable;
