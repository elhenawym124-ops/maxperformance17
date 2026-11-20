import { useCallback, useEffect, useState } from "react";
import { ArrowRightLeft, ArrowUpRight, ArrowDownRight, Shuffle, Ban, Info, Zap } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  type MovementFilterProps,
  type MovementMode,
  fetchMovement,
  KpiCard,
  StatusPill,
  LoadingState,
  ErrorState,
  EmptyState,
  MovementCard,
  CHART_TOOLTIP_STYLE,
  formatNumber,
  formatCurrency,
  formatPercent,
  TruncatedNotice,
} from "../orderMovementShared";

type MatrixKind = "invalid" | "backward" | "skip" | "forward" | "start" | "same" | "other";

interface MatrixRow {
  fromStatus: string;
  toStatus: string;
  count: number;
  revenue: number;
  manualCount: number;
  autoCount: number;
  kind: MatrixKind;
}

interface MatrixData {
  truncated?: boolean;
  totalTransitions: number;
  totalOrders: number;
  forwardCount: number;
  backwardCount: number;
  skipCount: number;
  invalidCount: number;
  startCount: number;
  sameCount: number;
  otherCount: number;
  rows: MatrixRow[];
  statuses: string[];
  modes: { manual: number; auto: number };
}

const KIND_META: { [K in MatrixKind]: { label: string; cell: string; dot: string; color: string } } = {
  invalid: {
    label: "غير مسموح",
    cell: "bg-red-50 text-destructive border-destructive hover:bg-destructive dark:bg-destructive/40 dark:text-destructive dark:border-destructive/60 dark:hover:bg-destructive/30",
    dot: "bg-red-500",
    color: "#EF4444",
  },
  backward: {
    label: "تراجع",
    cell: "bg-orange-50 text-warning border-warning hover:bg-warning dark:bg-warning/40 dark:text-warning dark:border-warning/60 dark:hover:bg-warning/30",
    dot: "bg-orange-500",
    color: "#F97316",
  },
  skip: {
    label: "قفزة",
    cell: "bg-amber-50 text-warning border-warning hover:bg-warning dark:bg-warning/40 dark:text-warning dark:border-warning/60 dark:hover:bg-warning/30",
    dot: "bg-amber-500",
    color: "#F59E0B",
  },
  forward: {
    label: "تقدم",
    cell: "bg-green-50 text-success border-success hover:bg-success dark:bg-success/40 dark:text-success dark:border-success/60 dark:hover:bg-success/30",
    dot: "bg-green-500",
    color: "#10B981",
  },
  start: {
    label: "بداية",
    cell: "bg-blue-50 text-primary border-primary hover:bg-primary dark:bg-primary/40 dark:text-primary dark:border-primary/60 dark:hover:bg-primary/30",
    dot: "bg-blue-500",
    color: "#3B82F6",
  },
  same: {
    label: "ثابت",
    cell: "bg-gray-50 text-foreground border-border hover:bg-muted dark:bg-muted dark:text-muted-foreground dark:border-border dark:hover:bg-muted",
    dot: "bg-gray-400",
    color: "#9CA3AF",
  },
  other: {
    label: "أخرى",
    cell: "bg-slate-50 text-foreground border-border hover:bg-muted dark:bg-muted dark:text-muted-foreground dark:border-border dark:hover:bg-muted",
    dot: "bg-slate-400",
    color: "#64748B",
  },
};

const KIND_ORDER: MatrixKind[] = ["forward", "backward", "skip", "invalid", "start", "same", "other"];

const modeLabel = (mode: MovementMode): string =>
  mode === "all" ? "جميع الحركات (يدوي + تلقائي)" : mode === "manual" ? "الحركات اليدوية فقط" : "الحركات التلقائية فقط";

const cellTitle = (row: MatrixRow): string =>
  `${KIND_META[row.kind].label} — الإجمالي: ${formatNumber(row.count)} · يدوي: ${formatNumber(row.manualCount)} · تلقائي: ${formatNumber(row.autoCount)} · الإيراد: ${formatCurrency(row.revenue)}`;

