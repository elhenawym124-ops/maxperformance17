import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  MessageSquare,
  ShoppingCart,
  Cpu,
  Clock,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Phone,
} from "lucide-react";
import { apiClient } from "../../../services/apiClient";
import { Button } from "../../../components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatNumber,
  formatCurrency,
  formatRatio,
} from "../../../utils/formatNumber";

interface OperationsPulseData {
  orders: {
    todayOrders: number;
    todayGMV: number;
    avgOrderValue: number;
    topMerchant: {
      id: string;
      name: string;
      slug: string | null;
      ordersCount: number;
      ordersGMV: number;
    } | null;
  };
  whatsapp: {
    totalSessions: number;
    connected: number;
    disconnected: number;
    hasDisconnectedAlert: boolean;
    disconnectedList: Array<{
      id: string;
      companyName: string;
      companyId?: string;
      phoneNumber: string;
      status: string;
    }>;
  };
  abandonedCarts: {
    todayCount: number;
    todayValue: number;
    todayRecovered: number;
    recoveryRatePercent: number;
  };
  aiActivity: {
    todayInteractions: number;
    avgLatencyMs: number;
  };
  trials: {
    expiringCount: number;
    hasExpiringAlert: boolean;
    expiringList: Array<{
      id: string;
      name: string;
      phone: string | null;
      endsAt: string | null;
    }>;
  };
}

const formatLatency = (ms?: number | null): string => {
  if (ms === undefined || ms === null || isNaN(ms)) return "—";
  if (ms >= 1000) {
    const seconds = ms / 1000;
    const formatted = formatNumber(seconds, 1);
    return `${formatted} ثانية`;
  }
  const formatted = formatNumber(Math.round(ms));
  return `${formatted} مللي ثانية`;
};

