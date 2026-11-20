import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRightIcon,
  PencilIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
  ArrowDownTrayIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  ShoppingBagIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { CustomerRatingBadge } from "@/components/orders/CustomerRatingBadge";
import { CustomerDetailsData } from "./types";
import { CustomerBlockRule } from "@/services/customerBlocklistService";
import QuickOrderModal from "@/components/facebook-inbox/Modals/QuickOrderModal";
import { GitMerge } from "lucide-react";
import MergeCustomerModal from "./MergeCustomerModal";

interface CustomerDetailsHeaderProps {
  customer: CustomerDetailsData["customer"];
  stats: CustomerDetailsData["stats"];
  isAdmin: boolean;
  isCustomerBlocked: boolean;
  activeBlockRule: CustomerBlockRule | null;
  isUnblocking: boolean;
  onStartWhatsApp: () => void;
  onUnblock: () => void;
  onOpenBlockModal: () => void;
  onExport: () => void;
  onOpenDeleteModal: () => void;
  getStatusBadge: (status: string) => string;
  // Lead assignment + quick order (optional, additive)
  companyUsers?: { id: string; firstName: string; lastName: string }[];
  onAssigneeFocus?: () => void;
  onAssignLead?: (assignedToId: string | null) => void;
  isAssigning?: boolean;
  showQuickOrder?: boolean;
  onOpenQuickOrder?: () => void;
  onCloseQuickOrder?: () => void;
  onOrderCreated?: () => void;
  // Merge duplicates (optional, additive)
  showMergeModal?: boolean;
  onOpenMergeModal?: () => void;
  onCloseMergeModal?: () => void;
  onMerged?: () => void;
}

