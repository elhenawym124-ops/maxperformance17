import React, { useState, useEffect } from "react";
import { apiClient } from "../../services/apiClient";
import {
  Users,
  BadgePercent,
  CheckCircle2,
  Clock,
  RefreshCcw,
  FileClock,
  Loader2,
} from "lucide-react";

interface AutoDiscountAnalyticsData {
  system?: string;
  totalDeliveredOrders?: number;
  appliedCustomers?: number;
  waitingForDelivery?: number;
  activeVouchers?: number;
  usedVouchers?: number;
  convertedVouchers?: number;
  expiredVouchers?: number;
  preActivationCustomers?: number;
}

/**
 * لوحة تحليلات نظام الخصم التلقائي:
 * عدد العملاء اللي عندهم كوبون + مراحل الكوبون (متاح/مستخدم/منتهي/تحول كاش باك).
 * بيعرض فقط لما يكون نظام الخصم التلقائي هو المُفعّل.
 */
const AutoDiscountAnalytics: React.FC = () => {
  const [data, setData] = useState<AutoDiscountAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await apiClient.get("/hr/customer-loyalty/system-analytics");
      setData((res?.data?.data as AutoDiscountAnalyticsData) || null);
    } catch (e) {
      console.error("Error loading auto-discount analytics:", e);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const isAutoDiscount = data?.system === "AUTO_DISCOUNT";

  const cards = [
    {
      label: "عملاء عندهم كوبون خصم",
      value: data?.appliedCustomers ?? 0,
      icon: Users,
      color: "text-emerald-600 bg-success dark:text-success dark:bg-success/40",
    },
    {
      label: "كوبونات متاحة",
      value: data?.activeVouchers ?? 0,
      icon: BadgePercent,
      color: "text-amber-600 bg-warning dark:text-warning dark:bg-warning/40",
    },
    {
      label: "كوبونات مستخدمة",
      value: data?.usedVouchers ?? 0,
      icon: CheckCircle2,
      color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/40",
    },
    {
      label: "اتحولت كاش باك",
      value: data?.convertedVouchers ?? 0,
      icon: RefreshCcw,
      color: "text-purple-600 bg-primary dark:text-primary dark:bg-primary/40",
    },
    {
      label: "كوبونات منتهية",
      value: data?.expiredVouchers ?? 0,
      icon: Clock,
      color: "text-gray-600 bg-muted dark:text-muted-foreground dark:bg-muted",
    },
    {
      label: "أوردرات مستلمة مستنية كوبون",
      value: data?.waitingForDelivery ?? 0,
      icon: FileClock,
      color: "text-orange-600 bg-warning dark:text-warning dark:bg-warning/40",
    },
  ];

  return (
    <div className="rounded-lg border border-success dark:border-success bg-success/40 dark:bg-success/10 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BadgePercent className="h-4 w-4 text-success dark:text-success" />
          <h4 className="text-sm font-semibold text-foreground">
            تحليل نظام الخصم التلقائي
          </h4>
        </div>
        <button
          onClick={load}
          disabled={loading}
          title="تحديث"
          className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-border text-muted-foreground hover:bg-muted disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCcw className="h-3.5 w-3.5" />
          )}
          تحديث
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-lg bg-muted/40 animate-pulse"
            />
          ))}
        </div>
      ) : !isAutoDiscount ? (
        <p className="text-sm text-muted-foreground py-2">
          فعّل نظام الخصم التلقائي لعرض التحليلات (عدد العملاء بالكوبونات ومراحل الكوبون).
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {cards.map((c) => (
              <div
                key={c.label}
                className="rounded-lg border border-border dark:border-border p-3 bg-card/60"
              >
                <div
                  className={`inline-flex items-center justify-center h-7 w-7 rounded-md ${c.color} mb-2`}
                >
                  <c.icon className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {c.value.toLocaleString()}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {c.label}
                </p>
              </div>
            ))}
          </div>

          {(data?.preActivationCustomers ?? 0) > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              ⚠️{" "}
              {data.preActivationCustomers} عميل عندهم أوردرات اتسلمت قبل تفعيل
              النظام — مش بياخدوا كوبون خصم تلقائي ("قبل تفعيل النظام").
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default AutoDiscountAnalytics;
