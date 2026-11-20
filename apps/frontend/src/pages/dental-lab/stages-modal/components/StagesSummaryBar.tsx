import { Clock, Coins, RotateCcw, Workflow } from "lucide-react";
import { fmtMoney } from "../../shared";

interface StagesSummaryBarProps {
  stagesCount: number;
  totalSlaHours: number;
  totalDays: string;
  totalWages: number;
  onReset: () => void;
}

export function StagesSummaryBar({
  stagesCount,
  totalSlaHours,
  totalDays,
  totalWages,
  onReset,
}: StagesSummaryBarProps) {
  return (
    <div className="bg-gray-50 dark:bg-muted px-4 py-2.5 border-b dark:border-border flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-4 text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Workflow className="w-3.5 h-3.5 text-blue-500" />
          <span>المراحل:</span>
          <strong
            data-testid="stages-count"
            className="font-mono tabular-nums text-foreground"
          >
            {stagesCount}
          </strong>
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-warning" />
          <span>إجمالي SLA:</span>
          <strong className="font-mono tabular-nums text-foreground">
            {totalSlaHours} ساعة ({totalDays} يوم)
          </strong>
        </span>
        <span className="flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5 text-success" />
          <span>إجمالي أجور المراحل:</span>
          <strong className="font-mono tabular-nums text-foreground">
            {fmtMoney(totalWages)} ج.م
          </strong>
        </span>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        استعادة الـ 5 مراحل المعتمدة
      </button>
    </div>
  );
}

export default StagesSummaryBar;