export const CustomerDetailsHeader: React.FC<CustomerDetailsHeaderProps> = ({
  customer,
  stats,
  isAdmin,
  isCustomerBlocked,
  activeBlockRule,
  isUnblocking,
  onStartWhatsApp,
  onUnblock,
  onOpenBlockModal,
  onExport,
  onOpenDeleteModal,
  getStatusBadge,
  companyUsers,
  onAssigneeFocus,
  onAssignLead,
  isAssigning,
  showQuickOrder,
  onOpenQuickOrder,
  onCloseQuickOrder,
  onOrderCreated,
  showMergeModal,
  onOpenMergeModal,
  onCloseMergeModal,
  onMerged,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [orderSuccess, setOrderSuccess] = useState(false);
  const orderSuccessTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (orderSuccessTimer.current) clearTimeout(orderSuccessTimer.current);
    };
  }, []);

  const handleOrderCreated = () => {
    setOrderSuccess(true);
    if (orderSuccessTimer.current) clearTimeout(orderSuccessTimer.current);
    orderSuccessTimer.current = setTimeout(() => setOrderSuccess(false), 4000);
    onOrderCreated?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/customers"
            className="text-gray-500 hover:text-foreground dark:text-muted-foreground dark:hover:text-muted-foreground"
          >
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {customer.firstName} {customer.lastName}
            </h1>
            <div className="flex gap-2 mt-1 items-center flex-wrap">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                  customer.status,
                )}`}
              >
                {customer.status}
              </span>
              <CustomerRatingBadge
                rating={customer.customerRating}
                deliveryRate={customer.deliveryRate ?? stats.deliveryRate}
                totalDelivered={customer.totalDelivered ?? stats.totalDelivered}
                totalOrdersCount={
                  customer.totalOrdersCount ?? stats.totalOrdersCount
                }
                variant="badge"
                size="sm"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          {/* WhatsApp Button */}
          {customer.phone && (
            <button
              onClick={onStartWhatsApp}
              className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-success dark:border-success rounded-lg text-xs sm:text-sm font-medium text-success dark:text-success bg-white dark:bg-success/20 hover:bg-success/10 dark:hover:bg-success/30 transition-all duration-150 active:scale-[0.97]"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4 ms-1.5" />
              WhatsApp
            </button>
          )}

          {/* Quick Order Button */}
          {onOpenQuickOrder && (
            <button
              onClick={onOpenQuickOrder}
              disabled={!customer.phone && !customer.id}
              className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-white bg-muted dark:bg-muted dark:text-foreground border border-transparent hover:bg-muted dark:hover:bg-muted disabled:opacity-50 transition-all duration-150 active:scale-[0.97]"
            >
              <ShoppingBagIcon className="h-4 w-4 ms-1.5" />
              أوردر سريع
            </button>
          )}

          {/* Lead Assignee (admin only) */}
          {isAdmin && onAssignLead && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-border dark:border-border rounded-lg bg-card">
              <UserCircleIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <label
                htmlFor="lead-assignee-select"
                className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap"
              >
                المسؤول عن الليد
              </label>
              <select
                id="lead-assignee-select"
                value={customer.assignedToId || ""}
                onFocus={onAssigneeFocus}
                onChange={(e) => onAssignLead(e.target.value || null)}
                disabled={isAssigning}
                className="text-xs font-medium text-foreground bg-transparent focus:outline-none disabled:opacity-50 max-w-[9rem] truncate cursor-pointer"
              >
                <option value="">غير مُسند</option>
                {(companyUsers || []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {`${u.firstName || ""} ${u.lastName || ""}`.trim()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isAdmin &&
            (isCustomerBlocked ? (
              <button
                onClick={onUnblock}
                disabled={isUnblocking}
                className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-destructive dark:border-destructive rounded-lg text-xs sm:text-sm font-medium text-destructive dark:text-destructive bg-white dark:bg-destructive/20 hover:bg-destructive/10 dark:hover:bg-destructive/30 disabled:opacity-50 transition-all duration-150 active:scale-[0.97]"
              >
                <CheckCircleIcon className="h-4 w-4 ms-1.5" />
                {isUnblocking ? "جاري فك الحظر..." : "فك الحظر"}
              </button>
            ) : (
              <button
                onClick={onOpenBlockModal}
                className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-destructive dark:border-destructive rounded-lg text-xs sm:text-sm font-medium text-destructive dark:text-destructive bg-white dark:bg-destructive/20 hover:bg-destructive/10 dark:hover:bg-destructive/30 transition-all duration-150 active:scale-[0.97]"
              >
                <NoSymbolIcon className="h-4 w-4 ms-1.5" />
                حظر العميل
              </button>
            ))}

          {/* Merge Duplicates Button (ghost, admin only) */}
          {onOpenMergeModal && (
            <button
              onClick={onOpenMergeModal}
              disabled={!isAdmin}
              title={
                isAdmin ? "دمج عميل مكرر في هذا العميل" : "متاح للمدير فقط"
              }
              className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-border dark:border-border rounded-lg text-xs sm:text-sm font-medium text-foreground bg-transparent hover:bg-muted dark:hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.97]"
            >
              <GitMerge className="h-4 w-4 ms-1.5" />
              دمج مكرر
            </button>
          )}

          {/* Export Button */}
          <button
            onClick={onExport}
            className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-border dark:border-border rounded-lg text-xs sm:text-sm font-medium text-foreground bg-card hover:bg-muted/50 transition-all duration-150 active:scale-[0.97]"
          >
            <ArrowDownTrayIcon className="h-4 w-4 ms-1.5" />
            {t("common.export")}
          </button>

          {/* Edit Button */}
          <button
            onClick={() => navigate(`/customers/${customer.id}/edit`)}
            className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-border dark:border-border rounded-lg text-xs sm:text-sm font-medium text-foreground bg-card hover:bg-muted/50 transition-all duration-150 active:scale-[0.97]"
          >
            <PencilIcon className="h-4 w-4 ms-1.5" />
            {t("common.edit")}
          </button>

          {/* Delete Button */}
          <button
            onClick={onOpenDeleteModal}
            className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-destructive dark:border-destructive rounded-lg text-xs sm:text-sm font-medium text-destructive dark:text-destructive bg-white dark:bg-destructive/20 hover:bg-destructive/10 dark:hover:bg-destructive/30 transition-all duration-150 active:scale-[0.97]"
          >
            <TrashIcon className="h-4 w-4 ms-1.5" />
            {t("common.delete")}
          </button>
        </div>
      </div>

      {/* Quick order success chip */}
      {orderSuccess && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-success dark:text-success bg-success/10 dark:bg-success/20 border border-success dark:border-success">
          <CheckCircleIcon className="h-4 w-4" />
          تم إنشاء الأوردر بنجاح
        </div>
      )}

      {isCustomerBlocked && activeBlockRule && (
        <div className="rounded-xl border border-destructive bg-destructive/10 p-4 text-destructive dark:border-destructive dark:bg-destructive/20 dark:text-destructive">
          <div className="flex items-start gap-3">
            <NoSymbolIcon className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">العميل محظور من الطلبات</p>
              <p className="mt-1 text-xs">
                الإجراء:{" "}
                {activeBlockRule.action === "REQUIRE_MANAGER_APPROVAL"
                  ? "موافقة مدير قبل الطلب"
                  : activeBlockRule.action === "BLOCK_COD_ONLY"
                    ? "منع الدفع عند الاستلام فقط"
                    : "منع الطلبات"}
                {activeBlockRule.reasonNote
                  ? ` - ${activeBlockRule.reasonNote}`
                  : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Order Modal */}
      {showQuickOrder && onCloseQuickOrder && (
        <QuickOrderModal
          isOpen={showQuickOrder}
          onClose={onCloseQuickOrder || (() => {})}
          customerName={`${customer.firstName || ""} ${customer.lastName || ""}`.trim()}
          customerPhone={customer.phone}
          customerId={customer.id}
          platform="whatsapp"
          onOrderCreated={handleOrderCreated}
        />
      )}

      {/* Merge Duplicates Modal */}
      {showMergeModal && onCloseMergeModal && (
        <MergeCustomerModal
          isOpen={showMergeModal}
          onClose={onCloseMergeModal}
          targetCustomer={customer}
          onMerged={() => onMerged?.()}
        />
      )}
    </div>
  );
};
