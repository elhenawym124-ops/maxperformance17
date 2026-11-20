import React from "react";
import { Link } from "react-router-dom";
import {
  ExternalLink,
  Flame,
  Layers,
  Stethoscope,
  UserPlus,
} from "lucide-react";
import type { DentalLabCase } from "../../../../shared";
import {
  CASE_STATUS_MAP,
  fmtDate,
  PRIORITY_CONFIG,
} from "../../../../shared";
import { statusBadge } from "../../../types/dentalCasesTypes";
import { DentalCasesKanbanCardActions } from "./DentalCasesKanbanCardActions";

export interface DentalCasesKanbanCardProps {
  dentalCase: DentalLabCase;
  isSelected: boolean;
  isOverdue: boolean;
  daysOverdue: number;
  toggleSelect: (id: string) => void;
  applyFilter: (key: string, value: string, resetOthers?: boolean) => void;
  onAdvanceCase: (c: DentalLabCase) => void;
  onAssignCase: (c: DentalLabCase) => void;
  onPrintPanLabel: (c: DentalLabCase) => void;
  onEditCase: (c: DentalLabCase) => void;
}

export const DentalCasesKanbanCard: React.FC<DentalCasesKanbanCardProps> = ({
  dentalCase,
  isSelected,
  isOverdue,
  daysOverdue,
  toggleSelect,
  applyFilter,
  onAdvanceCase,
  onAssignCase,
  onPrintPanLabel,
  onEditCase,
}) => {
  return (
    <div
      className={`p-3.5 rounded-xl bg-white dark:bg-muted border shadow-xs hover:shadow-md transition-all flex flex-col gap-2.5 ${
        isSelected
          ? "ring-2 ring-primary border-primary dark:border-primary"
          : isOverdue
          ? "border-rose-300 dark:border-destructive/80 bg-destructive/20"
          : "border-gray-200 dark:border-border"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
            checked={isSelected}
            onChange={() => toggleSelect(dentalCase.id)}
            aria-label={`تحديد حالة ${dentalCase.caseNumber || dentalCase.id}`}
          />
          <Link
            to={`/dental-lab/cases/${dentalCase.id}`}
            className="font-mono font-bold text-xs text-primary dark:text-primary hover:underline flex items-center gap-1"
            title="فتح تفاصيل الأوردر"
          >
            <span>{dentalCase.caseNumber || dentalCase.id.slice(0, 8)}</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </Link>
        </div>
        <Link
          to={`/dental-lab/cases?status=${dentalCase.status}`}
          onClick={(e) => {
            e.stopPropagation();
            applyFilter("status", dentalCase.status, true);
          }}
          title={`عرض كل حالات مرحلة: ${
            CASE_STATUS_MAP[dentalCase.status]?.label || dentalCase.status
          } فقط`}
        >
          {statusBadge(PRIORITY_CONFIG, dentalCase.priority)}
        </Link>
      </div>

      <div>
        <div className="text-xs font-bold text-foreground truncate">
          {dentalCase.patientName}
        </div>
        {dentalCase.doctorName ? (
          <div className="flex items-center gap-1 group/doc mt-0.5">
            <Link
              to={
                dentalCase.doctorId
                  ? `/dental-lab/cases?doctorId=${dentalCase.doctorId}`
                  : `/dental-lab/cases?search=${encodeURIComponent(
                      dentalCase.doctorName
                    )}`
              }
              onClick={(e) => {
                e.stopPropagation();
                if (dentalCase.doctorId) applyFilter("doctorId", dentalCase.doctorId, true);
                else applyFilter("search", dentalCase.doctorName || "", true);
              }}
              className="text-[11px] text-muted-foreground hover:text-primary dark:hover:text-primary hover:underline truncate flex items-center gap-1"
              title={`عرض كل حالات د. ${dentalCase.doctorName} فقط`}
            >
              <Stethoscope className="w-3 h-3 text-primary shrink-0 opacity-70 group-hover/doc:opacity-100" />
              <span>د. {dentalCase.doctorName}</span>
            </Link>
            {dentalCase.doctorId && (
              <Link
                to={`/dental-lab/doctors/${dentalCase.doctorId}`}
                className="opacity-0 group-hover/doc:opacity-100 text-muted-foreground hover:text-primary dark:hover:text-primary transition-opacity p-0.5"
                title="الملف الشامل للطبيب"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            )}
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground truncate mt-0.5">
            د. طبيب غير محدد
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px] bg-muted dark:bg-muted p-2 rounded-lg border border-border dark:border-border">
        {dentalCase.workTypeName ? (
          <Link
            to={
              dentalCase.workTypeId
                ? `/dental-lab/cases?workTypeId=${dentalCase.workTypeId}`
                : `/dental-lab/cases?search=${encodeURIComponent(
                    dentalCase.workTypeName
                  )}`
            }
            onClick={(e) => {
              e.stopPropagation();
              if (dentalCase.workTypeId) applyFilter("workTypeId", dentalCase.workTypeId, true);
              else applyFilter("search", dentalCase.workTypeName || "", true);
            }}
            className="font-medium text-foreground hover:text-primary hover:underline truncate flex items-center gap-1"
            title={`عرض كل حالات نوع الشغل: ${dentalCase.workTypeName} فقط`}
          >
            <Layers className="w-3 h-3 text-primary shrink-0" />
            <span className="truncate max-w-[120px]">{dentalCase.workTypeName}</span>
          </Link>
        ) : (
          <span className="font-medium text-muted-foreground truncate">
            نوع الشغل غير محدد
          </span>
        )}
        {dentalCase.teeth && (
          <span className="shrink-0 px-1.5 py-0.5 rounded bg-primary dark:bg-primary/50 text-primary dark:text-primary text-[10px] font-bold font-mono">
            {dentalCase.teeth}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-1 text-[11px]">
        <span className="text-gray-400 text-[10px]">الفني:</span>
        {dentalCase.assignments && dentalCase.assignments.length > 0 ? (
          <div className="flex flex-wrap gap-1 justify-end max-w-[170px] items-center">
            {dentalCase.assignments.map((a) => {
              const techName = a.technician?.name || a.technicianId;
              const targetTechId = a.technicianId;
              return (
                <Link
                  key={a.id}
                  to={`/dental-lab/cases?technicianId=${targetTechId}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    applyFilter("technicianId", targetTechId, true);
                  }}
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 dark:bg-primary/40 text-primary dark:text-primary border border-primary dark:border-primary hover:bg-primary dark:hover:bg-primary/60 truncate max-w-[100px] cursor-pointer"
                  title={`عرض كل حالات الفني: ${techName} فقط`}
                >
                  {techName}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => onAssignCase(dentalCase)}
              className="p-0.5 text-primary hover:text-primary hover:bg-primary dark:hover:bg-primary/40 rounded transition-colors"
              title="تعديل أو إضافة فني"
              aria-label="إسناد فني"
            >
              <UserPlus className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onAssignCase(dentalCase)}
            className="text-[10px] text-primary dark:text-primary hover:underline flex items-center gap-0.5 font-medium transition-colors"
          >
            <UserPlus className="w-3 h-3" />
            <span>إسناد فني</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] pt-1 border-t dark:border-border">
        <span className="text-gray-400 text-[10px]">دخول:</span>
        <span className="text-muted-foreground font-medium font-mono">
          {fmtDate(dentalCase.receivedDate)}
        </span>
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-gray-400 text-[10px]">تسليم:</span>
        {isOverdue ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-destructive dark:text-destructive animate-pulse font-mono">
            <Flame className="w-3 h-3" /> متأخر {daysOverdue} يوم
          </span>
        ) : (
          <span className="text-muted-foreground font-medium font-mono">
            {fmtDate(dentalCase.dueDate)}
          </span>
        )}
      </div>

      <DentalCasesKanbanCardActions
        dentalCase={dentalCase}
        onAdvanceCase={onAdvanceCase}
        onPrintPanLabel={onPrintPanLabel}
        onEditCase={onEditCase}
      />
    </div>
  );
};
