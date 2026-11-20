import { useTranslation } from "react-i18next";
import { CreditCard } from "lucide-react";
import {
  type BillingPolicy,
  type DentalInvoiceMode,
  tKey,
  MODAL_INPUT_CLS,
} from "../../shared";
import {
  sectionCardCls,
  labelCls,
  INVOICE_MODES,
} from "../types/settingsTypes";
import { ToggleRow } from "../components/ToggleRow";

interface BillingSettingsSectionProps {
  billingPolicy: BillingPolicy;
  setBillingPolicy: React.Dispatch<React.SetStateAction<BillingPolicy>>;
  guards: { requireQualityCheckBeforeReady?: boolean };
  setGuards: React.Dispatch<
    React.SetStateAction<{ requireQualityCheckBeforeReady?: boolean }>
  >;
}

export function BillingSettingsSection({
  billingPolicy,
  setBillingPolicy,
  guards,
  setGuards,
}: BillingSettingsSectionProps) {
  const { t } = useTranslation();
  const inputCls = `${MODAL_INPUT_CLS} text-sm`;

  return (
    <div className={`${sectionCardCls} space-y-4`}>
      <div className="flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-muted-foreground" />
        <div>
          <h3 className="font-semibold">
            {t("dentalLab.settings.billingPolicy.title")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("dentalLab.settings.billingPolicy.hint")}
          </p>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-primary/20 border border-primary dark:border-primary rounded-lg px-4 py-3 text-xs text-primary dark:text-primary leading-relaxed">
        {t("dentalLab.settings.billingPolicy.whoOwes")}
      </div>

      <div>
        <label className={labelCls}>
          {t("dentalLab.settings.billingPolicy.invoiceMode")}
        </label>
        <select
          className={inputCls}
          value={billingPolicy.invoiceMode ?? "AUTO_ON_DELIVERY"}
          onChange={(e) =>
            setBillingPolicy((prev) => ({
              ...prev,
              invoiceMode: e.target.value as DentalInvoiceMode,
            }))
          }
        >
          {INVOICE_MODES.map((m) => (
            <option key={m.id} value={m.id}>
              {t(m.labelKey)} — {tKey(t, m.hintKey)}
            </option>
          ))}
        </select>
      </div>

      <div className="divide-y dark:divide-border border-t dark:border-border">
        <ToggleRow
          label={t(
            "dentalLab.settings.billingPolicy.requireInvoiceBeforeDelivery"
          )}
          hint={t(
            "dentalLab.settings.billingPolicy.requireInvoiceBeforeDelivery_hint"
          )}
          checked={billingPolicy.requireInvoiceBeforeDelivery !== false}
          onChange={(v) =>
            setBillingPolicy((prev) => ({
              ...prev,
              requireInvoiceBeforeDelivery: v,
            }))
          }
        />
        <ToggleRow
          label={t(
            "dentalLab.settings.billingPolicy.requireFullPaymentBeforeDelivery"
          )}
          hint={t(
            "dentalLab.settings.billingPolicy.requireFullPaymentBeforeDelivery_hint"
          )}
          checked={billingPolicy.requireFullPaymentBeforeDelivery === true}
          onChange={(v) =>
            setBillingPolicy((prev) => ({
              ...prev,
              requireFullPaymentBeforeDelivery: v,
            }))
          }
        />
        <ToggleRow
          label={t("dentalLab.settings.billingPolicy.enforceCreditLimit")}
          hint={t(
            "dentalLab.settings.billingPolicy.enforceCreditLimit_hint"
          )}
          checked={billingPolicy.enforceCreditLimit === true}
          onChange={(v) =>
            setBillingPolicy((prev) => ({
              ...prev,
              enforceCreditLimit: v,
            }))
          }
        />
        <ToggleRow
          label="إلزام فحص الجودة قبل التسليم"
          hint="يمنع نقل الحالة إلى جاهز للتسليم (READY) إلا بعد إجراء فحص جودة معتمد وناجح"
          checked={guards.requireQualityCheckBeforeReady === true}
          onChange={(v) =>
            setGuards((prev) => ({
              ...prev,
              requireQualityCheckBeforeReady: v,
            }))
          }
        />
      </div>
    </div>
  );
}

export default BillingSettingsSection;
