import React from "react";
import { CubeIcon } from "@heroicons/react/24/outline";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface OrderPreparationHeaderProps {
  enabled: boolean;
  defaultWarehouseName: string;
}

export const OrderPreparationHeader: React.FC<OrderPreparationHeaderProps> = ({
  enabled,
  defaultWarehouseName,
}) => {
  return (
    <Card className="border-slate-200/80 bg-white dark:border-border dark:bg-muted">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-warning bg-warning/10 px-3 py-1 text-xs font-semibold text-warning dark:border-warning/60 dark:bg-warning/40 dark:text-warning">
            <CubeIcon className="h-4 w-4" />
            <span>Fulfillment Settings</span>
          </div>
          <CardTitle className="mt-3 text-2xl font-bold text-foreground dark:text-white">
            إعدادات تجهيز الطلبات
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-muted-foreground">
            تحكم في قواعد تشغيل صفحة التجهيز، سياسات المخزون، فحص الجودة، والإجراءات الجماعية الخاصة بالمخزن.
          </CardDescription>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant={enabled ? "default" : "secondary"}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                enabled ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
              }`}
            />
            <span>{enabled ? "المسار مفعل" : "المسار متوقف"}</span>
          </Badge>
          <span className="text-xs text-muted-foreground dark:text-muted-foreground">
            {defaultWarehouseName}
          </span>
        </div>
      </CardHeader>
    </Card>
  );
};
