import {
  AlertTriangle,
  Clock,
  ExternalLink,
  Flame,
  Layers,
  PackageCheck,
  Zap,
} from "lucide-react";

export interface DentalCasesQuickPillsProps {
  viewMode: "ACTIVE" | "OVERDUE" | "TRASH";
  onViewModeChange: (mode: "ACTIVE" | "OVERDUE" | "TRASH") => void;
  priority: string;
  setPriority: (val: string) => void;
  dateRangePreset: string;
  setDateRangePreset: (val: string) => void;
  technicianId: string;
  setTechnicianId: (val: string) => void;
  status: string;
  setStatus: (val: string) => void;
  agendaDate: string;
  setAgendaDate: (val: string) => void;
  doctorId: string;
  workTypeId: string;
  paymentStatus: string;
  applyFilter: (key: string, value: string, resetOthers?: boolean) => void;
  clearAllFilters?: () => void;
  setPage: (p: number | ((prev: number) => number)) => void;
}

export function DentalCasesQuickPills({
  viewMode,
  onViewModeChange,
  priority,
  setPriority,
  dateRangePreset,
  setDateRangePreset,
  technicianId,
  setTechnicianId,
  status,
  setStatus,
  agendaDate,
  setAgendaDate,
  doctorId,
  workTypeId,
  paymentStatus,
  applyFilter,
  clearAllFilters,
  setPage,
}: DentalCasesQuickPillsProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs border-t border-border dark:border-border pt-2">
      <span className="text-slate-400 font-semibold flex items-center gap-1 shrink-0 text-[11px]">
        <Layers className="w-3 h-3 text-muted-foreground" /> فلاتر سريعة:
      </span>
      <button
        type="button"
        onClick={() => {
          if (clearAllFilters) {
            clearAllFilters();
          } else {
            onViewModeChange("ACTIVE");
            setPriority("");
            setDateRangePreset("ALL");
            setTechnicianId("");
            setStatus("");
            setAgendaDate("");
            applyFilter("doctorId", "");
            applyFilter("workTypeId", "");
            applyFilter("paymentStatus", "");
            setPage(1);
          }
        }}
        className={`px-2.5 py-0.5 rounded-full font-medium transition-all shrink-0 text-xs ${
          viewMode === "ACTIVE" &&
          !priority &&
          (!dateRangePreset || dateRangePreset === "ALL") &&
          !technicianId &&
          !status &&
          !agendaDate &&
          !doctorId &&
          !workTypeId &&
          !paymentStatus
            ? "bg-blue-600 text-white shadow-2xs"
            : "bg-slate-100 dark:bg-muted text-foreground dark:text-muted-foreground hover:bg-muted"
        }`}
      >
        الكل
      </button>
      <button
        type="button"
        onClick={() => {
          onViewModeChange("ACTIVE");
          setDateRangePreset(dateRangePreset === "received_today" ? "ALL" : "received_today");
        }}
        className={`px-2.5 py-0.5 rounded-full font-medium transition-all shrink-0 flex items-center gap-1 text-xs ${
          dateRangePreset === "received_today"
            ? "bg-blue-600 text-white shadow-2xs"
            : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200/80 dark:border-blue-900"
        }`}
      >
        <PackageCheck className="w-3 h-3 text-blue-500" />
        <span>وارد اليوم</span>
      </button>
      <button
        type="button"
        onClick={() => {
          if (viewMode !== "OVERDUE") {
            setDateRangePreset("ALL");
            onViewModeChange("OVERDUE");
          } else {
            onViewModeChange("ACTIVE");
          }
        }}
        className={`px-2.5 py-0.5 rounded-full font-medium transition-all shrink-0 flex items-center gap-1 text-xs ${
          viewMode === "OVERDUE"
            ? "bg-rose-600 text-white shadow-2xs"
            : "bg-rose-50 dark:bg-destructive/40 text-destructive dark:text-destructive hover:bg-destructive border border-destructive/80 dark:border-destructive"
        }`}
      >
        <Flame className="w-3 h-3 text-destructive" />
        <span>متأخرة عن موعدها</span>
      </button>
      <button
        type="button"
        onClick={() => {
          onViewModeChange("ACTIVE");
          setDateRangePreset(dateRangePreset === "today" ? "ALL" : "today");
        }}
        className={`px-2.5 py-0.5 rounded-full font-medium transition-all shrink-0 flex items-center gap-1 text-xs ${
          dateRangePreset === "today"
            ? "bg-amber-600 text-white shadow-2xs"
            : "bg-amber-50 dark:bg-warning/40 text-warning dark:text-warning hover:bg-warning border border-warning/80 dark:border-warning"
        }`}
      >
        <Clock className="w-3 h-3 text-warning" />
        <span>تسليم اليوم</span>
      </button>
      <button
        type="button"
        onClick={() => {
          setPriority(priority === "URGENT" ? "" : "URGENT");
        }}
        className={`px-2.5 py-0.5 rounded-full font-medium transition-all shrink-0 flex items-center gap-1 text-xs ${
          priority === "URGENT"
            ? "bg-purple-600 text-white shadow-2xs"
            : "bg-purple-50 dark:bg-primary/40 text-primary dark:text-primary hover:bg-primary border border-primary/80 dark:border-primary"
        }`}
      >
        <Zap className="w-3 h-3 text-primary" />
        <span>مستعجل</span>
      </button>
      <button
        type="button"
        onClick={() => {
          setPriority(priority === "STAT" ? "" : "STAT");
        }}
        className={`px-2.5 py-0.5 rounded-full font-medium transition-all shrink-0 flex items-center gap-1 text-xs ${
          priority === "STAT"
            ? "bg-red-600 text-white shadow-2xs"
            : "bg-red-50 dark:bg-destructive/40 text-destructive dark:text-destructive hover:bg-destructive border border-destructive/80 dark:border-destructive"
        }`}
      >
        <AlertTriangle className="w-3 h-3 text-destructive" />
        <span>طارئ فوري</span>
      </button>
      <button
        type="button"
        onClick={() => {
          setStatus(status === "OUTSOURCED" ? "" : "OUTSOURCED");
        }}
        className={`px-2.5 py-0.5 rounded-full font-medium transition-all shrink-0 flex items-center gap-1 text-xs ${
          status === "OUTSOURCED"
            ? "bg-amber-600 text-white shadow-2xs"
            : "bg-amber-50 dark:bg-warning/40 text-warning dark:text-warning hover:bg-warning border border-warning/80 dark:border-warning"
        }`}
      >
        <ExternalLink className="w-3 h-3 text-warning" />
        <span>بره المعمل (خارجي)</span>
      </button>
    </div>
  );
}

export default DentalCasesQuickPills;
