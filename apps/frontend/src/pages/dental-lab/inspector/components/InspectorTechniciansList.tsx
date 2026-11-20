import { User, Users } from "lucide-react";
import { type DentalLabCase, ROLE_CONFIG } from "../../shared";

interface InspectorTechniciansListProps {
  caseData: DentalLabCase;
  onAssign: (c: DentalLabCase) => void;
}

export function InspectorTechniciansList({
  caseData,
  onAssign,
}: InspectorTechniciansListProps) {
  return (
    <div className="p-3 bg-white dark:bg-muted border border-border dark:border-border rounded-xl space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-foreground dark:text-muted-foreground flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-primary" />
          <span>الفنيون المسندون</span>
        </span>
        <button
          type="button"
          onClick={() => onAssign(caseData)}
          className="text-[10px] font-bold text-primary dark:text-primary hover:underline"
        >
          + إضافة فني
        </button>
      </div>

      {caseData.assignments && caseData.assignments.length > 0 ? (
        <div className="space-y-1.5">
          {caseData.assignments.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between p-2 rounded-lg bg-muted dark:bg-muted border border-border dark:border-border"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary dark:bg-primary/50 text-primary dark:text-primary font-bold flex items-center justify-center text-[10px]">
                  <User className="w-3.5 h-3.5" />
                </span>
                <div>
                  <p className="font-bold text-foreground dark:text-muted-foreground text-xs">
                    {a.technician?.name || a.technicianId}
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {ROLE_CONFIG[a.role]?.label || a.role}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-2.5 rounded-lg border border-dashed border-border dark:border-border text-center text-muted-foreground text-[11px]">
          لم يتم إسناد أي فني على هذه الحالة بعد
        </div>
      )}
    </div>
  );
}

export default InspectorTechniciansList;
