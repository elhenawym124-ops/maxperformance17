import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { getStatusDisplay } from "../../../../../utils/statusRegistry";
import { SOURCE_LABEL_KEYS, type PreparationTableColumn } from "../../constants";
import { getAgeLabel } from "../../helpers";
import PreparationOrdersProblemCell from "./PreparationOrdersProblemCell";
import type {
  PreparationOrder,
  ProblemHoldDetails,
  ShortageFollowUpVisual,
} from "../../types";

export interface PreparationOrdersTableRowMainCellsProps {
  order: PreparationOrder;
  canPrepare: boolean;
  selectedSet: Set<string>;
  onToggleSelection: (orderNumber: string) => void;
  visibleColumns: PreparationTableColumn[];
  shortageFollowUpVisual: ShortageFollowUpVisual | null;
  isProblemHeld: boolean;
  problemHoldDetails: ProblemHoldDetails;
  rowBusy: boolean;
  onEditProblemReason: (orderNumber: string) => void;
  formatPrice: (value: number) => string;
  formatDate: (value: string) => string;
  isExpanded: boolean;
  onToggleExpanded: (orderNumber: string) => void;
}

export const PreparationOrdersTableRowMainCells: React.FC<PreparationOrdersTableRowMainCellsProps> = ({
  order,
  canPrepare,
  selectedSet,
  onToggleSelection,
  visibleColumns,
  shortageFollowUpVisual,
  isProblemHeld,
  problemHoldDetails,
  rowBusy,
  onEditProblemReason,
  formatPrice,
  formatDate,
  isExpanded,
  onToggleExpanded,
}) => {
  const { t } = useTranslation();

  return (
    <Fragment>
      {/* Checkbox */}
      <td className="px-3 py-2.5">
        <input
          type="checkbox"
          checked={selectedSet.has(order.orderNumber)}
          onChange={() => onToggleSelection(order.orderNumber)}
          disabled={!canPrepare}
          className="h-3.5 w-3.5 rounded border-border/70 bg-background text-primary focus:ring-primary/20 dark:border-border/70 dark:bg-muted dark:text-primary"
        />
      </td>

      {/* Order number */}
      <td className="px-3 py-2.5">
        {order.merchantFulfillment ? (
          <span className="font-mono text-xs font-semibold text-foreground">
            #{order.orderNumber}
          </span>
        ) : (
          <Link
            to={`/orders/${encodeURIComponent(order.orderNumber)}`}
            className="font-mono text-xs font-semibold text-foreground hover:text-primary transition"
          >
            #{order.orderNumber}
          </Link>
        )}

        <div className="mt-0.5 flex flex-wrap items-center gap-1">
          <span className="rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
            {t(SOURCE_LABEL_KEYS[(order.sourceType || "unknown").toLowerCase()]) || order.sourceType}
          </span>
          {shortageFollowUpVisual ? (
            <span className="rounded border border-warning/20 bg-warning/10 px-1.5 py-0.2 text-[10px] font-mono font-semibold text-warning dark:border-warning/60 dark:bg-warning/60 dark:text-warning">
              {shortageFollowUpVisual.label}
            </span>
          ) : null}
          {(() => {
            const origId = order.originalOrderId || (order.metadata as any)?.originalOrderId;
            const origNum = order.originalOrderNumber || (order.metadata as any)?.originalOrderNumber;
            if (!origId && !origNum) return null;
            return (
              <span className="inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/10 px-1.5 py-0.2 text-[10px] font-semibold text-primary dark:border-primary/50 dark:bg-primary/60 dark:text-primary">
                <span>استبدال</span>
                {origNum ? (
                  <Link
                    to={`/orders/${encodeURIComponent(origNum)}`}
                    className="font-mono underline hover:text-primary dark:hover:text-primary"
                    title={`فتح الأوردر الأصلي #${origNum}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    (أصل: #{origNum})
                  </Link>
                ) : null}
              </span>
            );
          })()}
        </div>
      </td>

      {/* Customer */}
      {visibleColumns.includes("customer") && (
        <td className="px-3 py-2.5">
          <p className="text-xs font-semibold text-foreground">
            {order.customerName}
          </p>
          <p className="text-[11px] font-mono tabular-nums text-muted-foreground">
            {order.customerPhone || ""}
          </p>
          <p className="text-[11px] text-muted-foreground/70">
            {getAgeLabel(order.createdAt)}
            {order.governorate || order.city ? ` • ${order.governorate || order.city}` : ""}
          </p>
        </td>
      )}

      {/* Units */}
      {visibleColumns.includes("units") && (
        <td className="px-3 py-2.5">
          <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
            {order.totalUnits}
          </span>
        </td>
      )}

      {/* Value */}
      {visibleColumns.includes("value") && (
        <td className="px-3 py-2.5">
          <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
            {formatPrice(order.totalValue)}
          </span>
        </td>
      )}

      {/* Status */}
      {visibleColumns.includes("status") && (
        <td className="px-3 py-2.5">
          {(() => {
            const statusInfo = getStatusDisplay(order.normalizedStatus);
            return (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusInfo.colorClass}`}
                aria-label={statusInfo.label}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                {t(statusInfo.labelKey) || statusInfo.label}
              </span>
            );
          })()}
        </td>
      )}

      {/* Problem */}
      {visibleColumns.includes("problem") && (
        <PreparationOrdersProblemCell
          orderNumber={order.orderNumber}
          isProblemHeld={isProblemHeld}
          problemHoldDetails={problemHoldDetails}
          rowBusy={rowBusy}
          onEditProblemReason={onEditProblemReason}
        />
      )}

      {/* Warehouse */}
      {visibleColumns.includes("warehouse") && (
        <td className="px-3 py-2.5">
          {order.recommendedWarehouseName ? (
            <span className="max-w-[120px] truncate text-xs font-medium text-foreground">
              {order.recommendedWarehouseName}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/60">
              {t("preparation.table.notDefined")}
            </span>
          )}
        </td>
      )}

      {/* Ready / shortage indicator */}
      {visibleColumns.includes("readiness") && (
        <td className="px-3 py-2.5">
          <span
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono font-semibold ${
              order.isReady
                ? "border border-success/30 bg-success/10 text-success dark:bg-success/60 dark:border-success/60 dark:text-success"
                : "border border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/60 dark:border-destructive/60 dark:text-destructive"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${order.isReady ? "bg-success" : "bg-destructive"}`} />
            {order.isReady
              ? t("preparation.table.ready")
              : t("preparation.table.shortage", { count: order.missingItemsCount })}
          </span>
        </td>
      )}

      {/* Print status */}
      {visibleColumns.includes("printStatus") && (
        <td className="px-3 py-2.5">
          {(order.printCount ?? 0) > 0 ? (
            <span
              className="inline-flex items-center gap-1 rounded border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-success dark:bg-success/60 dark:border-success/60 dark:text-success"
              title={order.printedAt ? formatDate(order.printedAt) : ""}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {order.printCount}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded bg-muted/40 px-2 py-0.5 text-[11px] font-mono text-muted-foreground/60">
              —
            </span>
          )}
        </td>
      )}

      {/* Shipping code */}
      {visibleColumns.includes("shippingCode") && (
        <td className="px-3 py-2.5">
          <span className="font-mono tabular-nums text-xs font-semibold text-foreground">
            {order.turboTrackingNumber ||
              (order.shipments?.length
                ? order.shipments.map((s) => s.trackingNumber).filter(Boolean).join(", ")
                : null) ||
              "—"}
          </span>
        </td>
      )}

      {/* Details button */}
      <td className="px-3 py-2.5">
        <button
          type="button"
          onClick={() => onToggleExpanded(order.orderNumber)}
          className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-background px-2 py-1 text-xs font-medium text-foreground transition hover:border-border hover:bg-muted active:scale-[0.97]"
        >
          {t("preparation.table.details")}
          <ChevronDownIcon
            className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>
      </td>
    </Fragment>
  );
};
