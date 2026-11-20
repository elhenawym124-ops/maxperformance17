import { useCallback, useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  ClipboardCheck,
  Clock3,
  CheckCircle2,
  XCircle,
  Percent,
  Timer,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import {
  fetchMovement,
  KpiCard,
  StatusPill,
  MovementCard,
  LoadingState,
  ErrorState,
  EmptyState,
  CHART_TOOLTIP_STYLE,
  formatNumber,
  formatPercent,
  formatDuration,
  formatDateTime,
  type MovementFilterProps,
  TruncatedNotice,
} from "../orderMovementShared";

interface StatusInfo {
  name: string | null;
  code: string | null;
}

interface ApprovalRequest {
  id: string;
  orderId: string;
  orderNumber: string | null;
  requestedBy: string;
  requestedByName: string;
  fromStatus: StatusInfo | null;
  toStatus: StatusInfo | null;
  reason: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

interface ReviewerRow {
  name: string;
  reviewedCount: number;
  approved: number;
  rejected: number;
  avgReviewHours: number;
}

interface ApprovalsData {
  truncated?: boolean;
  summary: {
    totalRequests: number;
    pending: number;
    approved: number;
    rejected: number;
    approvalRate: number;
    avgReviewHours: number;
    totalOverrides: number;
  };
  requests: ApprovalRequest[];
  reviewers: ReviewerRow[];
}

const requestStatusLabel = (status: string): string => {
  const s = String(status || "").toLowerCase();
  if (s === "approved") return "موافق عليها";
  if (s === "rejected") return "مرفوضة";
  return "بانتظار الموافقة";
};

const requestStatusClass = (status: string): string => {
  const s = String(status || "").toLowerCase();
  if (s === "approved")
    return "bg-emerald-100 text-success dark:bg-success/30 dark:text-success";
  if (s === "rejected")
    return "bg-red-100 text-destructive dark:bg-destructive/30 dark:text-destructive";
  return "bg-amber-100 text-warning dark:bg-warning/30 dark:text-warning";
};

export default function ApprovalsTab({ startDate, endDate, mode }: MovementFilterProps) {
  const [data, setData] = useState<ApprovalsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMovement<ApprovalsData>("approvals", { startDate, endDate, mode });
      setData(result);
    } catch {
      setError("تعذر تحميل بيانات الموافقات");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, mode]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data || data.requests.length === 0) return <EmptyState />;

  const { summary } = data;

  const pieData = [
    { name: "بانتظار الموافقة", value: summary.pending, color: "#F59E0B" },
    { name: "موافق عليها", value: summary.approved, color: "#10B981" },
    { name: "مرفوضة", value: summary.rejected, color: "#EF4444" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <TruncatedNotice truncated={data?.truncated} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-7">
        <KpiCard label="إجمالي الطلبات" value={formatNumber(summary.totalRequests)} icon={ClipboardCheck} />
        <KpiCard label="بانتظار الموافقة" value={formatNumber(summary.pending)} icon={Clock3} gradient="from-amber-500 to-warning" />
        <KpiCard label="موافق عليها" value={formatNumber(summary.approved)} icon={CheckCircle2} gradient="from-emerald-500 to-success" />
        <KpiCard label="مرفوضة" value={formatNumber(summary.rejected)} icon={XCircle} gradient="from-rose-500 to-destructive" />
        <KpiCard label="معدل الموافقة" value={formatPercent(summary.approvalRate)} icon={Percent} gradient="from-sky-500 to-primary" />
        <KpiCard label="متوسط زمن المراجعة" value={formatDuration(summary.avgReviewHours)} icon={Timer} gradient="from-fuchsia-500 to-primary" />
        <KpiCard label="تجاوزات" value={formatNumber(summary.totalOverrides)} icon={ShieldAlert} gradient="from-slate-600 to-gray-800" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <MovementCard title="حالة الموافقات" subtitle="توزيع طلبات تغيير الحالة" className="lg:col-span-2">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
            <div className="h-56 w-56 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-3 text-sm">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-semibold text-foreground">{formatNumber(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </MovementCard>

        <MovementCard title="أداء المراجعين" subtitle="حسب عدد المراجعات">
          {data.reviewers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">لا توجد مراجعات بعد</p>
          ) : (
            <div className="space-y-3">
              {data.reviewers.map((rv) => (
                <div
                  key={rv.name}
                  className="flex items-center justify-between gap-3 rounded-xl bg-muted px-4 py-3 dark:bg-muted"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{rv.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      موافق عليها: {formatNumber(rv.approved)} · مرفوضة: {formatNumber(rv.rejected)}
                    </p>
                  </div>
                  <div className="shrink-0 text-left">
                    <p className="text-sm font-semibold text-foreground">
                      {formatNumber(rv.reviewedCount)} مراجعة
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      متوسط {formatDuration(rv.avgReviewHours)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </MovementCard>
      </div>

      <MovementCard title="طلبات تغيير الحالة" subtitle={`آخر ${formatNumber(summary.totalRequests)} طلب في الفترة المحددة`}>
        <div className="-mx-5 -mb-5 overflow-x-auto rounded-b-2xl">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground dark:border-border dark:text-muted-foreground">
                <th className="px-5 py-3 text-right font-medium">رقم الطلب</th>
                <th className="px-5 py-3 text-right font-medium">مقدَّم من</th>
                <th className="px-5 py-3 text-right font-medium">نقل الحالة</th>
                <th className="px-5 py-3 text-right font-medium">السبب</th>
                <th className="px-5 py-3 text-right font-medium">حالة الموافقة</th>
                <th className="px-5 py-3 text-right font-medium">المراجع</th>
                <th className="px-5 py-3 text-right font-medium">تاريخ الطلب</th>
                <th className="px-5 py-3 text-right font-medium">تاريخ المراجعة</th>
              </tr>
            </thead>
            <tbody>
              {data.requests.map((r) => {
                const isPending = String(r.status || "").toLowerCase() === "pending";
                return (
                  <tr
                    key={r.id}
                    className={`border-b border-border transition-colors last:border-0 dark:border-border ${
                      isPending
                        ? "bg-amber-50/60 dark:bg-warning/10"
                        : "hover:bg-gray-50/60 dark:hover:bg-muted"
                    }`}
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-medium text-foreground dark:text-muted-foreground">
                      {r.orderNumber || "-"}
                    </td>
                    <td className="px-5 py-3.5 text-foreground">{r.requestedByName}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <StatusPill code={r.fromStatus?.code ?? ""} />
                        <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
                        <StatusPill code={r.toStatus?.code ?? ""} />
                      </div>
                    </td>
                    <td className="max-w-[240px] px-5 py-3.5">
                      <span className="block truncate text-foreground dark:text-muted-foreground" title={r.reason || ""}>
                        {r.reason || "-"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${requestStatusClass(r.status)}`}>
                        {requestStatusLabel(r.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-foreground">{r.reviewedByName || "-"}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-xs text-foreground dark:text-muted-foreground">
                      {formatDateTime(r.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-xs text-foreground dark:text-muted-foreground">
                      {formatDateTime(r.reviewedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </MovementCard>
    </div>
  );
}
