import { useTranslation } from "react-i18next";
import { Banknote, CreditCard, History } from "lucide-react";
import DentalCaseCard from "./DentalCaseCard";
import {
  PAYMENT_STATUS_MAP,
  fmtDate,
  fmtMoney,
  type DentalInvoice,
  type DentalLabCaseDetail,
} from "../../shared";
import { FALLBACK_BADGE } from "../types/dentalCaseDetailTypes";

interface DentalCaseInvoicesCardProps {
  invoices?: DentalInvoice[];
  customValues?: DentalLabCaseDetail["customValues"];
  onAddPayment: (invoice: DentalInvoice) => void;
}

const renderBadge = (
  map: Record<string, { label: string; color: string }>,
  value?: string,
  fallback?: string
) => {
  if (!value) return null;
  const meta = map[value] ?? { ...FALLBACK_BADGE, label: fallback ?? value };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${meta.color}`}>
      {meta.label}
    </span>
  );
};

export default function DentalCaseInvoicesCard({
  invoices = [],
  customValues = [],
  onAddPayment,
}: DentalCaseInvoicesCardProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Invoices Card */}
      <DentalCaseCard
        title={t("dentalLab.detail.invoices")}
        icon={<CreditCard className="w-5 h-5" />}
      >
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground/80">{t("dentalLab.detail.noInvoices")}</p>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => (
              <div key={inv.id} className="border dark:border-border rounded-lg p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-medium text-sm font-mono tabular-nums" dir="ltr">
                    {inv.invoiceNumber || inv.id.slice(0, 8)}
                  </span>
                  {renderBadge(PAYMENT_STATUS_MAP, inv.paymentStatus)}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-2 font-mono tabular-nums">
                  <span>
                    {t("dentalLab.invoices.total")}:{" "}
                    <b className="text-gray-800 dark:text-muted-foreground">{fmtMoney(inv.total)}</b>
                  </span>
                  <span>
                    {t("dentalLab.invoices.paid")}:{" "}
                    <b className="text-green-600 dark:text-success">{fmtMoney(inv.paid)}</b>
                  </span>
                  <span>
                    {t("dentalLab.invoices.remaining")}:{" "}
                    <b className="text-red-500">{fmtMoney(inv.remaining)}</b>
                  </span>
                </div>
                {(inv.payments ?? []).length > 0 && (
                  <div className="border-t dark:border-border pt-2 mb-2 font-mono tabular-nums">
                    <p className="text-xs text-muted-foreground mb-1 font-sans">
                      {t("dentalLab.detail.payments")}:
                    </p>
                    {(inv.payments ?? []).map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs">
                        <span>
                          {fmtDate(p.createdAt)} — {fmtMoney(p.amount)}{" "}
                          {p.method ? `(${p.method})` : ""}
                        </span>
                        <span className="text-gray-400 font-sans">{p.note}</span>
                      </div>
                    ))}
                  </div>
                )}
                {inv.remaining > 0 && (
                  <button
                    onClick={() => onAddPayment(inv)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-success text-success bg-success/10 hover:bg-success dark:border-success dark:text-success dark:bg-success/30 dark:hover:bg-success/50 rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    {t("dentalLab.detail.addPayment")}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </DentalCaseCard>

      {/* Custom Values Card */}
      <DentalCaseCard
        title={t("dentalLab.detail.customValues")}
        icon={<History className="w-5 h-5" />}
      >
        {customValues.length === 0 ? (
          <p className="text-sm text-muted-foreground/80">
            {t("dentalLab.detail.noCustomValues")}
          </p>
        ) : (
          <div className="space-y-2">
            {customValues.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between border dark:border-border rounded-lg px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground">
                  {v.field?.name || v.fieldId || "—"}
                </span>
                <span className="font-medium font-mono">{v.value || "—"}</span>
              </div>
            ))}
          </div>
        )}
      </DentalCaseCard>
    </div>
  );
}
