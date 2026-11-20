import { FilterX, X as XMarkIcon } from "lucide-react";
import type { DentalLabDoctor, DentalTechnician, DentalWorkType } from "../../shared";
import { CASE_STATUSES } from "../../shared";
import { DateInput } from '../../../../components/ui/DateInput';

export interface DentalCasesDropdownsProps {
  viewMode: "ACTIVE" | "OVERDUE" | "TRASH";
  status: string;
  doctorId: string;
  workTypeId: string;
  priority: string;
  paymentStatus: string;
  technicianId: string;
  dateRangePreset: string;
  agendaDate: string;
  agendaField: "receivedDate" | "dueDate";
  activeFiltersCount: number;
  doctors: DentalLabDoctor[];
  workTypes: DentalWorkType[];
  technicians: DentalTechnician[];
  applyFilter: (key: string, value: string, resetOthers?: boolean) => void;
  clearAllFilters: () => void;
  setAgendaDate: (val: string) => void;
  setAgendaField: (field: "receivedDate" | "dueDate") => void;
  setDateRangePreset: (val: string) => void;
  setPage: (p: number | ((prev: number) => number)) => void;
}

export function DentalCasesDropdowns({
  viewMode,
  status,
  doctorId,
  workTypeId,
  priority,
  paymentStatus,
  technicianId,
  dateRangePreset,
  agendaDate,
  agendaField,
  activeFiltersCount,
  doctors,
  workTypes,
  technicians,
  applyFilter,
  clearAllFilters,
  setAgendaDate,
  setAgendaField,
  setDateRangePreset,
  setPage,
}: DentalCasesDropdownsProps) {
  const safeDoctors = Array.isArray(doctors)
    ? doctors
    : Array.isArray((doctors as any)?.items)
      ? (doctors as any).items
      : [];
  const safeWorkTypes = Array.isArray(workTypes)
    ? workTypes
    : Array.isArray((workTypes as any)?.items)
      ? (workTypes as any).items
      : [];
  const safeTechnicians = Array.isArray(technicians)
    ? technicians
    : Array.isArray((technicians as any)?.items)
      ? (technicians as any).items
      : [];

  const todayStr = new Date().toLocaleDateString("en-CA");
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toLocaleDateString("en-CA");

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-t border-border dark:border-border pt-2 text-xs">
      {viewMode !== "TRASH" && (
        <select
          className="bg-slate-50 dark:bg-muted border border-border dark:border-border rounded-lg px-2 py-1 text-xs text-foreground dark:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary hover:bg-white"
          value={status}
          onChange={(e) => {
            applyFilter("status", e.target.value);
            setPage(1);
          }}
          title="فلترة بحالة المرحلة"
        >
          <option value="">كل الحالات</option>
          {CASE_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      )}

      <select
        className="bg-slate-50 dark:bg-muted border border-border dark:border-border rounded-lg px-2 py-1 text-xs text-foreground dark:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary hover:bg-white max-w-[150px]"
        value={doctorId}
        onChange={(e) => {
          applyFilter("doctorId", e.target.value);
          setPage(1);
        }}
        title="فلترة بالطبيب أو العيادة"
      >
        <option value="">كل الدكاترة</option>
        {safeDoctors
          .filter((d) => d && d.isActive)
          .map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} {d.clinicName ? `(${d.clinicName})` : ""}
            </option>
          ))}
      </select>

      <select
        className="bg-slate-50 dark:bg-muted border border-border dark:border-border rounded-lg px-2 py-1 text-xs text-foreground dark:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary hover:bg-white max-w-[140px]"
        value={workTypeId}
        onChange={(e) => {
          applyFilter("workTypeId", e.target.value);
          setPage(1);
        }}
        title="فلترة بنوع الشغل"
      >
        <option value="">كل أنواع الشغل</option>
        {safeWorkTypes.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>

      <select
        className="bg-slate-50 dark:bg-muted border border-border dark:border-border rounded-lg px-2 py-1 text-xs text-foreground dark:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary hover:bg-white"
        value={priority}
        onChange={(e) => {
          applyFilter("priority", e.target.value);
          setPage(1);
        }}
        title="فلترة بدرجة الأولوية"
      >
        <option value="">كل الأولويات</option>
        <option value="NORMAL">عادي</option>
        <option value="URGENT">مستعجل</option>
        <option value="STAT">طارئ فوري</option>
      </select>

      <select
        className="bg-slate-50 dark:bg-muted border border-border dark:border-border rounded-lg px-2 py-1 text-xs text-foreground dark:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary hover:bg-white max-w-[130px]"
        value={technicianId}
        onChange={(e) => {
          applyFilter("technicianId", e.target.value);
          setPage(1);
        }}
        title="فلترة بالفني المسند"
      >
        <option value="">كل الفنيين</option>
        {safeTechnicians
          .filter((t) => t && (t.isActive ?? (t as any).active))
          .map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
      </select>

      <select
        className="bg-slate-50 dark:bg-muted border border-border dark:border-border rounded-lg px-2 py-1 text-xs text-foreground dark:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary hover:bg-white"
        value={paymentStatus}
        onChange={(e) => {
          applyFilter("paymentStatus", e.target.value);
          setPage(1);
        }}
        title="فلترة بحالة السداد"
      >
        <option value="">كل حالات السداد</option>
        <option value="UNPAID">غير مسدد</option>
        <option value="PARTIAL">مسدد جزئياً</option>
        <option value="PAID">مسدد بالكامل</option>
      </select>

      {/* Agenda Date Range & Shortcuts */}
      <div className="flex items-center gap-1 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg px-2 py-0.5 text-xs">
        <span className="text-slate-400 font-medium text-[11px]">الأجندة:</span>
        <select
          className="bg-transparent text-xs text-foreground dark:text-muted-foreground focus:outline-none cursor-pointer"
          value={agendaField}
          onChange={(e) => {
            setAgendaField(e.target.value as "receivedDate" | "dueDate");
            setPage(1);
          }}
        >
          <option value="receivedDate">تاريخ الدخول</option>
          <option value="dueDate">تاريخ التسليم</option>
        </select>
        <DateInput
          className="bg-transparent text-xs text-foreground dark:text-muted-foreground focus:outline-none w-[110px] font-mono"
          value={agendaDate}
          onChange={(e) => {
            const val = e.target.value;
            setAgendaDate(val);
            setPage(1);
          }}
        />
        {agendaDate && (
          <button
            type="button"
            onClick={() => {
              setAgendaDate("");
              setDateRangePreset("ALL");
              setPage(1);
            }}
            className="text-slate-400 hover:text-foreground"
            title="مسح التاريخ"
            aria-label="مسح التاريخ"
          >
            <XMarkIcon className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="flex items-center bg-muted dark:bg-muted p-0.5 rounded-lg text-[11px]">
        <button
          type="button"
          onClick={() => {
            setAgendaDate(yesterdayStr);
            setPage(1);
          }}
          className={`px-2 py-0.5 rounded transition-colors ${
            agendaDate === yesterdayStr
              ? "bg-card font-bold shadow-2xs text-primary"
              : "text-slate-600 dark:text-muted-foreground hover:text-foreground"
          }`}
        >
          أمس
        </button>
        <button
          type="button"
          onClick={() => {
            setAgendaDate(todayStr);
            setPage(1);
          }}
          className={`px-2 py-0.5 rounded transition-colors ${
            agendaDate === todayStr
              ? "bg-card font-bold shadow-2xs text-primary"
              : "text-slate-600 dark:text-muted-foreground hover:text-foreground"
          }`}
        >
          اليوم
        </button>
        {(agendaDate || (dateRangePreset && dateRangePreset !== "ALL")) && (
          <button
            type="button"
            onClick={() => {
              setAgendaDate("");
              setDateRangePreset("ALL");
              setPage(1);
            }}
            className="px-2 py-0.5 rounded text-muted-foreground hover:text-foreground"
          >
            كل المواعيد
          </button>
        )}
      </div>

      {activeFiltersCount > 0 && (
        <button
          type="button"
          onClick={clearAllFilters}
          className="text-rose-600 dark:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/40 font-bold text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg border border-destructive dark:border-destructive transition-colors me-auto"
          title="إلغاء كل الفلاتر وإعادة ضبط الجدول"
        >
          <FilterX className="w-3.5 h-3.5" />
          <span>إلغاء كل الفلاتر ({activeFiltersCount})</span>
        </button>
      )}
    </div>
  );
}

export default DentalCasesDropdowns;
