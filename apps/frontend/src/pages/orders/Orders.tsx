import React from "react";
import { useSearchParams } from "react-router-dom";
import { OrdersToolbarSection } from "./components/OrdersToolbarSection";
import { OrdersTableSection } from "./components/OrdersTableSection";
import { OrdersModalsContainer } from "./components/OrdersModalsContainer";
import { OrderStatusAlertBell } from "./components/OrderStatusAlertBell";
import { PolarisOrdersView } from "./PolarisOrdersView";
import { useOrdersPageController } from "./hooks/useOrdersPageController";

/* eslint-disable react-refresh/only-export-components */
export * from "./ordersCompat";

const Orders: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlLayout = searchParams.get("layout");
  const sessionLayout =
    typeof window !== "undefined"
      ? sessionStorage.getItem("maxp_session_layout")
      : null;
  const isPolaris = urlLayout !== "legacy" && sessionLayout !== "legacy";

  const { toolbarSectionProps, tableSectionProps, modalsContainerProps } =
    useOrdersPageController();

  if (isPolaris) {
    return (
      <PolarisOrdersView
        toolbarSectionProps={toolbarSectionProps}
        tableSectionProps={tableSectionProps}
        modalsContainerProps={modalsContainerProps}
      />
    );
  }

  return (
    <div
      data-orders-page="true"
      className="orders-page-root flex-1 h-full min-h-0 overflow-y-auto /60/60bg-muted dark:dark:bg-muted px-2 py-2 sm:px-3 sm:py-2.5"
    >
      <div className="w-full max-w-none">
        <div className="flex justify-end mb-2">
          <OrderStatusAlertBell />
        </div>
        <OrdersToolbarSection {...toolbarSectionProps} />
        <OrdersTableSection {...tableSectionProps} />
      </div>

      <OrdersModalsContainer {...modalsContainerProps} />
    </div>
  );
};

export default Orders;
