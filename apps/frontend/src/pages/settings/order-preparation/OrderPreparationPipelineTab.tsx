import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  PIPELINE_STAGES,
  type PreparationSettingsState,
  type StatusOption,
  type WarehouseOption,
} from "./types";

export interface OrderPreparationPipelineTabProps {
  startingStatus: string;
  handoffStatus: string;
  defaultWarehouseId: string;
  preparationStatuses: StatusOption[];
  handoffStatuses: StatusOption[];
  warehouses: WarehouseOption[];
  onUpdateSetting: <K extends keyof PreparationSettingsState>(
    key: K,
    value: PreparationSettingsState[K],
  ) => void;
}

export const OrderPreparationPipelineTab: React.FC<OrderPreparationPipelineTabProps> = ({
  startingStatus,
  handoffStatus,
  defaultWarehouseId,
  preparationStatuses,
  handoffStatuses,
  warehouses,
  onUpdateSetting,
}) => {
  return (
    <div className="space-y-6">
      {/* Pipeline Stages Card */}
      <Card className="border-slate-200/80 bg-white dark:border-border dark:bg-muted">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground dark:text-white">
            مسار التجهيز
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-muted-foreground">
            المراحل التي يمر بها الطلب من التأكيد حتى التسليم لشركة الشحن
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Visual Stages Flow */}
          <div className="mb-8 flex flex-wrap items-center gap-2">
            {PIPELINE_STAGES.map((stage, idx) => (
              <React.Fragment key={stage.key}>
                <div
                  className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold sm:text-sm ${stage.color}`}
                >
                  {stage.label}
                </div>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <div className="text-slate-300 dark:text-foreground">
                    <svg
                      className="h-4 w-4 rtl:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <Separator className="my-6 border-border dark:border-border" />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground dark:text-muted-foreground">
                أول مرحلة
              </Label>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                الحالة التي يبدأ منها الطلب عندما يدخل صفحة التجهيز
              </p>
              <Select
                value={startingStatus}
                onValueChange={(v) => onUpdateSetting("startingStatus", v)}
              >
                <SelectTrigger className="border-slate-200 dark:border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {preparationStatuses.map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground dark:text-muted-foreground">
                حالة التسليم للشحن
              </Label>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                الحالة التي عندما يصل إليها الطلب يصبح جاهزاً للتسليم لشركة الشحن
              </p>
              <Select
                value={handoffStatus}
                onValueChange={(v) => onUpdateSetting("handoffStatus", v)}
              >
                <SelectTrigger className="border-slate-200 dark:border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {handoffStatuses.map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warehouse Assignment Card */}
      <Card className="border-slate-200/80 bg-white dark:border-border dark:bg-muted">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground dark:text-white">
            المخزن
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-muted-foreground">
            إعدادات المخزن الافتراضي لصفحة التجهيز
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground dark:text-muted-foreground">
                المخزن الافتراضي
              </Label>
              <Select
                value={defaultWarehouseId}
                onValueChange={(v) => onUpdateSetting("defaultWarehouseId", v)}
              >
                <SelectTrigger className="border-slate-200 dark:border-border">
                  <SelectValue placeholder="بدون مخزن افتراضي" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">بدون مخزن افتراضي</SelectItem>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
