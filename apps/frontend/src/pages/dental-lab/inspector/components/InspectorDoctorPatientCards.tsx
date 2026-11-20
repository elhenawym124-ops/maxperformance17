import { Link } from "react-router-dom";
import { ExternalLink, Phone, Stethoscope, Users } from "lucide-react";
import { type DentalLabCase } from "../../shared";

interface InspectorDoctorPatientCardsProps {
  caseData: DentalLabCase;
}

export function InspectorDoctorPatientCards({
  caseData,
}: InspectorDoctorPatientCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {/* Doctor Card */}
      <div className="p-2.5 bg-white dark:bg-muted border border-border dark:border-border rounded-xl">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-1">
          <Stethoscope className="w-3.5 h-3.5" />
          <span>الطبيب والعيادة</span>
        </div>
        <p className="font-bold text-foreground dark:text-muted-foreground text-xs">
          {caseData.doctorName ? `د. ${caseData.doctorName}` : "—"}
        </p>
        {caseData.doctor?.clinicName && (
          <p className="text-[11px] text-muted-foreground dark:text-muted-foreground truncate">
            عيادة: {caseData.doctor.clinicName}
          </p>
        )}
        {caseData.doctorId && (
          <Link
            to={`/dental-lab/doctors/${caseData.doctorId}`}
            className="mt-1 inline-flex items-center gap-1 text-[10px] text-blue-500 hover:underline"
          >
            <span>كشف حساب الطبيب</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        )}
      </div>

      {/* Patient Card */}
      <div className="p-2.5 bg-white dark:bg-muted border border-border dark:border-border rounded-xl">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-foreground dark:text-muted-foreground mb-1">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span>المريض</span>
        </div>
        <p className="font-bold text-foreground dark:text-muted-foreground text-xs">
          {caseData.patientName || "—"}
        </p>
        {caseData.patientPhone ? (
          <a
            href={`tel:${caseData.patientPhone}`}
            className="inline-flex items-center gap-1 text-[11px] text-foreground dark:text-muted-foreground hover:text-blue-600 mt-0.5 font-mono tabular-nums"
            dir="ltr"
          >
            <Phone className="w-3 h-3 text-muted-foreground" />
            <span>{caseData.patientPhone}</span>
          </a>
        ) : (
          <p className="text-[11px] text-muted-foreground">—</p>
        )}
      </div>
    </div>
  );
}

export default InspectorDoctorPatientCards;
