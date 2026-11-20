import { FileText, Package, Plus, Trash2 } from "lucide-react";
import DentalCaseCard from "./DentalCaseCard";
import {
  fmtDate,
  fmtDateTime,
  type DentalCaseMaterialUsage,
} from "../../shared";

interface DentalCaseMaterialsCardProps {
  materialUsages: DentalCaseMaterialUsage[];
  isDeleted?: boolean;
  materialBusy: boolean;
  onOpenConsume: () => void;
  onDeleteUsage: (usageId: string) => void;
}

export default function DentalCaseMaterialsCard({
  materialUsages,
  isDeleted,
  materialBusy,
  onOpenConsume,
  onDeleteUsage,
}: DentalCaseMaterialsCardProps) {
  return (
    <DentalCaseCard
      title="الخامات المستخدمة وتتبع التشغيلة (Materials & Lot Traceability)"
      icon={<Package className="w-5 h-5" />}
      action={
        !isDeleted ? (
          <button
            type="button"
            onClick={onOpenConsume}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs hover:bg-primary shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            تسجيل استهلاك خام
          </button>
        ) : null
      }
    >
      {materialUsages.length === 0 ? (
        <div className="text-center py-5 text-muted-foreground/80 text-xs">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
          لم يتم تسجيل استهلاك خامات أو ربط قرص تفريز / تشغيلة بهذه الحالة حتى الآن.
        </div>
      ) : (
        <div className="space-y-2.5">
          {materialUsages.map((usage) => (
            <div
              key={usage.id}
              className="border dark:border-border rounded-xl p-3 bg-muted dark:bg-muted flex items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-foreground text-sm">
                    {usage.material?.name || "مادة خام"}
                  </span>
                  {usage.material?.category && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary border border-primary dark:border-primary font-semibold">
                      {usage.material.category}
                    </span>
                  )}
                  {usage.material?.shade && (
                    <span className="px-1.5 py-0.5 rounded bg-warning/10 dark:bg-warning/30 text-warning dark:text-warning font-mono text-[10px]">
                      {usage.material.shade}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-muted-foreground text-[11px] flex-wrap">
                  <span>
                    الكمية:{" "}
                    <strong className="text-gray-800 dark:text-muted-foreground font-semibold font-mono tabular-nums">
                      {usage.unitsUsed} {usage.material?.unit || "وحدة"}
                    </strong>
                  </span>
                  {usage.lotNumber && (
                    <span>
                      رقم التشغيلة (Lot #):{" "}
                      <code className="bg-gray-200 dark:bg-muted px-1 py-0.5 rounded font-mono text-foreground dark:text-muted-foreground font-bold tabular-nums">
                        {usage.lotNumber}
                      </code>
                    </span>
                  )}
                  {usage.materialStock?.expiryDate && (
                    <span className="font-mono tabular-nums">
                      انتهاء: {fmtDate(usage.materialStock.expiryDate)}
                    </span>
                  )}
                  {usage.consumedByName && <span>بواسطة: {usage.consumedByName}</span>}
                  <span className="font-mono tabular-nums">{fmtDateTime(usage.consumedAt)}</span>
                </div>
                {usage.notes && (
                  <p className="text-muted-foreground text-[11px] mt-0.5 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span>{usage.notes}</span>
                  </p>
                )}
              </div>
              {!isDeleted && (
                <button
                  type="button"
                  onClick={() => onDeleteUsage(usage.id)}
                  disabled={materialBusy}
                  className="p-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/40 rounded-lg transition disabled:opacity-50"
                  title="إلغاء الاستهلاك واسترجاع الرصيد للمخزن"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </DentalCaseCard>
  );
}
