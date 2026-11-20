import React, { useState, useEffect, useCallback, useTransition, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  FunnelIcon,
  BuildingOfficeIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { apiClient } from "../../../services/apiClient";
import { useAuth } from "../../../hooks/useAuthSimple";
import { MyCompaniesOrder, TotalsByCompany } from "./types";
import { DateInput } from '../../../components/ui/DateInput';

interface MyCompaniesOrdersTabProps {
  companies: Array<{
    company: {
      id: string;
      name: string;
      logo: string | null;
    };
  }>;
}

const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "قيد الانتظار", color: "bg-amber-100 text-warning dark:bg-warning/40 dark:text-warning" },
  CONFIRMED: { label: "مؤكد", color: "bg-blue-100 text-primary dark:bg-primary/40 dark:text-primary" },
  PROCESSING: { label: "جاري التجهيز", color: "bg-indigo-100 text-primary dark:bg-primary/40 dark:text-primary" },
  PREPARING: { label: "جاري التجهيز", color: "bg-indigo-100 text-primary dark:bg-primary/40 dark:text-primary" },
  READY: { label: "جاهز للشحن", color: "bg-cyan-100 text-info dark:bg-info/40 dark:text-info" },
  READY_TO_SHIP: { label: "جاهز للشحن", color: "bg-cyan-100 text-info dark:bg-info/40 dark:text-info" },
  SHIPPED: { label: "تم الشحن", color: "bg-purple-100 text-primary dark:bg-primary/40 dark:text-primary" },
  DELIVERED: { label: "تم التوصيل", color: "bg-green-100 text-success dark:bg-success/40 dark:text-success" },
  CANCELLED: { label: "ملغي", color: "bg-red-100 text-destructive dark:bg-destructive/40 dark:text-destructive" },
  RETURNED: { label: "مرتجع", color: "bg-rose-100 text-destructive dark:bg-destructive/40 dark:text-destructive" },
};

