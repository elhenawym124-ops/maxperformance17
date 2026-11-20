import React from "react";
import { CalendarDays } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import {
  AttendanceSheetData,
  SheetCell,
  SheetDay,
  SheetEmployee,
} from "./types";
import {
  ATTENDANCE_MONTHS,
  ATTENDANCE_STATUS_CONFIG,
  FALLBACK_ATTENDANCE_CELL,
} from "./helpers";

interface AttendanceSheetMatrixTableProps {
  report: AttendanceSheetData;
  filteredEmployees: SheetEmployee[];
  search: string;
  onSearchChange: (val: string) => void;
}

const renderCell = (cell: SheetCell, day: SheetDay) => {
  const cfg = ATTENDANCE_STATUS_CONFIG[cell.status] ?? FALLBACK_ATTENDANCE_CELL;
  return (
    <td
      key={day.day}
      className={`border-b border-l border-border dark:border-border p-0.5 align-top ${cfg.cell}`}
      title={`${day.date} — ${cfg.label}${
        cell.checkIn ? `\nحضور: ${cell.checkIn}` : ""
      }${cell.checkOut ? `\nانصراف: ${cell.checkOut}` : ""}${
        cell.lateMinutes > 0 ? `\nتأخير: ${cell.lateMinutes} دقيقة` : ""
      }`}
    >
      {cell.checkIn ? (
        <div className="flex flex-col items-center leading-tight py-0.5 font-mono tabular-nums">
          <span className={`text-[10px] font-bold ${cfg.timeColor}`}>
            {cell.checkIn}
          </span>
          {cell.checkOut && (
            <span className={`text-[9px] ${cfg.timeColor} opacity-80`}>
              {cell.checkOut}
            </span>
          )}
          {cell.lateMinutes > 0 && (
            <span className="text-[9px] font-bold text-warning">
              +{cell.lateMinutes}د
            </span>
          )}
        </div>
      ) : cell.status === "PRESENT" || cell.status === "REMOTE" ? (
        <div className="py-1 text-center">
          <span className={`text-[9px] font-bold ${cfg.timeColor}`}>
            {cfg.label}
          </span>
        </div>
      ) : (
        <div className="py-1 flex items-center justify-center">
          {cell.status !== "BEFORE_HIRE" && (
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} inline-block`} />
          )}
          {cell.status !== "BEFORE_HIRE" && cell.status !== "WEEKEND" && (
            <span className={`text-[9px] font-medium me-1 ${cfg.timeColor}`}>
              {cfg.label}
            </span>
          )}
        </div>
      )}
    </td>
  );
};

export const AttendanceSheetMatrixTable: React.FC<
  AttendanceSheetMatrixTableProps
> = ({ report, filteredEmployees, search, onSearchChange }) => {
  return (
    <Card className="dark:bg-gray-800 dark:border-border shadow-sm border-none bg-white">
      <CardHeader className="border-b dark:border-border bg-muted dark:bg-muted p-4">
        <CardTitle className="text-lg font-semibold dark:text-white flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          كشف الحضور الشهري — {ATTENDANCE_MONTHS[report.month - 1]}{" "}
          <span className="font-mono tabular-nums">{report.year}</span>
        </CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(ATTENDANCE_STATUS_CONFIG).map(([key, cfg]) => (
            <span
              key={key}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-3 border-b dark:border-border">
          <input
            type="text"
            id="attendance-sheet-search"
            name="attendance-sheet-search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث بالاسم أو رقم الموظف أو القسم..."
            className="w-full max-w-sm rounded-md border border-border dark:border-border bg-white dark:bg-muted px-3 py-2 text-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="border-collapse text-right w-full min-w-max">
            <thead>
              <tr className="bg-gray-50 dark:bg-muted">
                <th
                  className="sticky right-0 bg-muted dark:bg-muted border-b border-l border-border dark:border-border p-2 z-10 min-w-[220px] text-right"
                  rowSpan={2}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm dark:text-white">
                      الموظف
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      حاضر / متأخر / غائب / إجازة
                    </span>
                  </div>
                </th>
                {report.days.map((d) => (
                  <th
                    key={d.day}
                    className={`border-b border-l border-border dark:border-border p-1 text-center min-w-[54px] ${
                      d.isHoliday
                        ? "bg-purple-50 dark:bg-primary/20"
                        : !d.isWorkingDay
                          ? "bg-gray-100 dark:bg-muted"
                          : "bg-gray-50 dark:bg-muted"
                    }`}
                  >
                    <span
                      className={`block text-[10px] font-semibold ${
                        d.isHoliday
                          ? "text-purple-600 dark:text-primary"
                          : !d.isWorkingDay
                            ? "text-gray-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      {d.weekday}
                    </span>
                    <span
                      className={`block text-sm font-bold font-mono tabular-nums ${
                        d.isHoliday
                          ? "text-purple-700 dark:text-primary"
                          : !d.isWorkingDay
                            ? "text-gray-400"
                            : "text-gray-800 dark:text-muted-foreground"
                      }`}
                    >
                      {d.day}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-muted"
                >
                  <td className="sticky right-0 bg-card/95 border-b border-l border-border dark:border-border p-2 z-10 min-w-[220px]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm dark:text-muted-foreground">
                          {emp.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          <span className="font-mono tabular-nums">
                            #{emp.employeeNumber}
                          </span>{" "}
                          • {emp.department}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0 font-mono tabular-nums">
                        <Badge
                          variant="outline"
                          className="text-emerald-600 border-success bg-success/10 dark:bg-success/20 dark:border-success text-[10px] px-1.5 py-0"
                        >
                          ح {emp.totals.present}
                        </Badge>
                        <div className="flex gap-1">
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1 py-0 ${
                              emp.totals.late > 0
                                ? "text-amber-600 border-warning bg-warning/10 dark:bg-warning/20 dark:border-warning"
                                : "text-gray-300 border-border"
                            }`}
                          >
                            ت {emp.totals.late}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1 py-0 ${
                              emp.totals.absent > 0
                                ? "text-rose-600 border-destructive bg-destructive/10 dark:bg-destructive/20 dark:border-destructive"
                                : "text-gray-300 border-border"
                            }`}
                          >
                            غ {emp.totals.absent}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1 py-0 ${
                              emp.totals.leave > 0
                                ? "text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800"
                                : "text-gray-300 border-border"
                            }`}
                          >
                            إ {emp.totals.leave}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </td>
                  {emp.cells.map((cell, idx) =>
                    renderCell(
                      cell,
                      report.days[idx] ?? {
                        day: idx + 1,
                        date: "",
                        weekday: "",
                        isWorkingDay: true,
                        isHoliday: false,
                      },
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredEmployees.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد بيانات للموظفين
          </div>
        )}
      </CardContent>
    </Card>
  );
};
