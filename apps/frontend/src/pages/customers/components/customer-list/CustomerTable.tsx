import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDateFormat } from "@/hooks/useDateFormat";
import {
  EyeIcon,
  InformationCircleIcon,
  PencilIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { Customer } from "@/services/customerService";
import {
  parseTags,
  getStatusBadge,
  getRatingBadge,
  getAutoDiscountBadge,
  getTierBadge,
} from "./CustomerListBadges";

interface CustomerTableProps {
  customers: Customer[];
  selectedIds: Set<string>;
  statusOptions: { value: string; label: string; color: string }[];
  onToggleSelectAll: () => void;
  onToggleSelect: (id: string) => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onPageChange: (page: number) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  selectedIds,
  statusOptions,
  onToggleSelectAll,
  onToggleSelect,
  pagination,
  onPageChange,
}) => {
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();

  return (
    <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl shadow-2xs overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border dark:divide-border">
          <thead className="bg-zinc-50/80 dark:bg-muted border-b border-border dark:border-border">
            <tr>
              <th className="px-4 py-3.5 text-center">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.size === customers.length &&
                    customers.length > 0
                  }
                  onChange={onToggleSelectAll}
                  className="h-4 w-4 text-foreground dark:text-muted-foreground focus:ring-border dark:focus:ring-border border-border dark:border-border rounded dark:bg-muted"
                />
              </th>
              <th className="px-4 py-3.5 text-right text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground uppercase tracking-[0.08em]">
                {t("customers.tableCustomer")}
              </th>
              <th className="px-4 py-3.5 text-right text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground uppercase tracking-[0.08em]">
                {t("customers.tableContactInfo")}
              </th>
              <th className="px-4 py-3.5 text-right text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground uppercase tracking-[0.08em]">
                {t("customers.tableStatus")}
              </th>
              <th className="px-4 py-3.5 text-right text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground uppercase tracking-[0.08em]">
                {t("customers.tableStats")}
              </th>
              <th className="px-4 py-3.5 text-right text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground uppercase tracking-[0.08em]">
                {t("customers.tableUpdatedAt")}
              </th>
              <th className="px-4 py-3.5 text-right text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground uppercase tracking-[0.08em]">
                {t("customers.tableActions")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-muted divide-y divide-border dark:divide-border">
            {customers.map((customer) => (
              <tr
                key={customer.id}
                className={`hover:bg-zinc-50/70 dark:hover:bg-muted transition-colors ${
                  selectedIds.has(customer.id)
                    ? "bg-zinc-100/70 dark:bg-muted"
                    : ""
                }`}
              >
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(customer.id)}
                    onChange={() => onToggleSelect(customer.id)}
                    className="h-4 w-4 text-foreground dark:text-muted-foreground focus:ring-border dark:focus:ring-border border-border dark:border-border rounded dark:bg-muted"
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-9 w-9">
                      <div className="h-9 w-9 rounded-full bg-muted dark:bg-muted border border-border dark:border-border flex items-center justify-center shadow-2xs">
                        <span className="text-xs font-bold text-foreground dark:text-muted-foreground font-mono">
                          {customer.firstName && customer.firstName.charAt(0)}
                          {customer.lastName && customer.lastName.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-foreground dark:text-muted-foreground flex items-center gap-1.5 flex-wrap">
                        <span>
                          {customer.firstName || ""} {customer.lastName || ""}
                        </span>
                        {getRatingBadge(
                          customer.customerRating,
                          (customer as any).deliveryRate,
                        )}
                        {getTierBadge(customer.loyaltyTier)}
                        {getAutoDiscountBadge(customer.autoDiscountStatus)}
                      </div>
                      {parseTags(customer.tags).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {parseTags(customer.tags)
                            .slice(0, 2)
                            .map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-muted dark:bg-muted text-foreground dark:text-muted-foreground border border-border dark:border-border"
                              >
                                {tag}
                              </span>
                            ))}
                          {parseTags(customer.tags).length > 2 && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              +{parseTags(customer.tags).length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-xs font-medium text-foreground dark:text-muted-foreground">
                    {customer.email || "-"}
                  </div>
                  <div className="text-xs text-muted-foreground dark:text-muted-foreground tabular-nums font-mono mt-0.5">
                    {customer.phone || "-"}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {getStatusBadge(customer.status, statusOptions)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground dark:text-muted-foreground font-mono">
                  <div>
                    {t("customers.conversations")}:{" "}
                    <span className="tabular-nums font-semibold text-foreground dark:text-muted-foreground">
                      {customer._count?.conversations || 0}
                    </span>
                  </div>
                  <div>
                    {t("customers.orders")}:{" "}
                    <span className="tabular-nums font-semibold text-foreground dark:text-muted-foreground">
                      {customer._count?.orders || 0}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground dark:text-muted-foreground tabular-nums font-mono">
                  {formatDate(customer.updatedAt)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs font-medium">
                  <div className="flex items-center gap-1">
                    {((customer as any).whatsappPhone || customer.phone) && (
                      <a
                        href={`https://wa.me/${((customer as any).whatsappPhone || customer.phone).replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="مراسلة سريعة عبر واتساب"
                        aria-label="مراسلة سريعة عبر واتساب"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent hover:border-success/30 text-success dark:text-success hover:bg-success/10 dark:hover:bg-success/40 transition-all duration-150 active:scale-[0.94]"
                      >
                        <ChatBubbleLeftRightIcon className="h-4 w-4" />
                      </a>
                    )}
                    <Link
                      to={`/customers/${customer.id}/portal`}
                      title="صفحة العميل (النقاط والخصومات والكاش باك)"
                      aria-label="صفحة العميل (النقاط والخصومات والكاش باك)"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent hover:border-border dark:hover:border-border text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground hover:bg-muted dark:hover:bg-muted transition-all duration-150 active:scale-[0.94]"
                    >
                      <EyeIcon className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      to={`/customers/${customer.id}`}
                      title={t("customers.tableActions")}
                      aria-label={t("customers.tableActions")}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent hover:border-border dark:hover:border-border text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground hover:bg-muted dark:hover:bg-muted transition-all duration-150 active:scale-[0.94]"
                    >
                      <InformationCircleIcon className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      to={`/customers/${customer.id}/edit`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent hover:border-border dark:hover:border-border text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground hover:bg-muted dark:hover:bg-muted transition-all duration-150 active:scale-[0.94]"
                      aria-label="تعديل العميل"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="bg-white dark:bg-muted px-4 py-3 flex items-center justify-between border-t border-border dark:border-border sm:px-6 relative z-20">
          <div className="flex-1 flex justify-between sm:hidden relative z-20">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="relative inline-flex items-center px-4 py-2 border border-border dark:border-border text-xs font-medium rounded-lg text-foreground dark:text-muted-foreground bg-white dark:bg-muted hover:bg-muted dark:hover:bg-muted disabled:opacity-50"
            >
              {t("customers.previous")}
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="me-3 relative inline-flex items-center px-4 py-2 border border-border dark:border-border text-xs font-medium rounded-lg text-foreground dark:text-muted-foreground bg-white dark:bg-muted hover:bg-muted dark:hover:bg-muted disabled:opacity-50"
            >
              {t("customers.next")}
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                {t("customers.showing")}{" "}
                <span className="font-medium font-mono tabular-nums">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{" "}
                {t("customers.to")}{" "}
                <span className="font-medium font-mono tabular-nums">
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}
                </span>{" "}
                {t("customers.of")}{" "}
                <span className="font-medium font-mono tabular-nums">{pagination.total}</span>{" "}
                {t("customers.result")}
              </p>
            </div>
            <div>
              <nav
                className="relative z-20 inline-flex rounded-lg shadow-2xs -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-lg border border-border dark:border-border bg-white dark:bg-muted text-xs font-medium text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted disabled:opacity-50"
                >
                  {t("customers.previous")}
                </button>
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`relative inline-flex items-center px-3.5 py-2 border text-xs font-medium font-mono tabular-nums ${
                          page === pagination.page
                            ? "z-10 bg-muted border-border text-white dark:bg-muted dark:border-border dark:text-foreground font-bold"
                            : "bg-white dark:bg-muted border-border dark:border-border text-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  },
                )}
                <button
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-lg border border-border dark:border-border bg-white dark:bg-muted text-xs font-medium text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted disabled:opacity-50"
                >
                  {t("customers.next")}
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