export const PlatformOperationsPulse: React.FC = () => {
  const { data, isLoading, isFetching, refetch } = useQuery<{
    success: boolean;
    pulse: OperationsPulseData;
  }>({
    queryKey: ["super-admin", "operations-pulse"],
    queryFn: async () => {
      const res = await apiClient.get("/super-admin/dashboard/operations-pulse");
      return res.data;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const pulse = data?.pulse;

  if (isLoading && !pulse) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/60 p-5 shadow-sm backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-2.5 rounded-full bg-primary animate-ping" />
            <span className="text-sm font-bold text-foreground">
              نبض العمليات والمتاجر الحية
            </span>
          </div>
          <span className="text-xs text-muted-foreground animate-pulse">
            جاري فحص مؤشرات المنصة...
          </span>
        </div>
      </div>
    );
  }

  if (!pulse) return null;

  return (
    <div className="rounded-xl border border-border/50 bg-card/75 p-5 shadow-sm backdrop-blur-xl space-y-4">
      {/* Control / Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex size-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full size-2.5 bg-success" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              نبض العمليات والمتاجر الحية
            </h2>
            <p className="text-xs text-muted-foreground">
              رادار لحظي للطلبات، اتصالات الواتساب، السلال المتروكة، واستهلاك الذكاء الاصطناعي
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={cn("size-3.5 ms-1.5", isFetching && "animate-spin text-primary")} />
            تحديث
          </Button>

          <Link to="/super-admin/daily-orders">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs gap-1 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
            >
              <span>متابعة الطلبات التفصيلية</span>
              <ArrowUpRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Asymmetric Bento Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: الطلبات والمبيعات اليوم */}
        <div className="rounded-xl border border-border/50 bg-background/50 p-4 transition-all hover:bg-background hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              طلبات ومبيعات اليوم
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {formatNumber(pulse.orders.todayOrders)}
              </span>
              <span className="text-xs text-muted-foreground">طلب اليوم</span>
            </div>
            <p className="mt-1 text-xs text-success dark:text-success font-semibold tabular-nums">
              {formatCurrency(pulse.orders.todayGMV)}
              <span className="text-[10px] text-muted-foreground me-1 font-normal">
                {" "}(متوسط {formatCurrency(pulse.orders.avgOrderValue)})
              </span>
            </p>
          </div>
          {pulse.orders.topMerchant && (
            <div className="mt-2 pt-2 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
              <span className="truncate max-w-[130px]" title={pulse.orders.topMerchant.name}>
                الأعلى: {pulse.orders.topMerchant.name}
              </span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatNumber(pulse.orders.topMerchant.ordersCount)} طلب
              </span>
            </div>
          )}
        </div>

        {/* Card 2: رادار اتصالات الواتساب */}
        <div className="rounded-xl border border-border/50 bg-background/50 p-4 transition-all hover:bg-background hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              صحة اتصالات الواتساب
            </span>
            <div
              className={cn(
                "flex size-7 items-center justify-center rounded-lg",
                pulse.whatsapp.hasDisconnectedAlert
                  ? "bg-amber-500/10 text-warning dark:text-warning"
                  : "bg-emerald-500/10 text-success dark:text-success"
              )}
            >
              <MessageSquare className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {formatNumber(pulse.whatsapp.connected)}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                / {formatNumber(pulse.whatsapp.totalSessions)} جهاز متصل
              </span>
            </div>

            {pulse.whatsapp.hasDisconnectedAlert ? (
              <div className="mt-1 flex items-center gap-1 text-xs text-warning dark:text-warning font-medium">
                <AlertTriangle className="size-3 shrink-0" />
                <span>{formatNumber(pulse.whatsapp.disconnected)} أرقام مفصولة تحتاج فحص</span>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-1 text-xs text-success dark:text-success font-medium">
                <CheckCircle2 className="size-3 shrink-0" />
                <span>جميع أجهزة واتساب نشطة</span>
              </div>
            )}
          </div>

        </div>

        {/* Card 3: السلال المتروكة والاسترداد */}
        <div className="rounded-xl border border-border/50 bg-background/50 p-4 transition-all hover:bg-background hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              السلال المتروكة اليوم
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary dark:text-primary">
              <ShoppingCart className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {formatNumber(pulse.abandonedCarts.todayCount)}
              </span>
              <span className="text-xs text-muted-foreground">سلة متروكة</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground font-medium tabular-nums">
              بقيمة تقديرية:{" "}
              <span className="text-foreground font-semibold">
                {formatCurrency(pulse.abandonedCarts.todayValue)}
              </span>
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-border/40 text-[11px] flex items-center justify-between text-muted-foreground">
            <span>تم استردادها:</span>
            <span className="text-emerald-600 dark:text-success font-semibold tabular-nums">
              {formatNumber(pulse.abandonedCarts.todayRecovered)} سلة ({formatRatio(pulse.abandonedCarts.todayRecovered, pulse.abandonedCarts.todayCount)})
            </span>
          </div>
        </div>

        {/* Card 4: الذكاء الاصطناعي والتنبيهات */}
        <div className="rounded-xl border border-border/50 bg-background/50 p-4 transition-all hover:bg-background hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              نشاط الذكاء الاصطناعي
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary dark:text-primary">
              <Cpu className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {formatNumber(pulse.aiActivity.todayInteractions)}
              </span>
              <span className="text-xs text-muted-foreground">طلب وكلاء</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
              متوسط الاستجابة:{" "}
              <span className="font-semibold text-foreground">
                {formatLatency(pulse.aiActivity.avgLatencyMs)}
              </span>
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-border/40">
            <Link
              to="/super-admin/ai-consumption"
              className="text-[11px] text-primary hover:underline flex items-center justify-between font-medium"
            >
              <span>سجل استهلاك الـ AI</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Actionable Banner (Only appears if there are disconnected sessions or expiring trials) */}
      {(pulse.whatsapp.hasDisconnectedAlert || pulse.trials.hasExpiringAlert) && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-3.5 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-warning dark:text-warning">
            <AlertTriangle className="size-4 shrink-0 text-warning" />
            <span>
              <strong>تنبيه تشغيلي مباشر:</strong>{" "}
              {pulse.whatsapp.hasDisconnectedAlert && (
                <span>
                  هناك {formatNumber(pulse.whatsapp.disconnected)} أجهزة واتساب مفصولة أو بانتظار مسح QR.{" "}
                </span>
              )}
              {pulse.trials.hasExpiringAlert && (
                <span>
                  هناك {formatNumber(pulse.trials.expiringCount)} شركات توشك مهلتها التجريبية على الانتهاء خلال 48 ساعة.
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {pulse.trials.hasExpiringAlert && (
              <Link to="/super-admin/follow-up">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-warning/40 text-warning dark:text-warning bg-warning/10 hover:bg-warning/20"
                >
                  <Phone className="size-3 ms-1" />
                  متابعة الاشتراكات
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
