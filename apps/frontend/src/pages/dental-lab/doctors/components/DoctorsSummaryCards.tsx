import { useTranslation } from "react-i18next";
import { fmtMoney, type DentalLabDoctor } from "../../shared";
import type { DoctorSummary } from "../types/doctorsTypes";

interface DoctorsSummaryCardsProps {
  summary: DoctorSummary | null;
  rows: DentalLabDoctor[];
}

export function DoctorsSummaryCards({
  summary,
  rows,
}: DoctorsSummaryCardsProps) {
  const { t } = useTranslation();

  const totalOutstanding = summary
    ? summary.totalOutstanding
    : rows.reduce((s, d) => s + (d.outstanding ?? 0), 0);

  const totalBilled = summary
    ? summary.totalBilled
    : rows.reduce((s, d) => s + (d.totalBilled ?? 0), 0);

  const overCreditCount = rows.filter((d) => d.creditExceeded).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="bg-card rounded-xl border dark:border-border p-4">
        <p className="text-xs text-muted-foreground">
          {t("dentalLab.doctors.ledger.totalOutstanding")}
        </p>
        <p className="text-xl font-bold mt-1 font-mono tabular-nums text-destructive dark:text-destructive">
          {fmtMoney(totalOutstanding)} {t("dentalLab.common.egp")}
        </p>
      </div>

      <div className="bg-card rounded-xl border dark:border-border p-4">
        <p className="text-xs text-muted-foreground">
          {t("dentalLab.doctors.ledger.totalBilled")}
        </p>
        <p className="text-xl font-bold mt-1 font-mono tabular-nums text-foreground">
          {fmtMoney(totalBilled)} {t("dentalLab.common.egp")}
        </p>
      </div>

      <div className="bg-card rounded-xl border dark:border-border p-4">
        <p className="text-xs text-muted-foreground">
          {t("dentalLab.doctors.ledger.overCredit")}
        </p>
        <p
          className={`text-xl font-bold mt-1 font-mono tabular-nums ${
            overCreditCount > 0
              ? "text-red-600 dark:text-destructive"
              : "text-foreground"
          }`}
        >
          {overCreditCount} {t("dentalLab.common.doctor")}
        </p>
      </div>
    </div>
  );
}

export default DoctorsSummaryCards;
