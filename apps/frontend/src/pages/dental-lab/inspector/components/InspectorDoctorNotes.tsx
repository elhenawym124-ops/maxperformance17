import { type DentalLabCase } from "../../shared";

interface InspectorDoctorNotesProps {
  caseData: DentalLabCase;
}

export function InspectorDoctorNotes({ caseData }: InspectorDoctorNotesProps) {
  if (!caseData.notes) return null;

  return (
    <div className="p-3 bg-warning/40 dark:bg-warning/20 border border-warning/80 dark:border-warning/40 rounded-xl space-y-1">
      <span className="font-bold text-warning dark:text-warning block text-[11px]">
        ملاحظات وتعليمات الطبيب:
      </span>
      <p className="text-slate-700 dark:text-muted-foreground leading-relaxed whitespace-pre-wrap text-[11px]">
        {caseData.notes}
      </p>
    </div>
  );
}

export default InspectorDoctorNotes;
