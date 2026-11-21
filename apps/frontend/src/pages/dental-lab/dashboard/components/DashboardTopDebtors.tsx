import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { type DashboardData, fmtMoney } from "../../shared";

interface DashboardTopDebtorsProps {
  topDebtors: NonNullable<DashboardData["topDebtors"]>;
}

export function DashboardTopDebtors({
  topDebtors,
}: DashboardTopDebtorsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-border dark:border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">
          {t("dentalLab.dashboard.topDebtors")}
        </h3>
        <button
          type="button"
          onClick={() => navigate("/dental-lab/invoices?status=UNPAID")}
          className="text-xs text-destructive dark:text-destructive hover:underline flex items-center gap-1"
        >
          الفواتير غير المسددة <ArrowLeft className="w-3 h-3" />
        </button>
      </div>

      {topDebtors.length === 0 ? (
        <p className="text-sm text-muted-foreground/80">
          {t("dentalLab.common.noData")}
        </p>
      ) : (
        <div className="space-y-2">
          {topDebtors.map((d, i) => (
            <div
              key={d.doctorId ?? i}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (d.doctorId) {
                  navigate(`/dental-lab/doctors/${d.doctorId}`);
                } else {
                  navigate("/dental-lab/invoices?status=UNPAID");
                }
              }}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") &&
                (d.doctorId
                  ? navigate(`/dental-lab/doctors/${d.doctorId}`)
                  : navigate("/dental-lab/invoices?status=UNPAID"))
              }
              className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-destructive/70 dark:hover:bg-destructive/20 cursor-pointer transition-colors group"
              title="اضغط لفتح كشف حساب وفواتير الطبيب"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-6 h-6 rounded-full bg-destructive dark:bg-destructive/40 text-destructive dark:text-destructive text-xs flex items-center justify-center shrink-0 font-bold font-mono tabular-nums">
                  {i + 1}
                </span>
                <span className="font-medium text-foreground group-hover:text-destructive dark:group-hover:text-destructive truncate">
                  {d.doctorName || "—"}
                </span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity text-destructive shrink-0" />
              </div>
              <span className="font-bold text-destructive dark:text-destructive whitespace-nowrap font-mono tabular-nums">
                {fmtMoney(d.outstanding)} {t("dentalLab.common.egp")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DashboardTopDebtors;