const chartDataFor = (data: MatrixData) =>
  KIND_ORDER.map((kind) => ({
    name: KIND_META[kind].label,
    value: data[`${kind}Count` as const],
    color: KIND_META[kind].color,
  })).filter((entry) => entry.value > 0);

function StartBadge() {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary dark:bg-primary/40 dark:text-primary">
      بداية
    </span>
  );
}

export default function StatusMatrixTab({ startDate, endDate, mode, onSwitchToVelocity }: MovementFilterProps) {
  const [data, setData] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMovement<MatrixData>("matrix", { startDate, endDate, mode });
      setData(result);
    } catch {
      setError("تعذر تحميل مصفوفة الانتقالات");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, mode]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  if (
    !data ||
    !Array.isArray(data.rows) ||
    !Array.isArray(data.statuses) ||
    data.totalTransitions === 0 ||
    data.rows.length === 0 ||
    data.statuses.length === 0
  ) {
    return <EmptyState />;
  }

  const fromStatuses: string[] = [];
  for (const row of data.rows) {
    if (!fromStatuses.includes(row.fromStatus)) fromStatuses.push(row.fromStatus);
  }

  const cellMap = new Map<string, MatrixRow>();
  for (const row of data.rows) {
    cellMap.set(`${row.fromStatus}|${row.toStatus}`, row);
  }

  const chartData = chartDataFor(data);
  const invalidPercent = data.totalTransitions > 0 ? (data.invalidCount / data.totalTransitions) * 100 : 0;

  return (
    <div className="space-y-6">
      <TruncatedNotice truncated={data?.truncated} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="إجمالي الحركات"
          value={formatNumber(data.totalTransitions)}
          icon={ArrowRightLeft}
          gradient="from-indigo-500 to-primary"
          hint={`من ${formatNumber(data.totalOrders)} طلب`}
        />
        <KpiCard
          label="تقدم"
          value={formatNumber(data.forwardCount)}
          icon={ArrowUpRight}
          gradient="from-emerald-500 to-success"
        />
        <KpiCard
          label="تراجع"
          value={formatNumber(data.backwardCount)}
          icon={ArrowDownRight}
          gradient="from-orange-500 to-warning"
        />
        <KpiCard
          label="قفزة"
          value={formatNumber(data.skipCount)}
          icon={Shuffle}
          gradient="from-amber-500 to-warning"
        />
        <KpiCard
          label="غير مسموح"
          value={formatNumber(data.invalidCount)}
          icon={Ban}
          gradient="from-red-500 to-destructive"
          hint={`نسبة ${formatPercent(invalidPercent)}`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/60 dark:border-primary/50 bg-primary/60 dark:bg-primary/20 px-4 py-3 text-xs text-primary dark:text-primary">
        <Info className="h-4 w-4 shrink-0" />
        <span>
          تعرض المصفوفة الانتقالات من حالة إلى أخرى ({modeLabel(mode)}) — الأخضر تقدم، البرتقالي تراجع، الكهرماني قفزة،
          الأزرق بداية، الرمادي ثابت، الأحمر انتقال غير مسموح (مخالف لقواعد الحالات).
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-primary/80 dark:border-primary/60 bg-gradient-to-r from-primary/90 via-primary/60 to-white dark:from-primary/40 dark:via-primary/30 dark:to-slate-900 p-3.5 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-xs">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-primary dark:text-primary">
              تريد معرفة عدد الأوردرات التي تم شحنها وتوزيعها بحسب تاريخ ورود كل طلب (Order Vintage)؟
            </div>
            <div className="text-[11px] text-primary/80 dark:text-primary/80">
              شاهد كم أوردر خرج شحن اليوم، وكم منها من نفس اليوم، أمس، قبل يومين، أو متأخر، مع إمكانية تصدير وفحص الطلبات.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSwitchToVelocity?.()}
          className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-primary active:scale-95"
        >
          <span>عرض سرعة الإنجاز وشحن اليوم</span>
          <span aria-hidden="true">←</span>
        </button>
      </div>

      <MovementCard
        title="مصفوفة الانتقالات"
        subtitle="عدد الحركات من كل حالة إلى أخرى — الشريط داخل الخلية يقسم اليدوي (أزرق) والتلقائي (بنفسجي)"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="rounded-xl bg-muted px-3 py-2 text-right text-xs font-semibold text-muted-foreground dark:bg-muted dark:text-muted-foreground">
                  من \ إلى
                </th>
                {data.statuses.map((toStatus) => (
                  <th key={toStatus} className="px-1 py-1 text-center">
                    <StatusPill code={toStatus} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fromStatuses.map((fromStatus) => (
                <tr key={fromStatus}>
                  <td className="rounded-xl bg-muted px-3 py-2 dark:bg-muted">
                    {fromStatus === "__start__" ? <StartBadge /> : <StatusPill code={fromStatus} />}
                  </td>
                  {data.statuses.map((toStatus) => {
                    const cell = cellMap.get(`${fromStatus}|${toStatus}`);
                    if (!cell) {
                      return (
                        <td key={toStatus}>
                          <div className="py-3 text-center text-xs text-muted-foreground dark:text-foreground">-</div>
                        </td>
                      );
                    }
                    const autoPct = cell.count > 0 ? (cell.autoCount / cell.count) * 100 : 0;
                    const manualPct = cell.count > 0 ? (cell.manualCount / cell.count) * 100 : 0;
                    return (
                      <td key={toStatus}>
                        <div
                          title={cellTitle(cell)}
                          className={`rounded-xl border px-2 py-2 text-center transition-colors ${KIND_META[cell.kind].cell}`}
                        >
                          <p className="text-sm font-bold leading-none">{formatNumber(cell.count)}</p>
                          <p className="mt-0.5 text-[10px] leading-none opacity-75">{formatCurrency(cell.revenue)}</p>
                          <div className="mt-1.5 flex h-1 w-full overflow-hidden rounded-full bg-muted dark:bg-muted">
                            <div className="bg-sky-500" style={{ width: `${manualPct}%` }} />
                            <div className="bg-violet-500" style={{ width: `${autoPct}%` }} />
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 dark:border-border">
          {KIND_ORDER.map((kind) => (
            <span key={kind} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`h-2.5 w-2.5 rounded-full ${KIND_META[kind].dot}`} />
              {KIND_META[kind].label}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/80">
            <span className="h-2.5 w-2.5 rounded-full bg-info" />
            يدوي
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/80">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            تلقائي
          </span>
        </div>
      </MovementCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <MovementCard
          title="توزيع أنواع الانتقالات"
          subtitle="حصة كل نوع من إجمالي الحركات في هذه الفترة"
          className="lg:col-span-2"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </MovementCard>

        <MovementCard title="ملخص الوضع" subtitle="إحصاءات سريعة لمصفوفة الانتقالات">
          <ul className="space-y-3">
            {KIND_ORDER.map((kind) => {
              const count = data[`${kind}Count` as const];
              return (
                <li key={kind} className="flex items-center justify-between gap-2 text-sm">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <span className={`h-2.5 w-2.5 rounded-full ${KIND_META[kind].dot}`} />
                    {KIND_META[kind].label}
                  </span>
                  <span className="font-semibold text-foreground">{formatNumber(count)}</span>
                </li>
              );
            })}
            <li className="flex items-center justify-between gap-2 border-t border-border pt-3 text-sm dark:border-border">
              <span className="text-muted-foreground">حركات يدوية / تلقائية</span>
              <span className="font-semibold text-foreground">
                {formatNumber(data.modes?.manual ?? 0)} / {formatNumber(data.modes?.auto ?? 0)}
              </span>
            </li>
          </ul>
        </MovementCard>
      </div>
    </div>
  );
}
