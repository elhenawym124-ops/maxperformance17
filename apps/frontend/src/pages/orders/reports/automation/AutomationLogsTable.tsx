import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Search, ArrowLeft, ExternalLink, Filter } from "lucide-react";
import { AutomationLogItem, AutomationTriggerType } from "./OrderAutomationReportsTypes";

interface AutomationLogsTableProps {
  logs: AutomationLogItem[];
  loading: boolean;
  getStatusName: (code: string) => string;
}

export const AutomationLogsTable: React.FC<AutomationLogsTableProps> = ({
  logs,
  loading,
  getStatusName,
}) => {
  const { t } = useTranslation();
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredLogs = logs.filter((log) => {
    if (filterType !== "all" && log.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchOrder = log.orderNumber.toLowerCase().includes(q);
      const matchCustomer = log.customerName.toLowerCase().includes(q);
      const matchPhone = log.customerPhone.includes(q);
      if (!matchOrder && !matchCustomer && !matchPhone) return false;
    }
    return true;
  });

  const getTypeBadge = (type: AutomationTriggerType) => {
    switch (type) {
      case "RULE":
        return {
          label: "قاعدة زمنية",
          className: "bg-primary/10 text-primary border-primary/20",
        };
      case "PRINT":
        return {
          label: "طباعة",
          className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        };
      case "TURBO":
        return {
          label: "تربو",
          className: "bg-purple-500/10 text-purple-500 border-purple-500/20",
        };
      default:
        return {
          label: "تلقائي",
          className: "bg-muted text-muted-foreground border-border/70",
        };
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat("ar-EG", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch (_) {
      return isoString;
    }
  };

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-2xs">
      <div className="flex flex-col gap-3 pb-3 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground">
            {t("orders.executionLogsTitle", "سجل التحويلات التلقائية المباشر (Execution Logs)")}
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {t(
              "orders.executionLogsSubtitle",
              "عرض تفصيلي لآخر 100 تحويل تم تنفيذه تلقائياً مع سبب كل إجراء"
            )}
          </p>
        </div>

        {/* Controls: Search + Type Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("orders.searchByOrderOrCustomer", "بحث برقم الطلب أو العميل...")}
              className="h-8 w-44 sm:w-56 rounded-lg border border-border/70 bg-background ps-8 pe-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-background p-0.5 text-xs">
            <Filter className="h-3 w-3 text-muted-foreground ms-1.5" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent py-1 pe-2 text-xs font-semibold text-foreground focus:outline-hidden cursor-pointer"
            >
              <option value="all">كل المشغلات</option>
              <option value="RULE">قواعد زمنية</option>
              <option value="PRINT">طباعة</option>
              <option value="TURBO">تربو</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">
          {t("common.loading", "جاري تحميل السجلات...")}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="py-10 text-center text-xs text-muted-foreground">
          {t("orders.noLogsFound", "لا توجد سجلات مطابقة للبحث أو الفترة المحددة")}
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-border/50 text-[11px] font-semibold text-muted-foreground">
                <th className="pb-2.5 ps-2">{t("orders.orderNumber", "الطلب")}</th>
                <th className="pb-2.5 px-3">{t("orders.customer", "العميل")}</th>
                <th className="pb-2.5 px-3">{t("orders.triggerType", "نوع المشغل")}</th>
                <th className="pb-2.5 px-3">{t("orders.transition", "التحويل")}</th>
                <th className="pb-2.5 px-3">{t("orders.reason", "السبب المسجل")}</th>
                <th className="pb-2.5 px-3">{t("orders.orderTotal", "القيمة")}</th>
                <th className="pb-2.5 pe-2">{t("orders.timestamp", "التاريخ والوقت")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredLogs.map((log) => {
                const typeBadge = getTypeBadge(log.type);
                return (
                  <tr key={log.id} className="transition-colors hover:bg-muted/30">
                    {/* Order Number */}
                    <td className="py-2.5 ps-2">
                      <Link
                        to={`/orders?search=${encodeURIComponent(log.orderNumber)}`}
                        className="inline-flex items-center gap-1 font-mono tabular-nums font-bold text-primary hover:underline"
                        title="فتح في صفحة الطلبات"
                      >
                        <span>#{log.orderNumber}</span>
                        <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                      </Link>
                    </td>

                    {/* Customer */}
                    <td className="py-2.5 px-3">
                      <div className="truncate max-w-[130px] font-medium text-foreground">
                        {log.customerName}
                      </div>
                      {log.customerPhone && (
                        <div className="text-[10px] font-mono tabular-nums text-muted-foreground">
                          {log.customerPhone}
                        </div>
                      )}
                    </td>

                    {/* Trigger Type */}
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${typeBadge.className}`}
                      >
                        {typeBadge.label}
                      </span>
                    </td>

                    {/* Transition */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="inline-flex items-center rounded-md border border-border/70 bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {log.oldStatus ? getStatusName(log.oldStatus) : "—"}
                        </span>
                        <ArrowLeft className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                        <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-bold">
                          {getStatusName(log.newStatus)}
                        </span>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="py-2.5 px-3">
                      <div className="max-w-[220px] truncate text-[11px] text-muted-foreground" title={log.reason || ""}>
                        {log.reason || "تغيير تلقائي للنظام"}
                      </div>
                    </td>

                    {/* Total */}
                    <td className="py-2.5 px-3 font-mono tabular-nums font-semibold text-foreground">
                      {log.total > 0 ? `${log.total.toLocaleString("ar-EG")} ج.م` : "—"}
                    </td>

                    {/* Timestamp */}
                    <td className="py-2.5 pe-2 font-mono tabular-nums text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
