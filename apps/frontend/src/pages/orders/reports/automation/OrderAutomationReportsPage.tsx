import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { apiClient } from "../../../../services/apiClient";
import {
  AutomationReportsHeader,
  ReportPeriod,
} from "./AutomationReportsHeader";
import { AutomationReportsKpis } from "./AutomationReportsKpis";
import { AutomationRulesPerformanceTable } from "./AutomationRulesPerformanceTable";
import { AutomationEventsCard } from "./AutomationEventsCard";
import { AutomationLogsTable } from "./AutomationLogsTable";
import { AutomationReportData } from "./OrderAutomationReportsTypes";

const INITIAL_REPORT_DATA: AutomationReportData = {
  kpis: {
    totalTransitions: 0,
    uniqueOrders: 0,
    totalRevenue: 0,
    autoRate: 0,
    rulesTransitions: 0,
    printTransitions: 0,
    turboTransitions: 0,
    otherTransitions: 0,
  },
  rulesPerformance: [],
  eventsSummary: {
    print: {
      enabled: false,
      targetStatus: "",
      executionsCount: 0,
      totalRevenue: 0,
    },
    turbo: {
      enabled: false,
      targetStatus: "",
      executionsCount: 0,
      totalRevenue: 0,
    },
  },
  dailyTrends: [],
  recentLogs: [],
};

const DEFAULT_STATUS_NAMES: Record<string, string> = {
  PENDING: "قيد الانتظار",
  CONFIRMED: "مؤكد",
  PROCESSING: "قيد التجهيز",
  SHIPPED: "تم الشحن",
  DELIVERED: "تم التوصيل",
  CANCELLED: "ملغي",
  ON_HOLD: "معلق",
  RETURNED: "مرتجع",
};

export default function OrderAutomationReportsPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<ReportPeriod>("30");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [reportData, setReportData] = useState<AutomationReportData>(INITIAL_REPORT_DATA);
  const [statuses, setStatuses] = useState<{ code: string; name: string }[]>([]);

  // Fetch status configurations for translation
  const fetchStatuses = useCallback(async () => {
    try {
      const res = await apiClient.get("/order-status?statusType=order");
      if (res.data?.success && Array.isArray(res.data.data)) {
        setStatuses(res.data.data);
      }
    } catch (_) {}
  }, []);

  const getDateRange = useCallback(() => {
    const end = new Date();
    let start = new Date();

    if (period === "today") {
      start.setHours(0, 0, 0, 0);
    } else if (period === "yesterday") {
      start = new Date(Date.now() - 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else if (period === "custom") {
      if (customFrom) start = new Date(customFrom);
      if (customTo) end.setTime(new Date(customTo).getTime());
    } else {
      const days = parseInt(period, 10) || 30;
      start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [period, customFrom, customTo]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      const res = await apiClient.get("/order-status-rules/reports", {
        params: { startDate, endDate },
      });

      if (res.data?.success && res.data?.data) {
        setReportData(res.data.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch automation reports", err);
      toast.error(t("orders.failedToLoadReports", "تعذر تحميل تقارير الأتمتة"));
    } finally {
      setLoading(false);
    }
  }, [getDateRange, t]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    document.title = `${t("orders.automationReportsTitle", "تقارير أتمتة الطلبات")} | ${t("common.maxp", "MaxP")}`;
  }, [t]);

  const getStatusName = (code: string) => {
    const key = `orders.${code.toLowerCase()}`;
    const translated = t(key);
    if (translated && translated !== key) return translated;
    const match = statuses.find((s) => s.code.toUpperCase() === code.toUpperCase());
    return match?.name || DEFAULT_STATUS_NAMES[code.toUpperCase()] || code;
  };

  const handleExportCsv = () => {
    if (!reportData.recentLogs.length) return;

    const headers = ["رقم الطلب", "العميل", "الهاتف", "نوع المشغل", "من حالة", "إلى حالة", "السبب", "القيمة", "التاريخ"];
    const rows = reportData.recentLogs.map((log) => [
      log.orderNumber,
      `"${log.customerName.replace(/"/g, '""')}"`,
      log.customerPhone,
      log.type,
      getStatusName(log.oldStatus || ""),
      getStatusName(log.newStatus),
      `"${(log.reason || "").replace(/"/g, '""')}"`,
      log.total,
      log.createdAt,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `automation-reports-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(t("common.exportedSuccessfully", "تم تصدير التقرير بنجاح"));
  };

  return (
    <div className="flex flex-col p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-5" dir="rtl">
      {/* Header with Navigation and Filters */}
      <AutomationReportsHeader
        period={period}
        onPeriodChange={setPeriod}
        customFrom={customFrom}
        onCustomFromChange={setCustomFrom}
        customTo={customTo}
        onCustomToChange={setCustomTo}
        loading={loading}
        onRefresh={fetchReports}
        onExportCsv={handleExportCsv}
        totalLogsCount={reportData.recentLogs.length}
      />

      {/* KPI Cards */}
      <AutomationReportsKpis kpis={reportData.kpis} loading={loading} />

      {/* Events Summary (Print & Turbo) */}
      <AutomationEventsCard
        events={reportData.eventsSummary}
        loading={loading}
        getStatusName={getStatusName}
      />

      {/* Rules Performance Table */}
      <AutomationRulesPerformanceTable
        rules={reportData.rulesPerformance}
        loading={loading}
        getStatusName={getStatusName}
      />

      {/* Execution Logs Table */}
      <AutomationLogsTable
        logs={reportData.recentLogs}
        loading={loading}
        getStatusName={getStatusName}
      />
    </div>
  );
}
