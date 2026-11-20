import { Link } from "react-router-dom";
import { ExternalLink, X as XMarkIcon } from "lucide-react";
import { type DentalLabCase, PRIORITY_CONFIG } from "../../shared";

interface InspectorHeaderProps {
  caseData: DentalLabCase;
  onClose: () => void;
}

export function InspectorHeader({ caseData, onClose }: InspectorHeaderProps) {
  const priorityMeta = PRIORITY_CONFIG[caseData.priority] ?? {
    label: caseData.priority,
    color: "bg-gray-100 text-foreground dark:bg-muted dark:text-muted-foreground",
  };

  return (
    <div className="p-3.5 bg-muted dark:bg-muted border-b border-border dark:border-border flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2.5 h-2.5 rounded-full bg-primary dark:bg-primary shrink-0 animate-pulse" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="font-mono font-bold text-sm text-foreground dark:text-muted-foreground tracking-tight"
              dir="ltr"
            >
              {caseData.caseNumber || caseData.id.slice(0, 8)}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${priorityMeta.color}`}
            >
              {priorityMeta.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground dark:text-muted-foreground truncate">
            {caseData.patientName} • د. {caseData.doctorName || "غير محدد"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Link
          to={`/dental-lab/cases/${caseData.id}`}
          className="p-1.5 text-muted-foreground hover:text-primary dark:text-muted-foreground dark:hover:text-primary hover:bg-muted dark:hover:bg-muted rounded-lg transition-colors"
          title="فتح صفحة الحالة الكاملة"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground hover:bg-muted dark:hover:bg-muted rounded-lg transition-colors"
          title="إغلاق لوحة المعاينة"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default InspectorHeader;
