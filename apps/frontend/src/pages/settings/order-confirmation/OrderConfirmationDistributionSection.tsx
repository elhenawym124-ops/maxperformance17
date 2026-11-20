import { ROLE_OPTIONS } from "./types";

export interface OrderConfirmationDistributionSectionProps {
  distributionEnabled: boolean;
  distributionStrategy: string;
  eligibleRoles: string[];
  onToggleDistributionEnabled: () => void;
  onChangeStrategy: (strategy: string) => void;
  onToggleRole: (role: string) => void;
}

export function OrderConfirmationDistributionSection({
  distributionEnabled,
  distributionStrategy,
  eligibleRoles,
  onToggleDistributionEnabled,
  onChangeStrategy,
  onToggleRole,
}: OrderConfirmationDistributionSectionProps) {
  return (
    <div className="space-y-4">
      {/* Distribution Toggle Switch */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-foreground dark:text-white">
            تفعيل التوزيع التلقائي
          </h3>
          <p className="text-xs text-muted-foreground dark:text-muted-foreground">
            عند التفعيل سيتم توزيع الطلبات المؤكدة تلقائياً على أعضاء الفريق المؤهلين.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={distributionEnabled}
          aria-label="تفعيل التوزيع التلقائي"
          onClick={onToggleDistributionEnabled}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 ${
            distributionEnabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-muted"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
              distributionEnabled
                ? "translate-x-6 rtl:-translate-x-6"
                : "translate-x-1 rtl:-translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Strategy and Roles */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-foreground dark:text-muted-foreground">
            طريقة التوزيع
          </label>
          <select
            value={distributionStrategy}
            onChange={(e) => onChangeStrategy(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-2 text-xs text-foreground transition focus:border-primary focus:outline-none dark:border-border dark:bg-muted dark:text-white"
          >
            <option value="round_robin">توزيع متساوي (Round Robin)</option>
            <option value="by_region">حسب المنطقة</option>
            <option value="by_specialty">حسب المنتج</option>
            <option value="by_order_value">حسب قيمة الأوردر</option>
            <option value="by_workload">حسب العبء الحالي</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-foreground dark:text-muted-foreground">
            الأدوار المسموحة بالتوزيع
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            {ROLE_OPTIONS.map((role) => (
              <label
                key={role.value}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={eligibleRoles.includes(role.value)}
                  onChange={() => onToggleRole(role.value)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span>{role.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
