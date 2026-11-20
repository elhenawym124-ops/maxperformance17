import React from "react";
import {
  ArrowUturnLeftIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  Squares2X2Icon,
  SunIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { TodayAttendanceData } from "./types";
import { formatReportTime, getOwnerReportsImageUrl } from "./helpers";
import { DateInput } from '../../../components/ui/DateInput';

interface OwnerTodayAttendanceSectionProps {
  todayAttendanceData: TodayAttendanceData;
  attendancePreset: string;
  onPresetChange: (preset: string) => void;
  onSetCustomPreset: () => void;
  attendanceStartDate: string;
  onStartDateChange: (val: string) => void;
  attendanceEndDate: string;
  onEndDateChange: (val: string) => void;
}

export const OwnerTodayAttendanceSection: React.FC<
  OwnerTodayAttendanceSectionProps
> = ({
  todayAttendanceData,
  attendancePreset,
  onPresetChange,
  onSetCustomPreset,
  attendanceStartDate,
  onStartDateChange,
  attendanceEndDate,
  onEndDateChange,
}) => {
  return (
    <>
      <div className="bg-card p-5 rounded-xl shadow-sm border border-border dark:border-border space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDaysIcon className="w-5 h-5 text-primary dark:text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            اختر الفترة الزمنية
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onPresetChange("today")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              attendancePreset === "today"
                ? "bg-blue-600 text-white shadow-md shadow-primary dark:shadow-none"
                : "bg-muted text-foreground hover:bg-muted dark:hover:bg-muted"
            }`}
          >
            <SunIcon className="w-4 h-4" />
            <span className="text-sm">اليوم</span>
          </button>

          <button
            onClick={() => onPresetChange("yesterday")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              attendancePreset === "yesterday"
                ? "bg-blue-600 text-white shadow-md shadow-primary dark:shadow-none"
                : "bg-muted text-foreground hover:bg-muted dark:hover:bg-muted"
            }`}
          >
            <ArrowUturnLeftIcon className="w-4 h-4" />
            <span className="text-sm">أمس</span>
          </button>

          <button
            onClick={() => onPresetChange("lastWeek")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              attendancePreset === "lastWeek"
                ? "bg-blue-600 text-white shadow-md shadow-primary dark:shadow-none"
                : "bg-muted text-foreground hover:bg-muted dark:hover:bg-muted"
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span className="text-sm">آخر 7 أيام</span>
          </button>

          <button
            onClick={() => onPresetChange("thisMonth")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              attendancePreset === "thisMonth"
                ? "bg-blue-600 text-white shadow-md shadow-primary dark:shadow-none"
                : "bg-muted text-foreground hover:bg-muted dark:hover:bg-muted"
            }`}
          >
            <Squares2X2Icon className="w-4 h-4" />
            <span className="text-sm">هذا الشهر</span>
          </button>

          <button
            onClick={() => onPresetChange("lastMonth")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              attendancePreset === "lastMonth"
                ? "bg-blue-600 text-white shadow-md shadow-primary dark:shadow-none"
                : "bg-muted text-foreground hover:bg-muted dark:hover:bg-muted"
            }`}
          >
            <CalendarDaysIcon className="w-4 h-4" />
            <span className="text-sm">الشهر الماضي</span>
          </button>
        </div>

        <div className="pt-3 border-t border-border dark:border-border">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="customRange"
              checked={attendancePreset === "custom"}
              onChange={(e) => {
                if (e.target.checked) {
                  onSetCustomPreset();
                }
              }}
              className="w-4 h-4 text-primary rounded focus:ring-primary"
            />
            <label
              htmlFor="customRange"
              className="text-sm font-medium text-foreground"
            >
              فترة مخصصة
            </label>
          </div>

          {attendancePreset === "custom" && (
            <div className="flex flex-wrap items-center gap-3 mt-3 p-3 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary dark:border-primary/30 animate-fadeIn">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">
                  من:
                </label>
                <DateInput
                  value={attendanceStartDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg text-sm font-mono tabular-nums dark:bg-muted dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <span className="text-gray-400 font-bold">→</span>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">
                  إلى:
                </label>
                <DateInput
                  value={attendanceEndDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg text-sm font-mono tabular-nums dark:bg-muted dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-primary via-primary to-primary p-5 rounded-xl text-white shadow-lg">
          <div className="flex items-center gap-2 text-sm opacity-90 mb-2">
            <CalendarDaysIcon className="w-5 h-5" />
            <span className="font-medium">الفترة المختارة</span>
          </div>
          <p className="text-lg font-bold leading-relaxed">
            {attendanceStartDate === attendanceEndDate
              ? new Date(attendanceStartDate).toLocaleDateString("ar-EG", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : `${new Date(attendanceStartDate).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })} - ${new Date(attendanceEndDate).toLocaleDateString("ar-EG", { day: "numeric", month: "short", year: "numeric" })}`}
          </p>
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-xs opacity-80 font-mono tabular-nums">
              {attendanceStartDate === attendanceEndDate
                ? "يوم واحد"
                : `${Math.ceil((new Date(attendanceEndDate).getTime() - new Date(attendanceStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} يوم`}
            </p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-success to-success p-4 rounded-xl text-white">
          <div className="flex items-center gap-2 text-sm opacity-80">
            <UserGroupIcon className="w-4 h-4" />
            إجمالي الحضور
          </div>
          <p className="text-3xl font-bold font-mono tabular-nums mt-1">
            {todayAttendanceData.totalPresent}
          </p>
        </div>
        <div className="bg-gradient-to-r from-warning to-warning p-4 rounded-xl text-white">
          <div className="flex items-center gap-2 text-sm opacity-80">
            <ExclamationCircleIcon className="w-4 h-4" />
            متأخرين
          </div>
          <p className="text-3xl font-bold font-mono tabular-nums mt-1">
            {todayAttendanceData.totalLate}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border dark:border-border overflow-hidden">
        <div className="p-4 border-b border-border dark:border-border">
          <h2 className="text-lg font-bold text-foreground dark:text-white flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-primary" />
            سجل حضور اليوم
          </h2>
          <p className="text-sm text-muted-foreground">
            الموظفين اللي سجلوا حضورهم اليوم فقط
          </p>
        </div>

        {todayAttendanceData.records.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <ClockIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">لا يوجد حضور مسجل اليوم</p>
            <p className="text-sm">لم يسجل أي موظف حضوره حتى الآن</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border dark:divide-border">
              <thead className="bg-gray-50 dark:bg-muted">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    الموظف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    الشركة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    وقت الحضور
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    وقت الانصراف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    ساعات العمل
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border dark:divide-border">
                {todayAttendanceData.records.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                          {record.employee.avatar ? (
                            <img
                              src={
                                getOwnerReportsImageUrl(
                                  record.employee.avatar,
                                ) || ""
                              }
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-bold text-muted-foreground">
                              {record.employee.firstName?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {record.employee.firstName}{" "}
                            {record.employee.lastName}
                          </p>
                          {record.employee.employeeNumber && (
                            <p className="text-xs font-mono tabular-nums text-muted-foreground">
                              #{record.employee.employeeNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-muted rounded flex items-center justify-center overflow-hidden">
                          {record.company.logo ? (
                            <img
                              src={
                                getOwnerReportsImageUrl(record.company.logo) ||
                                ""
                              }
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BuildingOffice2Icon className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                        <span className="text-sm text-foreground">
                          {record.company.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono tabular-nums">
                      <span className="text-green-600 dark:text-success font-medium">
                        {formatReportTime(record.checkIn)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono tabular-nums">
                      {record.checkOut ? (
                        <span className="text-blue-600 dark:text-primary font-medium">
                          {formatReportTime(record.checkOut)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">
                          لم ينصرف بعد
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono tabular-nums">
                      {record.workHours ? (
                        <span className="font-medium text-foreground">
                          {record.workHours.toFixed(1)} ساعة
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.status === "LATE" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-warning dark:bg-warning/30 text-warning dark:text-warning rounded-full text-xs font-medium font-mono tabular-nums">
                          <ExclamationCircleIcon className="w-3.5 h-3.5" />
                          متأخر {record.lateMinutes} دقيقة
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-success dark:bg-success/30 text-success dark:text-success rounded-full text-xs font-medium">
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                          في الوقت
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};
