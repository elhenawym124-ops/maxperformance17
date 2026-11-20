import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Loader2,
  Printer,
  RefreshCcw,
  RotateCcw,
  Save,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface OrderInvoiceActionBarProps {
  saving: boolean;
  onRefresh: () => void;
  onResetInvoice: () => void;
  onSaveAll: () => void;
}

export function OrderInvoiceActionBar({
  saving,
  onRefresh,
  onResetInvoice,
  onSaveAll,
}: OrderInvoiceActionBarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4 rounded-[24px] border border-border bg-muted p-5 xl:flex-row xl:items-center xl:justify-between dark:border-border dark:bg-muted">
      <div className="grid gap-3 sm:grid-cols-3 xl:flex xl:flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="rounded-xl"
          onClick={() => navigate("/orders/invoices")}
        >
          <FileText className="size-4" />
          <span>سجل الفواتير</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="rounded-xl"
          onClick={() => navigate("/orders/invoices/print-multiple")}
        >
          <Printer className="size-4" />
          <span>طباعة متعددة</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="rounded-xl"
          onClick={() => navigate("/settings/orders?tab=preparation")}
        >
          <Workflow className="size-4" />
          <span>تجهيز الطلبات التشغيلي</span>
        </Button>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="rounded-xl"
          onClick={onRefresh}
          disabled={saving}
        >
          <RefreshCcw className="size-4" />
          <span>إعادة تحميل</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="rounded-xl border-warning bg-warning/10 text-warning hover:bg-warning hover:text-warning dark:border-warning dark:bg-warning/40 dark:text-warning"
          onClick={onResetInvoice}
          disabled={saving}
        >
          <RotateCcw className="size-4" />
          <span>إعادة الفاتورة</span>
        </Button>
        <Button
          type="button"
          size="lg"
          className="rounded-xl bg-muted text-white hover:bg-muted dark:bg-primary dark:hover:bg-primary"
          onClick={onSaveAll}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          <span>
            {saving
              ? t("orderInvoiceSettings.k_95")
              : t("orderInvoiceSettings.k_96")}
          </span>
        </Button>
      </div>
    </div>
  );
}
