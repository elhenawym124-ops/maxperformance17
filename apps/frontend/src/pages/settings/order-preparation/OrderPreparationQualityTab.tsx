import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleRow } from "./ToggleRow";
import type { PreparationQcChecks, PreparationSettingsState } from "./types";

export interface OrderPreparationQualityTabProps {
  settings: PreparationSettingsState;
  onUpdateSetting: <K extends keyof PreparationSettingsState>(
    key: K,
    value: PreparationSettingsState[K],
  ) => void;
  onUpdateQcCheck: (key: keyof PreparationQcChecks, value: boolean) => void;
}

const QC_ITEMS: Array<{ key: keyof PreparationQcChecks; label: string }> = [
  { key: "quantity", label: "مراجعة الكمية" },
  { key: "variant", label: "مراجعة المقاس / اللون" },
  { key: "packaging", label: "سلامة التغليف" },
  { key: "accessories", label: "الملحقات والإكسسوارات" },
  { key: "invoiceSlip", label: "إرفاق الورقة الداخلية" },
];

export const OrderPreparationQualityTab: React.FC<OrderPreparationQualityTabProps> = ({
  settings,
  onUpdateSetting,
  onUpdateQcCheck,
}) => {
  return (
    <div className="space-y-6">
      {/* Stock Policies Card */}
      <Card className="border-slate-200/80 bg-white dark:border-border dark:bg-muted">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground dark:text-white">
            سياسات المخزون
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-muted-foreground">
            كيف يتعامل النظام مع توفر المنتجات والتحويل بين المخازن
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ToggleRow
            title="حجز المخزون تلقائيًا"
            description="عند بدء التجهيز يتم اعتبار الكميات مرتبطة بالطلب لتقليل التضارب"
            checked={settings.autoReserveStock}
            onChange={(v) => onUpdateSetting("autoReserveStock", v)}
          />
          <ToggleRow
            title="اشتراط توفر المخزون قبل بدء التجهيز"
            description="منع التحريك إلى قيد التجهيز إذا كانت المنتجات غير مكتملة"
            checked={settings.requireStockBeforePreparing}
            onChange={(v) => onUpdateSetting("requireStockBeforePreparing", v)}
          />
          <ToggleRow
            title="السماح بالتجهيز الجزئي"
            description="تمكين تجهيز الأجزاء المتاحة من الطلب حتى مع وجود نواقص"
            checked={settings.allowPartialPreparation}
            onChange={(v) => onUpdateSetting("allowPartialPreparation", v)}
          />
          <ToggleRow
            title="السماح بالتحويل بين المخازن"
            description="إبراز خيار النقل من مخزن آخر عند وجود عجز في الكمية"
            checked={settings.allowCrossWarehouseTransfer}
            onChange={(v) => onUpdateSetting("allowCrossWarehouseTransfer", v)}
          />
          <ToggleRow
            title="إعطاء أولوية للطلبات التي بها نقص"
            description="تمييز الطلبات المتعثرة في الواجهة حتى يراجعها فريق المخزن أولًا"
            checked={settings.prioritizeShortageOrders}
            onChange={(v) => onUpdateSetting("prioritizeShortageOrders", v)}
          />
        </CardContent>
      </Card>

      {/* QC Checklist Card */}
      <Card className="border-slate-200/80 bg-white dark:border-border dark:bg-muted">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground dark:text-white">
            فحص الجودة
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-muted-foreground">
            متى يتم تفعيل مراجعة الجودة، وما هي العناصر الإلزامية قبل التغليف
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow
            title="تفعيل قائمة فحص الجودة"
            description="إضافة خطوة QA قبل إنهاء التجهيز وتحويل الطلب للتغليف"
            checked={settings.enableQcChecklist}
            onChange={(v) => onUpdateSetting("enableQcChecklist", v)}
          />

          {settings.enableQcChecklist && (
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted p-4 dark:border-border dark:bg-muted md:grid-cols-3">
              {QC_ITEMS.map((item) => (
                <label
                  key={item.key}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-white px-3 py-2.5 text-sm transition hover:bg-muted dark:border-border dark:bg-muted dark:hover:bg-muted"
                >
                  <Switch
                    checked={settings.qcChecks[item.key]}
                    onCheckedChange={(v) => onUpdateQcCheck(item.key, v)}
                  />
                  <span className="text-xs font-semibold text-foreground dark:text-muted-foreground">
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions Policies Card */}
      <Card className="border-slate-200/80 bg-white dark:border-border dark:bg-muted">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground dark:text-white">
            الإجراءات الجماعية
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-muted-foreground">
            تحديد ما الذي يمكن لفريق المخزن تنفيذه دفعة واحدة من الصفحة التشغيلية
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ToggleRow
            title="تحديث المرحلة جماعيًا"
            description="السماح بتحريك أكثر من طلب لمرحلة واحدة في نفس الوقت"
            checked={settings.enableBulkStatusUpdate}
            onChange={(v) => onUpdateSetting("enableBulkStatusUpdate", v)}
          />
          <ToggleRow
            title="تعيين مخزن جماعيًا"
            description="إتاحة تعيين مخزن افتراضي لمجموعة طلبات من نفس الصفحة"
            checked={settings.enableBulkWarehouseAssignment}
            onChange={(v) => onUpdateSetting("enableBulkWarehouseAssignment", v)}
          />
          <ToggleRow
            title="حجز المخزون جماعيًا"
            description="إتاحة تنفيذ reserve لعدة طلبات مرة واحدة"
            checked={settings.enableBulkReserve}
            onChange={(v) => onUpdateSetting("enableBulkReserve", v)}
          />
        </CardContent>
      </Card>

      {/* Notifications & SLAs Card */}
      <Card className="border-slate-200/80 bg-white dark:border-border dark:bg-muted">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground dark:text-white">
            الإشعارات ومؤشرات التأخير
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-muted-foreground">
            تنبيهات العميل والفريق، والحدود الزمنية لمراقبة بطء التنفيذ داخل المخزن
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ToggleRow
            title="إشعار عند بدء التجهيز"
            description="يمكن استخدامه لاحقاً مع رسائل الواتساب أو الإشعارات الداخلية"
            checked={settings.notifyOnPreparing}
            onChange={(v) => onUpdateSetting("notifyOnPreparing", v)}
          />
          <ToggleRow
            title="إشعار عند اكتمال التغليف"
            description="مفيد لإخطار الفريق بأن الطلب أصبح جاهزاً لخطوة ما قبل الشحن"
            checked={settings.notifyOnPackaged}
            onChange={(v) => onUpdateSetting("notifyOnPackaged", v)}
          />
          <ToggleRow
            title="إشعار عند الجاهزية للشحن"
            description="تجهيز الطلبات التي يمكن تسليمها لشركة الشحن فوراً"
            checked={settings.notifyOnReadyToShip}
            onChange={(v) => onUpdateSetting("notifyOnReadyToShip", v)}
          />

          <Separator className="my-2 border-border dark:border-border" />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground dark:text-muted-foreground">
                SLA التجهيز (ساعة)
              </Label>
              <Input
                type="number"
                min={1}
                value={settings.preparingSlaHours}
                onChange={(e) => onUpdateSetting("preparingSlaHours", Number(e.target.value))}
                className="font-mono tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground dark:text-muted-foreground">
                SLA التغليف (ساعة)
              </Label>
              <Input
                type="number"
                min={1}
                value={settings.packingSlaHours}
                onChange={(e) => onUpdateSetting("packingSlaHours", Number(e.target.value))}
                className="font-mono tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground dark:text-muted-foreground">
                SLA التسليم للشحن (ساعة)
              </Label>
              <Input
                type="number"
                min={1}
                value={settings.handoffSlaHours}
                onChange={(e) => onUpdateSetting("handoffSlaHours", Number(e.target.value))}
                className="font-mono tabular-nums"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
