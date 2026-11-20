import { Layers } from "lucide-react";
import { type DentalLabCase } from "../../shared";

interface InspectorTechnicalSpecsProps {
  caseData: DentalLabCase;
}

export function InspectorTechnicalSpecs({
  caseData,
}: InspectorTechnicalSpecsProps) {
  return (
    <div className="p-3 bg-white dark:bg-muted border border-border dark:border-border rounded-xl space-y-2.5">
      <div className="flex items-center justify-between border-b border-border dark:border-border pb-2">
        <span className="font-bold text-foreground dark:text-muted-foreground flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-primary" />
          <span>مواصفات التركيبة / الشغل</span>
        </span>
        <span className="font-semibold text-primary dark:text-primary bg-primary/10 dark:bg-primary/40 px-2 py-0.5 rounded-md text-[11px]">
          {caseData.workTypeName || "نوع الشغل غير محدد"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <span className="text-slate-400 block text-[10px]">الأسنان والوحدات:</span>
          <span className="font-bold text-foreground dark:text-muted-foreground">
            {caseData.teeth
              ? `الأسنان: ${caseData.teeth}`
              : `${caseData.unitsCount || 1} وحدة`}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[10px]">اللون (Shade):</span>
          <span className="font-bold text-foreground dark:text-muted-foreground">
            {caseData.shade || "غير محدد"}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[10px]">الخامة / المادة:</span>
          <span className="font-bold text-foreground dark:text-muted-foreground">
            {caseData.material || "غير محدد"}
            {caseData.materialBrand ? ` (${caseData.materialBrand})` : ""}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[10px]">فترة الضمان:</span>
          <span className="font-bold text-foreground dark:text-muted-foreground">
            {caseData.warrantyYears
              ? `${caseData.warrantyYears} سنوات`
              : "بدون ضمان"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default InspectorTechnicalSpecs;
