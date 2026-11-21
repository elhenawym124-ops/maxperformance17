import React from "react";
import { useTranslation } from "react-i18next";
import {
  Mail,
  Palette,
  ScanText,
  Settings2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SettingsSection } from "../components/SettingsPagePrimitives";
import { ToggleCard } from "./ToggleCard";
import {
  statuses,
  type InvoiceSettings,
} from "./types";

export interface InvoiceTabContentProps {
  invoice: InvoiceSettings;
  invoiceFlags: readonly (readonly [keyof InvoiceSettings, string])[];
  barcodeFlags: readonly (readonly [keyof InvoiceSettings, string])[];
  labelForStatus: (status: string) => string;
  onUpdateInvoice: (updates: Partial<InvoiceSettings>) => void;
}

export function InvoiceTabContent({
  invoice,
  invoiceFlags,
  barcodeFlags,
  labelForStatus,
  onUpdateInvoice,
}: InvoiceTabContentProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5 pt-0">
      <div className="grid gap-5 xl:grid-cols-2">
        {/* Automation & Numbering */}
        <SettingsSection
          icon={Settings2}
          title={t("orderInvoiceSettings.k_6")}
          description={t("orderInvoiceSettings.k_7")}
          accentClassName="bg-sky-50 text-info ring-info/70 dark:bg-info/40 dark:text-info"
          surfaceClassName="bg-white/90 dark:bg-muted"
        >
          <ToggleCard
            title={t("orderInvoiceSettings.k_8")}
            description={t("orderInvoiceSettings.k_9")}
            checked={invoice.autoGenerate}
            onCheckedChange={(checked) =>
              onUpdateInvoice({ autoGenerate: checked })
            }
          />

          {invoice.autoGenerate && (
            <div className="space-y-2">
              <Label htmlFor="auto-generate-status">
                توليد الفاتورة عند الحالة
              </Label>
              <Select
                value={invoice.autoGenerateOnStatus}
                onValueChange={(value) =>
                  onUpdateInvoice({ autoGenerateOnStatus: value })
                }
              >
                <SelectTrigger
                  id="auto-generate-status"
                  aria-label={t("orderInvoiceSettings.k_10")}
                  className="h-11 rounded-xl"
                >
                  <span className="flex flex-1 text-start font-medium">
                    {invoice.autoGenerateOnStatus
                      ? labelForStatus(invoice.autoGenerateOnStatus)
                      : t("orderInvoiceSettings.k_70")}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {labelForStatus(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invoice-prefix">
                {t("orderInvoiceSettings.k_34")}
              </Label>
              <Input
                id="invoice-prefix"
                value={invoice.invoicePrefix}
                onChange={(e) =>
                  onUpdateInvoice({ invoicePrefix: e.target.value })
                }
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice-number-format">
                تنسيق رقم الفاتورة
              </Label>
              <Input
                id="invoice-number-format"
                value={invoice.invoiceNumberFormat}
                onChange={(e) =>
                  onUpdateInvoice({ invoiceNumberFormat: e.target.value })
                }
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="rounded-[20px] border border-dashed border-info bg-info/80 p-4 dark:border-info dark:bg-info/20">
            <p className="text-xs font-semibold text-info dark:text-info">
              معاينة رقم الفاتورة
            </p>
            <p className="mt-2 text-sm font-bold font-mono tabular-nums text-foreground dark:text-muted-foreground" dir="ltr">
              {invoice.invoicePrefix || "INV"}-20260429-000001
            </p>
          </div>
        </SettingsSection>

        {/* Financial Defaults */}
        <SettingsSection
          icon={ScanText}
          title={t("orderInvoiceSettings.k_11")}
          description={t("orderInvoiceSettings.k_12")}
          accentClassName="bg-indigo-50 text-primary ring-primary/70 dark:bg-primary/40 dark:text-primary"
          surfaceClassName="bg-white/90 dark:bg-muted"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="default-tax-rate">
                {t("orderInvoiceSettings.k_35")}
              </Label>
              <Input
                id="default-tax-rate"
                type="number"
                value={invoice.defaultTaxRate}
                onChange={(e) =>
                  onUpdateInvoice({
                    defaultTaxRate: Number(e.target.value) || 0,
                  })
                }
                className="h-11 rounded-xl font-mono tabular-nums"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-due-days">
                {t("orderInvoiceSettings.k_36")}
              </Label>
              <Input
                id="default-due-days"
                type="number"
                value={invoice.defaultDueDays}
                onChange={(e) =>
                  onUpdateInvoice({
                    defaultDueDays: Number(e.target.value) || 0,
                  })
                }
                className="h-11 rounded-xl font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-terms">
              {t("orderInvoiceSettings.k_37")}
            </Label>
            <Textarea
              id="default-terms"
              rows={3}
              value={invoice.defaultTerms}
              onChange={(e) =>
                onUpdateInvoice({ defaultTerms: e.target.value })
              }
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-notes">
              {t("orderInvoiceSettings.k_38")}
            </Label>
            <Textarea
              id="default-notes"
              rows={3}
              value={invoice.defaultNotes}
              onChange={(e) =>
                onUpdateInvoice({ defaultNotes: e.target.value })
              }
              className="rounded-xl"
            />
          </div>
        </SettingsSection>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Visible Elements & Barcode */}
        <SettingsSection
          icon={Palette}
          title={t("orderInvoiceSettings.k_13")}
          description={t("orderInvoiceSettings.k_14")}
          accentClassName="bg-emerald-50 text-success ring-success/70 dark:bg-success/40 dark:text-success"
          surfaceClassName="bg-white/90 dark:bg-muted"
        >
          <div className="space-y-3">
            {invoiceFlags.map(([key, label]) => (
              <ToggleCard
                key={String(key)}
                title={label}
                description={t("orderInvoiceSettings.k_15", { label })}
                checked={Boolean(invoice[key])}
                onCheckedChange={(checked) =>
                  onUpdateInvoice({ [key]: checked })
                }
              />
            ))}
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-xs font-semibold text-foreground dark:text-muted-foreground">
              إعدادات الباركود
            </p>
            {barcodeFlags.map(([key, label]) => (
              <ToggleCard
                key={String(key)}
                title={label}
                description={t("orderInvoiceSettings.k_15", { label })}
                checked={Boolean(invoice[key])}
                onCheckedChange={(checked) =>
                  onUpdateInvoice({ [key]: checked })
                }
              />
            ))}
          </div>
        </SettingsSection>

        {/* Customer Notifications */}
        <SettingsSection
          icon={Mail}
          title={t("orderInvoiceSettings.k_16")}
          description={t("orderInvoiceSettings.k_17")}
          accentClassName="bg-amber-50 text-warning ring-warning/70 dark:bg-warning/40 dark:text-warning"
          surfaceClassName="bg-white/90 dark:bg-muted"
        >
          <ToggleCard
            title={t("orderInvoiceSettings.k_18")}
            description={t("orderInvoiceSettings.k_19")}
            checked={invoice.autoEmailToCustomer}
            onCheckedChange={(checked) =>
              onUpdateInvoice({ autoEmailToCustomer: checked })
            }
          />

          <div className="space-y-2">
            <Label htmlFor="email-subject">
              {t("orderInvoiceSettings.k_20")}
            </Label>
            <Input
              id="email-subject"
              value={invoice.emailSubject}
              onChange={(e) =>
                onUpdateInvoice({ emailSubject: e.target.value })
              }
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-body">
              {t("orderInvoiceSettings.k_21")}
            </Label>
            <Textarea
              id="email-body"
              rows={5}
              value={invoice.emailBody}
              onChange={(e) =>
                onUpdateInvoice({ emailBody: e.target.value })
              }
              className="rounded-xl"
            />
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
