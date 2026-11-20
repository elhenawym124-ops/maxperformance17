import React from "react";
import {
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { CompanyStats } from "./types";
import { getImageUrl } from "./helpers";

interface MyCompaniesAttendanceTabProps {
  companies: CompanyStats[];
  selectedMonth: number;
  onMonthChange: (month: number) => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
}

export const MyCompaniesAttendanceTab: React.FC<
  MyCompaniesAttendanceTabProps
> = ({
  companies,
  selectedMonth,
  onMonthChange,
  selectedYear,
  onYearChange,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-card p-4 rounded-xl shadow-sm border border-border dark:border-border flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="w-5 h-5 text-muted-foreground" />
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="form-select rounded-md border-border dark:bg-muted dark:text-white shadow-sm focus:border-primary focus:ring-primary"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(0, m - 1).toLocaleString("ar-EG", {
                  month: "long",
                })}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="form-select rounded-md border-border dark:bg-muted dark:text-white shadow-sm focus:border-primary focus:ring-primary font-mono tabular-nums"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Attendance by Company */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {companies.map((item) => (
          <div
            key={item.company.id}
            className="bg-card p-5 rounded-xl shadow-sm border border-border dark:border-border"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                {item.company.logo ? (
                  <img
                    src={getImageUrl(item.company.logo) || ""}
                    alt=""
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <BuildingOffice2Icon className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-foreground dark:text-white">
                  {item.company.name}
                </h3>
                <p className="text-xs text-muted-foreground font-mono tabular-nums">
                  {item.stats.totalUsers} موظف
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-success/10 dark:bg-success/20 rounded-lg text-center">
                <CheckCircleIcon className="w-5 h-5 mx-auto text-success mb-1" />
                <p className="text-xl font-bold text-foreground dark:text-white font-mono tabular-nums">
                  {item.stats.attendance.present}
                </p>
                <p className="text-xs text-muted-foreground">
                  حاضر
                </p>
              </div>
              <div className="p-3 bg-warning/10 dark:bg-warning/20 rounded-lg text-center">
                <ClockIcon className="w-5 h-5 mx-auto text-warning mb-1" />
                <p className="text-xl font-bold text-foreground dark:text-white font-mono tabular-nums">
                  {item.stats.attendance.late}
                </p>
                <p className="text-xs text-muted-foreground">
                  متأخر
                </p>
              </div>
              <div className="p-3 bg-destructive/10 dark:bg-destructive/20 rounded-lg text-center">
                <XCircleIcon className="w-5 h-5 mx-auto text-destructive mb-1" />
                <p className="text-xl font-bold text-foreground dark:text-white font-mono tabular-nums">
                  {item.stats.attendance.absent}
                </p>
                <p className="text-xs text-muted-foreground">
                  غائب
                </p>
              </div>
            </div>

            {/* Attendance Bar */}
            <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${
                    item.stats.totalUsers > 0
                      ? (item.stats.attendance.present / item.stats.totalUsers) *
                        100
                      : 0
                  }%`,
                }}
                className="bg-green-500 h-full"
              />
              <div
                style={{
                  width: `${
                    item.stats.totalUsers > 0
                      ? (item.stats.attendance.late / item.stats.totalUsers) *
                        100
                      : 0
                  }%`,
                }}
                className="bg-yellow-500 h-full"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
