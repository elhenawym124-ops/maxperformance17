import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { RefreshCw, Wallet } from "lucide-react";
import { fetchAgingReport, type AgingBucket, fmtMoney, tKey } from "../../shared";
import {
  tableWrap,
  thCls,
  tdCls,
  Skeleton,
} from "../types/reportsTypes";

export function DebtAgingView() {
  const { t } = useTranslation();
  const [buckets, setBuckets] = useState<AgingBucket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAgingReport();
      setBuckets(data.buckets || []);
      setTotal(data.totalOutstanding ?? 0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("dentalLab.common.noData"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const bucketLabel = (label: string) =>
    tKey(t, `dentalLab.reports.aging.${label}`);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Wallet className="w-4 h-4" />
          <span>{t("dentalLab.reports.aging.hint")}</span>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 border dark:border-border rounded-lg text-sm hover:bg-muted/50"
        >
          <RefreshCw className="w-4 h-4" />
          {t("dentalLab.common.refresh")}
        </button>
      </div>

      {loading ? (
        <Skeleton />
      ) : (
        <>
          <div className="bg-card rounded-xl border dark:border-border p-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t("dentalLab.reports.aging.totalOutstanding")}
            </p>
            <p className="text-xl font-bold text-destructive dark:text-destructive font-mono tabular-nums">
              {fmtMoney(total)} {t("dentalLab.common.egp")}
            </p>
          </div>
          <div className={tableWrap}>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={thCls}>{t("dentalLab.reports.aging.title")}</th>
                  <th className={thCls}>{t("dentalLab.reports.invoices")}</th>
                  <th className={thCls}>{t("dentalLab.common.remaining")}</th>
                </tr>
              </thead>
              <tbody>
                {(buckets || []).map((b, i) => (
                  <tr
                    key={b.label}
                    className="border-b dark:border-border last:border-b-0"
                  >
                    <td className={tdCls}>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            i === 0
                              ? "bg-emerald-400"
                              : i <= 2
                              ? "bg-amber-400"
                              : "bg-rose-500"
                          }`}
                        />
                        {bucketLabel(b.label)}
                      </div>
                    </td>
                    <td className={`${tdCls} font-mono tabular-nums`}>
                      {b.invoices ?? 0}
                    </td>
                    <td
                      className={`${tdCls} font-semibold font-mono tabular-nums ${
                        i === 0
                          ? "text-foreground"
                          : "text-rose-600 dark:text-destructive"
                      }`}
                    >
                      {fmtMoney(b.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default DebtAgingView;
