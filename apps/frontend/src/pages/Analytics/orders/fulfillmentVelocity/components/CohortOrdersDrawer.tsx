import React, { useState } from "react";
import { X, Search, Download, ExternalLink, Clock, User, Phone, MapPin } from "lucide-react";
import type { ShippedOrderDetail, DrillDownPagination, FulfillmentMilestone } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  orders: ShippedOrderDetail[];
  loading: boolean;
  pagination: DrillDownPagination;
  milestone?: FulfillmentMilestone;
  onPageChange: (newPage: number) => void;
}

export const CohortOrdersDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  title,
  orders,
  loading,
  pagination,
  milestone,
  onPageChange,
}) => {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filteredOrders = orders.filter((o) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      o.governorate.toLowerCase().includes(q)
    );
  });

  const handleExportCsv = () => {
    if (orders.length === 0) return;
    const headers = [
      "رقم الطلب",
      "العميل",
      "الهاتف",
      "المحافظة",
      "الإجمالي",
      "تاريخ ورود الطلب",
      "توقيت الشحن",
      "دورة التجهيز (ساعة)",
      "الموظف المسؤول",
      "الحالة الحالية",
    ];
    const rows = orders.map((o) => [
      o.orderNumber,
      `"${o.customerName}"`,
      `"${o.customerPhone}"`,
      `"${o.governorate}"`,
      o.total,
      o.createDayStr,
      new Date(o.shippedAt).toLocaleString("ar-EG"),
      o.leadTimeHours,
      `"${o.shippedBy}"`,
      o.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shipped_cohort_${title.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-muted backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <aside className="relative z-50 flex h-full w-full max-w-2xl flex-col border-s border-border bg-white shadow-2xl transition-transform animate-in slide-in-from-end duration-200 dark:border-border dark:bg-muted sm:max-w-3xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 dark:border-border">
          <div>
            <h2 className="text-base font-bold text-foreground dark:text-white">
              {title}
            </h2>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground">
              إجمالي {pagination.total.toLocaleString("ar-EG")} طلب في هذه الدفعة
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-2xs transition hover:bg-muted active:scale-95 dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted"
            >
              <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>تصدير CSV</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 dark:text-muted-foreground dark:hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="border-b border-border bg-muted p-3 dark:border-border dark:bg-muted">
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث برقم الطلب، اسم العميل، الهاتف، أو المحافظة..."
              className="w-full rounded-lg border border-border bg-white py-2 pe-9 ps-3 text-xs outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-border dark:bg-muted dark:text-white"
            />
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
              لا توجد طلبات مطابقة للبحث
            </div>
          ) : (
            <div className="space-y-2">
              {filteredOrders.map((o) => (
                <div
                  key={o.id}
                  className="rounded-xl border border-border bg-white p-3.5 text-xs transition-shadow hover:shadow-xs dark:border-border dark:bg-muted"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-foreground dark:text-white">
                        {o.orderNumber}
                      </span>
                      {o.isGuest && (
                        <span className="rounded bg-warning px-1.5 py-0.5 text-[10px] font-semibold text-warning dark:bg-warning/60 dark:text-warning">
                          طلب ضيف
                        </span>
                      )}
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                        {o.status}
                      </span>
                      {o.handoffStatus && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            o.handoffStatus === "SHIPPED"
                              ? "bg-emerald-50 text-success dark:bg-success/50 dark:text-success"
                              : "bg-amber-50 text-warning dark:bg-warning/50 dark:text-warning"
                          }`}
                        >
                          {o.handoffStatus === "SHIPPED" ? "استلمها الكابتن" : "بانتظار الكابتن بالمخزن"}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-foreground tabular-nums dark:text-white">
                      {o.total.toLocaleString("ar-EG")} ج.م
                    </span>
                  </div>

                  <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] text-foreground dark:text-muted-foreground sm:grid-cols-4">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{o.customerName}</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono dir-ltr">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span>{o.customerPhone || "-"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span>{o.governorate}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="font-semibold text-foreground dark:text-muted-foreground">
                        دورة: {o.leadTimeHours} س
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-[10px] text-muted-foreground dark:border-border">
                    <span>ورود الطلب: {o.createDayStr}</span>
                    <span>
                      {milestone === "READY_TO_SHIP" ? "تجهيز بواسطة" : "تم الشحن بواسطة"}: {o.shippedBy}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs dark:border-border">
            <span className="text-slate-500">
              صفحة {pagination.page} من {pagination.totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}
                className="rounded-md border border-border px-2.5 py-1 font-medium disabled:opacity-40 dark:border-border"
              >
                السابق
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => onPageChange(pagination.page + 1)}
                className="rounded-md border border-border px-2.5 py-1 font-medium disabled:opacity-40 dark:border-border"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