export const MyCompaniesOrdersTab: React.FC<MyCompaniesOrdersTabProps> = ({ companies }) => {
  const navigate = useNavigate();
  const { switchCompany } = useAuth();
  const [isPendingTransition, startTransition] = useTransition();

  // Orders State
  const [orders, setOrders] = useState<MyCompaniesOrder[]>([]);
  const [totalsByCompany, setTotalsByCompany] = useState<TotalsByCompany[]>([]);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);

  // Filters State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Modal State for Status Change
  const [statusModalOrder, setStatusModalOrder] = useState<MyCompaniesOrder | null>(null);
  const [modalTargetStatus, setModalTargetStatus] = useState<string>("CONFIRMED");
  const [modalNotes, setModalNotes] = useState<string>("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Modal State for Cancel
  const [cancelModalOrder, setCancelModalOrder] = useState<MyCompaniesOrder | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Build company filter list from all active memberships (totalsByCompany or companies prop)
  const activeCompanyOptions = useMemo(() => {
    if (totalsByCompany && totalsByCompany.length > 0) {
      return totalsByCompany.map((tc) => ({
        id: tc.companyId,
        name: tc.companyName,
      }));
    }
    return (companies || []).map((c) => ({
      id: c.company?.id || (c as any).id,
      name: c.company?.name || (c as any).name,
    }));
  }, [totalsByCompany, companies]);

  // Fetch Orders from API
  const fetchOrders = useCallback(
    async (reset: boolean = false, cursor: string | null = null) => {
      try {
        if (reset) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const params: Record<string, string | number> = {
          limit: 25,
        };

        if (selectedCompanyId && selectedCompanyId !== "ALL") {
          params.companyIds = selectedCompanyId;
        }

        if (selectedStatus && selectedStatus !== "ALL") {
          params.status = selectedStatus;
        }

        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }

        if (startDate) {
          params.startDate = startDate;
        }

        if (endDate) {
          params.endDate = endDate;
        }

        if (cursor) {
          params.cursor = cursor;
        }

        const response = await apiClient.get<{
          success: boolean;
          data: {
            totalsByCompany: TotalsByCompany[];
            totalOrders: number;
            orders: MyCompaniesOrder[];
            pageInfo: {
              hasNextPage: boolean;
              nextCursor: string | null;
              limit: number;
            };
          };
        }>("/my-companies/orders", { params });

        if (response.data && response.data.success && response.data.data) {
          const { orders: newOrders, totalsByCompany: newTotals, totalOrders: newTotal, pageInfo } =
            response.data.data;

          if (reset) {
            setOrders(newOrders || []);
          } else {
            setOrders((prev) => [...prev, ...(newOrders || [])]);
          }

          setTotalsByCompany(newTotals || []);
          setTotalOrders(newTotal || 0);
          setHasNextPage(Boolean(pageInfo?.hasNextPage));
          setNextCursor(pageInfo?.nextCursor || null);
        }
      } catch (err: any) {
        console.error("Failed to fetch my-companies orders:", err);
        const errorMsg =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "حدث خطأ أثناء تحميل الطلبات المشتركة";
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [selectedCompanyId, selectedStatus, searchQuery, startDate, endDate],
  );

  // Trigger initial & filter fetches
  useEffect(() => {
    fetchOrders(true);
  }, [fetchOrders]);

  // Handle Load More (Keyset Pagination)
  const handleLoadMore = () => {
    if (hasNextPage && nextCursor && !isLoadingMore) {
      fetchOrders(false, nextCursor);
    }
  };

  // Switch context and open order in its original company screen
  const handleOpenOrder = async (order: MyCompaniesOrder) => {
    try {
      toast.info(`جاري التبديل إلى شركة ${order.companyName}...`);
      await switchCompany(order.companyId);
      startTransition(() => {
        navigate(`/orders?search=${encodeURIComponent(order.orderNumber)}`);
      });
    } catch (err) {
      console.error("Failed to switch company:", err);
      toast.error("فشل التبديل إلى شركة الطلب");
    }
  };

  // Submit Status Change
  const handleSubmitStatusChange = async () => {
    if (!statusModalOrder) return;
    try {
      setIsUpdatingStatus(true);
      const payload = {
        companyId: statusModalOrder.companyId,
        status: modalTargetStatus,
        notes: modalNotes || undefined,
      };

      const response = await apiClient.post(
        `/orders/${statusModalOrder.id}/status`,
        payload,
      );

      if (response.data && response.data.success) {
        toast.success(`تم تغيير حالة الطلب ${statusModalOrder.orderNumber} بنجاح`);
        // Update order in state locally
        setOrders((prev) =>
          prev.map((o) =>
            o.id === statusModalOrder.id ? { ...o, status: modalTargetStatus } : o,
          ),
        );
        setStatusModalOrder(null);
        setModalNotes("");
      } else {
        throw new Error(response.data?.error || "فشل تغيير الحالة");
      }
    } catch (err: any) {
      console.error("Error updating order status:", err);
      const msg = err?.response?.data?.error || err?.message || "فشل تغيير حالة الطلب";
      toast.error(msg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Submit Cancel Order
  const handleSubmitCancel = async () => {
    if (!cancelModalOrder) return;
    try {
      setIsCancelling(true);
      const payload = {
        companyId: cancelModalOrder.companyId,
        status: "CANCELLED",
        notes: cancelReason || "إلغاء من مساحة العمل المشتركة",
      };

      const response = await apiClient.post(
        `/orders/${cancelModalOrder.id}/status`,
        payload,
      );

      if (response.data && response.data.success) {
        toast.success(`تم إلغاء الطلب ${cancelModalOrder.orderNumber} بنجاح`);
        setOrders((prev) =>
          prev.map((o) =>
            o.id === cancelModalOrder.id ? { ...o, status: "CANCELLED" } : o,
          ),
        );
        setCancelModalOrder(null);
        setCancelReason("");
      } else {
        throw new Error(response.data?.error || "فشل إلغاء الطلب");
      }
    } catch (err: any) {
      console.error("Error cancelling order:", err);
      const msg = err?.response?.data?.error || err?.message || "فشل إلغاء الطلب";
      toast.error(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── 1. عدادات كل شركة + الإجمالي ── */}
      <div className="bg-card p-4 rounded-xl shadow-xs border border-border dark:border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BuildingOfficeIcon className="w-5 h-5 text-primary dark:text-primary" />
            <h2 className="text-base font-bold text-foreground dark:text-white">
              إحصائيات الطلبات عبر شركاتك
            </h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {totalsByCompany.length} شركات مسجلة
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {/* إجمالي كل الشركات */}
          <button
            onClick={() => setSelectedCompanyId("ALL")}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all border flex items-center gap-2 shadow-2xs ${
              selectedCompanyId === "ALL"
                ? "bg-blue-600 text-white border-primary shadow-sm"
                : "bg-gray-50 dark:bg-muted text-foreground border-border hover:bg-muted"
            }`}
          >
            <span>جميع الشركات</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                selectedCompanyId === "ALL"
                  ? "bg-white/20 text-white"
                  : "bg-gray-200 dark:bg-muted text-foreground dark:text-muted-foreground"
              }`}
            >
              {totalOrders}
            </span>
          </button>

          {/* عداد لكل شركة */}
          {totalsByCompany.map((tc) => {
            const isSelected = selectedCompanyId === tc.companyId;
            return (
              <button
                key={tc.companyId}
                onClick={() => setSelectedCompanyId(isSelected ? "ALL" : tc.companyId)}
                className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all border flex items-center gap-2 shadow-2xs ${
                  isSelected
                    ? "bg-blue-600 text-white border-primary shadow-sm"
                    : "bg-card text-foreground border-border hover:border-primary dark:hover:border-primary"
                }`}
              >
                <span className="truncate max-w-[140px]">{tc.companyName}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 dark:bg-muted text-primary dark:text-primary"
                  }`}
                >
                  {tc.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. شريط الفلاتر والبحث ── */}
      <div className="bg-card p-4 rounded-xl shadow-xs border border-border dark:border-border space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* بحث */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث برقم الأوردر، اسم العميل، أو رقم الهاتف..."
              className="w-full pe-10 ps-4 py-2 text-sm bg-muted dark:bg-muted border border-border rounded-lg text-foreground placeholder-muted focus:outline-hidden focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* فلتر الشركة */}
          <div className="w-full md:w-52">
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-muted dark:bg-muted border border-border rounded-lg text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">كل الشركات</option>
              {activeCompanyOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* فلتر الحالة */}
          <div className="w-full md:w-48">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-muted dark:bg-muted border border-border rounded-lg text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="PENDING">قيد الانتظار</option>
              <option value="CONFIRMED">مؤكد</option>
              <option value="PROCESSING">جاري التجهيز</option>
              <option value="SHIPPED">تم الشحن</option>
              <option value="DELIVERED">تم التوصيل</option>
              <option value="CANCELLED">ملغي</option>
            </select>
          </div>
        </div>

        {/* فلاتر التاريخ وإعادة الضبط */}
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border dark:border-border text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">من تاريخ:</span>
            <DateInput
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-muted dark:bg-muted border border-border rounded-md text-foreground focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">إلى تاريخ:</span>
            <DateInput
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-muted dark:bg-muted border border-border rounded-md text-foreground focus:ring-2 focus:ring-primary"
            />
          </div>

          {(searchQuery || selectedCompanyId !== "ALL" || selectedStatus !== "ALL" || startDate || endDate) && (
            <button
              onClick={() => {
                setSelectedCompanyId("ALL");
                setSelectedStatus("ALL");
                setSearchQuery("");
                setStartDate("");
                setEndDate("");
              }}
              className="me-auto px-3 py-1.5 text-xs text-destructive dark:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 rounded-md font-medium transition-colors"
            >
              مسح الفلاتر
            </button>
          )}

          <button
            onClick={() => fetchOrders(true)}
            className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted rounded-md font-medium flex items-center gap-1.5 me-auto sm:me-0 transition-colors"
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            تحديث
          </button>
        </div>
      </div>

      {/* ── 3. الجدول الموحد للطلبات ── */}
      <div className="bg-card rounded-xl shadow-xs border border-border dark:border-border overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">جاري جلب الطلبات من جميع الشركات...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 px-4">
            <FunnelIcon className="w-12 h-12 mx-auto text-muted-foreground dark:text-foreground mb-3" />
            <h3 className="text-base font-semibold text-foreground dark:text-white mb-1">
              لا توجد طلبات مطابقة
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              لم نتمكن من العثور على أي طلبات تطابق الفلاتر المحددة عبر شركاتك.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-gray-50/80 dark:bg-muted text-muted-foreground border-b border-border dark:border-border">
                <tr>
                  <th className="py-3 px-3 sm:px-4 font-semibold">رقم الأوردر</th>
                  <th className="py-3 px-3 sm:px-4 font-semibold">الشركة</th>
                  <th className="py-3 px-3 sm:px-4 font-semibold">العميل</th>
                  <th className="py-3 px-3 sm:px-4 font-semibold">الحالة</th>
                  <th className="py-3 px-3 sm:px-4 font-semibold">الإجمالي</th>
                  <th className="py-3 px-3 sm:px-4 font-semibold">التاريخ</th>
                  <th className="py-3 px-3 sm:px-4 font-semibold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-border">
                {orders.map((order) => {
                  const statusInfo = ORDER_STATUS_LABELS[order.status] || {
                    label: order.status,
                    color: "bg-gray-100 text-foreground dark:bg-muted dark:text-muted-foreground",
                  };
                  const perms = order.permissions;

                  return (
                    <tr
                      key={`${order.companyId}_${order.id}`}
                      className="hover:bg-gray-50/70 dark:hover:bg-muted transition-colors"
                    >
                      {/* رقم الأوردر */}
                      <td className="py-3 px-3 sm:px-4 font-mono font-bold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <span>{order.orderNumber}</span>
                          {order.isGuest && (
                            <span className="px-1.5 py-0.5 text-[10px] font-sans font-medium rounded bg-warning text-warning dark:bg-warning/40 dark:text-warning">
                              ضيف
                            </span>
                          )}
                        </div>
                      </td>

                      {/* الشركة كشارة */}
                      <td className="py-3 px-3 sm:px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary dark:bg-primary/40 dark:text-primary border border-primary dark:border-primary">
                          <BuildingOfficeIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[130px]">{order.companyName}</span>
                        </span>
                      </td>

                      {/* العميل */}
                      <td className="py-3 px-3 sm:px-4">
                        <div className="font-medium text-foreground truncate max-w-[150px]">
                          {order.customerName}
                        </div>
                        {order.customerPhone && (
                          <div className="text-xs text-muted-foreground font-mono" dir="ltr">
                            {order.customerPhone}
                          </div>
                        )}
                      </td>

                      {/* الحالة */}
                      <td className="py-3 px-3 sm:px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* الإجمالي */}
                      <td className="py-3 px-3 sm:px-4 font-mono font-semibold text-foreground">
                        {order.total.toLocaleString("ar-EG", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        <span className="text-xs text-muted-foreground font-sans">{order.currency}</span>
                      </td>

                      {/* التاريخ */}
                      <td className="py-3 px-3 sm:px-4 text-xs text-muted-foreground font-mono whitespace-nowrap">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString("ar-EG") : "-"}
                      </td>

                      {/* الإجراءات مع التحقق والصلاحية لكل شركة */}
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* زر تغيير الحالة */}
                          <div className="relative group inline-block">
                            <button
                              type="button"
                              onClick={() => {
                                if (perms.canChangeStatus && !order.isGuest) {
                                  setStatusModalOrder(order);
                                  setModalTargetStatus("CONFIRMED");
                                  setModalNotes("");
                                }
                              }}
                              disabled={!perms.canChangeStatus || order.isGuest}
                              className={`p-1.5 rounded-md transition-colors ${
                                perms.canChangeStatus && !order.isGuest
                                  ? "text-blue-600 hover:bg-primary/10 dark:text-primary dark:hover:bg-primary/30"
                                  : "text-gray-300 dark:text-foreground opacity-40 cursor-not-allowed"
                              }`}
                              title={
                                order.isGuest
                                  ? "أوردر ضيف — افتحه من صفحة الشركة"
                                  : !perms.canChangeStatus
                                  ? `مالكش صلاحية في شركة ${order.companyName}`
                                  : "تغيير الحالة"
                              }
                            >
                              <CheckCircleIcon className="w-5 h-5" />
                            </button>
                            {(order.isGuest || !perms.canChangeStatus) && (
                              <div className="hidden group-hover:block absolute bottom-full mb-1 z-30 px-2 py-1 text-xs text-white bg-muted dark:bg-black rounded shadow-md whitespace-nowrap pointer-events-none">
                                {order.isGuest
                                  ? "أوردر ضيف — افتحه من صفحة الشركة"
                                  : `مالكش صلاحية في شركة ${order.companyName}`}
                              </div>
                            )}
                          </div>

                          {/* زر إلغاء */}
                          <div className="relative group inline-block">
                            <button
                              type="button"
                              onClick={() => {
                                if (perms.canCancel && !order.isGuest) {
                                  setCancelModalOrder(order);
                                  setCancelReason("");
                                }
                              }}
                              disabled={!perms.canCancel || order.status === "CANCELLED" || order.isGuest}
                              className={`p-1.5 rounded-md transition-colors ${
                                perms.canCancel && order.status !== "CANCELLED" && !order.isGuest
                                  ? "text-red-600 hover:bg-destructive/10 dark:text-destructive dark:hover:bg-destructive/30"
                                  : "text-gray-300 dark:text-foreground opacity-40 cursor-not-allowed"
                              }`}
                              title={
                                order.isGuest
                                  ? "أوردر ضيف — افتحه من صفحة الشركة"
                                  : !perms.canCancel
                                  ? `مالكش صلاحية في شركة ${order.companyName}`
                                  : "إلغاء الطلب"
                              }
                            >
                              <XCircleIcon className="w-5 h-5" />
                            </button>
                            {(order.isGuest || !perms.canCancel) && (
                              <div className="hidden group-hover:block absolute bottom-full mb-1 z-30 px-2 py-1 text-xs text-white bg-muted dark:bg-black rounded shadow-md whitespace-nowrap pointer-events-none">
                                {order.isGuest
                                  ? "أوردر ضيف — افتحه من صفحة الشركة"
                                  : `مالكش صلاحية في شركة ${order.companyName}`}
                              </div>
                            )}
                          </div>

                          {/* زر «افتح» — يبدل السياق ويفتح الأوردر في شاشته الأصلية */}
                          <div className="relative group inline-block">
                            <button
                              type="button"
                              onClick={() => {
                                if (!order.isGuest) {
                                  handleOpenOrder(order);
                                }
                              }}
                              disabled={order.isGuest}
                              className={`p-1.5 rounded-md transition-colors flex items-center gap-1 text-xs font-medium ${
                                order.isGuest
                                  ? "text-gray-300 dark:text-foreground opacity-40 cursor-not-allowed"
                                  : "text-gray-600 hover:bg-muted dark:text-muted-foreground dark:hover:bg-muted"
                              }`}
                              title={
                                order.isGuest
                                  ? "أوردر ضيف — افتحه من صفحة الشركة"
                                  : `فتح الطلب داخل سياق شركة ${order.companyName}`
                              }
                            >
                              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                              <span className="hidden sm:inline">افتح</span>
                            </button>
                            {order.isGuest && (
                              <div className="hidden group-hover:block absolute bottom-full mb-1 z-30 px-2 py-1 text-xs text-white bg-muted dark:bg-black rounded shadow-md whitespace-nowrap pointer-events-none">
                                أوردر ضيف — افتحه من صفحة الشركة
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 4. الترقيم عبر Keyset Pagination ── */}
        {!isLoading && orders.length > 0 && (
          <div className="p-3.5 bg-muted dark:bg-muted border-t border-border dark:border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">
              تم عرض <strong className="font-mono text-foreground dark:text-white">{orders.length}</strong> من إجمالي{" "}
              <strong className="font-mono text-foreground dark:text-white">{totalOrders}</strong> طلب
            </span>

            {hasNextPage && (
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-4 py-2 bg-primary hover:bg-primary disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-xs"
              >
                {isLoadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري التحميل...</span>
                  </>
                ) : (
                  <>
                    <span>تحميل المزيد من الطلبات</span>
                    <ClockIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 5. Modal تغيير الحالة ── */}
      {statusModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-card rounded-xl shadow-xl border border-border dark:border-border w-full max-w-md p-5 space-y-4 text-right">
            <div>
              <h3 className="text-lg font-bold text-foreground">
                تغيير حالة الطلب #{statusModalOrder.orderNumber}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                الشركة: <strong className="text-blue-600 dark:text-primary">{statusModalOrder.companyName}</strong>
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  الحالة الجديدة
                </label>
                <select
                  value={modalTargetStatus}
                  onChange={(e) => setModalTargetStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-muted dark:bg-muted border border-border rounded-lg text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  <option value="CONFIRMED">مؤكد</option>
                  <option value="PROCESSING">جاري التجهيز</option>
                  <option value="SHIPPED">تم الشحن</option>
                  <option value="DELIVERED">تم التوصيل</option>
                  <option value="CANCELLED">ملغي</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  ملاحظات (اختياري)
                </label>
                <textarea
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  rows={2}
                  placeholder="أدخل أي ملاحظات على تغيير الحالة..."
                  className="w-full px-3 py-2 text-sm bg-muted dark:bg-muted border border-border rounded-lg text-foreground placeholder-muted focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border dark:border-border">
              <button
                type="button"
                onClick={() => setStatusModalOrder(null)}
                disabled={isUpdatingStatus}
                className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors font-medium"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSubmitStatusChange}
                disabled={isUpdatingStatus}
                className="px-4 py-2 text-sm bg-primary hover:bg-primary disabled:opacity-50 text-white rounded-lg transition-colors font-medium flex items-center gap-1.5"
              >
                {isUpdatingStatus ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <span>حفظ التغيير</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Modal تأكيد الإلغاء ── */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-card rounded-xl shadow-xl border border-border dark:border-border w-full max-w-md p-5 space-y-4 text-right">
            <div className="flex items-center gap-2 text-destructive dark:text-destructive">
              <XCircleIcon className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold">
                إلغاء الطلب #{cancelModalOrder.orderNumber}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              الشركة: <strong>{cancelModalOrder.companyName}</strong> — هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟
            </p>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                سبب الإلغاء (إلزامي)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={2}
                placeholder="أدخل سبب إلغاء الطلب..."
                className="w-full px-3 py-2 text-sm bg-muted dark:bg-muted border border-border rounded-lg text-foreground placeholder-muted focus:outline-hidden focus:ring-2 focus:ring-destructive"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border dark:border-border">
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                disabled={isCancelling}
                className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors font-medium"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleSubmitCancel}
                disabled={isCancelling || !cancelReason.trim()}
                className="px-4 py-2 text-sm bg-destructive hover:bg-destructive disabled:opacity-50 text-white rounded-lg transition-colors font-medium flex items-center gap-1.5"
              >
                {isCancelling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري الإلغاء...</span>
                  </>
                ) : (
                  <span>تأكيد الإلغاء</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCompaniesOrdersTab;
